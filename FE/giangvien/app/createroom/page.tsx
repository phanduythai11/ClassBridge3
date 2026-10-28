"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react"; // npm install qrcode.react
import styles from "./create.module.css";
import {
  generateUniqueClassCode,
  generateQrPayload,
} from "../home/classCodeGenerator";
import {
  Home,
  BookOpen,
  BarChart2,
  Settings,
  RefreshCw,
  MessageSquare,
  FileText,
} from "lucide-react";
import Link from "next/link";

// TODO: lấy danh sách mã lớp đang có thật từ database khi tích hợp API,
// để đảm bảo mã mới sinh ra không trùng với bất kỳ lớp nào.
const existingClassCodes: string[] = [];

export default function CreateClass() {
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classCode, setClassCode] = useState(() =>
    generateUniqueClassCode(existingClassCodes),
  );

  function handleRegenerateCode() {
    setClassCode(generateUniqueClassCode(existingClassCodes));
  }

  function handleCreateClass() {
    if (!subjectName.trim() || !date || !startTime || !endTime) return;
    console.log("Tạo lớp học:", {
      subjectName,
      classCode,
      date,
      startTime,
      endTime,
      description,
    });
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/home" className={styles.logoLink}>
            <span className={styles.logoText}>
              <img src="/Ai.png" alt="Logo" /> ClassBridge
            </span>
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link href="/home" className={styles.navItem}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link href="/home" className={styles.navItem}>
            <BookOpen size={18} />
            <span>My class</span>
          </Link>
          <Link href="/question" className={styles.navItem}>
            <MessageSquare size={18} />
            <span>Question center</span>
          </Link>
          <Link href="/createroom" className={styles.navItem}>
            <FileText size={18} />
            <span>Lesson Summary</span>
          </Link>
          <Link href="/home" className={styles.navItem}>
            <BarChart2 size={18} />
            <span>Report</span>
          </Link>
          <div className={styles.sidebarDivider}>
            <Link href="/home" className={styles.navItem}>
              <Settings size={18} />
              <span>Setting</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className={styles.main}>
        <h1 className={styles.title}>Tạo lớp học mới</h1>

        <div className={styles.formCard}>
          {/* Tên môn học */}
          <label className={styles.label}>
            Tên môn học <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Vui lòng nhập tên môn học"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />

          {/* Mã lớp — tự sinh, không cho gõ tay */}
          <label className={styles.label}>
            Mã lớp <span className={styles.required}>*</span>
          </label>
          <div className={styles.codeRow}>
            <input
              type="text"
              className={styles.input}
              value={classCode}
              readOnly
            />
            <button
              type="button"
              className={styles.regenerateBtn}
              onClick={handleRegenerateCode}
              title="Tạo mã khác"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <p className={styles.helperText}>
            Mã này do hệ thống tự sinh và đảm bảo không trùng với bất kỳ lớp nào
            khác.
          </p>

          {/* Thời gian */}
          <label className={styles.label}>
            Thời gian <span className={styles.required}>*</span>
          </label>
          <div className={styles.timeRow}>
            <input
              type="date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              className={styles.input}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <span className={styles.timeDash}>-</span>
            <input
              type="time"
              className={styles.input}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Mô tả */}
          <label className={styles.label}>Mô tả (tùy chọn)</label>
          <textarea
            className={styles.textarea}
            placeholder="Ví dụ: Introduction to Software Testing"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className={styles.createBtn} onClick={handleCreateClass}>
            Tạo lớp học
          </button>

          {/* Thông tin lớp học — mã + QR thật, quét được ngay */}
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>Thông tin lớp học</p>

            <div className={styles.infoRow}>
              <div>
                <p className={styles.infoLabel}>
                  Mã lớp: <span className={styles.infoCode}>{classCode}</span>
                </p>
                <p className={styles.infoHint}>
                  Chia sẻ mã QR hoặc mã lớp cho sinh viên
                </p>
              </div>

              <div className={styles.qrWrap}>
                <QRCodeSVG value={generateQrPayload(classCode)} size={80} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
