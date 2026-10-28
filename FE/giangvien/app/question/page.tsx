"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Radio,
  LayoutGrid,
  Users,
  CalendarClock,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Bell,
} from "lucide-react";
import styles from "./question.module.css";
import AccountMenu from "../account-logo/AccountMenu";
interface RawQuestion {
  id: string;
  studentName: string;
  text: string;
}

interface QuestionGroup {
  id: string;
  index: number;
  isLive: boolean;
  topic: string;
  totalQuestions: number;
  totalStudents: number;
  representativeQuestions: string[];
  rawQuestions: RawQuestion[];
  answered: boolean;
  answeredAt?: number;
  lastActivityAt: number;
}

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Live Session", href: "/room", icon: Radio },
  { label: "Class management", href: "/classmanagement", icon: Users },
  { label: "Question grouping", href: "/question", icon: LayoutGrid },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const SETTINGS_ITEM = { label: "Settings", href: "/settings", icon: Settings };

const lecturer = { name: "Dr", role: "Lecturer" };

type ClassItem = {
  id: string;
  code: string;
  name: string;
  isLive: boolean;
  studentCount: number;
};

const CLASSES: ClassItem[] = [
  {
    id: "c1",
    code: "CMU-IS 482 CIS · 2627",
    name: "AI in Education (CS101)",
    isLive: true,
    studentCount: 23,
  },
  {
    id: "c2",
    code: "CMU-IS 305 · 2627",
    name: "Software Testing (SE305)",
    isLive: false,
    studentCount: 2,
  },
  {
    id: "c3",
    code: "CMU-IS 210 · 2627",
    name: "Database Systems (DB210)",
    isLive: false,
    studentCount: 2,
  },
];

