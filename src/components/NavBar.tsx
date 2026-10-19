import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const NavBar = () => {
  const [savedCount, setSavedCount] = useState<number>(0);
  const [compareCount, setCompareCount] = useState<number>(0);

  useEffect(() => {
    const updateCounts = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('savedMotorcycles') || '[]');
        setSavedCount(Array.isArray(saved) ? saved.length : 0);
        const compare = JSON.parse(localStorage.getItem('compareList') || '[]');
        setCompareCount(Array.isArray(compare) ? compare.length : 0);
      } catch {
        setSavedCount(0);
        setCompareCount(0);
      }
    };

    updateCounts();
    window.addEventListener('storage', updateCounts);
    return () => window.removeEventListener('storage', updateCounts);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
      isActive
        ? 'text-[#ff5a1f] border-[#ff5a1f]'
        : 'text-[#9aa1b0] border-transparent hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#0c0d10]/90 backdrop-blur-md border-b border-[#222630]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-white hover:text-[#ff5a1f] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 bg-[#ff5a1f] rounded-sm transform rotate-45"></span>
          <span>motoRAG</span>
        </Link>

        {/* Zone 2: 4-5 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={navLinkClass} end>
            Overview
          </NavLink>
          <NavLink to="/finder" className={navLinkClass}>
            AI Finder
          </NavLink>
          <NavLink to="/compare" className={navLinkClass}>
            Compare {compareCount > 0 && <span className="text-xs text-[#ff5a1f] tabular-nums font-mono">({compareCount})</span>}
          </NavLink>
          <NavLink to="/saved" className={navLinkClass}>
            My Garage {savedCount > 0 && <span className="text-xs text-[#ff5a1f] tabular-nums font-mono">({savedCount})</span>}
          </NavLink>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/finder"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff5a1f] rounded-lg hover:bg-[#e04b16] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Launch Finder</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
