"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Zap, ShieldCheck, RefreshCw } from "lucide-react";
import Button from "@/components/Button/Button";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.landing}>
      <div className={styles.hero}>
        <div className={styles.heroIcon}><Shield size={30} /></div>
        <h1 className={styles.heroTitle}>
          Secure <span className={styles.accent}>OTP</span> Auth
        </h1>
        <p className={styles.heroSub}>
          Production-grade authentication with email &amp; phone verification,
          powered by Redis and MongoDB.
        </p>
        <div className={styles.cta}>
          <Button onClick={() => router.push(isAuthenticated ? "/dashboard" : "/auth")}>
            {isAuthenticated ? "Dashboard" : "Get Started"}
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              View Profile
            </Button>
          )}
        </div>
      </div>

      <div className={styles.features}>
        <div className={`glass ${styles.feat}`}>
          <div className={styles.featIcon}><Zap size={22} /></div>
          <div className={styles.featTitle}>Redis-Powered</div>
          <div className={styles.featDesc}>OTPs with TTL auto-expiry. Sub-ms reads.</div>
        </div>
        <div className={`glass ${styles.feat}`}>
          <div className={styles.featIcon}><ShieldCheck size={22} /></div>
          <div className={styles.featTitle}>Rate Limited</div>
          <div className={styles.featDesc}>Brute-force and spam protection built in.</div>
        </div>
        <div className={`glass ${styles.feat}`}>
          <div className={styles.featIcon}><RefreshCw size={22} /></div>
          <div className={styles.featTitle}>Token Rotation</div>
          <div className={styles.featDesc}>Refresh rotation with reuse detection.</div>
        </div>
      </div>
    </div>
  );
}
