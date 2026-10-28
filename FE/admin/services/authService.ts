const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/auth";

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
    return data;
  },

  async register(userInfo: {
    fullName: string;
    email: string;
    password: string;
  }) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInfo),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
    return data;
  },
};
