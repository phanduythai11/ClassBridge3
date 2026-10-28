"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  LayoutDashboard,
  Radio,
  Users,
  CalendarDays,
  Settings,
  Bell,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Home,
  LayoutGrid,
  CalendarClock,
  Check,
} from "lucide-react";

import AccountMenu from "../account-logo/AccountMenu";

// Sidebar phẳng — không còn dropdown "Question grouping" nữa. Class
// management và Question grouping giờ là 2 route riêng, ngang hàng các mục
// khác. Đổi lại href cho khớp route thật của dự án nếu khác.
const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Live Session", href: "/room", icon: Radio },
  { label: "Class management", href: "/classmanagement", icon: Users },
  { label: "Question grouping", href: "/question", icon: LayoutGrid },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const SETTING_NAV_ITEM = { label: "Settings", href: "/settings", icon: Settings };

const lecturer = { name: "Dr. Nguyen Van A", role: "Lecturer" };

type ClassOption = { id: string; label: string };
const CLASS_OPTIONS: ClassOption[] = [
  { id: "cs101", label: "AI in Education (CS101)" },
  { id: "se305", label: "Software Testing (SE305)" },
  { id: "db210", label: "Database Systems (DB210)" },
];

type Trend = {
  direction: "up" | "down";
  value: string;
  positive: boolean;
};

type StatCard = {
  label: string;
  value: string;
  trend: Trend;
};

type ConfusionPoint = {
  id: string;
  title: string;
  count: number;
};

type RecentQuestion = {
  id: string;
  text: string;
  secondaryText?: string;
  group: string;
  timeAgo: string;
};

const STATS: StatCard[] = [
  {
    label: "Total Questions",
    value: "48",
    trend: { direction: "up", value: "12%", positive: true },
  },
  {
    label: "Question Groups",
    value: "8",
    trend: { direction: "down", value: "33%", positive: false },
  },
  {
    label: "Students Active",
    value: "42",
    trend: { direction: "up", value: "5%", positive: true },
  },
  {
    label: "Avg. Response Time",
    value: "2.3s",
    trend: { direction: "down", value: "40%", positive: true },
  },
];

const CONFUSION_POINTS: ConfusionPoint[] = [
  { id: "cp-1", title: "Machine Learning vs Deep Learning", count: 12 },
  { id: "cp-2", title: "Gradient Descent Algorithm", count: 9 },
  { id: "cp-3", title: "Overfitting / Underfitting", count: 7 },
  { id: "cp-4", title: "Model Evaluation Metrics", count: 5 },
  { id: "cp-5", title: "Regularization Techniques", count: 4 },
];

