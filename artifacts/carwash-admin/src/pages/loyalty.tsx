import { useListLoyalty } from '@workspace/api-client-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const FREE_WASH_THRESHOLD = 4;

export default function Loyalty() {
  const { data: loyalty, isLoading } = useListLoyalty();
  const loyaltyList = Array.isArray(loyalty) ? loyalty : [];

  return (
    <div className="p-8 min-h-screen">
      <PageHeader
        title="Loyalty Rewards"
        description="Free-wash competition — customers win a free wash after every 4 paid washes"
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4 text-primary" />
            Buy 4 washes, get the next one free
          </div>
        }
      />

      <Card className="border-card-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading loyalty tracking...
            </div>
          ) : loyaltyList.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No loyalty customers yet.{' '}
                <span className="inline-block mt-1">
                  Customers are tracked automatically when a transaction is issued with a phone number.
                </span>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Progress to Free Wash</TableHead>
                    <TableHead className="text-center">Free Washes Available</TableHead>
                    <TableHead className="text-center">Wins</TableHead>
                    <TableHead className="text-center">Redeemed</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loyaltyList.map((row) => {
                    const remaining = FREE_WASH_THRESHOLD - row.washCount;
                    return (
                      <TableRow key={row.id} data-testid={`loyalty-row-${row.id}`}>
                        <TableCell>
                          <span className="text-sm font-medium text-foreground">
                            {row.customerName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono text-muted-foreground">
                            +{row.phone}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 max-w-[220px]">
                            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${(row.washCount / FREE_WASH_THRESHOLD) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {row.washCount}/{FREE_WASH_THRESHOLD} washes
                            </span>
                          </div>
                          {remaining > 0 ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              {remaining} more paid {remaining === 1 ? 'wash' : 'washes'} to win
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.freeWashesAvailable > 0 ? (
                            <Badge variant="default" data-testid={`available-${row.id}`}>
                              {row.freeWashesAvailable}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm text-foreground">
                          {row.freeWashesEarned}
                        </TableCell>
                        <TableCell className="text-center text-sm text-foreground">
                          {row.freeWashesRedeemed}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(row.updatedAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}