import { useGetReportSummary } from '@workspace/api-client-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: summary, isLoading } = useGetReportSummary();

  if (isLoading) {
    return (
      <div className="p-8">
        <PageHeader title="Dashboard" description="Overview of your car wash operations" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-card-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8">
        <PageHeader title="Dashboard" description="Overview of your car wash operations" />
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-muted-foreground">
            No data available
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentTransactions = summary.recentTransactions ?? [];
  const topServices = summary.topServices ?? [];

  return (
    <div className="p-8 min-h-screen">
      <PageHeader 
        title="Dashboard" 
        description="Real-time overview of your operations" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(summary.todayRevenue)}
          subtitle={`${summary.todayTransactions} transactions`}
          icon={DollarSign}
          data-testid="stat-today-revenue"
        />
        <StatCard
          title="This Week"
          value={formatCurrency(summary.weekRevenue)}
          subtitle={`${summary.weekTransactions} transactions`}
          icon={TrendingUp}
          data-testid="stat-week-revenue"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(summary.monthRevenue)}
          subtitle={`${summary.monthTransactions} transactions`}
          icon={Receipt}
          data-testid="stat-month-revenue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-card-border">
          <CardHeader className="border-b border-card-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
              <Link 
                href="/transactions" 
                className="text-xs font-medium text-primary hover:underline"
                data-testid="link-view-all-transactions"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {recentTransactions.map((transaction) => (
                  <Link
                    key={transaction.id}
                    href={`/transactions/${transaction.id}`}
                    className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-mono font-medium text-foreground">
                          #{transaction.receiptNumber}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {transaction.customerName}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.serviceName} • {transaction.vehiclePlate}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-mono font-semibold text-foreground">
                        {formatCurrency(transaction.amountPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.paymentMethod}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card className="border-card-border">
          <CardHeader className="border-b border-card-border pb-4">
            <CardTitle className="text-lg font-semibold">Top Services</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topServices.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No services data
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {topServices.map((service) => (
                  <div 
                    key={service.serviceId} 
                    className="flex items-center justify-between p-4"
                    data-testid={`top-service-${service.serviceId}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {service.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {service.transactionCount} transaction{service.transactionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold text-foreground">
                        {formatCurrency(service.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
