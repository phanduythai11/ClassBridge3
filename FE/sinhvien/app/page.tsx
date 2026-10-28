import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  Play,
  Brain,
  Languages,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
import styles from './classbridge.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Header / Navbar */}
      <header className={styles.header}>
        {/* Click vào Logo quay về trang chủ */}
        <Link href="/" className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <GraduationCap size={22} color="#ffffff" />
          </div>
          <span className={styles.logoText}>ClassBridge</span>
        </Link>

        <nav className={styles.nav}>
          <a href="#tinh-nang" className={styles.navLink}>Tính năng chính</a>
          <a href="#giai-phap" className={styles.navLink}>Giải pháp EMI</a>
          <a href="#hieu-qua" className={styles.navLink}>Hiệu quả</a>
        </nav>

        <div className={styles.authGroup}>
          <Link href="/login" className={styles.loginBtn}>
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Badge */}
        <div className={styles.badge}>
          <Sparkles size={14} />
          Trợ lý AI chuyên dụng cho lớp học quốc tế DTU
        </div>

        {/* Heading */}
        <h1 className={styles.title}>
          Phá vỡ rào cản ngôn ngữ trong <br />
          <span className={styles.highlightText}>
            Lớp học Song ngữ EMI
          </span>
        </h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          *Tích hợp công nghệ Speech-to-Text, dịch thuật thời gian thực và nhóm câu hỏi thông minh giúp kết nối hoàn hảo giữa giảng viên nước ngoài và sinh viên.
        </p>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Link href="/login" className={styles.actionLink}>
            <button className={styles.primaryBtn}>
              Vào phòng học ngay
              <ArrowRight size={16} />
            </button>
          </Link>

          <button className={styles.secondaryBtn}>
            <span className={styles.playIconWrapper}>
              <Play size={10} fill="currentColor" />
            </span>
            Tìm hiểu thêm
          </button>
        </div>
      </main>

      {/* Floating Sidebar Widgets (Right side) */}
      <aside aria-label="Quick Tools" className={styles.sidebar}>
        <div className={`${styles.sidebarIcon} ${styles.sidebarIconBrain}`}>
          <Brain size={18} />
        </div>
        <div className={styles.sidebarIcon}>
          <Languages size={18} />
        </div>
        <div className={styles.sidebarIcon}>
          <LayoutGrid size={18} />
        </div>
        <div className={styles.sidebarIconActive}>
          <span>AI</span>
        </div>
      </aside>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <img src="/logotachnen.png" className={styles.footerLogo} alt="Logo" />
              <p>ClassBridge – AI</p>
            </div>
            <div className={styles.footerColumn}>
              <h3>Điều hướng</h3>
              <ul>
                <li><Link href="/">Trang chủ</Link></li>
                <li><Link href="#">Giới thiệu</Link></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h3>Hỗ trợ</h3>
              <ul>
                <li><Link href="#">Chính sách Bảo mật</Link></li>
                <li><Link href="#">Điều khoản Dịch vụ</Link></li>
                <li><Link href="#">Trung tâm trợ giúp</Link></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h3>Liên hệ</h3>
              <ul>
                <li>Trường Chinh, Đà Nẵng</li>
                <li>phanduythai1112@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className={styles.footerCopyright}>
            &copy; 2026 ClassBridge – AI. Trợ giảng hỗ trợ công nghệ dành cho giảng viên nước ngoài tại DTU.
          </div>
        </div>
      </footer>
    </div>
  );
}