// TODO: lấy nhóm câu hỏi thật theo từng lớp (đổ về realtime từ room) khi tích hợp thật.
const GROUPS_BY_CLASS_SEED: Record<string, QuestionGroup[]> = {
  c1: [
    {
      id: "grp-1",
      index: 1,
      isLive: true,
      topic: "Machine Learning vs Deep Learning",
      totalQuestions: 12,
      totalStudents: 5,
      representativeQuestions: [
        "What is the difference between ML and DL?",
        "Sự khác nhau giữa Machine Learning và Deep Learning là gì?",
        "How do they relate to each other?",
      ],
      rawQuestions: [
        {
          id: "q1-1",
          studentName: "An",
          text: "What is the difference between ML and DL?",
        },
        {
          id: "q1-2",
          studentName: "Bình",
          text: "ML với DL khác nhau ở điểm nào vậy ạ?",
        },
        {
          id: "q1-3",
          studentName: "Chi",
          text: "How do they relate to each other?",
        },
      ],
      answered: true,
      lastActivityAt: Date.now() - 20 * 60 * 1000,
      answeredAt: Date.now() - 12 * 60 * 1000,
    },
    {
      id: "grp-2",
      index: 2,
      isLive: false,
      topic: "Overfitting & Regularization",
      totalQuestions: 6,
      totalStudents: 4,
      representativeQuestions: [
        "What causes overfitting?",
        "What are some regularization techniques?",
        "Underfitting là gì và khi nào xảy ra?",
      ],
      rawQuestions: [
        { id: "q3-1", studentName: "Người ẩn danh 1", text: "What causes overfitting?" },
        { id: "q3-3", studentName: "Người ẩn danh 2", text: "What are some regularization techniques?" },
        { id: "q3-4", studentName: "Người ẩn danh 3", text: "Underfitting là gì và khi nào xảy ra?" },
        { id: "q3-5", studentName: "Người ẩn danh 4", text: "Is dropout a regularization method?" },
        { id: "q3-6", studentName: "Người ẩn danh 5", text: "Mô hình của em bị overfitting thì nên làm gì?" },
      ],
      answered: false,
      lastActivityAt: Date.now() - 1 * 60 * 1000,
    },
  ],
  c2: [
    {
      id: "grp-c2-1",
      index: 1,
      isLive: false,
      topic: "Unit Testing vs Integration Testing",
      totalQuestions: 3,
      totalStudents: 2,
      representativeQuestions: [
        "Khi nào nên viết integration test thay vì unit test?",
      ],
      rawQuestions: [
        {
          id: "qc2-1",
          studentName: "Long",
          text: "Khi nào nên viết integration test thay vì unit test?",
        },
      ],
      answered: false,
      lastActivityAt: Date.now() - 30 * 60 * 1000,
    },
  ],
  c3: [
    {
      id: "grp-c3-1",
      index: 1,
      isLive: false,
      topic: "Chuẩn hoá dữ liệu (Normalization)",
      totalQuestions: 2,
      totalStudents: 2,
      representativeQuestions: ["Sự khác nhau giữa 2NF và 3NF là gì?"],
      rawQuestions: [
        { id: "qc3-1", studentName: "Khoa", text: "Sự khác nhau giữa 2NF và 3NF là gì?" },
      ],
      answered: false,
      lastActivityAt: Date.now() - 45 * 60 * 1000,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function TeacherQuestionGroupsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [teacherName, setTeacherName] = useState(lecturer.name);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [groupsByClass, setGroupsByClass] =
    useState<Record<string, QuestionGroup[]>>(GROUPS_BY_CLASS_SEED);

  const [expandedViewId, setExpandedViewId] = useState<string | null>(null);
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [justSentId, setJustSentId] = useState<string | null>(null);

  const selectedClass = CLASSES.find((c) => c.id === selectedClassId) ?? null;
  const groups = selectedClassId ? groupsByClass[selectedClassId] ?? [] : [];

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.answered !== b.answered) return a.answered ? 1 : -1;
      if (!a.answered) return b.lastActivityAt - a.lastActivityAt;
      return (b.answeredAt ?? 0) - (a.answeredAt ?? 0);
    });
  }, [groups]);

  function handleSelectClass(classId: string) {
    setSelectedClassId(classId);
    // Reset các state UI khi đổi lớp, tránh còn sót ô trả lời/mở rộng của lớp cũ.
    setExpandedViewId(null);
    setOpenReplyId(null);
    setJustSentId(null);
  }

  const toggleView = (groupId: string) => {
    setExpandedViewId((prev) => (prev === groupId ? null : groupId));
  };

  const toggleReply = (groupId: string) => {
    setOpenReplyId((prev) => (prev === groupId ? null : groupId));
    setJustSentId(null);
  };

  const updateDraft = (groupId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [groupId]: value }));
  };

  const handleSend = (group: QuestionGroup) => {
    const answerText = (replyDrafts[group.id] ?? "").trim();
    if (!answerText || !selectedClassId) return;
    group.rawQuestions.forEach((q) => {
      console.log(
        `[Đã gửi] Trả lời cho câu hỏi "${q.text}" của sinh viên ${q.studentName}: ${answerText}`,
      );
    });

    setGroupsByClass((prev) => ({
      ...prev,
      [selectedClassId]: prev[selectedClassId].map((g) =>
        g.id === group.id
          ? { ...g, answered: true, answeredAt: Date.now() }
          : g,
      ),
    }));
    setJustSentId(group.id);
    setOpenReplyId(null);
  };

  // Gọi hàm này mỗi khi hệ thống nhận được 1 câu hỏi mới đổ về 1 nhóm của 1 lớp
  // (ví dụ qua WebSocket/realtime ở phía backend). Nó sẽ: thêm câu hỏi vào
  // rawQuestions của đúng nhóm, cập nhật lastActivityAt, và mở lại nhóm thành
  // "chưa trả lời" nếu trước đó đã trả lời — nhờ sortedGroups, nhóm sẽ tự
  // nhảy lên đầu danh sách.
  function receiveNewQuestion(
    classId: string,
    groupId: string,
    question: RawQuestion,
  ) {
    setGroupsByClass((prev) => ({
      ...prev,
      [classId]: (prev[classId] ?? []).map((g) =>
        g.id === groupId
          ? {
              ...g,
              rawQuestions: [...g.rawQuestions, question],
              totalQuestions: g.totalQuestions + 1,
              totalStudents: g.rawQuestions.some(
                (q) => q.studentName === question.studentName,
              )
                ? g.totalStudents
                : g.totalStudents + 1,
              answered: false,
              answeredAt: undefined,
              lastActivityAt: Date.now(),
            }
          : g,
      ),
    }));
  }

  function handleNavigate(href: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  function goToStudentList() {
    if (!selectedClassId) return;
    router.push(`/classmanagement?classId=${selectedClassId}`);
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
            <Bell size={17} />
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
          <div className={styles.topBarAvatar}></div>
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
              onClick={() => handleNavigate(SETTINGS_ITEM.href)}
              className={`${styles.navItem} ${
                pathname === SETTINGS_ITEM.href ? styles.navItemActive : ""
              }`}
            >
              <SETTINGS_ITEM.icon size={17} />
              <span>{SETTINGS_ITEM.label}</span>
            </button>
          </nav>
        </aside>

        <main className={styles.main}>
          {!selectedClassId ? (
            /* ---------- Chưa chọn lớp: main chỉ hiện danh sách lớp ---------- */
            <section className={styles.classListPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Gom câu hỏi</p>
                  <h1 className={styles.headerTitle}>
                    Chọn 1 lớp để xem nhóm câu hỏi ({CLASSES.length})
                  </h1>
                </div>
              </div>

              <div className={styles.classGrid}>
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    className={styles.classCard}
                    onClick={() => handleSelectClass(cls.id)}
                  >
                    <div className={styles.classCardTop}>
                      <p className={styles.classCardCode}>{cls.code}</p>
                      {cls.isLive && (
                        <span className={styles.liveTag}>
                          <span className={styles.liveDot} /> Live
                        </span>
                      )}
                    </div>
                    <h3 className={styles.classCardName}>{cls.name}</h3>
                    <div className={styles.classCardFooter}>
                      <span className={styles.classCardCount}>
                        <Users size={14} />
                        {cls.studentCount} sinh viên
                      </span>
                      <ChevronRight size={16} className={styles.classCardChevron} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            /* ---------- Đã chọn lớp: chia 3 phần — 1 phần trái (lớp) + 2 phần phải (gom câu hỏi) ---------- */
            <div className={styles.splitLayout}>
              <section className={styles.classListPanelCompact}>
                <p className={styles.eyebrow}>Danh sách lớp</p>
                <div className={styles.classListCompact}>
                  {CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => handleSelectClass(cls.id)}
                      className={`${styles.classCardCompact} ${
                        cls.id === selectedClassId
                          ? styles.classCardCompactActive
                          : ""
                      }`}
                    >
                      <div className={styles.classCardCompactTop}>
                        <span className={styles.classCardCompactCode}>
                          {cls.code}
                        </span>
                        {cls.isLive && <span className={styles.liveDot} />}
                      </div>
                      <span className={styles.classCardCompactName}>
                        {cls.name}
                      </span>
                      <span className={styles.classCardCompactCount}>
                        <Users size={12} />
                        {cls.studentCount} sinh viên
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.groupingPanel}>
                <div className={styles.groupingPanelHeader}>
                  <div className={styles.headerTitleRow}>
                    <div>
                      <p className={styles.eyebrow}>{selectedClass?.code}</p>
                      <h1 className={styles.headerTitle}>
                        {selectedClass?.name}
                      </h1>
                    </div>
                    {selectedClass?.isLive && (
                      <span className={styles.liveTag}>
                        <span className={styles.liveDot} /> Live
                      </span>
                    )}
                  </div>

                  <div className={styles.groupingPanelActions}>
                    <button
                      type="button"
                      className={styles.btnOutline}
                      onClick={goToStudentList}
                    >
                      <Users size={14} /> Danh sách sinh viên
                    </button>
                    <button type="button" className={styles.sortSelect}>
                      Sort by: Recent <ChevronDown size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.groupList}>
                  {sortedGroups.length === 0 && (
                    <p className={styles.emptyState}>
                      Lớp này chưa có câu hỏi nào.
                    </p>
                  )}

                  {sortedGroups.map((group) => {
                    const isViewOpen = expandedViewId === group.id;
                    const isReplyOpen = openReplyId === group.id;
                    const justSent = justSentId === group.id;
                    const hasNewQuestions = !group.answered;
                    const questionsToShow = isViewOpen
                      ? group.rawQuestions.map((q) => ({
                          text: q.text,
                          name: q.studentName,
                        }))
                      : group.representativeQuestions.map((text) => ({
                          text,
                          name: null,
                        }));

                    return (
                      <div key={group.id} className={styles.groupCard}>
                        {/* Badge số câu hỏi mới — chỉ hiện khi nhóm CHƯA được trả lời. */}
                        {hasNewQuestions && (
                          <span className={styles.groupBadge}>
                            {group.totalQuestions}
                          </span>
                        )}

                        <div className={styles.groupTopRow}>
                          <div>
                            <div className={styles.groupHeadingLine}>
                              Nhóm {group.index}
                              {hasNewQuestions && (
                                <span className={styles.liveMiniPill}>
                                  {group.totalQuestions}
                                </span>
                              )}
                              {group.answered && (
                                <span className={styles.answeredPill}>
                                  Đã trả lời
                                </span>
                              )}
                            </div>
                            <h3 className={styles.groupTopic}>{group.topic}</h3>
                            <p className={styles.groupMeta}>
                              {group.totalQuestions} câu hỏi ·{" "}
                              {group.totalStudents} sinh viên
                            </p>
                          </div>

                          <div className={styles.groupActions}>
                            <button
                              type="button"
                              className={styles.btnOutline}
                              onClick={() => toggleView(group.id)}
                            >
                              {isViewOpen ? "Thu gọn" : "Xem tất cả"}
                            </button>
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => toggleReply(group.id)}
                            >
                              Trả lời
                            </button>
                          </div>
                        </div>

                        <ul className={styles.questionBullets}>
                          {questionsToShow.map((q, idx) => (
                            <li key={idx}>
                              <span className={styles.bulletDot}>•</span>
                              <span>
                                {q.text}
                                {q.name && (
                                  <span className={styles.rawStudentName}>
                                    — {q.name}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {isReplyOpen && (
                          <div className={styles.replyBox}>
                            <p className={styles.replyLabel}>
                              Trả lời chung cho cả nhóm
                            </p>
                            <textarea
                              className={styles.replyTextarea}
                              placeholder="Nhập câu trả lời..."
                              value={replyDrafts[group.id] ?? ""}
                              onChange={(e) =>
                                updateDraft(group.id, e.target.value)
                              }
                            />
                            <div className={styles.replyFooter}>
                              <span className={styles.replyHint}>
                                Câu trả lời sẽ gửi cho tất cả sinh viên trong
                                nhóm
                              </span>
                              <div className={styles.replyFooterActions}>
                                <button
                                  type="button"
                                  className={styles.btnOutline}
                                  onClick={() => setOpenReplyId(null)}
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnPrimary}
                                  disabled={!(replyDrafts[group.id] ?? "").trim()}
                                  onClick={() => handleSend(group)}
                                >
                                  Gửi
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {justSent && (
                          <div className={styles.sentNotice}>
                            Đã gửi câu trả lời cho nhóm này.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
