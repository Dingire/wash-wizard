import { useState } from 'react';
import { useGetDailyReport, useGetWeeklyReport, useGetMonthlyReport } from '@workspace/api-client-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  
  const { data: dailyReport } = useGetDailyReport();
  const { data: weeklyReport } = useGetWeeklyReport();
  const { data: monthlyReport } = useGetMonthlyReport();

  return (
    <div className="p-8 min-h-screen">
      <PageHeader
        title="Revenue Reports"
        description="Detailed revenue analytics and breakdowns"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          {dailyReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-card-border">
                  <CardHeader className="border-b border-card-border">
                    <CardTitle className="text-lg">
                      {formatDate(dailyReport.date)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-3xl font-mono font-bold">
                          {formatCurrency(dailyReport.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                        <p className="text-2xl font-mono font-semibold">
                          {dailyReport.transactionCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-card-border">
                  <CardHeader className="border-b border-card-border">
                    <CardTitle className="text-lg">Revenue by Service</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dailyReport.byService.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground text-center">
                        No service data
                      </div>
                    ) : (
                      <div className="divide-y divide-card-border">
                        {dailyReport.byService.map((service) => (
                          <div key={service.serviceId} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{service.serviceName}</p>
                              <p className="text-xs text-muted-foreground">
                                {service.transactionCount} transaction{service.transactionCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <p className="text-sm font-mono font-semibold">
                              {formatCurrency(service.totalRevenue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-card-border">
                <CardHeader className="border-b border-card-border">
                  <CardTitle className="text-lg">Today's Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {dailyReport.transactions.length === 0 ? (
                    <div className="p-8 text-sm text-muted-foreground text-center">
                      No transactions today
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/30 border-b border-card-border">
                          <tr>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Receipt</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Service</th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border">
                          {dailyReport.transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-muted/20">
                              <td className="p-3 text-sm font-mono">#{transaction.receiptNumber}</td>
                              <td className="p-3 text-sm">{transaction.customerName}</td>
                              <td className="p-3 text-sm">{transaction.serviceName}</td>
                              <td className="p-3 text-sm font-mono font-semibold text-right">
                                {formatCurrency(transaction.amountPaid)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Weekly Report */}
        <TabsContent value="weekly" className="space-y-6">
          {weeklyReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-card-border">
                  <CardHeader className="border-b border-card-border">
                    <CardTitle className="text-lg">
                      {formatDate(weeklyReport.weekStart)} - {formatDate(weeklyReport.weekEnd)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-3xl font-mono font-bold">
                          {formatCurrency(weeklyReport.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                        <p className="text-2xl font-mono font-semibold">
                          {weeklyReport.transactionCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-card-border">
                  <CardHeader className="border-b border-card-border">
                    <CardTitle className="text-lg">Revenue by Service</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-card-border">
                      {weeklyReport.byService.map((service) => (
                        <div key={service.serviceId} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{service.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.transactionCount} transaction{service.transactionCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <p className="text-sm font-mono font-semibold">
                            {formatCurrency(service.totalRevenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-card-border">
                <CardHeader className="border-b border-card-border">
                  <CardTitle className="text-lg">Daily Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyReport.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          tickFormatter={(value) => `K${value}`}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalRevenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          {monthlyReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-card-border">
                  <CardHeader className="border-b border-card-border">
                    <CardTitle className="text-lg">
                      {new Date(monthlyReport.year, monthlyReport.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-3xl font-mono font-bold">
                          {formatCurrency(monthlyReport.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                        <p className="text-2xl font-mono font-semibold">
                          {monthlyReport.transactionCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-card-border">
                  <CardHeader className="border-b border-card-border">
                    <CardTitle className="text-lg">Revenue by Service</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-card-border">
                      {monthlyReport.byService.map((service) => (
                        <div key={service.serviceId} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{service.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.transactionCount} transaction{service.transactionCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <p className="text-sm font-mono font-semibold">
                            {formatCurrency(service.totalRevenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-card-border">
                <CardHeader className="border-b border-card-border">
                  <CardTitle className="text-lg">Revenue by Day</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyReport.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).getDate().toString()}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          tickFormatter={(value) => `K${value}`}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
