"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EXPECTED_ROLE = "ADMIN";
const AUTH_API = "http://localhost:5000/api/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("\u0110ang x\u00E1c minh t\u00E0i kho\u1EA3n...");

  useEffect(() => {
    let cancelled = false;
    async function completeSignIn() {
      const token = new URLSearchParams(window.location.hash.slice(1)).get("access_token");
      if (!token) {
        setMessage("Kh\u00F4ng nh\u1EADn \u0111\u01B0\u1EE3c phi\u00EAn \u0111\u0103ng nh\u1EADp. H\u00E3y \u0111\u0103ng nh\u1EADp l\u1EA1i.");
        return;
      }
      try {
        const response = await fetch(`${AUTH_API}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || data.user?.role !== EXPECTED_ROLE) {
          throw new Error("T\u00E0i kho\u1EA3n kh\u00F4ng thu\u1ED9c giao di\u1EC7n n\u00E0y.");
        }
        if (cancelled) return;
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("access_token", token);
        router.replace("/dashboard");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Kh\u00F4ng th\u1EC3 x\u00E1c minh t\u00E0i kho\u1EA3n.");
      }
    }
    void completeSignIn();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#070b1c", color: "#d1fae5", fontFamily: "sans-serif" }}>
      <p role="status" aria-live="polite">{message}</p>
    </main>
  );
}
