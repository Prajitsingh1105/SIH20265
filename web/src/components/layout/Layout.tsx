import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopUtilityBar } from './TopUtilityBar';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { DemoClockBanner } from '../demo/DemoClockBanner';
import { GuidedDemoDrawer } from '../demo/GuidedDemoDrawer';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically close mobile menu when navigating to another route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isPublicPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 selection:bg-amber-100 selection:text-amber-900">
      <TopUtilityBar />
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <DemoClockBanner />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {!isPublicPage && user && (
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main id="main-content" className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <Footer />
      <GuidedDemoDrawer />
    </div>
  );
};
