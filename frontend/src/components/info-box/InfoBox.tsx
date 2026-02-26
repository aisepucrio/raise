import { cn } from "@/lib/utils";

type InfoBoxColor = "primary" | "secondary";

type InfoBoxProps = {
  title: string;
  number: number | string;
  color?: InfoBoxColor;
  className?: string;
};

const colorVariants: Record<InfoBoxColor, string> = {
  // Aumenta levemente a opacidade para o zebra ficar mais perceptível sem fugir do tema.
  primary: "bg-(--color-secondary-subtle) text-(--color-secondary)",
  secondary: "bg-(--color-secondary-muted) text-(--color-secondary-inverse)",
};

function InfoBox({
  title,
  number,
  color = "primary",
  className,
}: InfoBoxProps) {
  return (
    <article
      data-slot="info-box"
      data-color={color}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center rounded-md p-2 text-center shadow-none",
        "min-h-28 gap-4",
        colorVariants[color],
        className,
      )}
    >
      <p className="w-full text-sm font-semibold leading-tight">{title}</p>
      <p className="w-full text-3xl font-bold leading-none">{number}</p>
    </article>
  );
}

export { InfoBox };
export type { InfoBoxColor, InfoBoxProps };
