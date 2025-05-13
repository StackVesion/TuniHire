import React from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import Feature from "../feature";
import AuthFeature from "../authFeature";
import ProtectedRoute from "../../core/common/ProtectedRoute";
import { all_routes } from "./all_routes";
import { Navigate } from "react-router-dom";

const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Default route redirects to admin dashboard */}
        <Route path="/" element={<Navigate to={all_routes.adminDashboard} replace />} />
        
        {/* Protected admin routes */}
        <Route element={
          <ProtectedRoute adminOnly={true}>
            <Feature />
          </ProtectedRoute>
        }>
          {publicRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>

        {/* Auth routes (login, register, etc.) - not protected */}
        <Route element={<AuthFeature />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
        
        {/* Fallback for non-existent routes */}
        <Route path="*" element={<Navigate to={all_routes.login} replace />} />
      </Routes>
    </>
  );
};

export default ALLRoutes;
