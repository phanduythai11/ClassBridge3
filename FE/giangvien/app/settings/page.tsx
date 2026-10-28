"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Radio,
  Users,
  LayoutGrid,
  LayoutDashboard,
  Settings,
  Mic,
  Lock,
  Globe,
  Clock,
  Languages,
  Captions,
  ChevronDown,
  Check,
} from "lucide-react";
import styles from "./setting.module.css";
import AccountMenu from "../account-logo/AccountMenu";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Live Session", href: "/room", icon: Radio },
  { label: "Class management", href: "/classmanagement", icon: Users },
  { label: "Question grouping", href: "/question", icon: LayoutGrid },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const SETTING_NAV_ITEM = { label: "Settings", href: "/settings", icon: Settings };

type Option = { value: string; label: string };

const INTERFACE_LANGUAGES: Option[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
];

const TIME_ZONES: Option[] = [
  { value: "Asia/Ho_Chi_Minh", label: "(GMT+7) Hanoi" },
  { value: "Asia/Bangkok", label: "(GMT+7) Bangkok" },
  { value: "Asia/Singapore", label: "(GMT+8) Singapore" },
  { value: "Asia/Tokyo", label: "(GMT+9) Tokyo" },
  { value: "Europe/London", label: "(GMT+0) London" },
  { value: "America/New_York", label: "(GMT-5) New York" },
];

const LECTURE_LANGUAGES: Option[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" }
];

const SUBTITLE_STYLES: Option[] = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large text" },
  { value: "contrast", label: "High contrast" },
];

type SettingsState = {
  interfaceLanguage: string;
  timeZone: string;
  lectureLanguage: string;
  translation: boolean;
  bilingualSubtitles: boolean;
  subtitleStyle: string;
  classroomData: boolean;
  audioStorage: boolean;
  dataUsage: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  interfaceLanguage: "en",
  timeZone: "Asia/Ho_Chi_Minh",
  lectureLanguage: "en",
  translation: true,
  bilingualSubtitles: true,
  subtitleStyle: "default",
  classroomData: true,
  audioStorage: true,
  dataUsage: false,
};

function isSameSettings(a: SettingsState, b: SettingsState) {
  return (Object.keys(a) as (keyof SettingsState)[]).every(
    (key) => a[key] === b[key],
  );
}

/* ---------- Component nhỏ dùng lại ---------- */

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIcon} aria-hidden="true">
          {icon}
        </span>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDesc}>{description}</p>
        </div>
      </div>
      <div className={styles.rows}>{children}</div>
    </section>
  );
}

