import { NavLink, Outlet } from 'react-router-dom';
import { SyncButton } from '@/components/SyncButton';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/artists', label: 'Artists', icon: '♪' },
  { to: '/tracks', label: 'Tracks', icon: '♫' },
  { to: '/reports', label: 'Reports', icon: '◉' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-lastfm-dark text-white flex">
      {/* Sidebar — fixed */}
      <aside className="fixed top-0 left-0 h-screen w-56 shrink-0 bg-lastfm-card border-r border-lastfm-border flex flex-col z-40">
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

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
