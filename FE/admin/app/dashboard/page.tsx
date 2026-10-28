"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  GraduationCap,
  Home,
  Users,
  User,
  UsersRound,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Globe,
  Plus,
  Activity as ActivityIcon,
  Clock,
  HelpCircle,
  Layers,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Sidebar — điều hướng cho role Admin                                  */
/* ------------------------------------------------------------------ */

type NavChild = { label: string; href: string };
type NavGroup = {
  key: string;
  label: string;
  href?: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: NavChild[];
};

const NAV_GROUPS: NavGroup[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { key: "accountManagement", label: "Account Management", href: "/account", icon: Users },
  {
    key: "userManagement",
    label: "User Management",
    icon: UsersRound,
    children: [
      { label: "Lecturers", href: "/admin/lecturers" },
      { label: "Students", href: "/admin/students" },
    ],
  },
  {
    key: "classManagement",
    label: "Class Management",
    icon: BookOpen,
    children: [
      { label: "All Classes", href: "/admin/classes" },
      { label: "Enrollments", href: "/admin/enrollments" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Types — dữ liệu thật từ API                                          */
/* ------------------------------------------------------------------ */

type DashboardStats = {
  totalAccounts: number;
  accountsAddedThisWeek: number;
  lecturers: number;
  lecturersActive: number;
  students: number;
  studentsOnline: number;
  classes: number;
  classesActive: number;
  questions: number;
  questionsAddedThisWeek: number;
  questionGroups: number;
  questionGroupsAddedThisWeek: number;
};

type AccountDistribution = {
  admin: number;
  lecturer: number;
  student: number;
};

type ActivityItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  actor: string;
};

type RecentAccount = {
  id: string;
  name: string;
  role: "Admin" | "Lecturer" | "Student";
  email: string;
  status: "Active" | "Inactive";
  createdDate: string;
};

type RecentClass = {
  id: string;
  name: string;
  lecturer: string;
  students: number;
  status: "Active" | "Inactive";
  createdDate: string;
};

type SystemOverviewPoint = {
  date: string; // "16/09"
  accounts: number;
  questions: number;
};

type AdminUser = {
  name: string;
  email?: string;
};

type DashboardData = {
  stats: DashboardStats | null;
  distribution: AccountDistribution | null;
  activities: ActivityItem[];
  recentAccounts: RecentAccount[];
  recentClasses: RecentClass[];
  systemOverview: SystemOverviewPoint[];
  admin: AdminUser;
};

const EMPTY_DATA: DashboardData = {
  stats: null,
  distribution: null,
  activities: [],
  recentAccounts: [],
  recentClasses: [],
  systemOverview: [],
  admin: { name: "" },
};

function subscribeToStoredUser(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredAdminName() {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    const user = JSON.parse(storedUser) as {
      fullName?: string;
      name?: string;
      username?: string;
    };
    const name = user.fullName || user.name || user.username;
    return name?.trim() || null;
  } catch {
    return null;
  }
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US");
}

/* ------------------------------------------------------------------ */
/* API helpers — thay endpoint cho khớp backend thực tế của dự án       */
/* ------------------------------------------------------------------ */

async function fetchDashboardData(): Promise<DashboardData> {
  // Gọi song song các endpoint. Nếu backend có 1 endpoint tổng hợp thì
  // chỉ cần 1 request duy nhất.
  const [statsRes, distRes, actRes, accRes, classRes, overviewRes, meRes] =
    await Promise.allSettled([
      fetch("/api/admin/stats", { credentials: "include" }),
      fetch("/api/admin/account-distribution", { credentials: "include" }),
      fetch("/api/admin/activities?limit=8", { credentials: "include" }),
      fetch("/api/admin/accounts/recent?limit=5", { credentials: "include" }),
      fetch("/api/admin/classes/recent?limit=5", { credentials: "include" }),
      fetch("/api/admin/system-overview?days=7", { credentials: "include" }),
      fetch("/api/auth/me", { credentials: "include" }),
    ]);

  const safeJson = async (res: PromiseSettledResult<Response>) => {
    if (res.status !== "fulfilled" || !res.value.ok) return null;
    try {
      return await res.value.json();
    } catch {
      return null;
    }
  };

  const stats = await safeJson(statsRes);
  const distribution = await safeJson(distRes);
  const activities = (await safeJson(actRes)) ?? [];
  const recentAccounts = (await safeJson(accRes)) ?? [];
  const recentClasses = (await safeJson(classRes)) ?? [];
  const systemOverview = (await safeJson(overviewRes)) ?? [];
  const me = await safeJson(meRes);

  return {
    stats: stats ?? null,
    distribution: distribution ?? null,
    activities: Array.isArray(activities) ? activities : [],
    recentAccounts: Array.isArray(recentAccounts) ? recentAccounts : [],
    recentClasses: Array.isArray(recentClasses) ? recentClasses : [],
    systemOverview: Array.isArray(systemOverview) ? systemOverview : [],
    admin: me?.name ? { name: me.name, email: me.email } : { name: "" },
  };
}

/* ------------------------------------------------------------------ */
/* Component chính                                                      */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const storedAdminName = useSyncExternalStore(
    subscribeToStoredUser,
    getStoredAdminName,
    () => null,
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    accountManagement: true,
    userManagement: true,
    classManagement: false,
  });

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "VI">("EN");
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Đồng hồ thật
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dữ liệu dashboard
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateLabel = useMemo(() => {
    if (!now) return "";
    return now.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [now, language]);

  const timeLabel = useMemo(() => {
    if (!now) return "";
    return now.toLocaleTimeString(language === "VI" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: language === "EN",
    });
  }, [now, language]);

  const distributionTotal = data.distribution
    ? data.distribution.admin + data.distribution.lecturer + data.distribution.student
    : 0;

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleNavigate(href?: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  const stats = data.stats;
  const adminName = storedAdminName || data.admin.name || "Admin";

  return (
    <div className={styles.page}>
      {/* ---------- Sidebar ---------- */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon}>
            <GraduationCap size={20} />
          </span>
          <span className={styles.logoText}>ClassBridge</span>
        </div>

        <nav className={styles.navMenu}>
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            if (!group.children) {
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => handleNavigate(group.href)}
                  className={`${styles.navItem} ${
                    pathname === group.href ? styles.navItemActive : ""
                  }`}
                >
                  <Icon size={18} />
                  <span>{group.label}</span>
                </button>
              );
            }

            const isOpen = openGroups[group.key];
            return (
              <div key={group.key} className={styles.navGroup}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className={styles.navItem}
                >
                  <Icon size={18} />
                  <span>{group.label}</span>
                  <ChevronDown
                    size={15}
                    className={`${styles.navChevron} ${isOpen ? styles.navChevronOpen : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className={styles.navChildren}>
                    {group.children.map((child) => (
                      <button
                        key={child.href}
                        type="button"
                        onClick={() => handleNavigate(child.href)}
                        className={`${styles.navItemChild} ${
                          pathname === child.href ? styles.navItemChildActive : ""
                        }`}
                      >
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ---------- Nội dung chính ---------- */}
      <div className={styles.contentArea}>
        {/* ---------- Topbar ---------- */}
        <header className={styles.topbar}>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div className={styles.topbarActions}>
            <button type="button" className={styles.iconButton} aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className={styles.dropdownWrap} ref={langMenuRef}>
              <button
                type="button"
                className={styles.langButton}
                onClick={() => setIsLangMenuOpen((v) => !v)}
              >
                <Globe size={15} />
                <span>{language}</span>
                <ChevronDown size={13} />
              </button>
              {isLangMenuOpen && (
                <div className={styles.dropdownMenu}>
                  {(["EN", "VI"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className={`${styles.dropdownItem} ${
                        language === lang ? styles.dropdownItemActive : ""
                      }`}
                      onClick={() => {
                        setLanguage(lang);
                        setIsLangMenuOpen(false);
                      }}
                    >
                      {lang === "EN" ? "English" : "Tiếng Việt"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className={styles.topbarDivider} />

            <div className={styles.dropdownWrap} ref={profileMenuRef}>
              <button
                type="button"
                className={styles.profileButton}
                onClick={() => setIsProfileMenuOpen((v) => !v)}
              >
                <span className={styles.profileAvatar}>
                  {adminName.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.profileName}>
                  {adminName}
                </span>
                <ChevronDown size={13} />
              </button>
              {isProfileMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <button type="button" className={styles.dropdownItem}>
                    Profile
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => router.push("/logout")}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {/* ---------- Banner chào mừng ---------- */}
          <section className={styles.welcomeBanner}>
            <div>
              <h1 className={styles.welcomeTitle}>
                Welcome back, {adminName}!
              </h1>
              <p className={styles.welcomeSubtitle}>
                Manage accounts, users, classes, questions and more in ClassBridge.
              </p>
            </div>
            <div className={styles.welcomeDateTime}>
              <p className={styles.welcomeDate}>{dateLabel}</p>
              <p className={styles.welcomeTime}>
                <Clock size={14} /> {timeLabel}
              </p>
            </div>
          </section>

          {error && (
            <div className={styles.panel} style={{ borderColor: "var(--danger)" }}>
              <p className={styles.emptyText} style={{ color: "var(--danger)" }}>
                {error}{" "}
                <button type="button" className={styles.viewAllLink} onClick={loadData}>
                  Thử lại
                </button>
              </p>
            </div>
          )}

          {/* ---------- Thẻ số liệu (6 cards) ---------- */}
          <section className={styles.statsGrid}>
            <StatCard
              icon={<UsersRound size={20} />}
              iconClass={styles.statIconBlue}
              label="Total Accounts"
              value={formatNumber(stats?.totalAccounts)}
              trend={
                stats
                  ? `+${stats.accountsAddedThisWeek} this week`
                  : loading
                    ? "Loading..."
                    : "No data yet"
              }
            />
            <StatCard
              icon={<User size={20} />}
              iconClass={styles.statIconPurple}
              label="Lecturers"
              value={formatNumber(stats?.lecturers)}
              trend={
                stats
                  ? `Active ${stats.lecturersActive}`
                  : loading
                    ? "Loading..."
                    : "No data yet"
              }
            />
            <StatCard
              icon={<GraduationCap size={20} />}
              iconClass={styles.statIconGreen}
              label="Students"
              value={formatNumber(stats?.students)}
              trend={
                stats
                  ? `Online ${stats.studentsOnline}`
                  : loading
                    ? "Loading..."
                    : "No data yet"
              }
            />
            <StatCard
              icon={<BookOpen size={20} />}
              iconClass={styles.statIconOrange}
              label="Classes"
              value={formatNumber(stats?.classes)}
              trend={
                stats
                  ? `Active ${stats.classesActive}`
                  : loading
                    ? "Loading..."
                    : "No data yet"
              }
            />
            <StatCard
              icon={<HelpCircle size={20} />}
              iconClass={styles.statIconCyan}
              label="Questions"
              value={formatNumber(stats?.questions)}
              trend={
                stats
                  ? `+${stats.questionsAddedThisWeek} this week`
                  : loading
                    ? "Loading..."
                    : "No data yet"
              }
            />
            <StatCard
              icon={<Layers size={20} />}
              iconClass={styles.statIconPink}
              label="Question Groups"
              value={formatNumber(stats?.questionGroups)}
              trend={
                stats
                  ? `+${stats.questionGroupsAddedThisWeek} this week`
                  : loading
                    ? "Loading..."
                    : "No data yet"
              }
            />
          </section>

          {/* ---------- Quick Actions ---------- */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitleRow}>
              <ActivityIcon size={16} className={styles.panelTitleIcon} />
              Quick Actions
            </h2>
            <div className={styles.quickActionsGrid}>
              <button
                type="button"
                className={styles.quickActionPrimary}
                onClick={() => router.push("/admin/accounts/new")}
              >
                <Plus size={16} /> Create Account
              </button>
              <button
                type="button"
                className={styles.quickActionBlue}
                onClick={() => router.push("/admin/lecturers")}
              >
                <Users size={16} /> View Lecturers
              </button>
              <button
                type="button"
                className={styles.quickActionGreen}
                onClick={() => router.push("/admin/students")}
              >
                <GraduationCap size={16} /> View Students
              </button>
              <button
                type="button"
                className={styles.quickActionOrange}
                onClick={() => router.push("/admin/classes")}
              >
                <BookOpen size={16} /> View Classes
              </button>
            </div>
          </section>

          {/* ---------- Account Distribution + Recent Activities + System Overview ---------- */}
          <section className={styles.threeColumn}>
            {/* Account Distribution */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitleRow}>
                <User size={16} className={styles.panelTitleIcon} />
                Account Distribution
              </h2>

              {loading ? (
                <p className={styles.loadingText}>Loading...</p>
              ) : !data.distribution || distributionTotal === 0 ? (
                <p className={styles.emptyText}>Chưa có dữ liệu phân bổ tài khoản.</p>
              ) : (
                <div className={styles.distributionRow}>
                  <DonutChart distribution={data.distribution} total={distributionTotal} />
                  <div className={styles.distributionLegend}>
                    <LegendRow
                      color={styles.legendDotBlue}
                      label="Admin"
                      value={data.distribution.admin}
                      total={distributionTotal}
                    />
                    <LegendRow
                      color={styles.legendDotPurple}
                      label="Lecturer"
                      value={data.distribution.lecturer}
                      total={distributionTotal}
                    />
                    <LegendRow
                      color={styles.legendDotGreen}
                      label="Student"
                      value={data.distribution.student}
                      total={distributionTotal}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitleRow}>
                  <Clock size={16} className={styles.panelTitleIcon} />
                  Recent Activities
                </h2>
                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => router.push("/admin/activities")}
                >
                  View All
                </button>
              </div>

              {loading ? (
                <p className={styles.loadingText}>Loading...</p>
              ) : data.activities.length === 0 ? (
                <p className={styles.emptyText}>Chưa có hoạt động nào được ghi nhận.</p>
              ) : (
                <div className={styles.activityList}>
                  {data.activities.map((a) => (
                    <div key={a.id} className={styles.activityRow}>
                      <span className={styles.activityDot} />
                      <div className={styles.activityBody}>
                        <p className={styles.activityTime}>{a.time}</p>
                        <p className={styles.activityTitle}>{a.title}</p>
                        <p className={styles.activityDesc}>{a.description}</p>
                      </div>
                      <span className={styles.activityActor}>{a.actor}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Overview */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitleRow}>
                  <TrendingUp size={16} className={styles.panelTitleIcon} />
                  System Overview
                </h2>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>Last 7 days</span>
              </div>

              {loading ? (
                <p className={styles.loadingText}>Loading...</p>
              ) : data.systemOverview.length === 0 ? (
                <p className={styles.emptyText}>Chưa có dữ liệu tổng quan hệ thống.</p>
              ) : (
                <SystemOverviewChart points={data.systemOverview} />
              )}
            </div>
          </section>

          {/* ---------- Recent Accounts + Recent Classes ---------- */}
          <section className={styles.twoColumn}>
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitleRow}>
                  <User size={16} className={styles.panelTitleIcon} />
                  Recent Accounts
                </h2>
                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => router.push("/admin/accounts")}
                >
                  View All
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Avatar</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          Loading...
                        </td>
                      </tr>
                    ) : data.recentAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          Chưa có tài khoản nào được tạo gần đây.
                        </td>
                      </tr>
                    ) : (
                      data.recentAccounts.map((acc) => (
                        <tr key={acc.id}>
                          <td>
                            <span className={styles.tableAvatar}>
                              {acc.name.slice(0, 1).toUpperCase()}
                            </span>
                          </td>
                          <td>{acc.name}</td>
                          <td>{acc.role}</td>
                          <td>{acc.email}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                acc.status === "Active"
                                  ? styles.statusActive
                                  : styles.statusInactive
                              }`}
                            >
                              {acc.status}
                            </span>
                          </td>
                          <td>{acc.createdDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h2 className={styles.panelTitleRow}>
                  <BookOpen size={16} className={styles.panelTitleIcon} />
                  Recent Classes
                </h2>
                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => router.push("/admin/classes")}
                >
                  View All
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Lecturer</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyState}>
                          Loading...
                        </td>
                      </tr>
                    ) : data.recentClasses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyState}>
                          Chưa có lớp học nào được tạo gần đây.
                        </td>
                      </tr>
                    ) : (
                      data.recentClasses.map((cls) => (
                        <tr key={cls.id}>
                          <td>
                            <span className={styles.classNameCell}>
                              <BookOpen size={14} /> {cls.name}
                            </span>
                          </td>
                          <td>{cls.lecturer}</td>
                          <td>{cls.students}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                cls.status === "Active"
                                  ? styles.statusActive
                                  : styles.statusInactive
                              }`}
                            >
                              {cls.status}
                            </span>
                          </td>
                          <td>{cls.createdDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  iconClass,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardTop}>
        <span className={`${styles.statIcon} ${iconClass}`}>{icon}</span>
        <ChevronRight size={16} className={styles.statChevron} />
      </div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statTrend}>{trend}</p>
    </div>
  );
}

function DonutChart({
  distribution,
  total,
}: {
  distribution: AccountDistribution;
  total: number;
}) {
  const adminPct = (distribution.admin / total) * 100;
  const lecturerPct = (distribution.lecturer / total) * 100;
  const gradient = `conic-gradient(
    #2563eb 0% ${adminPct}%,
    #8b5cf6 ${adminPct}% ${adminPct + lecturerPct}%,
    #22c55e ${adminPct + lecturerPct}% 100%
  )`;
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut} style={{ background: gradient }}>
        <div className={styles.donutHole}>
          <span className={styles.donutTotal}>{total.toLocaleString("en-US")}</span>
          <span className={styles.donutTotalLabel}>Total Accounts</span>
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className={styles.legendRow}>
      <span className={`${styles.legendDot} ${color}`} />
      <span className={styles.legendLabel}>{label}</span>
      <span className={styles.legendValue}>{value}</span>
      <span className={styles.legendPct}>({pct}%)</span>
    </div>
  );
}

/** Biểu đồ đường đơn giản bằng SVG thuần — không cần thư viện chart */
function SystemOverviewChart({ points }: { points: SystemOverviewPoint[] }) {
  if (points.length === 0) return null;

  const width = 400;
  const height = 160;
  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxY = Math.max(
    ...points.flatMap((p) => [p.accounts, p.questions]),
    1
  );
  const niceMax = Math.ceil(maxY / 100) * 100 || 100;

  const xStep = points.length > 1 ? chartW / (points.length - 1) : 0;

  const toX = (i: number) => padding.left + i * xStep;
  const toY = (v: number) => padding.top + chartH - (v / niceMax) * chartH;

  const accountsPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.accounts)}`)
    .join(" ");
  const questionsPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.questions)}`)
    .join(" ");

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => padding.top + chartH * (1 - t));

  return (
    <div className={styles.chartWrap}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#e7eaf3"
            strokeWidth="1"
          />
        ))}

        {[0, 0.5, 1].map((t) => {
          const y = padding.top + chartH * (1 - t);
          const val = Math.round(niceMax * t);
          return (
            <text
              key={t}
              x={padding.left - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#8b98ad"
            >
              {val}
            </text>
          );
        })}

        <path d={accountsPath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
        <path d={questionsPath} fill="none" stroke="#22c55e" strokeWidth="2.5" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(p.accounts)} r="3.5" fill="#2563eb" />
            <circle cx={toX(i)} cy={toY(p.questions)} r="3.5" fill="#22c55e" />
          </g>
        ))}

        {points.map((p, i) => (
          <text
            key={i}
            x={toX(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#8b98ad"
          >
            {p.date}
          </text>
        ))}
      </svg>

      <div className={styles.chartLegend}>
        <span className={styles.chartLegendItem}>
          <span className={`${styles.chartLegendDot} ${styles.chartLegendDotAccounts}`} />
          Accounts
        </span>
        <span className={styles.chartLegendItem}>
          <span className={`${styles.chartLegendDot} ${styles.chartLegendDotQuestions}`} />
          Questions
        </span>
      </div>
    </div>
  );
}