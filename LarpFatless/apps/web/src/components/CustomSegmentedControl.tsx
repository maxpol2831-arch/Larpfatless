interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface CustomSegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function CustomSegmentedControl<T extends string>({ options, value, onChange }: CustomSegmentedControlProps<T>) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <div className="segmented-control" style={{ "--segments": options.length, "--active-index": activeIndex } as CSSProperties}>
      <span className="segmented-control__thumb" />
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
import type { CSSProperties } from "react";
