type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-3 border-b-2 border-(--color-secondary-soft) pb-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        <p className="text-base text-(--color-secondary-muted) md:text-md">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export type { PageHeaderProps };
