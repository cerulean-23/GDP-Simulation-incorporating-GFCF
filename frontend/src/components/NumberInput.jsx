import { useState, useEffect } from "react";

/**
 * A number input that holds its own text buffer instead of forcing
 * Number(value) on every keystroke. Fixes two things a plain
 * <input type="number"> does badly under a controlled-value pattern:
 * - clearing the field snapping back to "0" mid-edit
 * - typed digits prepending/getting mangled (e.g. "2" -> "02" -> "023")
 * onChange only fires with a real number once the text actually parses;
 * invalid/incomplete text (empty, "-", "1.") is held locally until it
 * either becomes valid or the field blurs, at which point it reverts.
 */
export default function NumberInput({ value, onChange, className, ...props }) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    // Only resync from outside when the prop actually changed to a
    // different number than what we're currently showing/typing.
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") return;
    const num = Number(raw);
    if (!Number.isNaN(num)) onChange(num);
  };

  const handleBlur = () => {
    const num = Number(text);
    if (text === "" || Number.isNaN(num)) {
      setText(String(value)); // revert to last valid committed value
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
}
