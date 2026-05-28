"use client";
import styles from "./Input.module.css";

export default function Input({ label, icon, error, id, ...props }) {
  return (
    <div className={styles.group}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.wrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={id}
          className={`${styles.input} ${!icon ? styles.noIcon : ""} ${error ? styles.inputError : ""}`}
          {...props}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
