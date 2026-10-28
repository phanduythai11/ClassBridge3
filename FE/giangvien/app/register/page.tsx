"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import styles from "../login/login.module.css";

export default function LecturerRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    try {
      await authService.register({ fullName, email, password, role: "LECTURER" });
      setSuccess("\u0110\u0103ng k\u00FD t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng!");
      window.setTimeout(() => router.push("/login?registered=1"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.title}>
            <h1>Tạo tài khoản giảng viên</h1>
            <p>Đăng ký để bắt đầu sử dụng ClassBridge</p>
          </div>
          {success && <div className={styles.successToast} role="status" aria-live="polite"><span className={styles.successIcon} aria-hidden="true">&#10003;</span><span>{success}</span></div>}
          {error && <p role="alert" style={{ color: "#f87171", textAlign: "center" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className={styles["form-login"]}>
              <label className={styles["form-label"]} htmlFor="fullName">Họ và tên</label>
              <input id="fullName" className={styles["form-input"]} value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} autoComplete="name" />
            </div>
            <div className={styles["form-login"]}>
              <label className={styles["form-label"]} htmlFor="email">Email</label>
              <input id="email" type="email" className={styles["form-input"]} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className={styles["form-login"]}>
              <label className={styles["form-label"]} htmlFor="password">Mật khẩu (ít nhất 8 ký tự)</label>
              <input id="password" type="password" className={styles["form-input"]} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div className={styles["form-login"]}>
              <label className={styles["form-label"]} htmlFor="confirmPassword">Nhập lại mật khẩu</label>
              <input id="confirmPassword" type="password" className={styles["form-input"]} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <button type="submit" className={styles["btn-submit"]} disabled={loading}>
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "1rem", color: "#9ca3af", fontSize: "0.9rem" }}>
            Đã có tài khoản? <Link href="/login" style={{ color: "#4cd6fb" }}>Đăng nhập</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
