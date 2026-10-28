"use client";

import { useState, useSyncExternalStore, type ChangeEvent } from "react";
import {
  UserRound,
  KeyRound,
  LogOut,
  X,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import styles from "./account-logo.module.css";

export type AccountInfo = {
  avatarUrl?: string;
  username: string;
  dateOfBirth: string; 
  hobbies: string;
};

function subscribeToStoredUser(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredUserName() {
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

type AccountMenuProps = {
  teacherName: string;
  avatarUrl?: string;
  onSaveAccountInfo?: (info: AccountInfo) => void;
  onSubmitPasswordChange?: (oldPassword: string, newPassword: string) => void;
  onLogout?: () => void;
};

export default function AccountMenu({
  teacherName,
  avatarUrl,
  onSaveAccountInfo,
  onSubmitPasswordChange,
  onLogout,
}: AccountMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const storedDisplayName = useSyncExternalStore(
    subscribeToStoredUser,
    getStoredUserName,
    () => null,
  );
  const displayName = storedDisplayName || teacherName;

  const initials = displayName?.trim()
    ? displayName.trim().charAt(0).toUpperCase()
    : "?";

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className={styles.accountMenuWrap}>
      <button
        type="button"
        className={styles.avatarTrigger}
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
        ) : (
          initials
        )}
      </button>

      {isMenuOpen && (
        <>
          {/* Bấm ra ngoài là đóng danh sách */}
          <div className={styles.accountMenuOverlay} onClick={closeMenu} />

          <div className={styles.accountMenuPopup}>
            <div className={styles.accountMenuHeader}>
              <div className={styles.accountMenuAvatarBig}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                ) : (
                  initials
                )}
              </div>
              <div className={styles.accountMenuName}>{displayName}</div>
            </div>

            <div className={styles.accountMenuDivider} />

            {/* 3 mục cùng cấp: Thông tin tài khoản, Đổi mật khẩu, Đăng xuất */}
            <button
              type="button"
              className={styles.accountMenuItem}
              onClick={() => {
                closeMenu();
                setIsInfoModalOpen(true);
              }}
            >
              <UserRound size={16} />
              <span>Thông tin tài khoản</span>
            </button>

            <button
              type="button"
              className={styles.accountMenuItem}
              onClick={() => {
                closeMenu();
                setIsPasswordModalOpen(true);
              }}
            >
              <KeyRound size={16} />
              <span>Đổi mật khẩu</span>
            </button>

            <button
              type="button"
              className={`${styles.accountMenuItem} ${styles.accountMenuLogout}`}
              onClick={() => {
                closeMenu();
                onLogout?.();
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </>
      )}

      {isInfoModalOpen && (
        <AccountInfoModal
          teacherName={displayName}
          avatarUrl={avatarUrl}
          onClose={() => setIsInfoModalOpen(false)}
          onSave={(info) => {
            onSaveAccountInfo?.(info);
            setIsInfoModalOpen(false);
          }}
        />
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={(oldPassword, newPassword) => {
            onSubmitPasswordChange?.(oldPassword, newPassword);
            setIsPasswordModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Khung nhỏ hiện giữa màn hình: Thông tin tài khoản
// ----------------------------------------------------------
type AccountInfoModalProps = {
  teacherName: string;
  avatarUrl?: string;
  onClose: () => void;
  onSave: (info: AccountInfo) => void;
};

function AccountInfoModal({
  teacherName,
  avatarUrl,
  onClose,
  onSave,
}: AccountInfoModalProps) {
  const [preview, setPreview] = useState<string | undefined>(avatarUrl);
  const [username, setUsername] = useState(teacherName);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [hobbies, setHobbies] = useState("");

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: khi có API thật, upload file này lên server thay vì chỉ preview tạm
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleSubmit() {
    onSave({ avatarUrl: preview, username, dateOfBirth, hobbies });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Thông tin tài khoản</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.avatarEditWrap}>
            <div className={styles.avatarEditPreview}>
              {preview ? (
                <img src={preview} alt={username} />
              ) : (
                <span>{username?.trim().charAt(0).toUpperCase() || "?"}</span>
              )}
            </div>
            <label className={styles.avatarEditBtn}>
              <Camera size={14} />
              <span>Đổi ảnh đại diện</span>
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
          </div>

          <label className={styles.fieldLabel}>Tên đăng nhập</label>
          <input
            type="text"
            className={styles.fieldInput}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className={styles.fieldLabel}>Ngày tháng năm sinh</label>
          <input
            type="date"
            className={styles.fieldInput}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />

          <label className={styles.fieldLabel}>Sở thích</label>
          <textarea
            className={styles.fieldTextarea}
            placeholder="Ví dụ: đọc sách, chơi thể thao, nghe nhạc..."
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
          />
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={styles.primaryBtn} onClick={handleSubmit}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Khung nhỏ hiện giữa màn hình: Đổi mật khẩu
// ----------------------------------------------------------
type ChangePasswordModalProps = {
  onClose: () => void;
  onSubmit: (oldPassword: string, newPassword: string) => void;
};

function ChangePasswordModal({ onClose, onSubmit }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!oldPassword || !newPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }
    setError("");
    onSubmit(oldPassword, newPassword);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Đổi mật khẩu</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Mật khẩu cũ</label>
          <div className={styles.passwordFieldWrap}>
            <input
              type={showOld ? "text" : "password"}
              className={styles.fieldInput}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowOld((prev) => !prev)}
              aria-label={showOld ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <label className={styles.fieldLabel}>Mật khẩu mới</label>
          <div className={styles.passwordFieldWrap}>
            <input
              type={showNew ? "text" : "password"}
              className={styles.fieldInput}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowNew((prev) => !prev)}
              aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={styles.primaryBtn} onClick={handleSubmit}>
            Cập nhật mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}