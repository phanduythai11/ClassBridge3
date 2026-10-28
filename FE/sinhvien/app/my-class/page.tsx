"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./my-class.module.css";
import {
  Home,
  BookOpen,
  MessageSquare,
  FileText,
  Settings,
  Radio,
} from "lucide-react";

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

// Định nghĩa kiểu dữ liệu cho lớp học
type ClassData = {
  id: string;
  title: string;
  code: string;
  instructorInitials: string;
  instructorName: string;
  lastSession: string;
  isActive: boolean;
};

export default function MyClassPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State lưu trữ dữ liệu lớp học và trạng thái tải
  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hàm gọi API lấy dữ liệu thật
    async function fetchClasses() {
      try {

        const mockDataFromAPI: ClassData[] = [
          {
            id: "1",
            title: "Web Programming",
            code: "C1SE.38",
            instructorInitials: "JS",
            instructorName: "John Smith",
            lastSession: "SQL Queries",
            isActive: true,
          },
          {
            id: "2",
            title: "Database Management",
            code: "C1SE.38",
            instructorInitials: "DB",
            instructorName: "David Brown",
            lastSession: "Relational Model",
            isActive: true,
          },
        ];
        
        // Giả lập thời gian chờ API (1 giây)
        setTimeout(() => {
          setMyClasses(mockDataFromAPI);
          setIsLoading(false);
        }, 1000);
        // --- Kết thúc phần dữ liệu giả lập API ---

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu lớp học:", error);
        setIsLoading(false);
      }
    }

    fetchClasses();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.logoArea}>
          <span className={styles.logoText}>
            <img src="/Ai.png" alt="Logo" /> ClassBridge
          </span>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.bellButton}>🔔</button>
          <div className={styles.avatar}></div>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <button
                key={href}
                type="button"
                onClick={() => router.push(href)}
                className={`${styles.navItem} ${pathname === href ? styles.navItemActive : ""}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
            <div className={styles.sidebarDivider}>
              <button
                type="button"
                onClick={() => router.push(SETTING_NAV_ITEM.href)}
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
          <div className={styles.headerArea}>
            <span className={styles.breadcrumb}>My Class</span>
            <h1 className={styles.pageTitle}>Lớp học của bạn</h1>
            <p className={styles.pageSubtitle}>Danh sách các lớp bạn đang tham gia</p>
          </div>

          <div className={styles.classList}>
            {isLoading ? (
              <p>Đang tải dữ liệu lớp học...</p>
            ) : myClasses.length === 0 ? (
              <p>Bạn chưa tham gia lớp học nào.</p>
            ) : (
              myClasses.map((cls) => (
                <div key={cls.id} className={styles.classCard}>
                  <div className={styles.cardTop}>
                    <div>
                      <h2 className={styles.className}>{cls.title}</h2>
                      <p className={styles.classCode}>{cls.code}</p>
                    </div>
                    {cls.isActive && (
                      <div className={styles.statusActive}>
                        <span className={styles.statusDot}></span> Active
                      </div>
                    )}
                  </div>

                  <div className={styles.instructorRow}>
                    <div className={styles.instructorAvatar}>{cls.instructorInitials}</div>
                    <span className={styles.instructorName}>{cls.instructorName}</span>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.cardBottom}>
                    <span className={styles.lastSession}>
                      Last session: <span className={styles.lastSessionHighlight}>{cls.lastSession}</span>
                    </span>
                    <button 
  className={styles.enterBtn}
  onClick={() => router.push(`/my-class/class-id?id=${cls.id}`)}
>
  Enter Class &rarr;
</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}