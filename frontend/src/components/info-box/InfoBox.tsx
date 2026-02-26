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
  primary:
    "border border-(--theme-secondary-50) bg-(--theme-secondary-80) text-(--theme-secondary)",
  secondary:
    "border border-transparent bg-(--theme-secondary) text-(--theme-primary)",
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
        "flex h-full w-full flex-col items-center justify-between rounded-md p-4 text-center shadow-none",
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
