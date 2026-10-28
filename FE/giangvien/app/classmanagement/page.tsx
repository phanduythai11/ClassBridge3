"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Radio,
  Users,
  LayoutGrid,
  CalendarClock,
  LayoutDashboard,
  Settings,
  Bell,
  Search,
  FileSpreadsheet,
  MessageSquare,
} from "lucide-react";
import styles from "./classmanagement.module.css";
import AccountMenu from "../account-logo/AccountMenu";
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
  isLive: boolean;
};

type Student = {
  id: number;
  classId: string;
  name: string;
  studentId: string;
  joined: boolean;
  joinedAt: string;
  questionCount: number;
};

type QuestionNotification = {
  key: string;
  classId: string;
  className: string;
  code: string;
  isLive: boolean;
  questionCount: number;
  askerCount: number;
};

// TODO: lấy danh sách lớp thật của giảng viên từ API khi tích hợp thật.
// Cố tình dùng chung id (c1/c2/c3) với trang Question grouping để 2 trang
// đồng bộ dữ liệu lớp với nhau.
const CLASSES: ClassItem[] = [
  {
    id: "c1",
    code: "CMU-IS 482 CIS · 2627",
    name: "AI in Education (CS101)",
    isLive: true,
  },
  {
    id: "c2",
    code: "CMU-IS 305 · 2627",
    name: "Software Testing (SE305)",
    isLive: false,
  },
  {
    id: "c3",
    code: "CMU-IS 210 · 2627",
    name: "Database Systems (DB210)",
    isLive: false,
  },
];

// TODO: lấy danh sách sinh viên thật theo từng lớp (classId) từ API khi tích hợp thật.
const STUDENTS: Student[] = [
  { id: 1, classId: "c1", name: "Nguyễn Văn Anh", studentId: "2105000124", joined: true, joinedAt: "09:20", questionCount: 3 },
  { id: 2, classId: "c1", name: "Trần Thị Bích Ngọc", studentId: "2105000340", joined: true, joinedAt: "09:43", questionCount: 2 },
  { id: 3, classId: "c1", name: "Lê Minh Đức", studentId: "2105001672", joined: true, joinedAt: "09:10", questionCount: 1 },
  { id: 4, classId: "c1", name: "Phạm Thị Hồng Nhung", studentId: "2105004581", joined: true, joinedAt: "09:32", questionCount: 4 },
  { id: 5, classId: "c1", name: "Ngô Văn Long", studentId: "2105000564", joined: false, joinedAt: "-", questionCount: 0 },
  { id: 6, classId: "c1", name: "Đặng Minh Khang", studentId: "2105000731", joined: true, joinedAt: "09:18", questionCount: 2 },
  { id: 7, classId: "c1", name: "Hoàng Thị Mai", studentId: "2105000816", joined: true, joinedAt: "09:26", questionCount: 0 },
  { id: 8, classId: "c1", name: "Võ Quốc Bảo", studentId: "2105000920", joined: false, joinedAt: "-", questionCount: 0 },
  { id: 9, classId: "c1", name: "Đỗ Thị Hà", studentId: "2105001042", joined: true, joinedAt: "09:35", questionCount: 1 },
  { id: 10, classId: "c1", name: "Bùi Gia Huy", studentId: "2105001178", joined: true, joinedAt: "09:41", questionCount: 3 },
  { id: 11, classId: "c1", name: "Phan Ngọc Linh", studentId: "2105001288", joined: true, joinedAt: "09:15", questionCount: 2 },
  { id: 12, classId: "c1", name: "Nguyễn Hoàng Nam", studentId: "2105001394", joined: false, joinedAt: "-", questionCount: 0 },
  { id: 13, classId: "c1", name: "Lý Khánh Vy", studentId: "2105001406", joined: true, joinedAt: "09:39", questionCount: 1 },
  { id: 14, classId: "c1", name: "Trương Minh Quân", studentId: "2105001530", joined: true, joinedAt: "09:22", questionCount: 2 },
  { id: 15, classId: "c1", name: "Đinh Thùy Dương", studentId: "2105001662", joined: true, joinedAt: "09:30", questionCount: 0 },
  { id: 16, classId: "c1", name: "Hồ Đức Anh", studentId: "2105001775", joined: false, joinedAt: "-", questionCount: 0 },
  { id: 17, classId: "c1", name: "Mai Thanh Tâm", studentId: "2105001820", joined: true, joinedAt: "09:28", questionCount: 1 },
  { id: 18, classId: "c1", name: "Đặng Ngọc Hân", studentId: "2105001932", joined: true, joinedAt: "09:37", questionCount: 2 },
  { id: 19, classId: "c1", name: "Vũ Anh Tú", studentId: "2105002041", joined: true, joinedAt: "09:12", questionCount: 0 },
  { id: 20, classId: "c1", name: "Nguyễn Thùy Trang", studentId: "2105002158", joined: false, joinedAt: "-", questionCount: 0 },
  { id: 21, classId: "c1", name: "Phạm Quốc Việt", studentId: "2105002264", joined: true, joinedAt: "09:44", questionCount: 1 },
  { id: 22, classId: "c1", name: "Lê Hải Yến", studentId: "2105002370", joined: true, joinedAt: "09:17", questionCount: 2 },
  { id: 23, classId: "c1", name: "Trần Minh Khôi", studentId: "2105002486", joined: true, joinedAt: "09:24", questionCount: 0 },
  { id: 24, classId: "c2", name: "Trần Bảo Long", studentId: "2103000456", joined: true, joinedAt: "08:58", questionCount: 1 },
  { id: 25, classId: "c2", name: "Nguyễn Thị Thu", studentId: "2103000789", joined: false, joinedAt: "-", questionCount: 0 },
  { id: 26, classId: "c3", name: "Phạm Đình Khoa", studentId: "2104000111", joined: true, joinedAt: "10:05", questionCount: 2 },
  { id: 27, classId: "c3", name: "Lâm Thị Ngân", studentId: "2104000233", joined: true, joinedAt: "10:02", questionCount: 0 },
];

