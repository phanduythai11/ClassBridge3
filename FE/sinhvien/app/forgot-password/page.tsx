"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể gửi yêu cầu.");
      setMessage(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể kết nối máy chủ."); }
    finally { setLoading(false); }
  }

  return <div className={styles.container}><main className={styles.main}><section className={styles.card}>
    <div className={styles.title}><h1>Quên mật khẩu?</h1><p>Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.</p></div>
    {message && <p role="status" style={{color:"#86efac",lineHeight:1.6}}>{message}</p>}
    {error && <p role="alert" style={{color:"#fca5a5"}}>{error}</p>}
    <form onSubmit={submit}><div className={styles["form-login"]}>
      <label className={styles["form-label"]} htmlFor="email">Địa chỉ email</label>
      <input id="email" type="email" required autoComplete="email" className={styles["form-input"]} style={{paddingLeft:"1rem"}} value={email} onChange={e=>setEmail(e.target.value)} />
    </div><button className={styles["btn-submit"]} disabled={loading}>{loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}</button></form>
    <p style={{textAlign:"center",marginTop:"1rem"}}><Link href="/login" style={{color:"#4cd6fb"}}>Quay lại đăng nhập</Link></p>
  </section></main></div>;
}

