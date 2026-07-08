import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-primary-soft-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-[hsl(0_93%_94%)] text-destructive",
        outline: "border-border text-foreground bg-transparent",
        success: "border-transparent bg-[hsl(142_76%_92%)] text-[hsl(142_71%_35%)]",
        warning: "border-transparent bg-[hsl(48_96%_89%)] text-[hsl(32_95%_44%)]",
        info: "border-transparent bg-[hsl(214_95%_93%)] text-[hsl(217_91%_50%)]",
        neutral: "border-transparent bg-secondary text-[hsl(215_16%_47%)]",
        purple: "border-transparent bg-[hsl(258_100%_94%)] text-[hsl(258_90%_60%)]",
        orange: "border-transparent bg-primary-soft text-primary",
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
