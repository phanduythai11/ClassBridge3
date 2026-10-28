"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./accountList.module.css";
import {
  GraduationCap,
  Home,
  Users,
  UsersRound,
  BookOpen,
  ChevronDown,
  Search,
  Bell,
  Globe,
  Plus,
  Download,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreVertical,
} from "lucide-react";

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

type UserStatus =
  | "Active"
  | "Inactive"
  | "Banned"
  | "Pending"
  | "Suspended"
  | "Locked"
  | "NotActivated";

type UserRole = "Admin" | "Editor" | "User" | "Moderator" | "Guest" | "Customer";

type Account = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone?: string;
  studentId?: string;
  status: UserStatus;
  role: UserRole;
  joinedDate: string;
  lastActiveLabel: string;
  avatarUrl?: string | null;
};

type ActivityLog = {
  id: string;
  time: string;
  title: string;
  description: string;
};

type AccountsResponse = {
  items: Account[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type AdminUser = { name: string; email?: string };

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "Active", label: "Active (Đang hoạt động)" },
  { value: "Locked", label: "Locked (Bị khóa)" },
  { value: "NotActivated", label: "Not Activated (Chưa kích hoạt)" },
  { value: "Inactive", label: "Inactive (Không hoạt động)" },
];

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Roles" },
  { value: "Admin", label: "Admin" },
  { value: "Editor", label: "Lecture" },
  { value: "User", label: "Students" },
];

const FULLNAME_REGEX = /^[\p{L}]+(?:\s[\p{L}]+)*$/u;
const USERNAME_REGEX = /^[\p{L}]+$/u;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PHONE_REGEX = /^\d{10}$/;

type FieldName = "fullName" | "username" | "password" | "email" | "phone" | "studentId";
type FieldErrors = Partial<Record<FieldName, string>>;

function validateField(field: FieldName, rawValue: string): string | undefined {
  const value = rawValue.trim();
  switch (field) {
    case "fullName":
      if (!value) return "Vui lòng nhập họ và tên.";
      if (/\d/.test(value)) return "Họ và tên không được chứa số.";
      if (!FULLNAME_REGEX.test(value)) return "Họ và tên chỉ được chứa chữ cái.";
      return undefined;
    case "username":
      if (!value) return "Vui lòng nhập username.";
      if (/\d/.test(value)) return "Username không được chứa số.";
      if (!USERNAME_REGEX.test(value)) return "Username chỉ được chứa chữ cái, không khoảng trắng.";
      return undefined;
    case "password":
      if (!value) return "Vui lòng nhập mật khẩu.";
      if (value.length < 8 || value.length > 12) return "Mật khẩu phải dài từ 8 đến 12 ký tự.";
      return undefined;
    case "email":
      if (!value) return "Vui lòng nhập email.";
      if (!EMAIL_REGEX.test(value)) return "Email phải đúng định dạng và kết thúc bằng @gmail.com.";
      return undefined;
    case "phone":
      if (!value) return undefined;
      if (!PHONE_REGEX.test(value)) return "Số điện thoại phải gồm đúng 10 chữ số, không chứa chữ.";
      return undefined;
    case "studentId":
      if (!value) return "Vui lòng nhập mã số sinh viên.";
      if (!/^\d+$/.test(value)) return "Mã số sinh viên chỉ được nhập số, không chứa chữ.";
      if (value.length < 5 || value.length > 20) return "Mã số sinh viên phải từ 5–20 chữ số.";
      return undefined;
    default:
      return undefined;
  }
}

const MOCK_DB_KEY = "classbridge_accounts_mock_db";


