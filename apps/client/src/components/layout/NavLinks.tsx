import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/applications', label: 'Applications' },
  { to: '/settings', label: 'Settings' }
];

interface NavLinksProps {
  open: boolean;
}

// Sidebar on desktop; collapsible panel under the header on mobile.
const NavLinks = ({ open }: NavLinksProps) => (
  <nav className="app-nav" data-open={open} aria-label="Main navigation">
    {links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        className={({ isActive }) => (isActive ? 'app-nav__link active' : 'app-nav__link')}
      >
        {link.label}
      </NavLink>
    ))}
  </nav>
);

export default NavLinks;
