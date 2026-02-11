import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StatusItem {
  label: string;
  value: number | string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

interface ModuleStatusCardProps {
  title: string;
  icon: LucideIcon;
  items: StatusItem[];
  link?: string;
  highlight?: {
    value: string | number;
    label: string;
  };
}

export function ModuleStatusCard({ 
  title, 
  icon: Icon, 
  items, 
  link,
  highlight
}: ModuleStatusCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (color?: StatusItem['color']) => {
    switch (color) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'danger':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all",
        link && "cursor-pointer hover:shadow-md hover:border-primary/50"
      )}
      onClick={() => link && navigate(link)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            {title}
          </div>
          {link && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {highlight && (
          <div className="mb-3 pb-3 border-b">
            <p className="text-2xl font-bold">{highlight.value}</p>
            <p className="text-xs text-muted-foreground">{highlight.label}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "p-2 rounded-lg text-center",
                getStatusColor(item.color)
              )}
            >
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="text-xs truncate">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
