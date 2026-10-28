"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./summary.module.css";
import AccountMenu from "../account/AccountMenu";
import {
  Home,
  Radio,
  MessageSquare,
  FileText,
  BarChart2,
  Settings,
  Search,
  Code2,
  Database,
  Cog,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileStack,
  Languages,
} from "lucide-react";

// ---------- Sidebar — copy nguyên từ topbar/sidebar của trang Home để đồng bộ bố cục ----------
const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My class", href: "/my-class", icon: BookOpen },
  { label: "Live lessons", href: "/live-lession", icon: Radio },
  { label: "Question grouping", href: "/question", icon: MessageSquare },
  { label: "Lesson Summary", href: "/summary", icon: FileText },
];

const SETTING_NAV_ITEM = { label: "Setting", href: "/setting", icon: Settings };

/* ------------------------------------------------------------------ */
/* Dữ liệu mẫu — TODO: thay bằng dữ liệu thật (lớp học, bài giảng, bản  */
/* tổng hợp do AI tạo ra) khi tích hợp API thật.                        */
/* ------------------------------------------------------------------ */

type ClassSummaryItem = {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  icon: React.ComponentType<{ size?: number }>;
  color: "blue" | "green" | "purple";
};

const CLASSES: ClassSummaryItem[] = [
  { id: "web", name: "Web Programming", code: "C1SE.38", studentCount: 42, icon: Code2, color: "blue" },
  { id: "db", name: "Database Management", code: "C1SE.38", studentCount: 38, icon: Database, color: "green" },
  { id: "se", name: "Software Engineering", code: "C1SE.38", studentCount: 35, icon: Cog, color: "purple" },
];

type LectureItem = {
  id: string;
  classId: string;
  title: string;
  topic: string;
  date: string;
  duration: string;
  hasSummary: boolean;
};

const LECTURES: LectureItem[] = [
  { id: "web-l3", classId: "web", title: "Lecture 03", topic: "React Components & Props", date: "23/09/2026", duration: "01:35:20", hasSummary: true },
  { id: "web-l2", classId: "web", title: "Lecture 02", topic: "Introduction to React", date: "21/09/2026", duration: "01:42:15", hasSummary: true },
  { id: "web-l1", classId: "web", title: "Lecture 01", topic: "What is React?", date: "19/09/2026", duration: "01:28:10", hasSummary: true },
  { id: "db-l1", classId: "db", title: "Lecture 01", topic: "Relational Model Basics", date: "20/09/2026", duration: "01:20:00", hasSummary: false },
  { id: "se-l1", classId: "se", title: "Lecture 01", topic: "SDLC Overview", date: "18/09/2026", duration: "01:15:40", hasSummary: false },
];

type KeyConcept = { id: string; title: string; description: string };
type QAItem = {
  id: string;
  question: string;
  groupLabel: string;
  studentCount: number;
  answered: boolean;
  answer?: string;
};
type TranscriptLine = { time: string; en: string; vi: string };

type LectureDetail = {
  summaryEn: string;
  summaryVi: string;
  keyConcepts: KeyConcept[];
  questions: QAItem[];
  transcript: TranscriptLine[];
};

// Chỉ Lecture 03 (web-l3) có dữ liệu mẫu đầy đủ, các bài khác dùng dữ liệu rút gọn.
const LECTURE_DETAILS: Record<string, LectureDetail> = {
  "web-l3": {
    summaryEn:
      "This lecture introduces the core concepts of React, including Components, Props, and how components pass data to each other. It also covers State and its role in the component lifecycle.",
    summaryVi:
      "Bài giảng giới thiệu các khái niệm cơ bản về React, bao gồm Components, Props và cách các component truyền dữ liệu cho nhau. Ngoài ra, giảng viên cũng chia sẻ về State và vòng đời của component.",
    keyConcepts: [
      { id: "c1", title: "React Components", description: "Components are reusable parts of a React application." },
      { id: "c2", title: "Props", description: "Props allow data to be passed between components." },
      { id: "c3", title: "State", description: "State stores information that can change during the component lifecycle." },
    ],
    questions: [
      { id: "q1", question: "What is the difference between Props and State?", groupLabel: "Nhóm 1", studentCount: 8, answered: true, answer: "Props are read-only data passed from a parent component, while State is data managed internally by the component itself and can change over time." },
      { id: "q2", question: "How does the component lifecycle work?", groupLabel: "Nhóm 2", studentCount: 5, answered: true, answer: "A component goes through mounting, updating, and unmounting phases. Hooks like useEffect let you run code at these specific points." },
      { id: "q3", question: "What are React Hooks used for?", groupLabel: "Nhóm 3", studentCount: 4, answered: true, answer: "Hooks let you use state and other React features in function components without writing a class." },
    ],
    transcript: [
      { time: "09:05", en: "Today we are going to learn about React Components. Components are reusable parts of a React application.", vi: "Hôm nay chúng ta sẽ tìm hiểu về các thành phần trong React. Các thành phần là những phần tái sử dụng được trong ứng dụng React." },
      { time: "09:07", en: "Next, we will look at Props. Props allow data to be passed from one component to another.", vi: "Tiếp theo, chúng ta sẽ tìm hiểu về Props. Props cho phép truyền dữ liệu từ thành phần này sang thành phần khác." },
      { time: "09:12", en: "Finally, we will discuss State and how it works with the component lifecycle.", vi: "Cuối cùng, chúng ta sẽ thảo luận về State và cách nó hoạt động với vòng đời của component." },
    ],
  },
};

