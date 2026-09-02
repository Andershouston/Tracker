import { Select } from "radix-ui";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export function SelectField<T extends string>({ value, options, onValueChange, ariaLabel, className }: {
  value: T;
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Select.Root value={value} onValueChange={(next) => onValueChange(next as T)}>
      <Select.Trigger className={`radix-select-trigger${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
        <Select.Value />
        <Select.Icon asChild><img src="/icons/ui/chevron-down.svg" alt="" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="radix-select-content" position="popper" sideOffset={4} collisionPadding={8}>
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item className="radix-select-item" value={option.value} key={option.value}>
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator asChild><img src="/icons/ui/check.svg" alt="" /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