function SelectRow({
  id,
  icon,
  label,
  description,
  value,
  options,
  disabled = false,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  description: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`${styles.row} ${disabled ? styles.rowDisabled : ""}`}>
      <div className={styles.rowText}>
        <label htmlFor={id} className={styles.rowLabel}>
          {label}
        </label>
        <p id={`${id}-desc`} className={styles.rowDesc}>
          {description}
        </p>
      </div>
      <div className={styles.selectWrap}>
        <span className={styles.selectIcon} aria-hidden="true">
          {icon}
        </span>
        <select
          id={id}
          className={styles.select}
          value={value}
          disabled={disabled}
          aria-describedby={`${id}-desc`}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className={styles.selectChevron}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={`${styles.row} ${disabled ? styles.rowDisabled : ""}`}>
      <div className={styles.rowText}>
        <span id={`${id}-label`} className={styles.rowLabel}>
          {label}
        </span>
        <p id={`${id}-desc`} className={styles.rowDesc}>
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        className={`${styles.switch} ${checked ? styles.switchOn : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.switchThumb} />
      </button>
    </div>
  );
}

/* ---------- Trang Settings ---------- */

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [teacherName, setTeacherName] = useState("");

  // settings: giá trị đang chỉnh. savedSettings: giá trị đã lưu gần nhất.
  // TODO: khi tích hợp thật, nạp savedSettings từ API khi vào trang.
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] =
    useState<SettingsState>(DEFAULT_SETTINGS);
  const [justSaved, setJustSaved] = useState(false);

  const isDirty = !isSameSettings(settings, savedSettings);
  const isDefault = isSameSettings(settings, DEFAULT_SETTINGS);

  // Tự ẩn dòng "Settings saved" sau vài giây
  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  function update<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    setJustSaved(false);
  }

  function handleSave() {
    // TODO: gọi API lưu cài đặt thật ở đây
    console.log("Lưu cài đặt:", settings);
    setSavedSettings(settings);
    setJustSaved(true);
  }

  function handleNavigate(href: string) {
    if (!href || href === pathname) return;
    router.push(href);
  }

  // Phụ đề song ngữ chỉ có ý nghĩa khi bật Translation
  const bilingualDisabled = !settings.translation;
  const subtitleStyleDisabled =
    !settings.translation || !settings.bilingualSubtitles;

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
          <div className={styles.content}>
            {/* ---------- General ---------- */}
            <SettingsSection
              icon={<Settings size={19} />}
              title="General"
              description="Basic settings for your account and interface."
            >
              <SelectRow
                id="interface-language"
                icon={<Globe size={16} />}
                label="Interface language"
                description="Choose the language for the interface"
                value={settings.interfaceLanguage}
                options={INTERFACE_LANGUAGES}
                onChange={(value) => update("interfaceLanguage", value)}
              />
              <SelectRow
                id="time-zone"
                icon={<Clock size={16} />}
                label="Time zone"
                description="Set your local time zone"
                value={settings.timeZone}
                options={TIME_ZONES}
                onChange={(value) => update("timeZone", value)}
              />
            </SettingsSection>

            {/* ---------- Lecture & Translation ---------- */}
            <SettingsSection
              icon={<Mic size={19} />}
              title="Lecture & Translation"
              description="Configure how the lecture and translation features work."
            >
              <SelectRow
                id="lecture-language"
                icon={<Languages size={16} />}
                label="Lecture language"
                description="Select the language for your lecture content"
                value={settings.lectureLanguage}
                options={LECTURE_LANGUAGES}
                onChange={(value) => update("lectureLanguage", value)}
              />
              <ToggleRow
                id="translation"
                label="Translation"
                description="Enable real-time translation during the session"
                checked={settings.translation}
                onChange={(checked) => update("translation", checked)}
              />
              <ToggleRow
                id="bilingual-subtitles"
                label="Show bilingual subtitles"
                description="Display both languages in the subtitles"
                checked={settings.bilingualSubtitles}
                disabled={bilingualDisabled}
                onChange={(checked) => update("bilingualSubtitles", checked)}
              />
              <SelectRow
                id="subtitle-style"
                icon={<Captions size={16} />}
                label="Subtitle display style"
                description="Choose the style for bilingual subtitles"
                value={settings.subtitleStyle}
                options={SUBTITLE_STYLES}
                disabled={subtitleStyleDisabled}
                onChange={(value) => update("subtitleStyle", value)}
              />
            </SettingsSection>

            {/* ---------- Privacy ---------- */}
            <SettingsSection
              icon={<Lock size={19} />}
              title="Privacy"
              description="Manage your data and privacy settings."
            >
              <ToggleRow
                id="classroom-data"
                label="Classroom data"
                description="Allow the system to store classroom data for better experience"
                checked={settings.classroomData}
                onChange={(checked) => update("classroomData", checked)}
              />
              <ToggleRow
                id="audio-storage"
                label="Audio storage"
                description="Do not store original audio files for a long time"
                checked={settings.audioStorage}
                onChange={(checked) => update("audioStorage", checked)}
              />
              <ToggleRow
                id="data-usage"
                label="Data usage"
                description="Allow anonymous usage data for system improvement"
                checked={settings.dataUsage}
                onChange={(checked) => update("dataUsage", checked)}
              />
            </SettingsSection>

            {/* ---------- Nút hành động ---------- */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleReset}
                disabled={isDefault}
              >
                Reset to default
              </button>

              <div className={styles.footerRight}>
                <span className={styles.saveStatus} role="status">
                  {justSaved && (
                    <>
                      <Check size={15} aria-hidden="true" />
                      Settings saved
                    </>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={!isDirty}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}