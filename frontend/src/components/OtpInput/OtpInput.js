"use client";
import { useRef, useState, useEffect } from "react";
import styles from "./OtpInput.module.css";

export default function OtpInput({ length = 6, onComplete, error = false, disabled = false }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (val && !/^\d$/.test(val)) return;

    const next = [...values];
    next[index] = val;
    setValues(next);

    if (val && index < length - 1) inputsRef.current[index + 1]?.focus();

    const code = next.join("");
    if (code.length === length && !next.includes("")) onComplete?.(code);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      const next = [...values];
      next[index - 1] = "";
      setValues(next);
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getText().replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setValues(next);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  };

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => {
        setValues(Array(length).fill(""));
        inputsRef.current[0]?.focus();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [error, length]);

  return (
    <div className={styles.container}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={val}
          disabled={disabled}
          placeholder="·"
          className={`${styles.digit} ${val ? styles.filled : ""} ${error ? styles.error : ""}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
