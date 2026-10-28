"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AccountMenu from "../account/AccountMenu";
import {
  LayoutDashboard,
  Radio,
  LayoutGrid,
  Users,
  CalendarClock,
  Settings,
  Bell,
  Play,
  Pause,
  Volume2,
  Clock,
  Home,
  FlagOff,
  MessageSquare,
  FileText,
  BarChart2,
  BookOpen
} from "lucide-react";
import styles from "./live.module.css";

/* ------------------------------------------------------------------ */
/* Dữ liệu mẫu — thay bằng dữ liệu thật (API / speech-to-text) sau này  */
/* ------------------------------------------------------------------ */

interface TranscriptLine {
  id: string;
  time: string; // mm:ss trong bài giảng
  en: string;
  vi: string;
}

const LECTURE_TITLE = "Lớp học chưa có tên";
const LECTURE_DURATION = "00:45:12";

const TRANSCRIPT: TranscriptLine[] = [
  {
    id: "t1",
    time: "00:42",
    en: "Machine learning is a subset of artificial intelligence.",
    vi: "Machine learning là một nhánh của trí tuệ nhân tạo.",
  },
  {
    id: "t2",
    time: "01:12",
    en: "Today we will focus on supervised learning algorithms.",
    vi: "Hôm nay chúng ta sẽ tập trung vào các thuật toán học có giám sát.",
  },
  {
    id: "t3",
    time: "01:45",
    en: "The next slide shows the basic structure of a neural network.",
    vi: "Slide tiếp theo cho thấy cấu trúc cơ bản của một mạng nơ-ron.",
  },
];

// Danh sách điều hướng sidebar — dùng chung cho mọi trang, đổi href cho khớp
// route thật trong app/ của bạn.
const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My class", href: "/my-class", icon: BookOpen }, 
  { label: "Live Sessions", href: "/live-lession", icon: Radio },
  { label: "Question Groups", href: "/question", icon: MessageSquare },
  { label: "Lesson Summary", href: "/summary", icon: FileText },
];

const SETTINGS_ITEM = { label: "Settings", href: "/setting", icon: Settings };

/* ------------------------------------------------------------------ */
/* Lưu bài giảng đã tổng hợp vào "Tài liệu" của trang Question Center.  */
/* TODO (BE): thay localStorage bằng API thật, ví dụ:                   */
/*   POST /api/classes/:classId/materials { title, transcript, ... }    */
/* ------------------------------------------------------------------ */
function saveLectureToDocuments(className: string) {
  if (typeof window === "undefined") return;
  const doc = {
    id: crypto.randomUUID(),
    className: className.trim(),
    title: LECTURE_TITLE,
    duration: LECTURE_DURATION,
    transcript: TRANSCRIPT,
    savedAt: new Date().toISOString(),
  };
  const existingRaw = localStorage.getItem("classbridge_documents");
  const existing = existingRaw ? JSON.parse(existingRaw) : [];
  localStorage.setItem(
    "classbridge_documents",
    JSON.stringify([...existing, doc]),
  );
}

/* ------------------------------------------------------------------ */

type EndFlowStep = "closed" | "confirm" | "enterClassName";

