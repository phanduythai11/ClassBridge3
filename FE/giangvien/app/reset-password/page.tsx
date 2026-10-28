"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../login/login.module.css";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("token") || ""); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token,password}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể đặt lại mật khẩu.");
      setMessage(data.message);
    } catch(e) { setError(e instanceof Error ? e.message : "Không thể kết nối máy chủ."); }
    finally { setLoading(false); }
  }

  return <div className={styles.container}><main className={styles.main}><section className={styles.card}>
    <div className={styles.title}><h1>Đặt lại mật khẩu</h1><p>Tạo mật khẩu mới có ít nhất 8 ký tự.</p></div>
    {message ? <p role="status" style={{color:"#86efac",lineHeight:1.6}}>{message} <Link href="/login" style={{color:"#4cd6fb"}}>Đăng nhập</Link></p> :
    !token ? <p role="alert" style={{color:"#fca5a5"}}>Liên kết thiếu mã xác nhận. Hãy yêu cầu liên kết mới.</p> :
    <form onSubmit={submit}><div className={styles["form-login"]}>
      <label className={styles["form-label"]} htmlFor="password">Mật khẩu mới</label>
      <input id="password" type="password" required minLength={8} autoComplete="new-password" className={styles["form-input"]} style={{paddingLeft:"1rem"}} value={password} onChange={e=>setPassword(e.target.value)} />
    </div><div className={styles["form-login"]}>
      <label className={styles["form-label"]} htmlFor="confirm">Nhập lại mật khẩu</label>
      <input id="confirm" type="password" required minLength={8} autoComplete="new-password" className={styles["form-input"]} style={{paddingLeft:"1rem"}} value={confirm} onChange={e=>setConfirm(e.target.value)} />
    </div>{error && <p role="alert" style={{color:"#fca5a5"}}>{error}</p>}
    <button className={styles["btn-submit"]} disabled={loading}>{loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</button></form>}
    <p style={{textAlign:"center",marginTop:"1rem"}}><Link href="/login" style={{color:"#4cd6fb"}}>Quay lại đăng nhập</Link></p>
  </section></main></div>;
}

