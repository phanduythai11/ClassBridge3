// D:\NCKH\HocTap\FE\sinhvien\app\login\Login-profile\page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login-profile.module.css";
import { GraduationCap } from "lucide-react";

const FULLNAME_REGEX = /^[\p{L}]+(?:\s[\p{L}]+)*$/u;
// Mã số sinh viên: chữ + số, 6-12 ký tự. Chỉnh lại nếu trường bạn quy định khác.
const STUDENT_ID_REGEX = /^[A-Za-z0-9]{6,12}$/;

type Errors = { fullName?: string; studentId?: string };

const PROFILE_STORAGE_KEY = "sinhvien_profile";

export default function LoginProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: Errors = {};
    const name = fullName.trim();
    if (!name) next.fullName = "Vui lòng nhập họ và tên.";
    else if (/\d/.test(name)) next.fullName = "Họ và tên không được chứa số.";
    else if (!FULLNAME_REGEX.test(name)) next.fullName = "Họ và tên chỉ được chứa chữ cái.";

    const sid = studentId.trim();
    if (!sid) next.studentId = "Vui lòng nhập mã số sinh viên.";
    else if (!STUDENT_ID_REGEX.test(sid))
      next.studentId = "Mã số sinh viên chỉ gồm chữ và số, 6-12 ký tự.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO (khi có backend): thay đoạn lưu localStorage bên dưới bằng gọi API thật, ví dụ:
      // const res = await fetch("/api/me/complete-profile", {
      //   method: "POST",
      //   credentials: "include",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ fullName: fullName.trim(), studentId: studentId.trim() }),
      // });
      // if (!res.ok) throw new Error("Không thể lưu thông tin.");

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify({ fullName: fullName.trim(), studentId: studentId.trim() })
        );
      }

      router.push("/home");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon}>
            <GraduationCap size={22} />
          </span>
          <span className={styles.logoText}>ClassBridge</span>
        </div>

        <h1 className={styles.title}>Hoàn thiện hồ sơ</h1>
        <p className={styles.subtitle}>
          Vui lòng nhập họ tên và mã số sinh viên để tiếp tục vào hệ thống.
        </p>

        <form onSubmit={handleSave} noValidate className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Họ và tên *</label>
            <input
              className={`${styles.formInput} ${errors.fullName ? styles.inputError : ""}`}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((er) => ({ ...er, fullName: undefined }));
              }}
              placeholder="Nguyễn Văn A"
              autoFocus
            />
            {errors.fullName && <p className={styles.fieldError}>{errors.fullName}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mã số sinh viên *</label>
            <input
              className={`${styles.formInput} ${errors.studentId ? styles.inputError : ""}`}
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setErrors((er) => ({ ...er, studentId: undefined }));
              }}
              placeholder="SV000123"
            />
            {errors.studentId && <p className={styles.fieldError}>{errors.studentId}</p>}
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" className={styles.btnPrimary} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
