import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../core/data/redux/store';
import { all_routes } from './router/all_routes';
import { checkAuth } from '../core/data/redux/authSlice';

const AuthFeature = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [authChecked, setAuthChecked] = useState(false);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Check authentication only once on component mount
  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
      setAuthChecked(true);
    }
  }, [dispatch, authChecked]);

  // Redirect to admin dashboard if already authenticated
  useEffect(() => {
    if (authChecked && isAuthenticated && user?.role === 'admin') {
      navigate(all_routes.adminDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate, authChecked]);

  // Don't render the auth feature component while checking authentication
  if (!authChecked) {
    return null;
  }

  return (
    <div>
      <div className="main-wrapper login-body">
        {/* Main auth content */}
        <Outlet />
      </div>
    </div>
  );
};

export default AuthFeature;