export default function LessonSummaryPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [teacherName, setTeacherName] = useState("");

  const [isPlaying, setIsPlaying] = useState(true);
  const [endFlowStep, setEndFlowStep] = useState<EndFlowStep>("closed");
  const [className, setClassName] = useState("");

  function handleEndClick() {
    setEndFlowStep("confirm");
  }

  function handleConfirmNo() {
    // Không tổng hợp -> thoát thẳng về trang chủ
    setEndFlowStep("closed");
    router.push("/home");
  }

  function handleConfirmYes() {
    setEndFlowStep("enterClassName");
  }

  function handleSaveDocument() {
    if (!className.trim()) return;
    saveLectureToDocuments(className);
    setEndFlowStep("closed");
    // Đưa thẳng tới tab "Tài liệu" trong trang Question Center để thấy ngay
    router.push("/question?tab=materials");
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.topBanner}>
        <div className={styles.topBannerLeft}>
          <span className={styles.logoText}>
            <img src="/Ai.png" alt="Logo" /> ClassBridge
          </span>
        </div>

        <div className={styles.topBannerRight}>
          <button
            type="button"
            className={styles.topBannerIconBtn}
            aria-label="Thông báo"
          >
            <Bell size={17} className={styles.topBannerBellIcon} />
          </button>
  <AccountMenu
            teacherName={teacherName}
            onSaveAccountInfo={(info) => {
              // TODO: gọi API cập nhật thông tin tài khoản thật ở đây
              console.log("Lưu thông tin tài khoản:", info);
              setTeacherName(info.username);
            }}
            onSubmitPasswordChange={(oldPassword, newPassword) => {
              // TODO: gọi API đổi mật khẩu thật ở đây
              console.log("Đổi mật khẩu:", { oldPassword, newPassword });
            }}
            onLogout={() => {
              // TODO: gọi API/logic đăng xuất thật
              console.log("Đăng xuất");
            }}
          />
        </div>
      </header>

      <div className={styles.page}>
        {/* ===================== SIDEBAR (dùng chung toàn app) ===================== */}
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${
                  pathname === href ? styles.navItemActive : ""
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarDivider} />

          <Link
            href={SETTINGS_ITEM.href}
            className={`${styles.navItem} ${
              pathname === SETTINGS_ITEM.href ? styles.navItemActive : ""
            }`}
          >
            <SETTINGS_ITEM.icon size={17} />
            <span>{SETTINGS_ITEM.label}</span>
          </Link>
        </aside>

        {/* ===================== NỘI DUNG CHÍNH ===================== */}
        <main className={styles.main}>
          {/* Thanh thông tin bài giảng — không có "Live" vì đây là học offline */}
          <div className={styles.sessionBar}>
            <div className={styles.sessionBarLeft}>
              <span className={styles.offlineTag}>Bài giảng đã ghi</span>
              <span className={styles.sessionTitle}>{LECTURE_TITLE}</span>
            </div>
            <div className={styles.sessionTimer}>
              <Clock size={14} />
              {LECTURE_DURATION}
            </div>
          </div>

          {/* Không có khung video/slide — chỉ nghe + đọc phụ đề song ngữ */}
          <div className={styles.audioBar}>
            <button
              type="button"
              className={styles.audioPlayBtn}
              onClick={() => setIsPlaying((v) => !v)}
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <div className={styles.audioProgressTrack}>
              <div className={styles.audioProgressFill} style={{ width: "42%" }} />
            </div>

            <span className={styles.audioTime}>18:56 / {LECTURE_DURATION}</span>

            <button
              type="button"
              className={styles.audioVolumeBtn}
              aria-label="Âm lượng"
            >
              <Volume2 size={16} />
            </button>
          </div>

          {/* Nghe - dịch: 2 cột cố định EN | VI, không phải nút chuyển qua lại */}
          <div className={styles.translatePanel}>
            <div className={styles.translateHeader}>
              <span className={styles.translateColLabel}>EN — Nghe</span>
              <span className={styles.translateColLabel}>VI — Bản dịch</span>
            </div>

            <div className={styles.translateBody}>
              {TRANSCRIPT.map((line) => (
                <div key={line.id} className={styles.translateRow}>
                  <span className={styles.translateTime}>{line.time}</span>
                  <p className={styles.translateEn}>{line.en}</p>
                  <p className={styles.translateVi}>{line.vi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nút Kết thúc — góc phải phía dưới */}
          <button
            type="button"
            className={styles.endButton}
            onClick={handleEndClick}
          >
            <FlagOff size={16} />
            Kết thúc
          </button>
        </main>
      </div>

      {/* ===================== MODAL: Xác nhận tổng hợp bài giảng ===================== */}
      {endFlowStep === "confirm" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Kết thúc buổi nghe bài giảng?</h3>
            <p className={styles.modalText}>
              Bạn có muốn tổng hợp bài giảng này để lưu lại không?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtnOutline}
                onClick={handleConfirmNo}
              >
                Không
              </button>
              <button
                type="button"
                className={styles.modalBtnPrimary}
                onClick={handleConfirmYes}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Nhập tên lớp học để lưu ===================== */}
      {endFlowStep === "enterClassName" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Lưu vào tài liệu lớp học</h3>
            <p className={styles.modalText}>
              Nhập tên lớp học để lưu bản tổng hợp bài giảng này vào mục Tài
              liệu.
            </p>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="Ví dụ: CMU-IS 482 CIS"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtnOutline}
                onClick={() => setEndFlowStep("closed")}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.modalBtnPrimary}
                disabled={!className.trim()}
                onClick={handleSaveDocument}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
