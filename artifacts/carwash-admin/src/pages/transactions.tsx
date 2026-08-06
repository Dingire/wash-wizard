import { useState } from 'react';
import { useListTransactions } from '@workspace/api-client-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Link } from 'wouter';
import { PlusCircle, Search } from 'lucide-react';

export default function Transactions() {
  const [dateFilter, setDateFilter] = useState('');
  const { data: transactions, isLoading } = useListTransactions(
    dateFilter ? { date: dateFilter } : undefined
  );

  const transactionList = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="p-8 min-h-screen">
      <PageHeader
        title="Transactions"
        description="Complete transaction history"
        action={
          <Link href="/transactions/new">
            <Button className="gap-2" data-testid="button-new-transaction">
              <PlusCircle className="w-4 h-4" />
              New Receipt
            </Button>
          </Link>
        }
      />

      <Card className="border-card-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Filter by date..."
                className="pl-9"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                data-testid="input-date-filter"
              />
            </div>
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter('')}
                data-testid="button-clear-filter"
              >
                Clear filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading transactions...
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No transactions found
              </p>
              <Link href="/transactions/new">
                <Button size="sm" data-testid="button-create-first">
                  Create first transaction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-card-border">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Receipt #
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Vehicle
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Service
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Payment
                    </th>
                    <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {transactionList.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-muted/20 transition-colors"
                      data-testid={`row-transaction-${transaction.id}`}
                    >
                      <td className="p-4">
                        <span className="text-sm font-mono font-medium text-foreground">
                          #{transaction.receiptNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">
                          {transaction.customerName}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {transaction.vehiclePlate}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.vehicleType}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">
                          {transaction.serviceName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-mono font-semibold text-foreground">
                          {formatCurrency(transaction.amountPaid)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(transaction.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
