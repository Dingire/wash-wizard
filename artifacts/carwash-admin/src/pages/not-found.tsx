import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8">
      <Card className="max-w-md w-full border-card-border">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
