export const formFieldWrapperClassName = "grid gap-1.5";

export const formFieldLabelClassName =
  "inline-flex items-center gap-1 text-sm font-semibold text-(--color-form-label)";

export const formFieldRequiredMarkClassName = "text-(--color-form-error)";

export const formFieldMessageClassName = "m-0 text-[0.82rem]";

export const formFieldHintClassName =
  `${formFieldMessageClassName} text-(--color-form-hint)`;

export const formFieldErrorClassName =
  `${formFieldMessageClassName} text-(--color-form-error)`;

const formControlLayoutClassName =
  "w-full min-h-11 box-border rounded-md !border-0 shadow-none px-3.5 py-2.5";

const formControlTypographyClassName =
  "[font:inherit] leading-[1.35] [color-scheme:light_dark]";

const formControlColorClassName =
  "bg-[color:var(--color-form-bg)] text-[color:var(--color-form-text)] placeholder:text-[color:var(--color-form-placeholder)]";

const formControlStateClassName =
  "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:[box-shadow:none] focus-visible:[box-shadow:none] disabled:cursor-not-allowed disabled:bg-[color:var(--color-form-disabled-bg)] disabled:text-[color:var(--color-form-disabled-text)] disabled:placeholder:text-[color:var(--color-form-disabled-text)]";

export const formControlBaseClassName = [
  formControlLayoutClassName,
  formControlTypographyClassName,
  formControlColorClassName,
  formControlStateClassName,
].join(" ");

export const formSelectSpecificClassName =
  "appearance-none !border-0 shadow-none pl-9 pr-3";

export const formSelectIconClassName =
  "pointer-events-none absolute inset-y-0 left-3 flex items-center text-[color:var(--color-form-text)]";
