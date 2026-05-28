"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield, LogOut, User, Mail, Phone, Calendar, Clock,
  CheckCircle, Pencil, AlertTriangle, Music
} from "lucide-react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout, logoutAll, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/auth");
  }, [isAuthenticated, authLoading, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      setSaveMsg("");
      await updateProfile({ name: name.trim() });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    router.push("/auth");
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}><Shield size={18} /></div>
            <span className={styles.brandName}>OTP Auth</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut size={15} /> Logout
          </Button>
        </header>

        {/* Welcome */}
        <div className={`glass ${styles.welcome}`}>
          <div className={styles.welcomeIcon}><User size={24} /></div>
          <h1 className={styles.welcomeTitle}>
            {user?.name ? `Hello, ${user.name}` : "Welcome"}
          </h1>
          <p className={styles.welcomeSub}>Your account is securely authenticated.</p>
        </div>

        {/* The Rickroll (Autoplays on login) */}
        <div style={{ marginBottom: 20, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <iframe 
            width="100%" 
            height="350" 
            src="https://www.youtube.com/embed/xvFZjo5PgG0?autoplay=1"
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>

        {/* Info Grid */}
        <div className={styles.grid}>
          <div className={`glass ${styles.infoCard}`}>
            <div className={styles.infoLabel}><Mail size={12} /> Email</div>
            <div className={styles.infoVal}>
              {user?.email || <span className={styles.none}>Not linked</span>}
            </div>
            {user?.email && (
              <span className={`${styles.badge} ${user?.isEmailVerified ? styles.verified : styles.unverified}`}>
                <CheckCircle size={10} /> {user?.isEmailVerified ? "Verified" : "Unverified"}
              </span>
            )}
          </div>

          <div className={`glass ${styles.infoCard}`}>
            <div className={styles.infoLabel}><Phone size={12} /> Phone</div>
            <div className={styles.infoVal}>
              {user?.phone || <span className={styles.none}>Not linked</span>}
            </div>
            {user?.phone && (
              <span className={`${styles.badge} ${user?.isPhoneVerified ? styles.verified : styles.unverified}`}>
                <CheckCircle size={10} /> {user?.isPhoneVerified ? "Verified" : "Unverified"}
              </span>
            )}
          </div>

          <div className={`glass ${styles.infoCard}`}>
            <div className={styles.infoLabel}><Calendar size={12} /> Member since</div>
            <div className={styles.infoVal}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              }) : "Unknown"}
            </div>
          </div>

          <div className={`glass ${styles.infoCard}`}>
            <div className={styles.infoLabel}><Clock size={12} /> Last login</div>
            <div className={styles.infoVal}>
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })
                : "Just now"}
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className={`glass ${styles.section}`}>
          <h2 className={styles.sectionTitle}><Pencil size={14} /> Edit Profile</h2>
          <form className={styles.profileForm} onSubmit={handleSave}>
            <Input
              id="profile-name"
              icon={<User size={16} />}
              label="Display Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className={styles.profileActions}>
              <Button type="submit" loading={saving} disabled={!name.trim()}>
                Save
              </Button>
              {saveMsg && (
                <span
                  className={styles.saveMsg}
                  style={{ color: saveMsg === "Saved!" ? "var(--success)" : "var(--error)" }}
                >
                  {saveMsg}
                </span>
              )}
            </div>
          </form>
        </div>



        {/* Danger Zone */}
        <div className={`glass ${styles.section} ${styles.danger}`}>
          <h2 className={styles.sectionTitle}><AlertTriangle size={14} /> Danger Zone</h2>
          <p className={styles.dangerDesc}>
            This will invalidate all active sessions across every device.
          </p>
          <button className={styles.dangerBtn} onClick={handleLogoutAll}>
            Logout from all devices
          </button>
        </div>
      </div>
    </div>
  );
}
