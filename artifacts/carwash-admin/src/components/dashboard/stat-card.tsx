import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="border-card-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold font-mono tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-2">
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 pt-4 border-t border-card-border">
            <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
