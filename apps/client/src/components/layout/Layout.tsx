import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Header from './Header';
import NavLinks from './NavLinks';

// App shell for all protected pages: header, navigation, and content area.
const Layout = () => {
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile nav after navigating to a new page.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Header user={user} navOpen={navOpen} onToggleNav={() => setNavOpen((open) => !open)} />
      <div className="app-body">
        <NavLinks open={navOpen} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