function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function slugFromFullName(fullName: string): string {
  return removeDiacritics(fullName)
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

function isUsernameTaken(username: string, excludeId?: string): boolean {
  const list = loadMockDb();
  return list.some(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.id !== excludeId
  );
}

function uniqueUsername(base: string, excludeId?: string): string {
  if (!base) return "";
  let candidate = base;
  let n = 1;
  while (isUsernameTaken(candidate, excludeId)) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function seedMockAccounts(): Account[] {
  const t = todayISO();
  return [
    {
      id: "acc-seed-1",
      fullName: "Nguyễn Văn An",
      username: "nguyenvanan",
      email: "nguyenvanan@gmail.com",
      phone: "0901234567",
      studentId: "SV20210001",
      status: "Active",
      role: "Admin",
      joinedDate: t,
      lastActiveLabel: "Vừa xong",
      avatarUrl: null,
    },
    {
      id: "acc-seed-2",
      fullName: "Trần Thị Bích",
      username: "tranthibich",
      email: "tranthibich@gmail.com",
      phone: "0912345678",
      studentId: "SV20210002",
      status: "Active",
      role: "Editor",
      joinedDate: t,
      lastActiveLabel: "1 giờ trước",
      avatarUrl: null,
    },
    {
      id: "acc-seed-3",
      fullName: "Lê Minh Châu",
      username: "leminhchau",
      email: "leminhchau@gmail.com",
      phone: "0923456789",
      studentId: "SV20210003",
      status: "Pending",
      role: "User",
      joinedDate: t,
      lastActiveLabel: "Chưa hoạt động",
      avatarUrl: null,
    },
  ];
}

function loadMockDb(): Account[] {
  if (typeof window === "undefined") return seedMockAccounts();
  try {
    const raw = window.localStorage.getItem(MOCK_DB_KEY);
    if (raw) return JSON.parse(raw) as Account[];
    const seeded = seedMockAccounts();
    window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return seedMockAccounts();
  }
}

function saveMockDb(list: Account[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_DB_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function mockListAccounts(params: {
  q: string;
  status: string;
  role: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): AccountsResponse {
  let list = loadMockDb();
  if (params.q) {
    const needle = params.q.trim().toLowerCase();
    list = list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        u.username.toLowerCase().includes(needle) ||
        (u.phone ?? "").includes(needle) ||
        (u.studentId ?? "").toLowerCase().includes(needle) ||
        u.id.toLowerCase().includes(needle)
    );
  }
  if (params.status) list = list.filter((u) => u.status === params.status);
  if (params.role) list = list.filter((u) => u.role === params.role);
  if (params.dateFrom) list = list.filter((u) => u.joinedDate >= params.dateFrom);
  if (params.dateTo) list = list.filter((u) => u.joinedDate <= params.dateTo);

  const sortBy = params.sortBy || "joinedDate";
  const dir = params.sortDir === "asc" ? 1 : -1;
  list = [...list].sort((a, b) => {
    const av = String((a as unknown as Record<string, string>)[sortBy] ?? "");
    const bv = String((b as unknown as Record<string, string>)[sortBy] ?? "");
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const start = (params.page - 1) * params.pageSize;
  const items = list.slice(start, start + params.pageSize);
  return { items, total, page: params.page, pageSize: params.pageSize, totalPages };
}

function mockCreateAccount(body: {
  username: string;
  password: string;
  email: string;
  phone?: string;
  studentId?: string;
  fullName?: string;
  role: string;
}): Account {
  const list = loadMockDb();
  if (list.some((u) => u.username.toLowerCase() === body.username.toLowerCase())) {
    throw new Error("Username đã tồn tại, vui lòng chọn username khác.");
  }
  if (list.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
    throw new Error("Email đã tồn tại, vui lòng dùng email khác.");
  }
  if (body.studentId && list.some((u) => (u.studentId ?? "").toLowerCase() === body.studentId!.toLowerCase())) {
    throw new Error("Mã số sinh viên đã tồn tại.");
  }
  const newAccount: Account = {
    id: `acc-${Date.now()}`,
    fullName: body.fullName || body.username,
    username: body.username,
    email: body.email,
    phone: body.phone,
    studentId: body.studentId,
    status: "Active",
    role: (body.role as UserRole) || "User",
    joinedDate: todayISO(),
    lastActiveLabel: "Vừa tạo",
    avatarUrl: null,
  };
  saveMockDb([newAccount, ...list]);
  return newAccount;
}

function mockUpdateAccount(
  id: string,
  body: Partial<{
    username: string;
    password: string;
    email: string;
    phone: string;
    studentId: string;
    fullName: string;
    role: string;
    status: string;
  }>
): Account {
  const list = loadMockDb();
  const idx = list.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Không tìm thấy tài khoản.");
  const updated: Account = {
    ...list[idx],
    ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
    ...(body.username !== undefined ? { username: body.username } : {}),
    ...(body.email !== undefined ? { email: body.email } : {}),
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
    ...(body.studentId !== undefined ? { studentId: body.studentId } : {}),
    ...(body.role !== undefined ? { role: body.role as UserRole } : {}),
    ...(body.status !== undefined ? { status: body.status as UserStatus } : {}),
  };
  const next = [...list];
  next[idx] = updated;
  saveMockDb(next);
  return updated;
}

function mockDeleteAccount(id: string): void {
  const list = loadMockDb();
  saveMockDb(list.filter((u) => u.id !== id));
}

function formatDateTime(d: Date = new Date()): string {
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function mockActivityHistory(userId: string): ActivityLog[] {
  const user = loadMockDb().find((u) => u.id === userId);
  if (!user) return [];
  const now = new Date();
  const created = new Date(user.joinedDate + "T08:30:00");
  const login = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const pageView = new Date(now.getTime() - 30 * 60 * 1000);
  return [
    {
      id: `${userId}-page`,
      time: formatDateTime(pageView),
      title: "Truy cập trang",
      description: "Đã mở Account Management / Dashboard.",
    },
    {
      id: `${userId}-login`,
      time: formatDateTime(login),
      title: "Đăng nhập",
      description: user.lastActiveLabel || "Đăng nhập vào hệ thống.",
    },
    {
      id: `${userId}-created`,
      time: formatDateTime(created),
      title: "Tạo tài khoản",
      description: `Tài khoản được tạo với vai trò ${user.role}.`,
    },
  ];
}

async function fetchMe(): Promise<AdminUser> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return { name: "" };
    const data = await res.json();
    return { name: data?.name ?? "", email: data?.email };
  } catch {
    return { name: "" };
  }
}

async function fetchAccounts(params: {
  q: string;
  status: string;
  role: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<AccountsResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.role) sp.set("role", params.role);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortDir) sp.set("sortDir", params.sortDir);

  try {
    const res = await fetch(`/api/admin/accounts?${sp.toString()}`, {
      credentials: "include",
    });
    if (res.status === 404) return mockListAccounts(params);
    if (!res.ok) throw new Error("Failed to load accounts");
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) return mockListAccounts(params);
    throw err;
  }
}

async function createAccount(body: {
  username: string;
  password: string;
  email: string;
  phone?: string;
  studentId?: string;
  fullName?: string;
  role: string;
}): Promise<Account> {
  try {
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return mockCreateAccount(body);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Không thể tạo tài khoản");
    }
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) return mockCreateAccount(body);
    throw err;
  }
}

async function updateAccount(
  id: string,
  body: Partial<{
    username: string;
    password: string;
    email: string;
    phone: string;
    studentId: string;
    fullName: string;
    role: string;
    status: string;
  }>
): Promise<Account> {
  try {
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return mockUpdateAccount(id, body);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Không thể cập nhật tài khoản");
    }
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) return mockUpdateAccount(id, body);
    throw err;
  }
}

