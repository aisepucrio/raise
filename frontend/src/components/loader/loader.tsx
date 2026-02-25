import { Loader2Icon } from "lucide-react";

function Loader() {
  return (
    <div
      data-slot="loader"
      className="grid h-full w-full place-items-center [container-type:size]"
    >
      <Loader2Icon
        role="status"
        aria-label="Carregando"
        className="size-[clamp(1rem,24cqmin,2rem)] animate-spin text-(--color-app-fg)"
      />
    </div>
  );
}

export { Loader };
