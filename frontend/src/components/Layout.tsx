import { Outlet, NavLink } from 'react-router-dom'
import { Home, FileAudio, FolderOpen, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/editor', icon: FileAudio, label: 'Editor' },
    { to: '/projects', icon: FolderOpen, label: 'Projetos' },
    { to: '/jobs', icon: ListChecks, label: 'Jobs' },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">
            DELkokoOtimized
          </h1>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            TTS Content Studio v1.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
