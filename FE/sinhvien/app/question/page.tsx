'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AccountMenu from "../account/AccountMenu";
import {
  GraduationCap,
  Home,
  BookOpen,
  UserPlus,
  Settings,
  Send,
  Globe,
  MessageSquare,
  FileText,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Bell,
  Radio
} from 'lucide-react';
import styles from './question.module.css';

type QuestionLang = 'vi' | 'en' | 'mixed';

interface ClassInfo {
  id: string;
  code: string;
  name: string;

  isLive: boolean;
  day: string;
  time: string;
  date: string;
}

interface CurrentUser {
  name: string;
}

interface QuestionItem {
  id: string;
  group: string;
  text: string;
  answered: boolean;
  lang: QuestionLang;
  timeAgo: string;
}

/* ---- Nhóm câu hỏi (câu hỏi tương tự nhau được gom thành 1 nhóm) --------- */
type GroupQuestionLang = 'EN' | 'VI';

interface GroupRelatedQuestion {
  id: string;
  text: string;
  lang: GroupQuestionLang;
}

interface QuestionGroup {
  id: string;
  index: number; // "Nhóm 1", "Nhóm 2"...
  topic: string; // chủ đề đại diện, vd "Regression Testing"

  totalQuestions: number; // tổng số câu hỏi gốc đã được gom vào nhóm này
  answered: boolean;
  mainQuestion: { text: string; lang: GroupQuestionLang };
  relatedQuestions: GroupRelatedQuestion[];
  answer?: { en: string; vi: string };
}

const LANG_LABEL: Record<QuestionLang, string> = {
  vi: 'VI',
  en: 'EN',
  mixed: 'Mixed',
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

// TODO: lấy danh sách lớp học sinh viên đã tham gia thật từ API khi tích hợp thật.
const JOINED_CLASSES: ClassInfo[] = [
  {
    id: 'c1',
    code: '2627',
    name: 'CMU-IS 482 CIS',
    isLive: true,
    day: 'Thứ 5',
    time: '11:15',
    date: '10/09/2026',

  },
  {
    id: 'c2',
    code: '2627',
    name: 'Software Testing (SE305)',
    isLive: false,
    day: 'Thứ 3',
    time: '09:00',
    date: '12/09/2026',
  },
  {
    id: 'c3',
    code: '2627',
    name: 'Database Systems (DB210)',
    isLive: false,
    day: 'Thứ 4',
    time: '14:00',
    date: '13/09/2026',
  },
];

const MOCK_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    group: 'Group 1',
    text: 'What is regression testing?',
    answered: true,
    lang: 'en',
    timeAgo: '2 phút trước',
  },
  {
    id: 'q2',

    group: 'Group 2',
    text: 'How is unit testing different?',
    answered: true,
    lang: 'vi',
    timeAgo: '5 phút trước',
  },
  {
    id: 'q3',
    group: 'Group 3',
    text: 'When should we perform testing?',
    answered: false,
    lang: 'mixed',
    timeAgo: '12 phút trước',
  },
];

type QuestionFilter = 'all' | 'answered' | 'unanswered';
type MainTab = 'qa' | 'groups' | 'materials';
const MOCK_QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: 'grp-1',
    index: 1,
    topic: 'Regression Testing',
    totalQuestions: 8,
    answered: true,
    mainQuestion: { text: 'What is regression testing?', lang: 'EN' },
    relatedQuestions: [
      { id: 'rq-1', text: 'What is the purpose of regression testing?', lang: 'EN' },
      { id: 'rq-2', text: 'Regression testing có nghĩa là gì?', lang: 'VI' },
      { id: 'rq-3', text: 'How often should regression tests be run?', lang: 'EN' },
      { id: 'rq-4', text: 'Regression testing có bắt buộc trong CI/CD không?', lang: 'VI' },
      { id: 'rq-5', text: 'Who is responsible for writing regression tests?', lang: 'EN' },

      { id: 'rq-6', text: 'Có công cụ nào tự động hoá regression testing không?', lang: 'VI' },
      { id: 'rq-7', text: 'Is regression testing part of unit testing?', lang: 'EN' },
    ],
    answer: {
      en: 'Regression testing is a type of software testing that ensures new changes do not break existing functionality.',
      vi: 'Kiểm thử hồi quy là một loại kiểm thử phần mềm nhằm đảm bảo các thay đổi mới không làm ảnh hưởng đến chức năng hiện có.',
    },
  },
  {
    id: 'grp-2',
    index: 2,
    topic: 'Unit Testing',
    totalQuestions: 4,
    answered: false,
    mainQuestion: { text: 'How is unit testing different from integration testing?', lang: 'EN' },
    relatedQuestions: [
      { id: 'rq-8', text: 'Unit test và integration test khác nhau ở đâu?', lang: 'VI' },
      { id: 'rq-9', text: 'Do we need both unit and integration tests?', lang: 'EN' },
    ],
  },
];

