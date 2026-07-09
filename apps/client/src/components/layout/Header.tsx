import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../../auth';
import { signOut } from '../../auth';
import Button from '../ui/Button';

interface HeaderProps {
  user: AuthUser | null;
  navOpen: boolean;
  onToggleNav: () => void;
}

const Header = ({ user, navOpen, onToggleNav }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the user menu when clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // Even if the logout request fails, fall through to the login page;
      // the session cookie is HttpOnly so the server remains the source of truth.
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <header className="app-header">
      <div className="app-header__actions">
        <button
          type="button"
          className="app-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          onClick={onToggleNav}
        >
          ☰
        </button>
        <Link to="/dashboard" className="app-header__brand">
          Job Application Tracker
        </Link>
      </div>

      <div className="user-menu" ref={menuRef}>
        <button
          type="button"
          className="user-menu__trigger"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {user?.name || user?.email || 'Account'} ▾
        </button>

        {menuOpen ? (
          <div className="user-menu__dropdown" role="menu">
            <span className="user-menu__email">{user?.email}</span>
            <Button
              variant="secondary"
              disabled={signingOut}
              onClick={() => { void handleSignOut(); }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
