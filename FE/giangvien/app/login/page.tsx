"use client";
import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService"; // <-- Thêm service gọi API
import styles from "./login.module.css"; // ĐỔI: global "./login.css" -> CSS Module

const roleCallbackUrls: Record<string, string> = {
  STUDENT: `${process.env.NEXT_PUBLIC_STUDENT_APP_URL || "http://localhost:3002"}/auth-callback`,
  LECTURER: `${process.env.NEXT_PUBLIC_LECTURER_APP_URL || "http://localhost:3001"}/auth-callback`,
  ADMIN: `${process.env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3000"}/auth-callback`,
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Gọi API đăng nhập sang Backend Flask (cổng 5000)
      const data = await authService.login({ email, password });

      const destination = roleCallbackUrls[data.user.role];
      if (!destination) {
        setError("\u0110\u0103ng nh\u1EADp t\u00E0i kho\u1EA3n n\u00E0y t\u1EA1i trang qu\u1EA3n tr\u1ECB.");
        return;
      }

      setSuccess("\u0110\u0103ng nh\u1EADp th\u00E0nh c\u00F4ng!");
      window.setTimeout(() => {
        window.location.assign(`${destination}#access_token=${encodeURIComponent(data.token)}`);
      }, 1300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Email hoặc mật khẩu không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.title}>
            <h1>Chào mừng trở lại</h1>
            <p>Truy cập vào ClassBridge – AI của bạn</p>
          </div>

          {/* Hiển thị lỗi nếu đăng nhập thất bại */}
          {success && (
            <div className={styles.successToast} role="status" aria-live="polite">
              <span className={styles.successIcon} aria-hidden="true">?</span>
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles["form-login"]}>
              <label className={styles["form-label"]}>Địa chỉ Email</label>
              <div className={styles["input-wrapper"]}>
                <img
                  src="/mail.png"
                  alt="mail icon"
                  style={{ width: "20px", height: "20px" }}
                />
                <input
                  type="email"
                  placeholder="Vui lòng nhập email của bạn"
                  className={styles["form-input"]}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles["form-login"]}>
              <label className={styles["form-label"]}>Mật khẩu</label>
              <div className={styles["input-wrapper"]}>
                <img
                  src="/lock.png"
                  alt="lock icon"
                  style={{ width: "20px", height: "20px" }}
                />
                <input
                  type="password"
                  placeholder="Vui lòng nhập mật khẩu"
                  className={styles["form-input"]}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <img
                  src="/eye.png"
                  alt="eye icon"
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </div>
            </div>
            <div className={styles["form-options"]}>
              <label className={styles["remember-pass"]}>
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgot-password" className={styles["forgot-pass"]}>
                Quên mật khẩu?
              </Link>
            </div>
            <button
              type="submit"
              className={styles["btn-submit"]}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "1rem", color: "#9ca3af", fontSize: "0.9rem" }}>
            Chưa có tài khoản <Link href="/register" style={{ color: "#4cd6fb" }}>đăng ký ngay</Link>
          </p>
          <div className={styles.text}>HOẶC ĐĂNG NHẬP BẰNG TÀI KHOẢN</div>
          <div className={styles["social-login"]}>
            <button
              className={styles["social-btn"]}
              title="Google"
              type="button"
            >
              <img
                className={styles["social-icon"]}
                src="/google.png"
                alt="Google"
              />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}


