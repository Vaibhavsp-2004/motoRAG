import { NavLink } from 'react-router-dom';

export const NavBar = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-accent text-white'
        : 'text-textPrimary hover:bg-cardBg hover:text-textPrimary'
    }`;

  return (
    <nav className="bg-secondaryBg p-4 flex justify-center space-x-4">
      <NavLink to="/" className={linkClass} end>
        Home
      </NavLink>
      <NavLink to="/finder" className={linkClass}>
        Find Bike
      </NavLink>
      <NavLink to="/saved" className={linkClass}>
        Saved
      </NavLink>
      <NavLink to="/compare" className={linkClass}>
        Compare
      </NavLink>
    </nav>
  );
};