/* Danh sách menu bên trái: mỗi mục có href để điều hướng sang trang tương ứng */
const NAV_ITEMS = [
  { label: 'Home', href: '/home', icon: Home },
    { label: "My class", href: "/my-class", icon: BookOpen },
  { label: 'Live Lessions', href: '/live-lession', icon: Radio },
  { label: 'Question grouping', href: '/question', icon: MessageSquare },
  { label: 'Lesson Summary', href: '/summary', icon: FileText },
];

const SETTING_NAV_ITEM = { label: 'Setting', href: '/setting', icon: Settings };


export default function QuestionCenterPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [teacherName, setTeacherName] = useState("");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const classInfo = useMemo(
    () => JOINED_CLASSES.find((c) => c.id === selectedClassId) ?? null,
    [selectedClassId],
  );
  const [currentUser] = useState<CurrentUser>(() => {
    if (typeof window === 'undefined') return { name: 'Sinh viên' };
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return { name: 'Sinh viên' };
      const parsed = JSON.parse(raw);
      return { name: parsed.fullName ?? parsed.name ?? parsed.username ?? 'Sinh viên' };
    } catch {
      return { name: 'Sinh viên' };
    }
  });

  const [activeTab, setActiveTab] = useState<MainTab>('qa');
  const [newQuestion, setNewQuestion] = useState('');
  const [questionLang, setQuestionLang] = useState<QuestionLang>('vi');
  const [questions, setQuestions] = useState<QuestionItem[]>(MOCK_QUESTIONS);

  const handleSubmitQuestion = (e: FormEvent) => {
    e.preventDefault();
    const text = newQuestion.trim();
    if (!text) return;
    setQuestions((prev) => [

      {
        id: crypto.randomUUID(),
        group: 'Chưa phân nhóm',
        text,
        answered: false,
        lang: questionLang,
        timeAgo: 'Vừa xong',
      },
      ...prev,
    ]);
    setNewQuestion('');
  };

  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('all');

  const answeredCount = questions.filter((q) => q.answered).length;
  const unansweredCount = questions.length - answeredCount;

  const filteredQuestions = useMemo(() => {
    if (questionFilter === 'answered') return questions.filter((q) => q.answered);
    if (questionFilter === 'unanswered') return questions.filter((q) => !q.answered);
    return questions;
  }, [questions, questionFilter]);

  // ---- Nhóm câu hỏi (tab "Nhóm câu hỏi") ------------------------------------
  const [questionGroups] = useState<QuestionGroup[]>(MOCK_QUESTION_GROUPS);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(
    MOCK_QUESTION_GROUPS[0]?.id ?? null,
  );
  const [translationVisible, setTranslationVisible] = useState<Record<string, boolean>>({
    'grp-1': true,
  });

  const RELATED_PREVIEW_COUNT = 3;
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const toggleTranslation = (groupId: string) => {
    setTranslationVisible((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  function handleOpenClass(id: string) {
    setSelectedClassId(id);
    setActiveTab('qa');
  }

  function handleBackToClassList() {
    setSelectedClassId(null);
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
          <button type="button" className={styles.topBannerIconBtn} aria-label="Thông báo">
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
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <button
                key={href}
                type="button"
                onClick={() => router.push(href)}
                className={`${styles.navItem} ${pathname === href ? styles.navItemActive : ''}`}
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
                  pathname === SETTING_NAV_ITEM.href ? styles.navItemActive : ''
                }`}
              >
                <SETTING_NAV_ITEM.icon size={18} />
                <span>{SETTING_NAV_ITEM.label}</span>
              </button>
            </div>
          </nav>
        </aside>


        <main className={styles.main}>
          {/* ---------- Màn: Danh sách lớp học đã tham gia ---------- */}
          {!classInfo && (
            <>
              <h2 className={styles.sectionTitle}>Lớp học đã tham gia ({JOINED_CLASSES.length})</h2>
              <div className={styles.classListGrid}>
                {JOINED_CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    className={styles.classListCard}
                    onClick={() => handleOpenClass(cls.id)}
                  >
                    <div className={styles.classListCardTop}>
                      <span className={styles.classListCardCode}>
                        {cls.code} · {cls.day} - {cls.time}
                      </span>
                      {cls.isLive && (
                        <span className={`${styles.statusBadge} ${styles.statusLive}`}>
                          <span className={styles.statusDot} />
                          Đang diễn ra
                        </span>
                      )}
                    </div>
                    <h3 className={styles.classListCardName}>{cls.name}</h3>
                    <div className={styles.classListCardFooter}>
                      <span>{cls.date}</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}

              </div>
            </>
          )}

          {/* ---------- Màn: Chi tiết 1 lớp (Đặt câu hỏi / Nhóm câu hỏi / Tài liệu) ---------- */}
          {classInfo && (
            <>
              <button type="button" className={styles.backButton} onClick={handleBackToClassList}>
                <ChevronLeft size={16} /> Lớp học đã tham gia
              </button>

              {/* Thẻ thông tin lớp học */}
              <div className={styles.classCard}>
                <div className={styles.classCardLeft}>
                  <div className={styles.classAvatar}>
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className={styles.classTitle}>
                      {classInfo.code} - {classInfo.name}
                    </p>
                    <div className={styles.classMeta}>
                      <span>{currentUser.name}</span>
                      <span className={styles.classMetaDot}>•</span>
                      <span>
                        {classInfo.day} - {classInfo.time}
                      </span>
                      <span className={styles.classMetaDot}>•</span>
                      <span>{classInfo.date}</span>
                    </div>
                  </div>
                </div>


                {classInfo.isLive && (
                  <span className={`${styles.statusBadge} ${styles.statusLive}`}>
                    <span className={styles.statusDot} />
                    Đang diễn ra
                  </span>
                )}
              </div>

              {/* Tab chính */}
              <div className={styles.mainTabs}>
                <button
                  type="button"
                  className={`${styles.mainTabBtn} ${activeTab === 'qa' ? styles.mainTabBtnActive : ''}`}
                  onClick={() => setActiveTab('qa')}
                >
                  Hỏi đáp
                </button>
                <button
                  type="button"
                  className={`${styles.mainTabBtn} ${activeTab === 'groups' ? styles.mainTabBtnActive : ''}`}
                  onClick={() => setActiveTab('groups')}
                >
                  Nhóm câu hỏi
                </button>
                <button
                  type="button"
                  className={`${styles.mainTabBtn} ${activeTab === 'materials' ? styles.mainTabBtnActive : ''}`}
                  onClick={() => setActiveTab('materials')}
                >
                  Tài liệu
                </button>

              </div>

              {activeTab === 'qa' && (
                <>
                  {/* Đặt câu hỏi */}
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Đặt câu hỏi</h2>
                    <form onSubmit={handleSubmitQuestion}>
                      <textarea
                        className={styles.questionTextarea}
                        placeholder="Nhập câu hỏi của bạn... (có thể bằng tiếng Việt, tiếng Anh hoặc kết hợp)"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                      />
                      <div className={styles.questionFooter}>
                        <div className={styles.langGroup}>
                          {(['vi', 'en', 'mixed'] as QuestionLang[]).map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              className={`${styles.langBtn} ${
                                questionLang === lang ? styles.langBtnActive : ''
                              }`}
                              onClick={() => setQuestionLang(lang)}
                            >
                              <Globe size={12} />
                              {LANG_LABEL[lang]}
                            </button>
                          ))}
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={!newQuestion.trim()}>
                          Gửi <Send size={15} />

                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Câu hỏi của tôi */}
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Câu hỏi của tôi</h2>
                    <div className={styles.filterTabs}>
                      <button
                        type="button"
                        className={`${styles.filterTabBtn} ${
                          questionFilter === 'all' ? styles.filterTabBtnActive : ''
                        }`}
                        onClick={() => setQuestionFilter('all')}
                      >
                        Tất cả ({questions.length})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterTabBtn} ${
                          questionFilter === 'answered' ? styles.filterTabBtnActive : ''
                        }`}
                        onClick={() => setQuestionFilter('answered')}
                      >
                        Đã trả lời ({answeredCount})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterTabBtn} ${
                          questionFilter === 'unanswered' ? styles.filterTabBtnActive : ''
                        }`}

                        onClick={() => setQuestionFilter('unanswered')}
                      >
                        Chưa trả lời ({unansweredCount})
                      </button>
                    </div>
                  </div>

                  <div className={styles.questionList}>
                    {filteredQuestions.length === 0 ? (
                      <div className={styles.emptyState}>Không có câu hỏi nào ở mục này.</div>
                    ) : (
                      filteredQuestions.map((q) => (
                        <div key={q.id} className={styles.questionCard}>
                          <div className={styles.questionLeft}>
                            <span className={styles.groupBadge}>{q.group}</span>
                            <p className={styles.questionText}>{q.text}</p>
                            <div className={styles.questionMeta}>
                              <span className={styles.langTag}>{LANG_LABEL[q.lang]}</span>
                              <span>{q.timeAgo}</span>
                            </div>
                          </div>
                          <span
                            className={`${styles.answerBadge} ${
                              q.answered ? styles.answerBadgeDone : styles.answerBadgePending
                            }`}
                          >
                            {q.answered ? 'Đã trả lời' : 'Chưa trả lời'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                </>
              )}

              {activeTab === 'groups' && (
                <>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Nhóm câu hỏi</h2>
                    <div className={styles.groupsToolbar}>
                      <select className={styles.groupsFilterSelect} defaultValue="all">
                        <option value="all">Tất cả nhóm</option>
                        {questionGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            Nhóm {g.index} · {g.topic}
                          </option>
                        ))}
                      </select>
                      <button type="button" className={styles.iconBtn} aria-label="Tìm kiếm">
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.groupList}>
                    {questionGroups.length === 0 ? (
                      <div className={styles.emptyState}>Chưa có nhóm câu hỏi nào.</div>
                    ) : (
                      questionGroups.map((group) => {
                        const isOpen = expandedGroupId === group.id;
                        const showTranslation = translationVisible[group.id] ?? false;
                        const showAllRelated = expandedRelatedIds[group.id] ?? false;
                        const visibleRelated = showAllRelated
                          ? group.relatedQuestions

                          : group.relatedQuestions.slice(0, RELATED_PREVIEW_COUNT);

                        return (
                          <div key={group.id} className={styles.groupCard}>
                            <button
                              type="button"
                              className={styles.groupCardHeader}
                              onClick={() => toggleGroup(group.id)}
                            >
                              <span className={styles.groupIndexBadge}>{group.index}</span>
                              <span className={styles.groupTopic}>{group.topic}</span>
                              <span className={styles.groupCountBadge}>
                                {group.totalQuestions} câu hỏi
                              </span>
                              <span
                                className={`${styles.answerBadge} ${
                                  group.answered ? styles.answerBadgeDone : styles.answerBadgePending
                                }`}
                              >
                                {group.answered && <CheckCircle2 size={12} />}
                                {group.answered ? 'Đã trả lời' : 'Chưa trả lời'}
                              </span>
                              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {isOpen && (
                              <div className={styles.groupBody}>
                                <p className={styles.groupSubheading}>Câu hỏi đại diện</p>
                                <div className={styles.mainQuestionBox}>
                                  <span>{group.mainQuestion.text}</span>
                                  <span className={styles.langTag}>{group.mainQuestion.lang}</span>
                                </div>


                                {group.relatedQuestions.length > 0 && (
                                  <>
                                    <p className={styles.groupSubheading}>
                                      Các câu hỏi liên quan ({group.relatedQuestions.length})
                                    </p>
                                    <div className={styles.relatedList}>
                                      {visibleRelated.map((rq) => (
                                        <div key={rq.id} className={styles.relatedQuestionRow}>
                                          <span>{rq.text}</span>
                                          <span className={styles.langTag}>{rq.lang}</span>
                                        </div>
                                      ))}
                                    </div>
                                    {group.relatedQuestions.length > RELATED_PREVIEW_COUNT && (
                                      <button
                                        type="button"
                                        className={styles.viewAllBtn}
                                        onClick={() =>
                                          setExpandedRelatedIds((prev) => ({
                                            ...prev,
                                            [group.id]: !showAllRelated,
                                          }))
                                        }
                                      >
                                        {showAllRelated
                                          ? 'Thu gọn'
                                          : 'Xem tất cả câu hỏi trong nhóm'}
                                      </button>
                                    )}
                                  </>
                                )}


                                {group.answer && (
                                  <div className={styles.answerSection}>
                                    <div className={styles.answerSectionHeader}>
                                      <span className={styles.cardTitle} style={{ margin: 0 }}>
                                        Câu trả lời từ giảng viên
                                      </span>
                                      <label className={styles.translationToggleLabel}>
                                        Hiển thị bản dịch
                                        <button
                                          type="button"
                                          role="switch"
                                          aria-checked={showTranslation}
                                          className={`${styles.toggleSwitch} ${
                                            showTranslation ? styles.toggleSwitchOn : ''
                                          }`}
                                          onClick={() => toggleTranslation(group.id)}
                                        >
                                          <span className={styles.toggleKnob} />
                                        </button>
                                      </label>
                                    </div>

                                    <div className={styles.answerLangChips}>
                                      <span className={styles.langTag}>EN</span>
                                      {showTranslation && <span className={styles.langTag}>VI</span>}
                                    </div>

                                    <p className={styles.answerText}>{group.answer.en}</p>

                                    {showTranslation && (
                                      <p className={styles.answerTranslation}>{group.answer.vi}</p>

                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {activeTab === 'materials' && (
                <div className={styles.emptyState}>Tài liệu của lớp học sẽ hiển thị ở đây.</div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}