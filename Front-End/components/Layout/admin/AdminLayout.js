import React from "react";
import Head from "next/head";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <>
      <Head>
        <title>TuniHire - Admin Panel</title>
        <meta name="description" content="TuniHire Admin Panel" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-content">
          <main>{children}</main>
        </div>
      </div>

      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
        }
        
        .admin-content {
          flex: 1;
          margin-left: 250px;
          padding: 20px;
          background-color: #f5f7fa;
        }
        
        @media (max-width: 768px) {
          .admin-content {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}
