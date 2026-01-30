import React from 'react';
import AdminSidebar from './AdminSidebar';

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}

export default AdminLayout;
