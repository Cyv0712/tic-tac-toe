import { useId } from "react";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  legend: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
};

/** A radio group styled as a row of buttons. Native radios keep arrow-key support. */
export function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
}: Props<T>) {
  const name = useId();
  return (
    <fieldset className="field">
      <legend className="field-label">{legend}</legend>
      <div className="segmented">
        {options.map((o) => (
          <label key={o.value} className="segment">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
