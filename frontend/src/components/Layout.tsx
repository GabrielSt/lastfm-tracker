import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { SyncButton } from '@/components/SyncButton';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/artists', label: 'Artists', icon: '♪' },
  { to: '/tracks', label: 'Tracks', icon: '♫' },
  { to: '/reports', label: 'Reports', icon: '◉' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-lastfm-dark text-white flex">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-56 shrink-0 bg-lastfm-card border-r border-lastfm-border flex-col z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-lastfm-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-lastfm-red flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-black">lfm</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight tracking-tight">Last.fm</div>
              <div className="text-lastfm-muted text-xs">Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-lastfm-red/15 text-white border border-lastfm-red/25'
                    : 'text-lastfm-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-base transition-colors ${isActive ? 'text-lastfm-red' : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sync button at bottom */}
        <div className="px-4 py-4 border-t border-lastfm-border">
          <SyncButton />
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-lastfm-card border-b border-lastfm-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-lastfm-red flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black">lfm</span>
          </div>
          <div>
            <span className="font-bold text-white text-sm leading-tight">Last.fm</span>
            <span className="text-lastfm-muted text-xs ml-1.5">Tracker</span>
          </div>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-lastfm-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Mobile Drawer ───────────────────────────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div className="md:hidden fixed top-14 left-0 right-0 z-50 bg-lastfm-card border-b border-lastfm-border shadow-xl">
            <nav className="p-3 space-y-0.5">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-lastfm-red/15 text-white border border-lastfm-red/25'
                        : 'text-lastfm-muted hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`text-base transition-colors ${isActive ? 'text-lastfm-red' : ''}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 pb-4">
              <SyncButton />
            </div>
          </div>
        </>
      )}

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-56 min-h-screen pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
