import { ReactNode } from "react";

type AdminPageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
};

export const AdminPageShell = ({ title, description, actions, headerRight, children }: AdminPageShellProps) => {
  return (
    <div className="min-w-0 space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="min-w-0 truncate font-display text-2xl font-bold">{title}</h1>
            {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {headerRight ? <div className="flex shrink-0 items-center gap-2">{headerRight}</div> : null}
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
          </div>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
};

type AdminFiltersProps = {
  children: ReactNode;
};

export const AdminFilters = ({ children }: AdminFiltersProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">{children}</div>
    </div>
  );
};

type AdminActionBarProps = {
  left?: ReactNode;
  right?: ReactNode;
};

export const AdminActionBar = ({ left, right }: AdminActionBarProps) => {
  if (!left && !right) return null;
  return (
    <div className="sticky top-14 z-20 -mx-3 border-b border-border bg-background/85 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/65 md:-mx-5 md:px-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">{left}</div>
        <div className="flex shrink-0 flex-wrap gap-2">{right}</div>
      </div>
    </div>
  );
};

