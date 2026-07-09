import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-primary-soft-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-[hsl(0_93%_94%)] text-destructive",
        outline: "border-border text-foreground bg-transparent",
        success: "border-transparent bg-[hsl(168_76%_92%)] text-[hsl(168_76%_32%)]",
        warning: "border-transparent bg-[hsl(43_96%_90%)] text-[hsl(32_95%_40%)]",
        info: "border-transparent bg-[hsl(208_90%_94%)] text-[hsl(208_91%_40%)]",
        neutral: "border-transparent bg-muted text-muted-foreground",
        purple: "border-transparent bg-[hsl(258_100%_94%)] text-[hsl(258_83%_58%)]",
        pink: "border-transparent bg-[hsl(340_82%_94%)] text-[hsl(340_82%_50%)]",
        orange: "border-transparent bg-accent-soft text-accent-soft-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        // status softs (referência)
        pending: "border-transparent bg-[hsl(28_100%_92%)] text-[hsl(28_91%_44%)]",
        progress: "border-transparent bg-[hsl(43_96%_90%)] text-[hsl(32_95%_40%)]",
        done: "border-transparent bg-[hsl(168_76%_92%)] text-[hsl(168_76%_32%)]",
        fixed: "border-transparent bg-[hsl(340_82%_94%)] text-[hsl(340_60%_50%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