// useSearchParams() bắt buộc phải nằm trong <Suspense>, nên tách phần nội
// dung ra component con, export default bên dưới chỉ bọc Suspense.
export default function ClassManagementPage() {
  return (
    <Suspense fallback={null}>
      <ClassManagementPageInner />
    </Suspense>
  );
}

function ClassManagementPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Cho phép deep-link từ trang Question grouping: /classmanagement?classId=c1
  // sẽ mở thẳng vào danh sách sinh viên của đúng lớp đó.
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    () => searchParams.get("classId"),
  );
  const [search, setSearch] = useState("");

  const [teacherName, setTeacherName] = useState("");
  // ---------- Thông báo câu hỏi của sinh viên ----------
  const [notifyOpen, setNotifyOpen] = useState(false);
  // Lưu các thông báo đã đọc theo key "classId:soCauHoi" -> khi lớp có thêm
  // câu hỏi mới (số câu hỏi đổi) thì thông báo tự động thành "chưa đọc" lại.
  const [readKeys, setReadKeys] = useState<Set<string>>(() => new Set());
  const notifyRef = useRef<HTMLDivElement | null>(null);

  const selectedClass = useMemo(
    () => CLASSES.find((c) => c.id === selectedClassId) ?? null,
    [selectedClassId],
  );

  const studentCountByClass = useMemo(() => {
    const map: Record<string, number> = {};
    STUDENTS.forEach((s) => {
      map[s.classId] = (map[s.classId] ?? 0) + 1;
    });
    return map;
  }, []);

  const classStudents = useMemo(
    () => STUDENTS.filter((s) => s.classId === selectedClassId),
    [selectedClassId],
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classStudents;
    return classStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query),
    );
  }, [classStudents, search]);

  // TODO: khi tích hợp thật, thay bằng dữ liệu realtime (websocket/polling)
  // từ API thay vì tính từ STUDENTS.
  const notifications = useMemo<QuestionNotification[]>(() => {
    return CLASSES.map((cls) => {
      const askers = STUDENTS.filter(
        (s) => s.classId === cls.id && s.questionCount > 0,
      );
      const questionCount = askers.reduce((sum, s) => sum + s.questionCount, 0);
      return {
        key: `${cls.id}:${questionCount}`,
        classId: cls.id,
        className: cls.name,
        code: cls.code,
        isLive: cls.isLive,
        questionCount,
        askerCount: askers.length,
      };
    })
      .filter((n) => n.questionCount > 0)
      // Lớp đang diễn ra lên đầu
      .sort((a, b) => Number(b.isLive) - Number(a.isLive));
  }, []);

  const unreadCount = notifications.filter((n) => !readKeys.has(n.key)).length;


  // Đóng dropdown khi bấm ra ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!notifyOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        notifyRef.current &&
        !notifyRef.current.contains(event.target as Node)
      ) {
        setNotifyOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNotifyOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notifyOpen]);

  function handleOpenNotification(notification: QuestionNotification) {
    setReadKeys((prev) => new Set(prev).add(notification.key));
    setNotifyOpen(false);
    // Chuyển thẳng sang trang Question grouping, mở đúng lớp có câu hỏi.
    router.push(`/question?classId=${notification.classId}`);
  }

  function handleMarkAllRead() {
    setReadKeys(new Set(notifications.map((n) => n.key)));
  }

  async function handleExportExcel() {
    if (!selectedClass || filteredStudents.length === 0) return;

    // Import động để thư viện xlsx không làm nặng bundle ban đầu
    const XLSX = await import("xlsx");

    const rows = filteredStudents.map((student, index) => ({
      STT: index + 1,
      "Tên sinh viên": student.name,
      MSSV: student.studentId,
      "Trạng thái": student.joined ? "Đã tham gia" : "Chưa tham gia",
      "Thời gian tham gia": student.joinedAt,
      "Số câu hỏi": student.questionCount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sinh viên");

    const safeName = selectedClass.name.replace(/[\\/:*?"<>|]/g, "").trim();
    XLSX.writeFile(workbook, `Danh-sach-sinh-vien_${safeName}.xlsx`);
  }

  function handleOpenClass(classId: string) {
    setSelectedClassId(classId);
    setSearch("");
  }

  function handleBackToClassList() {
    setSelectedClassId(null);
    setSearch("");
  }

  function handleNavigate(href: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  // Nút chuông + dropdown thông báo câu hỏi (đặt cạnh badge lớp đang diễn ra)
  const notifyControl = (
    <div className={styles.notifyWrap} ref={notifyRef}>
      <button
        type="button"
        className={styles.notifyButton}
        aria-label={
          unreadCount > 0
            ? `Thông báo, ${unreadCount} chưa đọc`
            : "Thông báo"
        }
        aria-haspopup="true"
        aria-expanded={notifyOpen}
        onClick={() => setNotifyOpen((open) => !open)}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className={styles.notifyBadge}>{unreadCount}</span>
        )}
      </button>

      {notifyOpen && (
        <div className={styles.notifyPanel} role="menu">
          <div className={styles.notifyHeader}>
            <h2 className={styles.notifyTitle}>Thông báo</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.notifyMarkAll}
                onClick={handleMarkAllRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className={styles.notifyEmpty}>
              Chưa có câu hỏi nào từ sinh viên.
            </p>
          ) : (
            <ul className={styles.notifyList}>
              {notifications.map((n) => {
                const unread = !readKeys.has(n.key);
                return (
                  <li key={n.key}>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${styles.notifyItem} ${
                        unread ? styles.notifyItemUnread : ""
                      }`}
                      onClick={() => handleOpenNotification(n)}
                    >
                      <span className={styles.notifyIcon}>
                        <MessageSquare size={16} />
                      </span>
                      <span className={styles.notifyBody}>
                        <span className={styles.notifyText}>
                          Lớp <strong>{n.className}</strong> có{" "}
                          {n.questionCount} câu hỏi từ {n.askerCount} sinh
                          viên
                        </span>
                        <span className={styles.notifyMeta}>
                          {n.isLive ? "Đang diễn ra · " : ""}
                          Bấm để xem ở Question grouping
                        </span>
                      </span>
                      {unread && <span className={styles.notifyDot} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarBrand}>
          <span className={styles.logoText}>
            <img src="/Ai.png" alt="Logo" /> ClassBridge
          </span>
        </div>

        <div className={styles.topBarActions}>
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
                key={href}
                type="button"
                onClick={() => handleNavigate(href)}
                className={`${styles.navItem} ${
                  pathname === href ? styles.navItemActive : ""
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
            <div className={styles.sidebarDivider} />
            <button
              type="button"
              onClick={() => handleNavigate(SETTING_NAV_ITEM.href)}
              className={`${styles.navItem} ${
                pathname === SETTING_NAV_ITEM.href ? styles.navItemActive : ""
              }`}
            >
              <SETTING_NAV_ITEM.icon size={17} />
              <span>{SETTING_NAV_ITEM.label}</span>
            </button>
          </nav>
        </aside>

        <main className={styles.main}>
          {/* ---------- Màn 1: Danh sách lớp ---------- */}
          {!selectedClass && (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Quản lý lớp học</p>
                  <h1>Danh sách lớp của tôi ({CLASSES.length})</h1>
                </div>
                <div className={styles.headerActions}>{notifyControl}</div>
              </div>

              <div className={styles.classGrid}>
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    className={styles.classCard}
                    onClick={() => handleOpenClass(cls.id)}
                  >
                    <div className={styles.classCardTop}>
                      <p className={styles.classCardCode}>{cls.code}</p>
                      {cls.isLive && (
                        <span className={styles.liveBadge}>Đang diễn ra</span>
                      )}
                    </div>
                    <h3 className={styles.classCardName}>{cls.name}</h3>
                    <div className={styles.classCardFooter}>
                      <span className={styles.classCardCount}>
                        <Users size={14} />
                        {studentCountByClass[cls.id] ?? 0} sinh viên
                      </span>
                      <ChevronRight size={16} className={styles.classCardChevron} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ---------- Màn 2: Danh sách sinh viên của 1 lớp ---------- */}
          {selectedClass && (
            <section className={styles.panel}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackToClassList}
              >
                <ChevronLeft size={16} /> Danh sách lớp
              </button>

              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>{selectedClass.code}</p>
                  <h1>
                    {selectedClass.name} — {filteredStudents.length} sinh viên
                  </h1>
                </div>
                <div className={styles.headerActions}>
                  {selectedClass.isLive && (
                    <span className={styles.liveBadge}>Lớp đang diễn ra</span>
                  )}
                  {notifyControl}
                </div>
              </div>

              <div className={styles.toolbar}>
                <label className={styles.searchBox}>
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm theo tên hoặc MSSV..."
                    aria-label="Tìm kiếm sinh viên"
                  />
                </label>

                <button
                  type="button"
                  className={styles.exportButton}
                  onClick={handleExportExcel}
                  disabled={filteredStudents.length === 0}
                >
                  <FileSpreadsheet size={17} aria-hidden="true" />
                  Xuất Excel
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên sinh viên / MSSV</th>
                      <th>Trạng thái</th>
                      <th>Tham gia</th>
                      <th>Câu hỏi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td className={styles.indexCell}>{index + 1}</td>
                        <td>
                          <strong>{student.name}</strong>
                          <span className={styles.studentId}>
                            {student.studentId}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${student.joined ? styles.joined : styles.notJoined}`}
                          >
                            {student.joined ? "Đã tham gia" : "Chưa tham gia"}
                          </span>
                        </td>
                        <td className={styles.timeCell}>{student.joinedAt}</td>
                        <td className={styles.questionCell}>
                          {student.questionCount}
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className={styles.emptyState}>
                          Không tìm thấy sinh viên phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}