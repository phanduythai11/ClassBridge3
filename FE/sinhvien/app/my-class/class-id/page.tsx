"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  ArrowLeft, Play, ChevronRight,
  Home, BookOpen, MessageSquare, FileText, Settings, Radio 
} from "lucide-react";

// Import CSS dùng chung cho Topbar/Sidebar (từ thư mục cha)
import layoutStyles from "../my-class.module.css";
// Import CSS riêng cho phần chi tiết lớp học
import styles from "./class-id.module.css";

// Interface dữ liệu
type SessionData = { id: string; week: string; title: string; };
type ClassData = {
  id: string; title: string; code: string;
  instructorInitials: string; instructorName: string;
  currentSessionTitle: string; previousSessions: SessionData[];
};

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My class", href: "/my-class", icon: BookOpen },
  { label: "Live lessons", href: "/live-lession", icon: Radio },
  { label: "Question grouping", href: "/question", icon: MessageSquare },
  { label: "Lesson Summary", href: "/summary", icon: FileText },
];

const SETTING_NAV_ITEM = {
  label: "Setting",
  href: "/setting",
  icon: Settings,
};

function ClassDetailContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentId = searchParams.get("id"); 
  
  const [classDetail, setClassDetail] = useState<ClassData | null>(null);

  useEffect(() => {
    if (!currentId) return;

    // Giả lập lấy dữ liệu dựa trên currentId
    const mockData = {
      id: currentId,
      title: "Web Programming",
      code: "C1SE.38",
      instructorInitials: "JS",
      instructorName: "John Smith",
      currentSessionTitle: "Database Normalization",
      previousSessions: [
        { id: "s3", week: "Week 03", title: "SQL Queries" },
        { id: "s2", week: "Week 02", title: "Relational Database" },
        { id: "s1", week: "Week 01", title: "Introduction" },
      ]
    };
    
    setClassDetail(mockData);
  }, [currentId]);

  return (
    <div className={layoutStyles.page}>
      {/* 1. TOPBAR - Tái sử dụng layoutStyles */}
      <header className={layoutStyles.topbar}>
        <div className={layoutStyles.logoArea}>
          <span className={layoutStyles.logoText}>
            <img src="/Ai.png" alt="Logo" /> ClassBridge
          </span>
        </div>
        <div className={layoutStyles.topbarActions}>
          <button className={layoutStyles.bellButton}>🔔</button>
          <div className={layoutStyles.avatar}></div>
        </div>
      </header>

      <div className={layoutStyles.body}>
        {/* 2. SIDEBAR - Tái sử dụng layoutStyles */}
        <aside className={layoutStyles.sidebar}>
          <nav className={layoutStyles.navMenu}>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              // Highlight menu My Class kể cả khi đang ở trang chi tiết
              const isActive = pathname.includes(href);
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => router.push(href)}
                  className={`${layoutStyles.navItem} ${isActive ? layoutStyles.navItemActive : ""}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              )
            })}
            <div className={layoutStyles.sidebarDivider}>
              <button
                type="button"
                onClick={() => router.push(SETTING_NAV_ITEM.href)}
                className={`${layoutStyles.navItem} ${
                  pathname === SETTING_NAV_ITEM.href ? layoutStyles.navItemActive : ""
                }`}
              >
                <SETTING_NAV_ITEM.icon size={18} />
                <span>{SETTING_NAV_ITEM.label}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* 3. MAIN CONTENT - Chứa giao diện chi tiết */}
        <main className={layoutStyles.main}>
          {!classDetail ? (
            <p>Đang tải chi tiết lớp học...</p>
          ) : (
            <div className={styles.detailContainer}>
              {/* Nút Back về thư mục cha */}
              <button 
                className={styles.backLink} 
                onClick={() => router.push('/my-class')}
              >
                <ArrowLeft size={16} /> My Class
              </button>

              {/* Tiêu đề & Giảng viên */}
              <div className={styles.detailHeader}>
                <div className={styles.detailAvatar}>{classDetail.instructorInitials}</div>
                <div className={styles.detailTitleBlock}>
                  <h1 className={styles.detailTitle}>{classDetail.title}</h1>
                  <p className={styles.detailSubtitle}>
                    {classDetail.code} · Lecturer: {classDetail.instructorName}
                  </p>
                </div>
              </div>

              {/* Thẻ Current Session */}
              <div className={styles.currentSessionCard}>
                <div className={styles.sessionBadgeRow}>
                  <span className={styles.currentSessionText}>Current Session</span>
                  <span className={styles.liveBadge}>
                    <span className={styles.liveDot}></span> Live
                  </span>
                </div>
                <h2 className={styles.currentSessionTitle}>{classDetail.currentSessionTitle}</h2>
                <button 
  className={styles.joinSessionBtn}
  onClick={() => router.push(`/room?code=${classDetail.code}`)}
>
  <Play fill="currentColor" size={16} /> Join Session
</button>

              </div>

              {/* Danh sách Previous Sessions */}
              <div className={styles.previousSection}>
                <h3 className={styles.previousTitle}>Class History</h3>
                <div className={styles.previousList}>
                  {classDetail.previousSessions.map((session) => (
                    <div key={session.id} className={styles.previousItem}onClick={() =>router.push(`/summary?id=${classDetail.id}&session=${session.id}`)}>
                      <div className={styles.previousItemLeft}>
                        <span className={styles.weekBadge}>{session.week}</span>
                        <span className={styles.previousItemTitle}>{session.title}</span>
                      </div>
                      <ChevronRight size={18} className={styles.chevronIcon} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Bọc Component trong Suspense theo yêu cầu của Next.js khi dùng useSearchParams
export default function ClassDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Đang tải giao diện...</div>}>
      <ClassDetailContent />
    </Suspense>
  );
}
