import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/artists', label: 'Artistas', icon: '♪' },
  { to: '/tracks', label: 'Músicas', icon: '♫' },
  { to: '/settings', label: 'Configurações', icon: '⚙' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-lastfm-dark text-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-lastfm-card border-r border-lastfm-border flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-lastfm-border">
          <div className="flex items-center gap-2">
            <span className="text-lastfm-red text-xl">⬤</span>
            <div>
              <div className="font-bold text-white text-sm leading-tight">Last.fm</div>
              <div className="text-lastfm-muted text-xs">Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-lastfm-red/15 text-lastfm-red border border-lastfm-red/30'
                    : 'text-lastfm-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-lastfm-border text-xs text-lastfm-muted">
          Backend: localhost:3001
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
