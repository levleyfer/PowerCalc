import { useState } from "react";
import { clamp } from "../../utils/format";

/**
 * Shared label renderer used across sliders, inputs and selects.
 * Keeps icon + title + helper text visually consistent.
 */
function FieldLabel({ icon, name, desc, className = "" }) {
  return (
    <div className={`sliderFieldLabelWrap ${className}`.trim()}>
      {icon && (
        <img
          src={icon}
          alt={typeof name === "string" ? name : ""}
          className="sliderFieldIcon"
        />
      )}

      <div>
        <div className="sliderFieldName">{name}</div>

        {desc && <div className="sliderFieldDesc">{desc}</div>}
      </div>
    </div>
  );
}

/** Small stat card used in result panels. */
export function Meter({ icon, name, value }) {
  return (
    <div className={`meter ${icon ? "meterWithIcon" : ""}`}>
      <div className="meterHeader">
        <div className="meterName">{name}</div>

        {icon && (
          <img
            src={icon}
            alt={typeof name === "string" ? name : ""}
            className="meterIcon"
          />
        )}
      </div>

      <div className="meterVal">{value}</div>
    </div>
  );
}

/**
 * Main range slider used in calculators.
 * Background fill updates live with the value.
 */
export function Stepper({
  icon,
  name,
  desc,
  value,
  unit,
  step,
  min,
  max,
  onChange,
}) {
  const displayValue = `${value}${unit ? ` ${unit}` : ""}`;

  // Detect RTL layout for reverse fill direction
  const isRTL =
    typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const rawProgress =
    ((Number(value) - Number(min)) / (Number(max) - Number(min))) * 100;

  const progress = Number.isFinite(rawProgress)
    ? Math.min(100, Math.max(0, rawProgress))
    : 0;

  const fillPoint = isRTL ? 100 - progress : progress;

  const sliderStyle = {
    background: `linear-gradient(
      90deg,
      #6c63ff 0%,
      #8a7dff ${fillPoint}%,
      rgba(158, 171, 206, 0.42) ${fillPoint}%,
      rgba(158, 171, 206, 0.42) 100%
    )`,
  };

  return (
    <div className="sliderField">
      <div className="sliderFieldTop">
        <FieldLabel icon={icon} name={name} desc={desc} />

        <div className="sliderFieldValue">{displayValue}</div>
      </div>

      <input
        type="range"
        className="sliderInput"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
        style={sliderStyle}
      />

      <div className="sliderFieldRange">
        <span>
          {min}
          {unit}
        </span>

        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

/** Collapsible advanced settings block. */
export function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="accordion">
      <button
        className="acHeader"
        type="button"
        onClick={() => setOpen((s) => !s)}
      >
        <span>{title}</span>

        <span className="accordionChevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && <div className="acBody">{children}</div>}
    </div>
  );
}

// Long labels look cleaner split into two rows
function shouldSplit(label) {
  if (typeof label !== "string") return true;

  return label.length >= 18;
}

/** Numeric +/- stepper control. */
export function AdvancedStepper({
  icon,
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
  format,
}) {
  const dec = () => onChange(clamp(Number(value) - step, min, max));

  const inc = () => onChange(clamp(Number(value) + step, min, max));

  const show =
    typeof format === "function"
      ? format(Number(value))
      : Number.isFinite(Number(value))
        ? Number(value)
        : value;

  const split = shouldSplit(label);

  return (
    <div className={`stepper ${split ? "advSplit" : ""}`}>
      <div className="stepperLeft">
        <FieldLabel icon={icon} name={label} />
      </div>

      <div className="stepperRight">
        <button className="pillBtn" type="button" onClick={dec}>
          −
        </button>

        <div className="valueBox">
          {show} {unit}
        </div>

        <button className="pillBtn" type="button" onClick={inc}>
          +
        </button>
      </div>
    </div>
  );
}

/** Cycles through a short list of options. */
export function ChoiceStepper({ icon, label, value, options, onChange }) {
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const cur = options[idx] || options[0];

  const split = shouldSplit(label);

  const prev = () =>
    onChange(options[(idx - 1 + options.length) % options.length].value);

  const next = () => onChange(options[(idx + 1) % options.length].value);

  return (
    <div className={`stepper ${split ? "advSplit" : ""}`}>
      <div className="stepperLeft">
        <FieldLabel icon={icon} name={label} />
      </div>

      <div className="stepperRight">
        <button className="pillBtn" type="button" onClick={prev}>
          ◀
        </button>

        <div className="valueBox">{cur.label}</div>

        <button className="pillBtn" type="button" onClick={next}>
          ▶
        </button>
      </div>
    </div>
  );
}

/** Text / numeric input styled like other controls. */
export function TextStepper({ icon, label, value, onChange, placeholder }) {
  const split = shouldSplit(label);

  return (
    <div className={`stepper ${split ? "advSplit" : ""}`}>
      <div className="stepperLeft">
        <FieldLabel icon={icon} name={label} desc={placeholder} />
      </div>

      <div className="stepperRight stepperRightFull">
        <input
          className="valueBox valueBoxInput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

/** Simple labeled input row. */
export function InputRow({
  icon,
  label,
  value,
  onChange,
  containerClassName = "",
  inputClassName = "",
  ...rest
}) {
  return (
    <label className={`stackField ${containerClassName}`.trim()}>
      <FieldLabel icon={icon} name={label} className="stackLabelWithIcon" />

      <input
        className={`stackInput ${inputClassName}`.trim()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}

/** Simple labeled select row. */
export function SelectRow({
  icon,
  label,
  value,
  onChange,
  options,
  containerClassName = "",
  selectClassName = "",
}) {
  return (
    <label className={`stackField ${containerClassName}`.trim()}>
      <FieldLabel icon={icon} name={label} className="stackLabelWithIcon" />

      <select
        className={`stackInput ${selectClassName}`.trim()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </label>
  );
}