const FALLBACK_DETAIL: LectureDetail = {
  summaryEn: "AI-generated summary for this lecture is not available yet.",
  summaryVi: "Bản tổng hợp AI cho bài giảng này chưa có sẵn.",
  keyConcepts: [],
  questions: [],
  transcript: [],
};

const CARD_COLOR_CLASS: Record<ClassSummaryItem["color"], string> = {
  blue: styles.iconBlue,
  green: styles.iconGreen,
  purple: styles.iconPurple,
};

type TabKey = "summary" | "questions" | "transcript";

const TABS: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Tóm tắt" },
  { key: "questions", label: "Câu hỏi" },
  { key: "transcript", label: "Transcript" },
];

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

type View = "classes" | "lectures" | "detail";

export default function LessonSummaryPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [teacherName, setTeacherName] = useState("");

  const [view, setView] = useState<View>("classes");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [lectureSearch, setLectureSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [summaryLang, setSummaryLang] = useState<"vi" | "en">("vi");
  const [bilingualTranscript, setBilingualTranscript] = useState(true);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const selectedClass = CLASSES.find((c) => c.id === selectedClassId) ?? null;
  const selectedLecture = LECTURES.find((l) => l.id === selectedLectureId) ?? null;
  const detail = selectedLectureId
    ? LECTURE_DETAILS[selectedLectureId] ?? FALLBACK_DETAIL
    : FALLBACK_DETAIL;

  const filteredLectures = useMemo(() => {
    const list = LECTURES.filter((l) => l.classId === selectedClassId);
    const query = lectureSearch.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (l) =>
        l.title.toLowerCase().includes(query) ||
        l.topic.toLowerCase().includes(query),
    );
  }, [selectedClassId, lectureSearch]);

  function handleNavigate(href: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  function openClass(classId: string) {
    setSelectedClassId(classId);
    setLectureSearch("");
    setView("lectures");
  }

  function openLecture(lectureId: string) {
    setSelectedLectureId(lectureId);
    setActiveTab("summary");
    setExpandedQuestionId(null);
    setView("detail");
  }

  function backToClasses() {
    setView("classes");
    setSelectedClassId(null);
    setSelectedLectureId(null);
  }

  function backToLectures() {
    setView("lectures");
    setSelectedLectureId(null);
  }

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
                className={`${styles.navItem} ${pathname === href ? styles.navItemActive : ""}`}
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
          {/* ---------- Breadcrumb ---------- */}
          <div className={styles.breadcrumb}>
            <button type="button" onClick={backToClasses} className={styles.breadcrumbItem}>
              Lớp học của tôi
            </button>
            {selectedClass && (
              <>
                <ChevronRight size={14} className={styles.breadcrumbSep} />
                <button
                  type="button"
                  onClick={backToLectures}
                  className={styles.breadcrumbItem}
                >
                  {selectedClass.name}
                </button>
              </>
            )}
            {selectedLecture && (
              <>
                <ChevronRight size={14} className={styles.breadcrumbSep} />
                <span className={styles.breadcrumbCurrent}>
                  {selectedLecture.title} · Tổng hợp bài giảng
                </span>
              </>
            )}
          </div>

          {/* ---------- Màn 1: Lớp học của bài giảng ---------- */}
          {view === "classes" && (
            <>
              <h1 className={styles.pageTitle}>Lớp học của tôi</h1>
              <p className={styles.pageSubtitle}>Các lớp học bạn đang tham gia</p>

              <div className={styles.classGrid}>
                {CLASSES.map((cls) => (
                  <div key={cls.id} className={styles.classCard}>
                    <span className={`${styles.classCardIcon} ${CARD_COLOR_CLASS[cls.color]}`}>
                      <cls.icon size={20} />
                    </span>
                    <div className={styles.classCardBody}>
                      <h3 className={styles.classCardName}>{cls.name}</h3>
                      <p className={styles.classCardCode}>{cls.code}</p>
                      <span className={styles.classCardStudents}>
                        <Users size={13} /> {cls.studentCount} students
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => openClass(cls.id)}
                    >
                      Xem bài giảng <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ---------- Màn 2: Danh sách bài giảng của lớp ---------- */}
          {view === "lectures" && selectedClass && (
            <>
              <div className={styles.classHeaderRow}>
                <span className={`${styles.classCardIcon} ${CARD_COLOR_CLASS[selectedClass.color]}`}>
                  <selectedClass.icon size={22} />
                </span>
                <div>
                  <h1 className={styles.pageTitle}>{selectedClass.name}</h1>
                  <p className={styles.pageSubtitle}>
                    {selectedClass.code} · <Users size={13} style={{ verticalAlign: -2 }} />{" "}
                    {selectedClass.studentCount} students
                  </p>
                </div>
              </div>

              <h2 className={styles.sectionLabel}>Danh sách bài giảng</h2>
              <label className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Tìm kiếm bài giảng..."
                  value={lectureSearch}
                  onChange={(e) => setLectureSearch(e.target.value)}
                />
              </label>

              <div className={styles.lectureList}>
                {filteredLectures.map((lecture) => (
                  <div key={lecture.id} className={styles.lectureCard}>
                    <div className={styles.lectureCardMain}>
                      <p className={styles.lectureTitle}>{lecture.title}</p>
                      <p className={styles.lectureTopic}>{lecture.topic}</p>
                      <div className={styles.lectureMeta}>
                        <span>
                          <Calendar size={13} /> {lecture.date}
                        </span>
                        <span>
                          <Clock size={13} /> {lecture.duration}
                        </span>
                      </div>
                    </div>
                    <div className={styles.lectureCardActions}>
                      {lecture.hasSummary && (
                        <span className={styles.summaryBadge}>
                          <Sparkles size={12} /> Đã có bản tổng hợp
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => openLecture(lecture.id)}
                      >
                        Xem tổng hợp <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredLectures.length === 0 && (
                  <p className={styles.emptyText}>Không tìm thấy bài giảng phù hợp.</p>
                )}
              </div>
            </>
          )}

          {/* ---------- Màn 3: Tổng hợp bài giảng (chi tiết) ---------- */}
          {view === "detail" && selectedClass && selectedLecture && (
            <>
              <div className={styles.detailHeaderRow}>
                <div>
                  <h1 className={styles.pageTitle}>Tổng hợp bài giảng</h1>
                  <p className={styles.pageSubtitle}>{selectedLecture.topic}</p>
                  <div className={styles.detailMetaRow}>
                    <span>
                      <BookOpen size={13} /> {selectedClass.name}
                    </span>
                    <span>{selectedLecture.title}</span>
                    <span>
                      <Calendar size={13} /> {selectedLecture.date}
                    </span>
                    <span>
                      <Clock size={13} /> {selectedLecture.duration}
                    </span>
                  </div>
                </div>
                <button type="button" className={styles.backLink} onClick={backToLectures}>
                  <ChevronLeft size={15} /> Quay lại
                </button>
              </div>

              <div className={styles.tabBar}>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`${styles.tabItem} ${
                      activeTab === tab.key ? styles.tabItemActive : ""
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ---- Tab: Tóm tắt ---- */}
              {activeTab === "summary" && (
                <div className={styles.tabPanel}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <span className={styles.summaryCardTitle}>
                        <Sparkles size={15} /> Tóm tắt bài giảng
                      </span>
                      <div className={styles.langToggle}>
                        <button
                          type="button"
                          className={`${styles.langBtn} ${
                            summaryLang === "vi" ? styles.langBtnActive : ""
                          }`}
                          onClick={() => setSummaryLang("vi")}
                        >
                          Tiếng Việt
                        </button>
                        <button
                          type="button"
                          className={`${styles.langBtn} ${
                            summaryLang === "en" ? styles.langBtnActive : ""
                          }`}
                          onClick={() => setSummaryLang("en")}
                        >
                          English
                        </button>
                      </div>
                    </div>
                    <p className={styles.summaryText}>
                      {summaryLang === "vi" ? detail.summaryVi : detail.summaryEn}
                    </p>
                  </div>

                  {detail.keyConcepts.length > 0 && (
                    <>
                      <h2 className={styles.sectionLabel}>Chủ đề chính</h2>
                      <div className={styles.conceptGrid}>
                        {detail.keyConcepts.map((c, idx) => (
                          <div key={c.id} className={styles.conceptCard}>
                            <span className={styles.conceptNumber}>
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <h3 className={styles.conceptTitle}>{c.title}</h3>
                            <p className={styles.conceptDesc}>{c.description}</p>
                          </div>
                        ))}
                      </div>

                      <div className={styles.glossaryCard}>
                        <h2 className={styles.glossaryCardTitle}>
                          Giải thích từ ngữ chuyên ngành
                        </h2>
                        <div className={styles.glossaryList}>
                          {detail.keyConcepts.map((c) => (
                            <div key={c.id} className={styles.glossaryItem}>
                              <p className={styles.glossaryTerm}>{c.title}</p>
                              <p className={styles.glossaryDesc}>{c.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ---- Tab: Câu hỏi ---- */}
              {activeTab === "questions" && (
                <div className={styles.tabPanel}>
                  <h2 className={styles.sectionLabel}>Tất cả câu hỏi đã giải đáp</h2>
                  <QuestionList
                    questions={detail.questions}
                    expandedId={expandedQuestionId}
                    onToggle={setExpandedQuestionId}
                  />
                  {detail.questions.length === 0 && (
                    <p className={styles.emptyText}>Chưa có câu hỏi nào cho bài giảng này.</p>
                  )}
                </div>
              )}

              {/* ---- Tab: Transcript ---- */}
              {activeTab === "transcript" && (
                <div className={styles.tabPanel}>
                  <div className={styles.transcriptHeaderRow}>
                    <h2 className={styles.sectionLabel}>Transcript bài giảng</h2>
                    <label className={styles.bilingualToggleRow}>
                      <span>Hiển thị song ngữ</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={bilingualTranscript}
                        onClick={() => setBilingualTranscript((v) => !v)}
                        className={`${styles.toggle} ${
                          bilingualTranscript ? styles.toggleOn : ""
                        }`}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                    </label>
                  </div>

                  <div className={styles.transcriptList}>
                    {detail.transcript.map((line, idx) => (
                      <div key={idx} className={styles.transcriptRow}>
                        <span className={styles.transcriptTime}>{line.time}</span>
                        <div className={styles.transcriptTextBlock}>
                          <p className={styles.transcriptEn}>{line.en}</p>
                          {bilingualTranscript && (
                            <p className={styles.transcriptVi}>{line.vi}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {detail.transcript.length === 0 && (
                      <p className={styles.emptyText}>Chưa có transcript cho bài giảng này.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Danh sách câu hỏi — dùng chung cho tab "Chủ đề" và tab "Câu hỏi"      */
/* ------------------------------------------------------------------ */
function QuestionList({
  questions,
  expandedId,
  onToggle,
}: {
  questions: QAItem[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
}) {
  if (questions.length === 0) return null;
  return (
    <div className={styles.questionList}>
      {questions.map((q) => {
        const isOpen = expandedId === q.id;
        return (
          <div key={q.id} className={styles.questionItem}>
            <button
              type="button"
              className={styles.questionItemHeader}
              onClick={() => onToggle(isOpen ? null : q.id)}
            >
              <HelpCircle size={16} className={styles.questionIcon} />
              <span className={styles.questionText}>{q.question}</span>
              <span className={styles.questionMeta}>
                {q.answered && <span className={styles.answeredBadge}>Đã trả lời</span>}
                <span className={styles.questionGroupLabel}>
                  {q.groupLabel} · {q.studentCount} sinh viên
                </span>
                <ChevronDown
                  size={15}
                  className={`${styles.questionChevron} ${isOpen ? styles.questionChevronOpen : ""}`}
                />
              </span>
            </button>
            {isOpen && q.answer && (
              <p className={styles.questionAnswer}>{q.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}