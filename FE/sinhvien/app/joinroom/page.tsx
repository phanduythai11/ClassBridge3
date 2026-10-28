"use client";

import { useState } from "react";
import styles from "./join.module.css";
import {
  GraduationCap,
  Home,
  BookOpen,
  MessageSquare,
  FileText,
  BarChart2,
  Settings,
  Search,
  Plus,
  Calendar,
  Video,
  FileEdit,
  Bell,
  CalendarDays,
  Radio,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  X,
  CameraIcon,
  PhoneOff,
  Mic,
  Monitor,
  Users,
  Hash,
  ArrowLeftIcon
} from "lucide-react";
// Kiểu dữ liệu 1 lớp học
type ClassItem = {
  id: string;
  code: string;
  name: string;
  instructor: string;
  time: string;
  date: string;
  status: "ongoing" | "upcoming"; // ongoing = đang diễn ra, upcoming = sắp diễn ra
};

// TODO: thay bằng dữ liệu thật lấy từ API sau này
const studentName = "";
const classes: ClassItem[] = [];

// 3 màn hình có thể hiển thị: trang chủ / quét QR / nhập mã lớp
type Screen = "home" | "scanQr" | "enterCode";

// ----- Icon (SVG, không cần cài thư viện) -----


export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<"ongoing" | "upcoming">("ongoing");
  const [screen, setScreen] = useState<Screen>("home");
  const [codeInput, setCodeInput] = useState("");

  const ongoingClasses = classes.filter((c) => c.status === "ongoing");
  const upcomingClasses = classes.filter((c) => c.status === "upcoming");
  const visibleClasses = activeTab === "ongoing" ? ongoingClasses : upcomingClasses;

  // Xử lý khi bấm "Tham gia" ở màn nhập mã
  function handleJoinByCode() {
    if (!codeInput.trim()) return;
    // TODO: gửi codeInput lên server để kiểm tra và tham gia lớp thật
    console.log("Tham gia lớp bằng mã:", codeInput.trim());
  }
  

  // ================== MÀN HÌNH: QUÉT MÃ QR ==================
  if (screen === "scanQr") {
    return (
      <div className={styles.page}>
        <div className={styles.joinScreen}>
          <div className={styles.joinScreenHeader}>
            <button className={styles.backButton} onClick={() => setScreen("home")}>
              <ArrowLeftIcon /> Quay lại
            </button>
            <h1 className={styles.joinScreenTitle}>Quét mã QR</h1>
          </div>

          <div className={styles.scanBox}>

            <span className={`${styles.scanCorner} ${styles.scanCornerTL}`} />
            <span className={`${styles.scanCorner} ${styles.scanCornerTR}`} />
            <span className={`${styles.scanCorner} ${styles.scanCornerBL}`} />
            <span className={`${styles.scanCorner} ${styles.scanCornerBR}`} />
            <div className={styles.scanCameraCircle}>
              <CameraIcon />
            </div>
          </div>

          <p className={styles.scanHint}>Đưa mã QR vào khung hình</p>
        </div>
      </div>
    );
  }

  // ================== MÀN HÌNH: NHẬP MÃ LỚP ==================
  if (screen === "enterCode") {
    return (
      <div className={styles.page}>
        <div className={styles.joinScreen}>
          <div className={styles.joinScreenHeader}>
            <button className={styles.backButton} onClick={() => setScreen("home")}>
              <ArrowLeftIcon /> Quay lại
            </button>
          </div>

          <div className={styles.codeCard}>
            <h1 className={styles.codeCardTitle}>Nhập mã lớp</h1>

            <label className={styles.codeLabel} htmlFor="classCode">
              Mã lớp học
            </label>

            <input
              id="classCode"
              type="text"
              className={styles.codeInput}
              placeholder="Ví dụ: ABCD-EFGH"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            />

            <div className={styles.codeCardActions}>
              <button className={styles.cancelBtn} onClick={() => setScreen("home")}>
                Hủy
              </button>
              <button
                className={styles.joinBtn}
                disabled={!codeInput.trim()}
                onClick={handleJoinByCode}
              >
                Tham gia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}