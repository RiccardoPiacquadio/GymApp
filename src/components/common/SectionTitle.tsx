import type { ReactNode } from "react";

type SectionTitleProps = {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  /** Use "light" when rendered on dark background (header zone). Default is "dark" (light background). */
  variant?: "dark" | "light";
};

export const SectionTitle = ({ title, subtitle, action, variant = "dark" }: SectionTitleProps) => {
  const titleColor = variant === "light" ? "text-white" : "text-ink";
  const subtitleColor = variant === "light" ? "text-white/60" : "text-ink/50";

  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className={`text-lg font-semibold ${titleColor}`}>{title}</h2>
        {subtitle ? <p className={`text-sm ${subtitleColor}`}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
};
