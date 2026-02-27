type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-2 border-b-2 border-(--color-secondary-soft) pb-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-base text-(--color-secondary-muted) md:text-lg">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export type { PageHeaderProps };
