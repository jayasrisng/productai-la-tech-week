"use client";

type Props = {
  label: string;
  allLabel: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  onClear: () => void;
};

export function MultiSelectFilter({ label, allLabel, options, selected, onToggle, onClear }: Props) {
  return <div className="multi-filter">
    <span className="multi-filter-label">{label}</span>
    <details>
      <summary aria-label={`${label}: ${selected.length ? `${selected.length} selected` : allLabel}`}><span>{selected.length ? `${selected.length} selected` : allLabel}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
      <fieldset>
        <legend>{label}</legend>
        {options.map(option => <label className="multi-filter-option" key={option}>
          <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
          <span>{option}</span>
        </label>)}
      </fieldset>
      {selected.length > 0 ? <button className="multi-filter-clear" onClick={onClear} aria-label={`Clear ${label.toLowerCase()}`}>Clear</button> : null}
    </details>
  </div>;
}
