import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';
import { FirstLoginBanner } from '@/components/FirstLoginBanner';
import { pageTitles } from '@/components/nav/navConfig';

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const pageKey = location.pathname.split('/').pop() ?? 'dashboard';
  const title = pageTitles[pageKey] ?? 'Panel mensual';

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-[250px]">
        <Topbar title={title} onOpenMenu={() => setNavOpen(true)} />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto max-w-app px-5 py-7 lg:px-7"
        >
          <FirstLoginBanner />
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
