import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Droplets,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'New Receipt', href: '/transactions/new', icon: PlusCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Services', href: '/services', icon: Droplets },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">
          Mig Flares
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1 font-medium">
          Car Wash Admin
        </p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 font-mono">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}
