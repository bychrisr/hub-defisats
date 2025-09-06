import { cn } from "@/lib/utils";
import { Badge, BadgeProps } from "@/components/ui/badge";

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "active" | "inactive" | "error" | "warning" | "success";
  children: React.ReactNode;
}

export const StatusBadge = ({ status, children, className, ...props }: StatusBadgeProps) => {
  return (
    <Badge
      className={cn(
        "font-medium",
        {
          "status-active": status === "active",
          "status-inactive": status === "inactive", 
          "status-error": status === "error",
          "bg-warning/20 text-warning border-warning/30": status === "warning",
          "bg-success/20 text-success border-success/30": status === "success",
        },
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
};