const RECENT_QUESTIONS: RecentQuestion[] = [
  {
    id: "q-1",
    text: "What is the difference between supervised and unsupervised learning?",
    group: "Group 1",
    timeAgo: "2m ago",
  },
  {
    id: "q-2",
    text: "Tại sao mô hình bị overfitting?",
    secondaryText: "Why does the model overfit?",
    group: "Group 2",
    timeAgo: "4m ago",
  },
  {
    id: "q-3",
    text: "How to choose the right evaluation metric for classification?",
    group: "Group 3",
    timeAgo: "6m ago",
  },
  {
    id: "q-4",
    text: "Có thể giải thích thêm về regularization không ạ?",
    group: "Group 4",
    timeAgo: "8m ago",
  },
];

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function TeacherDashboard() {
  const pathname = usePathname();
  const router = useRouter();

  // Tên hiển thị lấy từ lúc đăng nhập — TODO: thay bằng session/context auth thật của bạn
  const [teacherName, setTeacherName] = useState(lecturer.name);

  useEffect(() => {
    const storedName =
      typeof window !== "undefined" ? localStorage.getItem("teacherName") : null;
    if (storedName) setTeacherName(storedName);
  }, []);

  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(CLASS_OPTIONS[0].id);
  const classMenuRef = useRef<HTMLDivElement>(null);
  const selectedClass =
    CLASS_OPTIONS.find((c) => c.id === selectedClassId) ?? CLASS_OPTIONS[0];

  useEffect(() => {
    if (!isClassMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        classMenuRef.current &&
        !classMenuRef.current.contains(event.target as Node)
      ) {
        setIsClassMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isClassMenuOpen]);

  const [selectedDate, setSelectedDate] = useState("2026-09-23");
  const dateInputRef = useRef<HTMLInputElement>(null);

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof (el as any).showPicker === "function") {
      (el as any).showPicker();
    } else {
      el.click();
    }
  }

  function formatDateLabel(isoDate: string) {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const maxConfusionCount = Math.max(...CONFUSION_POINTS.map((c) => c.count), 1);

  function handleNavigate(href: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarBrand}>
          <span className={styles.logoText}>
            <img src="/Ai.png" alt="Logo" /> ClassBridge
          </span>
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

      <div className={styles.body}>
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

        <main className={styles.main}>
          <div className={styles.topRow}>
            <div>
              <h1 className={styles.pageTitle}>Dashboard</h1>
              <p className={styles.pageSubtitle}>Overview of your class sessions</p>
            </div>

            <div className={styles.topControls}>
              <div className={styles.pickerWrap} ref={classMenuRef}>
                <button
                  type="button"
                  className={styles.pickerBtn}
                  onClick={() => setIsClassMenuOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isClassMenuOpen}
                >
                  <span>{selectedClass.label}</span>
                  <ChevronDown
                    size={14}
                    className={`${styles.pickerChevron} ${
                      isClassMenuOpen ? styles.pickerChevronOpen : ""
                    }`}
                  />
                </button>

                {isClassMenuOpen && (
                  <div className={styles.pickerMenu} role="listbox">
                    {CLASS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={option.id === selectedClassId}
                        className={`${styles.pickerMenuItem} ${
                          option.id === selectedClassId
                            ? styles.pickerMenuItemActive
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedClassId(option.id);
                          setIsClassMenuOpen(false);
                        }}
                      >
                        <span>{option.label}</span>
                        {option.id === selectedClassId && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.pickerWrap}>
                <button
                  type="button"
                  className={styles.pickerBtn}
                  onClick={openDatePicker}
                >
                  <CalendarDays size={14} className={styles.pickerIcon} />
                  <span>{formatDateLabel(selectedDate)}</span>
                  <ChevronDown size={14} className={styles.pickerChevron} />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  className={styles.hiddenDateInput}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Chọn ngày"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          <div className={styles.statsGrid}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
                <div className={styles.statTrend}>
                  <span className={stat.trend.positive ? styles.trendUp : styles.trendDown}>
                    {stat.trend.direction === "up" ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )}
                    {stat.trend.value}
                  </span>
                  <span>vs. last session</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.bottomGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <h2 className={styles.panelTitle}>Top Confusion Points</h2>
                </div>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} /> Live
                </span>
              </div>

              <div className={styles.confusionList}>
                {CONFUSION_POINTS.map((point, index) => (
                  <div key={point.id} className={styles.confusionRow}>
                    <span className={styles.confusionRank}>{index + 1}</span>
                    <div className={styles.confusionBody}>
                      <div className={styles.confusionTopLine}>
                        <span className={styles.confusionTitle}>{point.title}</span>
                        <span className={styles.confusionCount}>{point.count}</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${(point.count / maxConfusionCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Recent Questions</h2>
                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => handleNavigate("/question")}
                >
                  View all
                </button>
              </div>

              <div className={styles.questionList}>
                {RECENT_QUESTIONS.map((q) => (
                  <div key={q.id} className={styles.questionRow}>
                    <div className={styles.questionTextBlock}>
                      <p className={styles.questionText}>{q.text}</p>
                      {q.secondaryText && (
                        <p className={styles.questionSecondaryText}>{q.secondaryText}</p>
                      )}
                    </div>
                    <div className={styles.questionMeta}>
                      <span className={styles.groupTag}>{q.group}</span>
                      <span className={styles.timeAgo}>{q.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
