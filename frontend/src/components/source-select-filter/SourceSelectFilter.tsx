import { FormSelect } from "@/components/form";

export type SourceSelectOption = {
  value: string;
  label: string;
};

export type SourceSelectFilterProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SourceSelectOption[];
  allOptionLabel: string;
  isOptionsPending?: boolean;
  wrapperClassName?: string;
  className?: string;
};

// Select standard of source (repository/project/etc) reutilizado in the overview and preview.
export function SourceSelectFilter({
  id,
  label,
  value,
  onChange,
  options,
  allOptionLabel,
  isOptionsPending = false,
  wrapperClassName,
  className,
}: SourceSelectFilterProps) {
  return (
    <FormSelect
      id={id}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      wrapperClassName={wrapperClassName}
      className={className}
      disabled={isOptionsPending && options.length === 0}
    >
      <option value="">{allOptionLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </FormSelect>
  );
}
