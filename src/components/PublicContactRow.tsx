import { Children, cloneElement, forwardRef, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicContactRowProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
  asChild?: boolean;
  children?: ReactElement;
  icon: ReactNode;
  title?: string;
  value: string;
  action?: string;
  actionIcon?: ReactNode;
};

/** One interaction per row; the trailing label is a cue, not another button. */
const PublicContactRow = forwardRef<HTMLDivElement, PublicContactRowProps>(
  ({ asChild = false, children, icon, title, value, action, actionIcon, className, ...props }, ref) => {
    const content = (
      <>
        <span className="public-contact-row__icon" aria-hidden="true">{icon}</span>
        <span className="public-contact-row__copy">
          {title ? <strong>{title}</strong> : null}
          <span className="public-contact-row__value">{value}</span>
        </span>
        {action ? (
          <span className="public-contact-row__action">
            <span className="public-contact-row__action-label">{action}</span>
            <span aria-hidden="true">{actionIcon || <ArrowUpRight />}</span>
          </span>
        ) : null}
      </>
    );
    const Component = asChild ? Slot : "div";
    return (
      <Component ref={ref} className={cn("public-contact-row", className)} {...props}>
        {asChild ? cloneElement(Children.only(children!), undefined, content) : content}
      </Component>
    );
  },
);
PublicContactRow.displayName = "PublicContactRow";

export default PublicContactRow;
