"use client";
import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  block = false,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  ...props
}) {
  const v = variant === "ghost" ? styles.ghost : styles.primary;

  return (
    <button
      type={type}
      className={`${styles.btn} ${v} ${block ? styles.block : ""}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}
