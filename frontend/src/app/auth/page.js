"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Mail, Phone, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import PhoneInput from "@/components/PhoneInput/PhoneInput";
import OtpInput from "@/components/OtpInput/OtpInput";
import styles from "./auth.module.css";

const RESEND_COOLDOWN = 60;

export default function AuthPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isAuthenticated, loading: authLoading } = useAuth();

  const [step, setStep] = useState("identifier");
  const [type, setType] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSendOtp = useCallback(async (e) => {
    e?.preventDefault();
    setError("");
    setSuccess("");

    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (type === "phone" && !/^\+[1-9]\d{6,14}$/.test(identifier)) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(type, identifier);
      setSuccess(res.message);
      setStep("otp");
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
      if (err.data?.cooldownRemaining) setCountdown(err.data.cooldownRemaining);
    } finally {
      setLoading(false);
    }
  }, [type, identifier, sendOtp]);

  const handleVerifyOtp = useCallback(async (code) => {
    setError("");
    setSuccess("");
    setOtpError(false);
    try {
      setLoading(true);
      await verifyOtp(type, identifier, code);
      setSuccess("Verified! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err) {
      setError(err.message || "Invalid OTP.");
      setOtpError(true);
    } finally {
      setLoading(false);
    }
  }, [type, identifier, verifyOtp, router]);

  const handleResend = async () => {
    setError("");
    setOtpError(false);
    try {
      setLoading(true);
      await sendOtp(type, identifier);
      setSuccess("New OTP sent!");
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.message || "Failed to resend.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep("identifier");
    setError("");
    setSuccess("");
    setOtpError(false);
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={`glass ${styles.card}`}>
          <div className={styles.header}>
            <div className={styles.iconBadge}><Shield size={26} /></div>
            <h1 className={styles.title}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  const mask = (t, id) => {
    if (t === "email") {
      const [l, d] = id.split("@");
      return `${l.slice(0, 2)}***@${d}`;
    }
    return id.slice(0, 3) + "*****" + id.slice(-4);
  };

  return (
    <div className={styles.page}>
      <div className={`glass ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.iconBadge}>
            {step === "otp" ? <Mail size={26} /> : <Shield size={26} />}
          </div>
          <h1 className={styles.title}>
            {step === "otp" ? "Enter OTP" : "Welcome back"}
          </h1>
          <p className={styles.subtitle}>
            {step === "otp" ? (
              <>Code sent to <span className={styles.highlight}>{mask(type, identifier)}</span></>
            ) : (
              "Sign in with your email or phone number"
            )}
          </p>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle size={15} /> {success}
          </div>
        )}

        {step === "identifier" && (
          <form className={styles.form} onSubmit={handleSendOtp}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${type === "email" ? styles.tabActive : ""}`}
                onClick={() => { setType("email"); setIdentifier(""); setError(""); }}
              >
                <Mail size={14} /> Email
              </button>
              <button
                type="button"
                className={`${styles.tab} ${type === "phone" ? styles.tabActive : ""}`}
                onClick={() => { setType("phone"); setIdentifier(""); setError(""); }}
              >
                <Phone size={14} /> Phone
              </button>
            </div>

            {type === "email" ? (
              <Input
                id="email-input"
                type="email"
                icon={<Mail size={16} />}
                label="Email Address"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trim())}
                autoFocus
                required
              />
            ) : (
              <PhoneInput
                id="phone-input"
                label="Phone Number"
                value={identifier}
                onChange={(val) => setIdentifier(val)}
                autoFocus
                required
              />
            )}

            <Button type="submit" block loading={loading}>
              Send OTP
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className={styles.otpSection}>
            <OtpInput
              length={6}
              onComplete={handleVerifyOtp}
              error={otpError}
              disabled={loading}
            />

            <Button block loading={loading} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <div className={styles.timer}>
              {countdown > 0 ? (
                <>Resend in <span className={styles.timerVal}>{fmt(countdown)}</span></>
              ) : (
                <button className={styles.resend} onClick={handleResend} disabled={loading}>
                  Resend OTP
                </button>
              )}
            </div>

            <button className={styles.back} onClick={goBack}>
              <ArrowLeft size={14} /> Change {type}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
