import type { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export const SectionTitle = ({ title, subtitle, action }: SectionTitleProps) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle ? <p className="text-sm text-ink/70">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);