async function deleteAccount(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.status === 404) {
      mockDeleteAccount(id);
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Không thể xóa tài khoản");
    }
  } catch (err) {
    if (err instanceof TypeError) {
      mockDeleteAccount(id);
      return;
    }
    throw err;
  }
}

async function fetchActivityHistory(userId: string): Promise<ActivityLog[]> {
  try {
    const res = await fetch(`/api/admin/accounts/${userId}/activity`, {
      credentials: "include",
    });
    if (res.status === 404) return mockActivityHistory(userId);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.items ?? [];
  } catch {
    return mockActivityHistory(userId);
  }
}

function statusClass(status: UserStatus): string {
  switch (status) {
    case "Active":
      return styles.statusActive;
    case "Inactive":
    case "NotActivated":
      return styles.statusInactive;
    case "Banned":
    case "Locked":
      return styles.statusBanned;
    case "Pending":
      return styles.statusPending;
    case "Suspended":
      return styles.statusSuspended;
    default:
      return styles.statusInactive;
  }
}

export default function AdminAccountsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    userManagement: false,
    classManagement: false,
  });

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "VI">("EN");
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [topSearch, setTopSearch] = useState("");
  const [admin, setAdmin] = useState<AdminUser>({ name: "" });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>("joinedDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [items, setItems] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<Account | null>(null);
  const [deleteUser, setDeleteUser] = useState<Account | null>(null);
  const [detailUser, setDetailUser] = useState<Account | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    studentId: "",
    role: "User" as string,
    status: "Active" as string,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

useEffect(() => {
  if (!toast) return;
  const t = setTimeout(() => setToast(null), 3200);
  return () => clearTimeout(t);
}, [toast]);

  const todayStr = useMemo(() => todayISO(), []);
  const hasSelection = selectedIds.size > 0;

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts({
        q,
        status: statusFilter,
        role: roleFilter,
        dateFrom: dateFilter,
        dateTo: dateFilter,
        page,
        pageSize,
        sortBy,
        sortDir,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách tài khoản. Vui lòng thử lại.");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, roleFilter, dateFilter, page, pageSize, sortBy, sortDir]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    fetchMe().then(setAdmin);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function onSearchChange(value: string) {
    setQ(value);
    setPage(1);
  }

  function handleDateChange(value: string) {
    if (value && value > todayStr) {
      setDateError("Không được chọn ngày trong tương lai. Vui lòng chọn lại.");
      return;
    }
    setDateError(null);
    setDateFilter(value);
    setPage(1);
  }

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleNavigate(href?: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  function toggleSort(column: string) {
    if (sortBy === column) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortDir("asc");
    }
    setPage(1);
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((u) => u.id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateFormField(field: FieldName, value: string) {
    // Khi thêm user: fullName → auto username (unique), vẫn cho sửa username
    if (field === "fullName" && addOpen && !editUser) {
      const base = slugFromFullName(value);
      const uname = uniqueUsername(base);
      setForm((f) => ({ ...f, fullName: value, username: uname }));
      setFieldErrors((fe) => ({
        ...fe,
        fullName: validateField("fullName", value),
        username: uname ? undefined : validateField("username", uname),
      }));
      return;
    }
    if (field === "username") {
      setForm((f) => ({ ...f, username: value }));
      const err = validateField("username", value);
      if (!err && value.trim() && isUsernameTaken(value.trim(), editUser?.id)) {
        setFieldErrors((fe) => ({
          ...fe,
          username: "Username đã tồn tại, vui lòng chọn username khác.",
        }));
      } else {
        setFieldErrors((fe) => ({ ...fe, username: err }));
      }
      return;
    }
    if (field === "studentId") {
      const digits = value.replace(/\D/g, "");
      setForm((f) => ({ ...f, studentId: digits }));
      setFieldErrors((fe) => ({ ...fe, studentId: validateField("studentId", digits) }));
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "password" && editUser && value === "") {
      setFieldErrors((fe) => ({ ...fe, password: undefined }));
      return;
    }
    setFieldErrors((fe) => ({ ...fe, [field]: validateField(field, value) }));
  }

  function openAddModal() {
    setForm({
      fullName: "",
      username: "",
      password: "",
      email: "",
      phone: "",
      studentId: "",
      role: "User",
      status: "Active",
    });
    setFieldErrors({});
    setFormError(null);
    setAddOpen(true);
  }

  function openEditModal(user: Account) {
    setMenuOpenId(null);
    setForm({
      fullName: user.fullName,
      username: user.username,
      password: "",
      email: user.email,
      phone: user.phone ?? "",
      studentId: user.studentId ?? "",
      role: user.role,
      status: user.status,
    });
    setFieldErrors({});
    setFormError(null);
    setEditUser(user);
  }

  async function handleSubmitAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errors: FieldErrors = {
      fullName: validateField("fullName", form.fullName),
      username: validateField("username", form.username),
      password: validateField("password", form.password),
      email: validateField("email", form.email),
      phone: validateField("phone", form.phone),
      studentId: validateField("studentId", form.studentId),
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setFormError("Vui lòng kiểm tra lại các trường được đánh dấu lỗi bên dưới.");
      return;
    }
    setSubmitting(true);
    try {
      if (isUsernameTaken(form.username.trim())) {
        setFieldErrors((fe) => ({
          ...fe,
          username: "Username đã tồn tại, vui lòng chọn username khác.",
        }));
        setFormError("Username đã tồn tại.");
        setSubmitting(false);
        return;
      }
      await createAccount({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        studentId: form.studentId.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
      });
      setAddOpen(false);
      await loadAccounts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Lỗi tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setFormError(null);
    const errors: FieldErrors = {
      fullName: validateField("fullName", form.fullName),
      username: validateField("username", form.username),
      email: validateField("email", form.email),
      phone: validateField("phone", form.phone),
      studentId: validateField("studentId", form.studentId),
    };
    if (form.password) errors.password = validateField("password", form.password);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setFormError("Vui lòng kiểm tra lại các trường được đánh dấu lỗi bên dưới.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        studentId: form.studentId.trim(),
        role: form.role,
        status: form.status,
      };
      if (form.password) body.password = form.password;
      if (isUsernameTaken(form.username.trim(), editUser.id)) {
        setFieldErrors((fe) => ({
          ...fe,
          username: "Username đã tồn tại, vui lòng chọn username khác.",
        }));
        setFormError("Username đã tồn tại.");
        setSubmitting(false);
        return;
      }
      await updateAccount(editUser.id, body);
      setEditUser(null);
      await loadAccounts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Lỗi cập nhật");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      await deleteAccount(deleteUser.id);
      setDeleteUser(null);
      if (detailUser?.id === deleteUser.id) setDetailUser(null);
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkDelete() {
  if (selectedIds.size === 0) return;
  if (!confirm(`Xóa ${selectedIds.size} tài khoản đã chọn? Không thể hoàn tác.`)) return;
  setSubmitting(true);
  try {
    const count = selectedIds.size;
    for (const id of selectedIds) {
      await deleteAccount(id);
    }
    setSelectedIds(new Set());
    if (detailUser && selectedIds.has(detailUser.id)) setDetailUser(null);
    setToast(`Đã xóa ${count} tài khoản thành công.`);
    await loadAccounts();
  } catch (err) {
    alert(err instanceof Error ? err.message : "Không thể xóa");
  } finally {
    setSubmitting(false);
  }
}
  async function openDetailPanel(user: Account) {
    setMenuOpenId(null);
    setDetailUser(user);
    setActivityLogs([]);
    setActivityLoading(true);
    try {
      setActivityLogs(await fetchActivityHistory(user.id));
    } catch {
      setActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  }

  async function handleExport() {
    const header = ["ID", "Username", "Full Name", "Email", "Phone", "Status", "Role", "Joined Date", "Activity History"];
    const rows = items.map((u, i) =>
      [
        String((page - 1) * pageSize + i + 1),
        u.username,
        u.fullName,
        u.email,
        u.phone ?? "",
        u.status,
        u.role,
        u.joinedDate,
        u.lastActiveLabel,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleShowMore() {
    setPageSize((s) => s + PAGE_SIZE);
    setPage(1);
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxShow = 5;
    let start = Math.max(1, page - Math.floor(maxShow / 2));
    let end = Math.min(totalPages, start + maxShow - 1);
    start = Math.max(1, end - maxShow + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={styles.page}>
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
                  className={`${styles.navItem} ${pathname === group.href ? styles.navItemActive : ""}`}
                >
                  <Icon size={18} />
                  <span>{group.label}</span>
                </button>
              );
            }
            const isOpen = openGroups[group.key];
            return (
              <div key={group.key} className={styles.navGroup}>
                <button type="button" onClick={() => toggleGroup(group.key)} className={styles.navItem}>
                  <Icon size={18} />
                  <span>{group.label}</span>
                  <ChevronDown size={15} className={`${styles.navChevron} ${isOpen ? styles.navChevronOpen : ""}`} />
                </button>
                {isOpen && (
                  <div className={styles.navChildren}>
                    {group.children.map((child) => (
                      <button
                        key={child.href}
                        type="button"
                        onClick={() => handleNavigate(child.href)}
                        className={`${styles.navItemChild} ${pathname === child.href ? styles.navItemChildActive : ""}`}
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

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <label className={styles.searchBoxTop}>
            <Search size={16} />
            <input type="search" placeholder="Search..." value={topSearch} onChange={(e) => setTopSearch(e.target.value)} />
          </label>
          <div className={styles.topbarActions}>
            <button type="button" className={styles.iconButton} aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className={styles.dropdownWrap} ref={langMenuRef}>
              <button type="button" className={styles.langButton} onClick={() => setIsLangMenuOpen((v) => !v)}>
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
                      className={`${styles.dropdownItem} ${language === lang ? styles.dropdownItemActive : ""}`}
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
              <button type="button" className={styles.profileButton} onClick={() => setIsProfileMenuOpen((v) => !v)}>
                <span className={styles.profileAvatar}>{(admin.name || "A").slice(0, 1).toUpperCase()}</span>
                <span className={styles.profileName}>{admin.name || "Admin"}</span>
                <ChevronDown size={13} />
              </button>
              {isProfileMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <button type="button" className={styles.dropdownItem}>Profile</button>
                  <button type="button" className={styles.dropdownItem} onClick={() => router.push("/logout")}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Account Management</h1>
              <p className={styles.pageSubtitle}>
                Quản lý tài khoản — tìm kiếm, lọc, thêm / sửa / xóa và xem lịch sử hoạt động.
              </p>
            </div>
          </div>

          <div className={styles.mainWithPanel}>
            <div className={styles.mainCol}>
              {hasSelection ? (
  <div className={styles.bulkBar}>
    <span className={styles.bulkInfo}>Đã chọn {selectedIds.size} tài khoản</span>
    <div className={styles.bulkActions}>
      <button
        type="button"
        className={styles.btnBulkCancel}
        onClick={() => setSelectedIds(new Set())}
      >
        Hủy
      </button>
      <button
        type="button"
        className={styles.btnBulkDelete}
        onClick={handleBulkDelete}
        disabled={submitting}
      >
        <Trash2 size={16} /> Xóa
      </button>
    </div>
  </div>
) : (
                <div className={styles.filtersBar}>
                  <label className={styles.searchInputWrap}>
                    <Search size={16} />
                    <input
                      type="search"
                      placeholder="Tìm theo Tên, Email, SĐT hoặc ID..."
                      value={q}
                      onChange={(e) => onSearchChange(e.target.value)}
                    />
                  </label>
                  <div className={styles.filterSelect}>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value || "all-s"} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                  <div className={styles.filterSelect}>
                    <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value || "all-r"} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                  <div className={styles.dateInputWrap}>
                    <Calendar size={14} />
                    <input type="date" value={dateFilter} max={todayStr} onChange={(e) => handleDateChange(e.target.value)} aria-label="Ngày đăng ký" />
                  </div>
                  <div className={styles.filtersSpacer} />
                  <button type="button" className={styles.btnExport} onClick={handleExport}>
                    <Download size={16} /> Export
                  </button>
                  <button type="button" className={styles.btnAdd} onClick={openAddModal}>
                    <Plus size={16} /> Add User
                  </button>
                </div>
              )}

              {dateError && <p className={styles.inlineError}>{dateError}</p>}
              {error && (
                <div className={styles.errorBanner}>
                  {error}{" "}
                  <button type="button" onClick={loadAccounts} className={styles.retryLink}>Thử lại</button>
                </div>
              )}

              <div className={styles.tablePanel}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={items.length > 0 && selectedIds.size === items.length}
                            onChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </th>
                        <th className={styles.idCell}>ID</th>
                        <th className={styles.sortable} onClick={() => toggleSort("username")}>Username</th>
                        <th className={styles.sortable} onClick={() => toggleSort("fullName")}>Full Name</th>
                        <th className={styles.sortable} onClick={() => toggleSort("studentId")}>Mã SV</th>
                        <th className={styles.sortable} onClick={() => toggleSort("email")}>Email</th>
                        <th className={styles.sortable} onClick={() => toggleSort("status")}>Status</th>
                        <th className={styles.sortable} onClick={() => toggleSort("role")}>Role</th>
                        <th className={styles.sortable} onClick={() => toggleSort("joinedDate")}>Joined Date</th>
                        <th>Activity History</th>
                        <th style={{ width: 48 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={11} className={styles.loadingState}>Loading...</td></tr>
                      ) : items.length === 0 ? (
                        <tr><td colSpan={11} className={styles.emptyState}>Không có tài khoản nào phù hợp bộ lọc.</td></tr>
                      ) : (
                        items.map((user, index) => {
                          const rowId = (page - 1) * pageSize + index + 1;
                          return (
                            <tr key={user.id} className={selectedIds.has(user.id) ? styles.selected : undefined}>
                              <td className={styles.checkboxCell}>
                                <input
                                  type="checkbox"
                                  className={styles.checkbox}
                                  checked={selectedIds.has(user.id)}
                                  onChange={() => toggleSelect(user.id)}
                                  aria-label={`Select ${user.username}`}
                                />
                              </td>
                              <td className={styles.idCell}>{rowId}</td>
                              <td>
                                <button type="button" className={styles.userNameLink} onClick={() => openDetailPanel(user)}>
                                  {user.username}
                                </button>
                              </td>
                              <td className={styles.usernameCell}>{user.fullName}</td>
                              <td className={styles.dateCell}>{user.studentId || "—"}</td>
                              <td className={styles.emailCell}>{user.email}</td>
                              <td>
                                <span className={`${styles.statusBadge} ${statusClass(user.status)}`}>
                                  {user.status === "NotActivated" ? "Not Activated" : user.status}
                                </span>
                              </td>
                              <td className={styles.roleCell}>{user.role}</td>
                              <td className={styles.dateCell}>{user.joinedDate}</td>
                              <td>
                                <button type="button" className={styles.activityLink} onClick={() => openDetailPanel(user)}>
                                  {user.lastActiveLabel || "View history"}
                                </button>
                              </td>
                              <td>
                                <div className={styles.kebabWrap} ref={menuOpenId === user.id ? menuRef : undefined}>
                                  <button
                                    type="button"
                                    className={styles.kebabBtn}
                                    aria-label="More actions"
                                    onClick={() => setMenuOpenId((id) => (id === user.id ? null : user.id))}
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {menuOpenId === user.id && (
                                    <div className={styles.kebabMenu}>
                                      <button type="button" className={styles.kebabItem} onClick={() => openEditModal(user)}>
                                        <Pencil size={14} /> Chỉnh sửa
                                      </button>
                                      <button
                                        type="button"
                                        className={`${styles.kebabItem} ${styles.kebabItemDanger}`}
                                        onClick={() => { setMenuOpenId(null); setDeleteUser(user); }}
                                      >
                                        <Trash2 size={14} /> Xóa
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {total > 0 && (
                  <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>Showing {from}–{to} of {total}</span>
                    <div className={styles.paginationCenter}>
                      <button type="button" className={styles.btnShowMore} onClick={handleShowMore} title="Xem thêm tài khoản trên 1 trang">
                        Show more
                      </button>
                    </div>
                    <div className={styles.paginationControls}>
                      <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        <ChevronLeft size={16} />
                      </button>
                      {pageNumbers.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      ))}
                      <button type="button" className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {detailUser && (
              <aside className={styles.detailPanel}>
                <button
                  type="button"
                  className={styles.detailCloseX}
                  onClick={() => setDetailUser(null)}
                  aria-label="Đóng profile"
                >
                  <X size={16} />
                </button>
                <div className={styles.detailHeader}>
                  <div className={styles.detailAvatar}>
                    {detailUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detailUser.avatarUrl} alt="" />
                    ) : (
                      (detailUser.fullName || detailUser.username || "?").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <h3 className={styles.detailName}>{detailUser.fullName}</h3>
                  <p className={styles.detailUsername}>@{detailUser.username}</p>
                  <div className={styles.detailStatusRow}>
                    <span className={`${styles.statusBadge} ${statusClass(detailUser.status)}`}>{detailUser.status}</span>
                  </div>
                </div>
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Thông tin</p>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{detailUser.email}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Mã số sinh viên</span>
                    <span className={styles.detailValue}>{detailUser.studentId || "—"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Role</span>
                    <span className={styles.detailValue}>{detailUser.role}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Joined</span>
                    <span className={styles.detailValue}>{detailUser.joinedDate}</span>
                  </div>
                </div>
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Lịch sử hoạt động</p>
                  {activityLoading ? (
                    <p className={styles.loadingState} style={{ padding: 12 }}>Loading...</p>
                  ) : activityLogs.length === 0 ? (
                    <p className={styles.emptyState} style={{ padding: 12 }}>Chưa có lịch sử.</p>
                  ) : (
                    <div className={styles.detailTimeline}>
                      {activityLogs.map((log) => (
                        <div key={log.id} className={styles.detailTimelineItem}>
                          <span className={styles.detailTimelineDot} />
                          <div>
                            <p className={styles.detailTimelineTime}>{log.time}</p>
                            <p className={styles.detailTimelineTitle}>{log.title}</p>
                            <p className={styles.detailTimelineDesc}>{log.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" className={styles.detailClose} onClick={() => setDetailUser(null)}>
                  Close
                </button>
              </aside>
            )}
          </div>
        </main>
      </div>

      {addOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New User</h2>
              <button type="button" className={styles.modalClose} onClick={() => setAddOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} noValidate>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name *</label>
                  <input className={`${styles.formInput} ${fieldErrors.fullName ? styles.inputError : ""}`} value={form.fullName} onChange={(e) => updateFormField("fullName", e.target.value)} placeholder="Nguyễn Văn A" />
                  {fieldErrors.fullName && <p className={styles.fieldError}>{fieldErrors.fullName}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Username *</label>
                  <input className={`${styles.formInput} ${fieldErrors.username ? styles.inputError : ""}`} value={form.username} onChange={(e) => updateFormField("username", e.target.value)} autoComplete="off" />
                  {fieldErrors.username && <p className={styles.fieldError}>{fieldErrors.username}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password * (8-12 ký tự)</label>
                  <input type="password" className={`${styles.formInput} ${fieldErrors.password ? styles.inputError : ""}`} value={form.password} onChange={(e) => updateFormField("password", e.target.value)} autoComplete="new-password" maxLength={12} />
                  {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email * </label>
                  <input type="email" className={`${styles.formInput} ${fieldErrors.email ? styles.inputError : ""}`} value={form.email} onChange={(e) => updateFormField("email", e.target.value)} placeholder="tenban@gmail.com" />
                  {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mã số sinh viên *</label>
                  <input className={`${styles.formInput} ${fieldErrors.studentId ? styles.inputError : ""}`} value={form.studentId} onChange={(e) => updateFormField("studentId", e.target.value)} placeholder="SV20210001" />
                  {fieldErrors.studentId && <p className={styles.fieldError}>{fieldErrors.studentId}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone (tùy chọn)</label>
                  <input className={`${styles.formInput} ${fieldErrors.phone ? styles.inputError : ""}`} value={form.phone} onChange={(e) => updateFormField("phone", e.target.value)} placeholder="09xxxxxxxx" inputMode="numeric" maxLength={10} />
                  {fieldErrors.phone && <p className={styles.fieldError}>{fieldErrors.phone}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.formSelect} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                      {ROLE_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                </div>
                {formError && <p className={styles.formError}>{formError}</p>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setAddOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>{submitting ? "Saving..." : "Create Account"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit User</h2>
              <button type="button" className={styles.modalClose} onClick={() => setEditUser(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} noValidate>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name *</label>
                  <input className={`${styles.formInput} ${fieldErrors.fullName ? styles.inputError : ""}`} value={form.fullName} onChange={(e) => updateFormField("fullName", e.target.value)} />
                  {fieldErrors.fullName && <p className={styles.fieldError}>{fieldErrors.fullName}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Username *</label>
                  <input className={`${styles.formInput} ${fieldErrors.username ? styles.inputError : ""}`} value={form.username} onChange={(e) => updateFormField("username", e.target.value)} />
                  {fieldErrors.username && <p className={styles.fieldError}>{fieldErrors.username}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>New Password (để trống nếu không đổi)</label>
                  <input type="password" className={`${styles.formInput} ${fieldErrors.password ? styles.inputError : ""}`} value={form.password} onChange={(e) => updateFormField("password", e.target.value)} autoComplete="new-password" maxLength={12} />
                  {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email * (@gmail.com)</label>
                  <input type="email" className={`${styles.formInput} ${fieldErrors.email ? styles.inputError : ""}`} value={form.email} onChange={(e) => updateFormField("email", e.target.value)} />
                  {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mã số sinh viên *</label>
                  <input className={`${styles.formInput} ${fieldErrors.studentId ? styles.inputError : ""}`} value={form.studentId} onChange={(e) => updateFormField("studentId", e.target.value)} placeholder="SV20210001" />
                  {fieldErrors.studentId && <p className={styles.fieldError}>{fieldErrors.studentId}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone (tùy chọn)</label>
                  <input className={`${styles.formInput} ${fieldErrors.phone ? styles.inputError : ""}`} value={form.phone} onChange={(e) => updateFormField("phone", e.target.value)} inputMode="numeric" maxLength={10} />
                  {fieldErrors.phone && <p className={styles.fieldError}>{fieldErrors.phone}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.formSelect} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                      {ROLE_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.formSelect} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                      {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                </div>
                {formError && <p className={styles.formError}>{formError}</p>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xóa tài khoản</h2>
              <button type="button" className={styles.modalClose} onClick={() => setDeleteUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
                Bạn có chắc muốn xóa tài khoản{" "}
                <strong style={{ color: "var(--text)" }}>{deleteUser.username}</strong> ({deleteUser.email})? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => setDeleteUser(null)}>Cancel</button>
              <button type="button" className={styles.btnDanger} disabled={submitting} onClick={handleConfirmDelete}>
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
  <div className={styles.toast} role="status">
    {toast}
  </div>
)}
    </div>
  );
}
