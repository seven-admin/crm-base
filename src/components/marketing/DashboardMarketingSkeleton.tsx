import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function KPICardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartCardSkeleton({ height = 250 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3" style={{ height }}>
          {/* Chart bars skeleton */}
          <div className="flex items-end gap-2 h-full pt-4">
            {[65, 85, 45, 70, 55, 90, 60].map((h, i) => (
              <Skeleton 
                key={i} 
                className="flex-1 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DonutChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TicketListSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ProdutividadeTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-4 pb-2 border-b">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HorizontalBarChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 py-2">
          {[80, 65, 50, 45, 30, 25].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-28 shrink-0" />
              <Skeleton 
                className="h-6 rounded" 
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardMarketingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorizontalBarChartSkeleton />
        <DonutChartSkeleton />
      </div>

      {/* Tickets Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketListSkeleton title="Tickets Atrasados" />
        <TicketListSkeleton title="Próximas Entregas" />
      </div>

      {/* Produtividade e Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProdutividadeTableSkeleton />
        <ChartCardSkeleton height={280} />
      </div>

      {/* Categoria */}
      <ChartCardSkeleton height={200} />
    </div>
  );
}
