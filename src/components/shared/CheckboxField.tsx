import { Checkbox } from "radix-ui";

export function CheckboxField({ checked, onCheckedChange, label }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="check-row">
      <Checkbox.Root className="radix-checkbox" checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)}>
        <Checkbox.Indicator asChild><img src="/icons/ui/check.svg" alt="" /></Checkbox.Indicator>
      </Checkbox.Root>
      <span>{label}</span>
    </label>
  );
}
