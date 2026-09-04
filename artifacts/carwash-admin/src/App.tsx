import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppSidebar } from '@/components/layout/app-sidebar';
import Dashboard from '@/pages/dashboard';
import Transactions from '@/pages/transactions';
import NewTransaction from '@/pages/new-transaction';
import Reports from '@/pages/reports';
import Services from '@/pages/services';
import Loyalty from '@/pages/loyalty';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/transactions/new" component={NewTransaction} />
      <Route path="/reports" component={Reports} />
      <Route path="/services" component={Services} />
      <Route path="/loyalty" component={Loyalty} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppLayout>
            <Router />
          </AppLayout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
