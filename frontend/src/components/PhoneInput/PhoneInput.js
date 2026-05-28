"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import countries from "@/lib/countries";
import styles from "./PhoneInput.module.css";

export default function PhoneInput({
  label,
  value = "",
  onChange,
  error,
  id,
  ...props
}) {
  const [selected, setSelected] = useState(countries[0]); // Default: India
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Extract phone number without dial code
  const phoneNumber = value.startsWith(selected.dial)
    ? value.slice(selected.dial.length)
    : value.replace(/^\+\d+/, "");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (country) => {
    setSelected(country);
    setOpen(false);
    setSearch("");
    // Update the full phone value
    onChange?.(country.dial + phoneNumber);
  };

  const handlePhoneChange = (e) => {
    const num = e.target.value.replace(/\D/g, ""); // digits only
    onChange?.(selected.dial + num);
  };

  return (
    <div className={styles.phoneGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.phoneRow}>
        {/* Country Selector */}
        <div className={styles.dropdownWrap} ref={dropdownRef}>
          <button
            type="button"
            className={styles.countryBtn}
            onClick={() => setOpen(!open)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className={styles.flag}>{selected.code}</span>
            <span className={styles.dialCode}>{selected.dial}</span>
            <ChevronDown
              size={14}
              className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            />
          </button>

          {open && (
            <div className={styles.dropdown} role="listbox">
              <input
                ref={searchRef}
                type="text"
                className={styles.search}
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={c.code === selected.code}
                  className={`${styles.option} ${c.code === selected.code ? styles.optionActive : ""}`}
                  onClick={() => handleSelect(c)}
                >
                  <span className={styles.optionFlag}>{c.code}</span>
                  <span className={styles.optionName}>{c.name}</span>
                  <span className={styles.optionDial}>{c.dial}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
                  No results
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phone Number */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          className={styles.phoneInput}
          placeholder="9876543210"
          value={phoneNumber}
          onChange={handlePhoneChange}
          {...props}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
