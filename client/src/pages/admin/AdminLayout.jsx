import React from 'react';
import AdminSidebar from './AdminSidebar';

function AdminLayout({ children }) {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Fixed Sidebar */}
      <AdminSidebar />
      
      {/* Main content with independent scrolling */}
      <main className="ml-64 flex-1 overflow-y-auto h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;