"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react"; 
import styles from "./home.module.css";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Radio,
  LayoutGrid,
  Users,
  CalendarClock,
  Settings,
  LayoutDashboard,
  Bell,
  RefreshCw,
  Copy,
  Check,
  UserPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  generateUniqueClassCode,
  generateQrPayload,
} from "./classCodeGenerator";

import AccountMenu from "../account-logo/AccountMenu";

const APP_BASE_URL = "https://classbridge.app";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Live Session", href: "/room", icon: Radio },
  { label: "Class management", href: "/classmanagement", icon: Users },
  { label: "Question grouping", href: "/question", icon: LayoutGrid },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const SETTING_NAV_ITEM = { label: "Settings", href: "/settings", icon: Settings };

type ClassItem = {
  id: string;
  code: string;
  name: string;
  date: string;
  time: string;
  status: "ongoing" | "upcoming";
  studentCount: number;
  groupCount: number;
};

const initialClasses: ClassItem[] = [];
const existingClassCodes: string[] = [];

type RightPanelView = "create" | "result";

export default function TeacherHome() {
  const pathname = usePathname();
  const router = useRouter();

  const [classesList, setClassesList] = useState<ClassItem[]>(initialClasses);
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>("create");

  // Form states
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classCode, setClassCode] = useState(() =>
    generateUniqueClassCode(existingClassCodes)
  );
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const joinLink = `${APP_BASE_URL}/join/${classCode}`;

  const sortedClasses = [...classesList].sort((a, b) => {
    const weight = (c: ClassItem) => (c.status === "ongoing" ? 0 : 1);
    return weight(a) - weight(b);
  });

  function handleNavigate(href: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  function handleRegenerateCode() {
    setClassCode(generateUniqueClassCode(existingClassCodes));
  }

  function handleCreateClass() {
    if (!subjectName.trim() || !date || !startTime || !endTime) return;

    const newClass: ClassItem = {
      id: classCode,
      code: classCode,
      name: subjectName.trim(),
      date,
      time: `${startTime} - ${endTime}`,
      status: "upcoming",
      studentCount: 0,
      groupCount: 0,
    };

    setClassesList((prev) => [...prev, newClass]);
    setRightPanelView("result");
  }

  function handleCopy(text: string, type: "code" | "link") {
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleCreateAnother() {
    setSubjectName("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setClassCode(generateUniqueClassCode(existingClassCodes));
    setRightPanelView("create");
  }

  function handleAddStudent(classId: string) {
    console.log("Thêm sinh viên vào lớp:", classId);
  }

  function handleEditClass(classId: string) {
    console.log("Sửa lớp:", classId);
  }

  function handleDeleteClass(classId: string) {
    setClassesList((prev) => prev.filter((c) => c.id !== classId));
  }

  return (
    <div className={styles.page}>
      {/* ---------- Topbar ---------- */}
      <header className={styles.topBar}>
        <div className={styles.topBarBrand}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>
              <img src="/Ai.png" alt="Logo" /> ClassBridge
            </span>
          </Link>
        </div>
        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.topBarIconButton}
            aria-label="Thông báo"
          >
            <Bell size={19} />
          </button>
          <AccountMenu
            teacherName="Teacher"
            onSaveAccountInfo={(info) => {
              console.log("Save account info:", info);
            }}
            onSubmitPasswordChange={(oldPassword, newPassword) => {
              console.log("Change password:", { oldPassword, newPassword });
            }}
            onLogout={() => {
              console.log("Log out");
            }}
          />
        </div>
      </header>

      <div className={styles.body}>
        {/* ---------- Sidebar ---------- */}
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigate(href)}
                className={`${styles.navItem} ${
                  pathname === href ? styles.navItemActive : ""
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}

            {/* Sử dụng class sidebarDivider để tạo thanh ngang */}
            <div className={styles.sidebarDivider}>
              <button
                type="button"
                onClick={() => handleNavigate(SETTING_NAV_ITEM.href)}
                className={`${styles.navItem} ${
                  pathname === SETTING_NAV_ITEM.href ? styles.navItemActive : ""
                }`}
              >
                <SETTING_NAV_ITEM.icon size={18} />
                <span>{SETTING_NAV_ITEM.label}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* ---------- Main content ---------- */}
        <div className={styles.twoColumn}>
          {/* Cột 1: Lớp học của tôi */}
          <section className={styles.classBox}>
            <div className={styles.classBoxHeader}>
              <h2 className={styles.sectionTitle}>Lớp học của tôi</h2>
              <a href="#" className={styles.viewAll}>
                Xem tất cả
              </a>
            </div>

            {sortedClasses.length === 0 && (
              <p className={styles.emptyText}>Chưa có dữ liệu lớp học.</p>
            )}

            {sortedClasses.map((c) => (
              <div key={c.id} className={styles.classCard}>
                <div className={styles.classCardTop}>
                  <span className={styles.classIcon}>
                    <BookOpen size={18} />
                  </span>

                  <div className={styles.classInfo}>
                    <div className={styles.classTitle}>
                      {c.code} - {c.name}
                    </div>
                    <div className={styles.classMeta}>
                      {c.date} · {c.time}
                    </div>
                  </div>

                  <span
                    className={
                      c.status === "ongoing"
                        ? styles.statusOngoing
                        : styles.statusUpcoming
                    }
                  >
                    {c.status === "ongoing" ? "Đang diễn ra" : "Sắp diễn ra"}
                  </span>
                </div>

                <div className={styles.classStats}>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>{c.studentCount}</div>
                    <div className={styles.statLabel}>Sinh viên</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>{c.groupCount}</div>
                    <div className={styles.statLabel}>Nhóm câu hỏi</div>
                  </div>
                </div>

                <div className={styles.classActions}>
                  <button
                    className={styles.actionBtn}
                    title="Thêm sinh viên"
                    onClick={() => handleAddStudent(c.id)}
                  >
                    <UserPlus size={15} />
                  </button>
                  <button
                    className={styles.actionBtn}
                    title="Sửa lớp"
                    onClick={() => handleEditClass(c.id)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    title="Xóa lớp"
                    onClick={() => handleDeleteClass(c.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Cột 2: Tạo lớp học / Kết quả */}
          <section className={styles.formCard}>
            {rightPanelView === "create" ? (
              <>
                <h2 className={styles.sectionTitle}>Tạo lớp học mới</h2>
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
                  Mã này do hệ thống tự sinh và đảm bảo không trùng với bất kỳ
                  lớp nào khác.
                </p>
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
                <label className={styles.label}>Mô tả (tùy chọn)</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Ví dụ: Introduction to Software Testing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button
                  className={styles.createBtn}
                  onClick={handleCreateClass}
                >
                  Tạo lớp học
                </button>
              </>
            ) : (
              <>
                <h2 className={styles.sectionTitle}>Đã tạo lớp học</h2>
                <p className={styles.resultInlineSubtitle}>
                  Bạn hãy chia sẻ mã lớp, link hoặc mã QR này cho sinh viên để
                  tham gia lớp học.
                </p>
                <div className={styles.inlineResultCenter}>
                  <div className={styles.bigQrWrap}>
                    <QRCodeSVG
                      value={generateQrPayload(classCode)}
                      size={220}
                    />
                  </div>
                  <div className={styles.bigCodeLabel}>Mã lớp học</div>
                  <div className={styles.bigCodeRow}>
                    <span className={styles.bigCode}>{classCode}</span>
                    <button
                      className={styles.copyIconBtn}
                      onClick={() => handleCopy(classCode, "code")}
                    >
                      {copied === "code" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  <div className={styles.linkRow}>
                    <span className={styles.linkText}>{joinLink}</span>
                    <button
                      className={styles.copyIconBtn}
                      onClick={() => handleCopy(joinLink, "link")}
                    >
                      {copied === "link" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  className={styles.createBtn}
                  onClick={handleCreateAnother}
                >
                  Tạo lớp học khác
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
