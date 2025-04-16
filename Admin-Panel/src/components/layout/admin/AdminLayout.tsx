import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import TwoColumnSidebar from '../../../core/common/two-column';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * AdminLayout - Main layout component for the admin dashboard
 * Provides the two-column layout structure with sidebar navigation
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content container-fluid">
          <TwoColumnSidebar />
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
