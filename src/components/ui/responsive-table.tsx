import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  const { isMobile } = useBreakpoint();

  return (
    <div className={cn("relative w-full", className)}>
      {isMobile ? (
        <div className="space-y-4">
          {children}
        </div>
      ) : (
        <div className="overflow-auto">
          <Table>
            {children}
          </Table>
        </div>
      )}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <CardContent className="p-0 space-y-2">
        {children}
      </CardContent>
    </Card>
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };