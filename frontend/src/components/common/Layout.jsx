import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Navbar
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-600">
          <p className="max-w-2xl mx-auto">
            <span className="font-semibold text-slate-800">Medical Disclaimer:</span> Dhruva provides educational digital ergonomic guidance and habit awareness. It does not replace licensed optometric or ophthalmological clinical consultation.
          </p>
        </footer>
      </div>
    </div>
  );
};
