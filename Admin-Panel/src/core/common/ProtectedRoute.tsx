import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { all_routes } from '../../feature-module/router/all_routes';
import { checkAuth } from '../data/redux/authSlice';
import { RootState } from '../data/redux/store';
import Swal from 'sweetalert2';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = true }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on component mount, but only once
    if (!authChecked) {
      dispatch(checkAuth());
      setAuthChecked(true);
    }
  }, [dispatch, authChecked]);

  // Don't show anything until auth check is complete
  if (!authChecked) {
    return null;
  }

  if (!isAuthenticated) {
    // Show redirect message only once
    Swal.fire({
      title: 'Authentication Required',
      text: 'Please login to access the admin panel',
      icon: 'warning',
      timer: 2000,
      showConfirmButton: false
    });
    
    // Redirect to login with the return url and replace to avoid back button issues
    return <Navigate to={all_routes.login} state={{ from: location }} replace />;
  }

  // Check if user role is admin when adminOnly is true
  if (adminOnly && user?.role !== 'admin') {
    Swal.fire({
      title: 'Access Denied',
      text: 'You need admin privileges to access this section',
      icon: 'error',
      timer: 2000,
      showConfirmButton: false
    });
    
    // Redirect to login if not admin, with replace to avoid back button issues
    return <Navigate to={all_routes.login} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
