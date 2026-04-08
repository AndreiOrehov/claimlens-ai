import { useState, useEffect, useCallback, useRef } from "react";
import { US_STATES, buildPricingContext, validateEstimates, getVehicleClass, fetchFreshPricing, mergePricing } from "./pricing-db.js";

// ============================================================
// ClaimPilot AI — Insurance Damage Assessment MVP
// ============================================================

// --- Responsive hook ---
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// --- Storage helpers (simulates DB) ---
const DB = {
  getUser: () => {
    try { return JSON.parse(localStorage.getItem("cl_user")); } catch { return null; }
  },
  setUser: (u) => localStorage.setItem("cl_user", JSON.stringify(u)),
  getUsers: () => {
    try { return JSON.parse(localStorage.getItem("cl_users")) || []; } catch { return []; }
  },
  addUser: (u) => {
    const users = DB.getUsers();
    users.push(u);
    localStorage.setItem("cl_users", JSON.stringify(users));
  },
  getClaims: (userId) => {
    try { return JSON.parse(localStorage.getItem(`cl_claims_${userId}`)) || []; } catch { return []; }
  },
  saveClaim: (userId, claim) => {
    const claims = DB.getClaims(userId);
    claims.unshift(claim);
    localStorage.setItem(`cl_claims_${userId}`, JSON.stringify(claims));
  },
  logout: () => localStorage.removeItem("cl_user"),
  getUsage: (userId) => {
    try {
      const data = JSON.parse(localStorage.getItem(`cl_usage_${userId}`)) || {};
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
      if (data.month !== monthKey) return { month: monthKey, count: 0 };
      return data;
    } catch { return { month: `${new Date().getFullYear()}-${new Date().getMonth()}`, count: 0 }; }
  },
  incrementUsage: (userId) => {
    const usage = DB.getUsage(userId);
    usage.count += 1;
    localStorage.setItem(`cl_usage_${userId}`, JSON.stringify(usage));
    return usage;
  },
  upgradePlan: (userId) => {
    const user = DB.getUser();
    if (user && user.id === userId) {
      user.plan = "pro";
      user.planActivatedAt = new Date().toISOString();
      DB.setUser(user);
      // Also update in users list
      const users = DB.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx >= 0) { users[idx].plan = "pro"; users[idx].planActivatedAt = user.planActivatedAt; localStorage.setItem("cl_users", JSON.stringify(users)); }
    }
    return user;
  },
  FREE_LIMIT: 3,
};

// --- Styles ---
const palette = {
  bg: "#080C18",
  surface: "#0E1525",
  surfaceAlt: "#141C30",
  border: "#1B2540",
  borderLight: "#243052",
  accent: "#4A90FF",
  accentHover: "#3B7BF0",
  accentSoft: "rgba(74,144,255,0.10)",
  accentGlow: "rgba(74,144,255,0.25)",
  danger: "#FF5A5A",
  dangerSoft: "rgba(255,90,90,0.10)",
  warning: "#FFB347",
  warningSoft: "rgba(255,179,71,0.10)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.10)",
  text: "#E8EDF5",
  textMuted: "#8B9DC3",
  textDim: "#5A6B8A",
  white: "#FFFFFF",
  glow: "0 0 20px rgba(74,144,255,0.15), 0 0 60px rgba(74,144,255,0.05)",
  glowStrong: "0 0 20px rgba(74,144,255,0.3), 0 0 80px rgba(74,144,255,0.1)",
  cardShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(74,144,255,0.06)",
  gradientBg: "radial-gradient(ellipse at 50% 0%, rgba(74,144,255,0.08) 0%, transparent 60%)",
};

const font = "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// --- Icons (inline SVG) ---
const Icons = {
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Car: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
};

// --- Animated Back Arrow ---
function BackArrow({ onClick, label = "Back", centered = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: "flex", justifyContent: centered ? "center" : "flex-start", animation: "fadeIn 0.35s ease-out" }}>
      <button
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          background: "none", border: "none", cursor: "pointer", fontFamily: font,
          fontSize: 13, fontWeight: 500, color: palette.accent, padding: "6px 0",
          display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          transition: "all 0.2s ease",
          transform: pressed ? "translateX(-4px) scale(0.97)" : "translateX(0)",
          filter: pressed ? `drop-shadow(0 0 8px ${palette.accentGlow})` : "none",
        }}
      >
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 8,
          background: palette.accentSoft, border: `1px solid ${palette.accent}30`,
          boxShadow: `0 0 12px ${palette.accent}20`,
          transition: "all 0.25s ease",
          ...(pressed ? { boxShadow: `0 0 20px ${palette.accent}50`, background: palette.accent + "25" } : {}),
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </span>
        {label}
      </button>
    </div>
  );
}

// ============================================================
// Auth Screen
// ============================================================
function AuthScreen({ onLogin }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!email || !password) return setError("Email and password are required");
    if (mode === "register") {
      if (!name) return setError("Name is required");
      const exists = DB.getUsers().find((u) => u.email === email);
      if (exists) return setError("Account already exists");
      const user = { id: Date.now().toString(), email, name, company, createdAt: new Date().toISOString() };
      DB.addUser({ ...user, password });
      DB.setUser(user);
      onLogin(user);
    } else {
      const found = DB.getUsers().find((u) => u.email === email && u.password === password);
      if (!found) return setError("Invalid credentials");
      const { password: _, ...user } = found;
      DB.setUser(user);
      onLogin(user);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: palette.bg, backgroundImage: palette.gradientBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: font, color: palette.text, padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: palette.surface, borderRadius: 20,
        border: `1px solid ${palette.border}`, padding: isMobile ? 20 : 40,
        boxShadow: palette.cardShadow,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <img src="/icon.png" alt="ClaimPilot AI" style={{
            width: 57, height: 57, borderRadius: 14,
            boxShadow: palette.glowStrong,
          }} />
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", background: `linear-gradient(135deg, #E8EDF5, ${palette.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ClaimPilot AI</span>
        </div>
        <p style={{ color: palette.textDim, fontSize: 13, marginBottom: 32, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500 }}>
          Estimate Before You Inspect
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: palette.surfaceAlt, borderRadius: 8, padding: 3 }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer",
              background: mode === m ? palette.accent : "transparent",
              color: mode === m ? "#fff" : palette.textMuted,
              fontWeight: 600, fontSize: 13, fontFamily: font, transition: "all 0.2s",
            }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              <Input label="Full Name" value={name} onChange={setName} placeholder="John Smith" />
              <Input label="Company (optional)" value={company} onChange={setCompany} placeholder="Acme Insurance" />
            </>
          )}
          <Input label="Email" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: "8px 12px", borderRadius: 8, background: palette.dangerSoft,
            color: palette.danger, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          }}>
            <Icons.AlertTriangle /> {error}
          </div>
        )}

        <button onClick={handleSubmit} style={{
          width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg, ${palette.accent}, #2563EB)`, color: "#fff",
          fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: font,
          transition: "opacity 0.2s",
        }}
          onMouseEnter={(e) => e.target.style.opacity = 0.9}
          onMouseLeave={(e) => e.target.style.opacity = 1}
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", onKeyDown }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: palette.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={onKeyDown}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${palette.border}`,
          background: palette.surfaceAlt, color: palette.text, fontSize: 14, fontFamily: font,
          outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
        }}
        onFocus={(e) => e.target.style.borderColor = palette.accent}
        onBlur={(e) => e.target.style.borderColor = palette.border}
      />
    </div>
  );
}

// --- Profile Dropdown ---
function ProfileDropdown({ user, claimsCount, onHistory, onLogout, onUpgrade }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isPro = user.plan === "pro";

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8,
        border: `1px solid ${open ? palette.accent + "40" : palette.border}`,
        cursor: "pointer", fontFamily: font, fontSize: 11, fontWeight: 500,
        background: open ? palette.accentSoft : "transparent",
        color: open ? palette.accent : palette.textMuted,
        boxShadow: open ? palette.glow : "none",
        transition: "all 0.2s", whiteSpace: "nowrap",
      }}>
        <Icons.User /> My&nbsp;Profile
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6, marginLeft: 2,
          background: isPro ? "linear-gradient(135deg, #F59E0B, #F97316)" : palette.surfaceAlt,
          color: isPro ? "#fff" : palette.textDim,
          boxShadow: isPro ? "0 0 8px rgba(245,158,11,0.4)" : "none",
        }}>
          {isPro ? "PRO" : "Free"}
        </span>
        <span style={{
          transition: "transform 0.2s", display: "inline-flex",
          transform: open ? "rotate(180deg)" : "rotate(0)",
        }}>
          <Icons.ChevronDown />
        </span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 200,
          background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12,
          boxShadow: palette.cardShadow, overflow: "hidden", zIndex: 200,
          animation: "dropdownIn 0.18s ease-out",
        }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>{user.name || "User"}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                background: isPro ? "linear-gradient(135deg, #F59E0B, #F97316)" : palette.surfaceAlt,
                color: isPro ? "#fff" : palette.textDim,
              }}>
                {isPro ? "PRO" : "Free"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{user.email}</div>
          </div>
          {!isPro && (
            <button onClick={() => { setOpen(false); onUpgrade(); }} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px",
              border: "none", background: "transparent", cursor: "pointer", fontFamily: font,
              fontSize: 13, color: "#F59E0B", transition: "all 0.15s", textAlign: "left",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Icons.Star /> Upgrade to Pro
            </button>
          )}
          <button onClick={() => { setOpen(false); onHistory(); }} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px",
            border: "none", background: "transparent", cursor: "pointer", fontFamily: font,
            fontSize: 13, color: palette.textMuted, transition: "all 0.15s", textAlign: "left",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = palette.accentSoft; e.currentTarget.style.color = palette.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = palette.textMuted; }}
          >
            <Icons.History /> History
            {claimsCount > 0 && (
              <span style={{
                marginLeft: "auto", background: `linear-gradient(135deg, ${palette.accent}, #6366F1)`,
                color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                boxShadow: "0 0 8px rgba(74,144,255,0.4)",
              }}>{claimsCount}</span>
            )}
          </button>
          <button onClick={() => { setOpen(false); onLogout(); }} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px",
            border: "none", borderTop: `1px solid ${palette.border}`, background: "transparent",
            cursor: "pointer", fontFamily: font, fontSize: 13, color: palette.danger, textAlign: "left",
            transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = palette.dangerSoft; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Icons.LogOut /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

// --- Upgrade Modal ---
function UpgradeModal({ onClose, onActivate }) {
  const isMobile = useIsMobile();
  const features = [
    { free: "3 analyses / month", pro: "Unlimited analyses" },
    { free: "Watermark on PDF", pro: "Clean professional PDF" },
    { free: "Basic damage report", pro: "Xactimate-style line items" },
    { free: "Standard AI model", pro: "Premium AI model" },
    { free: "—", pro: "Priority support" },
  ];
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", padding: 20,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 520, background: palette.surface, borderRadius: 20,
        border: `1px solid ${palette.border}`, boxShadow: palette.cardShadow,
        animation: "slideUp 0.3s ease-out", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", textAlign: "center",
          background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.08))",
          borderBottom: `1px solid ${palette.border}`,
        }}>
          <div style={{ color: "#F59E0B", marginBottom: 8 }}><Icons.Star /></div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: palette.text, margin: 0 }}>Upgrade to Pro</h2>
          <p style={{ fontSize: 13, color: palette.textMuted, marginTop: 4 }}>Unlock the full power of ClaimPilot AI</p>
        </div>

        {/* Comparison */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {/* Free column */}
            <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${palette.border}`, background: palette.bg }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: palette.textMuted, marginBottom: 4 }}>Free</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: palette.text }}>$0<span style={{ fontSize: 12, fontWeight: 400, color: palette.textDim }}>/mo</span></div>
            </div>
            {/* Pro column */}
            <div style={{
              padding: 14, borderRadius: 12, background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.08))",
              border: "1px solid rgba(245,158,11,0.3)",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>Pro</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: palette.text }}>$29<span style={{ fontSize: 12, fontWeight: 400, color: palette.textDim }}>/mo</span></div>
            </div>
          </div>

          {/* Features list */}
          <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, overflow: "hidden" }}>
            {features.map((f, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: 12,
                borderBottom: i < features.length - 1 ? `1px solid ${palette.border}` : "none",
              }}>
                <div style={{ padding: "8px 12px", color: palette.textDim }}>{f.free}</div>
                <div style={{ padding: "8px 12px", color: palette.text, fontWeight: 500, background: "rgba(245,158,11,0.04)" }}>{f.pro}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${palette.border}`,
            background: "transparent", color: palette.textMuted, fontFamily: font, fontSize: 13,
            fontWeight: 500, cursor: "pointer",
          }}>
            Maybe Later
          </button>
          <button onClick={onActivate} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#fff",
            fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 0 20px rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Icons.Star /> Activate Pro
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main App (Dashboard)
// ============================================================
function Dashboard({ user: initialUser, onLogout, onUserUpdate }) {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(initialUser);
  const [view, setView] = useState("home"); // "home" | "new" | "report" | "cabinet"
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimType, setClaimType] = useState(null); // null | "auto" | "property"
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [usage, setUsage] = useState({ month: "", count: 0 });

  useEffect(() => {
    setClaims(DB.getClaims(user.id));
    setUsage(DB.getUsage(user.id));
  }, [user.id]);

  const isPro = user.plan === "pro";
  const usageLeft = DB.FREE_LIMIT - usage.count;
  const canAnalyze = isPro || usageLeft > 0;

  const handleNewClaim = (claim) => {
    DB.saveClaim(user.id, claim);
    const newUsage = DB.incrementUsage(user.id);
    setClaims(DB.getClaims(user.id));
    setUsage(newUsage);
    setSelectedClaim(claim);
    setClaimType(null);
    setView("report");
  };

  const handleUpgrade = () => {
    const updated = DB.upgradePlan(user.id);
    if (updated) { setUser(updated); if (onUserUpdate) onUserUpdate(updated); }
    setShowUpgrade(false);
  };

  const startNewClaim = (type) => {
    if (!canAnalyze) { setShowUpgrade(true); return; }
    setClaimType(type);
    setView("new");
  };

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, backgroundImage: palette.gradientBg, fontFamily: font, color: palette.text }}>
      {/* Top nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", borderBottom: `1px solid ${palette.border}`,
        background: `${palette.surface}E6`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setView("home"); setClaimType(null); }}>
          <img src="/icon.png" alt="" style={{
            width: 44, height: 44, borderRadius: 11,
            boxShadow: palette.glow,
          }} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", display: "block", lineHeight: 1.2 }}>ClaimPilot AI</span>
            <span style={{ fontSize: 8.5, color: palette.textDim, letterSpacing: "0.12em", textTransform: "uppercase", display: "block" }}>Estimate Before You Inspect</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", position: "relative" }}>
          <ProfileDropdown
            user={user}
            claimsCount={claims.length}
            onHistory={() => { setView("cabinet"); }}
            onLogout={onLogout}
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: isMobile ? "100%" : 960, margin: "0 auto", padding: "24px 20px" }}>

        {/* HOME VIEW — New Claim only */}
        {view === "home" && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.35s ease-out" }}>
              <h2 style={{ fontSize: isMobile ? 13 : 14.4, fontWeight: 400, letterSpacing: "-0.01em", color: palette.textMuted, whiteSpace: "nowrap", textAlign: "center", padding: "6px 0", marginBottom: 4, lineHeight: "28px" }}>
                New Claim — select damage type
              </h2>
            </div>
            {!isPro && (
              <div style={{ textAlign: "center", marginBottom: 12, animation: "fadeIn 0.35s ease-out" }}>
                <span style={{
                  fontSize: 11, color: usageLeft > 0 ? palette.textDim : palette.danger,
                  background: usageLeft > 0 ? palette.surfaceAlt : palette.dangerSoft,
                  padding: "3px 10px", borderRadius: 8,
                }}>
                  {usageLeft > 0 ? `${usageLeft} of ${DB.FREE_LIMIT} free analyses left this month` : "Free limit reached — "}
                  {usageLeft <= 0 && <span onClick={() => setShowUpgrade(true)} style={{ color: "#F59E0B", cursor: "pointer", fontWeight: 600 }}>Upgrade to Pro</span>}
                </span>
              </div>
            )}

            <div style={{
              display: "flex", gap: 14, flexDirection: isMobile ? "column" : "row",
            }}>
              {[
                { key: "auto", icon: <Icons.Car />, title: "Vehicle Damage", desc: "Collision, dents, scratches, glass damage", color: palette.accent },
                { key: "property", icon: <Icons.Home />, title: "Property Damage", desc: "Water, fire, storm, structural damage", color: "#8B5CF6" },
              ].map((t, i) => (
                <button key={t.key} onClick={() => startNewClaim(t.key)} style={{
                  flex: 1, padding: isMobile ? 20 : 24, borderRadius: 16, cursor: "pointer", textAlign: "left",
                  border: `1.5px solid ${palette.border}`, background: palette.surface,
                  transition: "all 0.3s", boxShadow: "none", fontFamily: font,
                  animation: `slideUp 0.4s ease-out ${i * 0.1}s both`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.color + "60"; e.currentTarget.style.boxShadow = `0 0 20px ${t.color}20, 0 0 60px ${t.color}08`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${t.color}15`, color: t.color, marginBottom: 14,
                  }}>
                    {t.icon}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.4 }}>{t.desc}</div>
                  <div style={{
                    marginTop: 14, fontSize: 13, fontWeight: 600, color: t.color,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    Start Assessment →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CABINET VIEW — History */}
        {view === "cabinet" && (
          <div>
            <BackArrow onClick={() => { setView("home"); setClaimType(null); }} label="Back to Dashboard" centered />
            <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 400, marginBottom: 4, letterSpacing: "-0.01em", color: palette.textMuted }}>
              My History
            </h2>
            <p style={{ color: palette.textDim, fontSize: 13, fontWeight: 300, marginBottom: 20 }}>
              {user.name || user.email} · {claims.length} claim{claims.length !== 1 ? "s" : ""}
            </p>

            {claims.length > 0 ? (
              <HistoryView claims={claims} onSelect={(c) => { setSelectedClaim(c); setView("report"); }} />
            ) : (
              <div style={{
                textAlign: "center", padding: "40px 20px", borderRadius: 16,
                border: `1px dashed ${palette.border}`, background: palette.surface,
              }}>
                <div style={{ color: palette.textDim, marginBottom: 8 }}><Icons.FileText /></div>
                <p style={{ color: palette.textMuted, fontSize: 14 }}>No claims yet. Start your first assessment.</p>
              </div>
            )}
          </div>
        )}

        {/* NEW CLAIM VIEW */}
        {view === "new" && claimType && (
          <div style={{ animation: "slideUp 0.35s ease-out" }}>
            <BackArrow onClick={() => { setView("home"); setClaimType(null); }} label="Back to Dashboard" centered />
            <NewClaimView onSubmit={handleNewClaim} initialType={claimType} />
          </div>
        )}

        {/* REPORT VIEW */}
        {view === "report" && selectedClaim && (
          <ReportView claim={selectedClaim} onBack={() => setView("home")} isPro={isPro} />
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} onActivate={handleUpgrade} />
      )}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
      border: active ? `1px solid ${palette.accent}40` : "1px solid transparent",
      cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 500,
      background: active ? palette.accentSoft : "transparent",
      color: active ? palette.accent : palette.textMuted,
      boxShadow: active ? palette.glow : "none",
      transition: "all 0.2s", position: "relative",
    }}>
      {icon} {label}
      {badge > 0 && (
        <span style={{
          background: `linear-gradient(135deg, ${palette.accent}, #6366F1)`, color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "1px 6px", borderRadius: 10, marginLeft: 2,
          boxShadow: "0 0 8px rgba(74,144,255,0.4)",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Vehicle Database (Make → Model → Year ranges)
// ============================================================
const VEHICLE_DB = {
  "Acura": { "ILX": [2013,2022], "Integra": [2023,2026], "MDX": [2001,2026], "RDX": [2007,2026], "TLX": [2015,2026], "TSX": [2004,2014], "RSX": [2002,2006], "NSX": [2017,2022] },
  "Audi": { "A3": [2006,2026], "A4": [1996,2026], "A5": [2008,2026], "A6": [1995,2026], "A7": [2012,2026], "A8": [1997,2026], "Q3": [2015,2026], "Q5": [2009,2026], "Q7": [2007,2026], "Q8": [2019,2026], "e-tron": [2019,2026], "RS5": [2013,2026], "RS7": [2014,2026], "S4": [2000,2026], "TT": [2000,2023] },
  "BMW": { "2 Series": [2014,2026], "3 Series": [1990,2026], "4 Series": [2014,2026], "5 Series": [1990,2026], "7 Series": [1990,2026], "X1": [2013,2026], "X3": [2004,2026], "X5": [2000,2026], "X7": [2019,2026], "M3": [1995,2026], "M4": [2015,2026], "M5": [1999,2026], "iX": [2022,2026], "i4": [2022,2026] },
  "Buick": { "Enclave": [2008,2026], "Encore": [2013,2026], "Encore GX": [2020,2026], "Envision": [2016,2026], "LaCrosse": [2005,2019], "Regal": [2011,2020] },
  "Cadillac": { "CT4": [2020,2026], "CT5": [2020,2026], "Escalade": [1999,2026], "XT4": [2019,2026], "XT5": [2017,2026], "XT6": [2020,2026], "LYRIQ": [2023,2026], "CTS": [2003,2019], "ATS": [2013,2019] },
  "Chevrolet": { "Blazer": [2019,2026], "Camaro": [2010,2024], "Colorado": [2004,2026], "Corvette": [1997,2026], "Equinox": [2005,2026], "Malibu": [1997,2024], "Silverado 1500": [1999,2026], "Silverado 2500HD": [2001,2026], "Suburban": [2000,2026], "Tahoe": [2000,2026], "Traverse": [2009,2026], "Trax": [2013,2026], "Bolt EV": [2017,2023], "Bolt EUV": [2022,2023], "Trailblazer": [2021,2026] },
  "Chrysler": { "300": [2005,2023], "Pacifica": [2017,2026], "Voyager": [2020,2022] },
  "Dodge": { "Challenger": [2008,2023], "Charger": [2006,2026], "Durango": [1998,2026], "Hornet": [2023,2026], "Ram 1500": [2002,2026], "Ram 2500": [2003,2026] },
  "Ford": { "Bronco": [2021,2026], "Bronco Sport": [2021,2026], "Edge": [2007,2024], "Escape": [2001,2026], "Expedition": [1997,2026], "Explorer": [1995,2026], "F-150": [1997,2026], "F-250": [1999,2026], "Maverick": [2022,2026], "Mustang": [1994,2026], "Mustang Mach-E": [2021,2026], "Ranger": [1998,2026], "Lightning": [2022,2026], "Transit": [2015,2026] },
  "Genesis": { "G70": [2019,2026], "G80": [2017,2026], "G90": [2017,2026], "GV70": [2022,2026], "GV80": [2021,2026] },
  "GMC": { "Acadia": [2007,2026], "Canyon": [2004,2026], "Sierra 1500": [1999,2026], "Sierra 2500HD": [2001,2026], "Terrain": [2010,2026], "Yukon": [2000,2026], "Yukon XL": [2000,2026], "Hummer EV": [2022,2026] },
  "Honda": { "Accord": [1990,2026], "Civic": [1990,2026], "CR-V": [1997,2026], "HR-V": [2016,2026], "Odyssey": [1999,2026], "Passport": [2019,2026], "Pilot": [2003,2026], "Ridgeline": [2006,2026], "Fit": [2007,2020], "Prologue": [2024,2026] },
  "Hyundai": { "Elantra": [1996,2026], "Ioniq 5": [2022,2026], "Ioniq 6": [2023,2026], "Kona": [2018,2026], "Palisade": [2020,2026], "Santa Cruz": [2022,2026], "Santa Fe": [2001,2026], "Sonata": [1999,2026], "Tucson": [2005,2026], "Venue": [2020,2026] },
  "Infiniti": { "Q50": [2014,2026], "Q60": [2017,2024], "QX50": [2019,2026], "QX55": [2022,2026], "QX60": [2013,2026], "QX80": [2011,2026] },
  "Jeep": { "Cherokee": [2014,2023], "Compass": [2007,2026], "Gladiator": [2020,2026], "Grand Cherokee": [1999,2026], "Grand Cherokee L": [2021,2026], "Renegade": [2015,2026], "Wagoneer": [2022,2026], "Wrangler": [1997,2026] },
  "Kia": { "EV6": [2022,2026], "EV9": [2024,2026], "Forte": [2010,2026], "K5": [2021,2026], "Seltos": [2021,2026], "Sorento": [2003,2026], "Soul": [2010,2026], "Sportage": [2005,2026], "Telluride": [2020,2026], "Carnival": [2022,2026] },
  "Lexus": { "ES": [1997,2026], "GX": [2003,2026], "IS": [2001,2026], "LC": [2018,2026], "LS": [1995,2026], "LX470": [1998,2007], "LX570": [2008,2021], "LX600": [2022,2026], "NX": [2015,2026], "RC": [2015,2026], "RX": [1999,2026], "TX": [2024,2026], "UX": [2019,2026], "GS": [1998,2020], "RZ": [2023,2026] },
  "Lincoln": { "Aviator": [2020,2026], "Corsair": [2020,2026], "Nautilus": [2019,2026], "Navigator": [1998,2026] },
  "Mazda": { "CX-5": [2013,2026], "CX-30": [2020,2026], "CX-50": [2023,2026], "CX-70": [2025,2026], "CX-90": [2024,2026], "Mazda3": [2004,2026], "MX-5 Miata": [1990,2026], "CX-9": [2007,2023] },
  "Mercedes-Benz": { "A-Class": [2019,2022], "C-Class": [1994,2026], "E-Class": [1996,2026], "S-Class": [1996,2026], "CLA": [2014,2026], "CLE": [2024,2026], "GLA": [2015,2026], "GLB": [2020,2026], "GLC": [2016,2026], "GLE": [2016,2026], "GLS": [2017,2026], "G-Class": [1990,2026], "EQS": [2022,2026], "EQE": [2023,2026], "AMG GT": [2016,2026] },
  "Nissan": { "Altima": [1998,2026], "Armada": [2004,2026], "Frontier": [1998,2026], "Kicks": [2018,2026], "Leaf": [2011,2024], "Maxima": [1995,2023], "Murano": [2003,2025], "Pathfinder": [1996,2026], "Rogue": [2008,2026], "Sentra": [2000,2026], "Titan": [2004,2025], "Versa": [2007,2026], "Z": [2023,2026], "Ariya": [2023,2026] },
  "Porsche": { "911": [1999,2026], "Cayenne": [2003,2026], "Macan": [2015,2026], "Panamera": [2010,2026], "Taycan": [2020,2026], "718 Boxster": [2017,2026], "718 Cayman": [2017,2026] },
  "Ram": { "1500": [2011,2026], "2500": [2011,2026], "3500": [2011,2026], "ProMaster": [2014,2026] },
  "Subaru": { "Ascent": [2019,2026], "Crosstrek": [2013,2026], "Forester": [1998,2026], "Impreza": [1993,2026], "Legacy": [1995,2024], "Outback": [2000,2026], "Solterra": [2023,2026], "WRX": [2002,2026], "BRZ": [2013,2026] },
  "Tesla": { "Model 3": [2017,2026], "Model S": [2012,2026], "Model X": [2016,2026], "Model Y": [2020,2026], "Cybertruck": [2024,2026] },
  "Toyota": { "4Runner": [1996,2026], "86/GR86": [2017,2026], "Camry": [1992,2026], "Corolla": [1990,2026], "Corolla Cross": [2022,2026], "Grand Highlander": [2024,2026], "Highlander": [2001,2026], "Land Cruiser": [1998,2026], "Prius": [2001,2026], "RAV4": [1996,2026], "Sequoia": [2001,2026], "Sienna": [1998,2026], "Tacoma": [1995,2026], "Tundra": [2000,2026], "Venza": [2021,2026], "bZ4X": [2023,2026], "Crown": [2023,2026], "GR Corolla": [2023,2026], "Supra": [2020,2026] },
  "Volkswagen": { "Atlas": [2018,2026], "Atlas Cross Sport": [2020,2026], "Golf": [1999,2025], "Golf GTI": [2006,2026], "Golf R": [2012,2026], "ID.4": [2021,2026], "ID.Buzz": [2025,2026], "Jetta": [1999,2026], "Taos": [2022,2026], "Tiguan": [2009,2026], "Arteon": [2019,2023] },
  "Volvo": { "S60": [2001,2026], "S90": [2017,2026], "V60": [2019,2026], "V90": [2017,2022], "XC40": [2019,2026], "XC60": [2010,2026], "XC90": [2003,2026], "C40 Recharge": [2022,2026], "EX30": [2024,2026], "EX90": [2024,2026] },
};

const PROPERTY_TYPES = [
  { value: "house", label: "Single Family House" },
  { value: "apartment", label: "Apartment / Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "commercial", label: "Commercial Property" },
  { value: "mobile_home", label: "Mobile / Manufactured Home" },
  { value: "multi_family", label: "Multi-Family (Duplex/Triplex)" },
];

const DAMAGE_CAUSES = [
  { value: "water_flood", label: "Water / Flood" },
  { value: "fire_smoke", label: "Fire / Smoke" },
  { value: "storm_wind_hail", label: "Storm / Wind / Hail" },
  { value: "hurricane_tornado", label: "Hurricane / Tornado" },
  { value: "vandalism", label: "Vandalism / Break-in" },
  { value: "tree_fall", label: "Tree / Debris Fall" },
  { value: "structural", label: "Structural Failure" },
  { value: "mold", label: "Mold Damage" },
  { value: "plumbing", label: "Plumbing / Pipe Burst" },
  { value: "other", label: "Other" },
];

const AREAS_AFFECTED = [
  { value: "roof", label: "Roof" },
  { value: "exterior", label: "Exterior Walls / Siding" },
  { value: "interior", label: "Interior (Walls/Floors/Ceiling)" },
  { value: "foundation", label: "Foundation" },
  { value: "garage", label: "Garage" },
  { value: "windows_doors", label: "Windows / Doors" },
  { value: "electrical", label: "Electrical Systems" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "fence_yard", label: "Fence / Yard / Landscaping" },
  { value: "multiple", label: "Multiple Areas" },
];

// Styled select component
function Select({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: palette.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${palette.border}`,
          background: disabled ? palette.bg : palette.surfaceAlt, color: disabled ? palette.textDim : palette.text,
          fontSize: 14, fontFamily: font, outline: "none", boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "pointer", appearance: "auto",
        }}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((o) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================
// New Claim View
// ============================================================
function NewClaimView({ onSubmit, initialType }) {
  const isMobile = useIsMobile();
  const [type, setType] = useState(initialType || "auto");
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Vehicle fields
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vYear, setVYear] = useState("");
  const [vMileage, setVMileage] = useState("");

  // Property fields
  const [pType, setPType] = useState("");
  const [pCause, setPCause] = useState("");
  const [pArea, setPArea] = useState("");
  const [pSqft, setPSqft] = useState("");
  const [pYearBuilt, setPYearBuilt] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [addrSuggestions, setAddrSuggestions] = useState([]);
  const [addrShowDropdown, setAddrShowDropdown] = useState(false);
  const addrTimerRef = useRef(null);

  // Format Nominatim address into USPS style: "123 Main St, Los Angeles, CA 90034"
  const formatUSPS = (addr) => {
    const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
    const city = addr.city || addr.town || addr.village || addr.hamlet || "";
    const stateObj = US_STATES.find(s => s.label.toLowerCase() === (addr.state || "").toLowerCase());
    const stateCode = stateObj?.value || addr.state || "";
    const zip = addr.postcode || "";
    return [street, city, stateCode && zip ? `${stateCode} ${zip}` : stateCode || zip].filter(Boolean).join(", ");
  };

  // Debounced address autocomplete via Nominatim
  const handleAddrInput = (val) => {
    setPAddress(val);
    if (addrTimerRef.current) clearTimeout(addrTimerRef.current);
    if (val.length < 3) { setAddrSuggestions([]); setAddrShowDropdown(false); return; }
    addrTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=5&countrycodes=us`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        const items = data.map(d => ({
          display: formatUSPS(d.address),
          address: d.address,
        })).filter(d => d.display.length > 3);
        setAddrSuggestions(items);
        setAddrShowDropdown(items.length > 0);
      } catch { setAddrSuggestions([]); setAddrShowDropdown(false); }
    }, 400);
  };

  const selectAddrSuggestion = (item) => {
    setPAddress(item.display);
    setAddrShowDropdown(false);
    setAddrSuggestions([]);
    // Auto-select state
    const stateMatch = US_STATES.find(s => s.label.toLowerCase() === (item.address.state || "").toLowerCase());
    if (stateMatch) setClaimState(stateMatch.value);
  };

  // Shared fields
  const [claimState, setClaimState] = useState("");

  // Reset dependent fields on type change
  const handleTypeChange = (newType) => {
    setType(newType);
    setVMake(""); setVModel(""); setVYear(""); setVMileage("");
    setPType(""); setPCause(""); setPArea(""); setPSqft(""); setPYearBuilt(""); setPAddress("");
    setClaimState("");
  };

  // Cascading vehicle logic
  const makes = Object.keys(VEHICLE_DB).sort();
  const models = vMake ? Object.keys(VEHICLE_DB[vMake]).sort() : [];
  const yearRange = (vMake && vModel && VEHICLE_DB[vMake]?.[vModel]) ? VEHICLE_DB[vMake][vModel] : null;
  const years = yearRange ? Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => (yearRange[1] - i).toString()) : [];

  // Reset model when make changes
  const handleMakeChange = (val) => { setVMake(val); setVModel(""); setVYear(""); };
  const handleModelChange = (val) => { setVModel(val); setVYear(""); };

  const extractVideoFrames = (file, maxFrames = 8) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "auto";
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / (maxFrames + 1);
        const frames = [];
        let idx = 0;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const captureFrame = () => {
          if (idx >= maxFrames) {
            URL.revokeObjectURL(url);
            resolve(frames);
            return;
          }
          const time = interval * (idx + 1);
          video.currentTime = Math.min(time, duration - 0.1);
        };

        video.onseeked = () => {
          canvas.width = Math.min(video.videoWidth, 1280);
          canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          frames.push({
            name: `${file.name}_frame${idx + 1}.jpg`,
            data: dataUrl,
            size: Math.round(dataUrl.length * 0.75),
            caption: `Video frame ${idx + 1}/${maxFrames} (${Math.round(video.currentTime)}s)`,
          });
          idx++;
          captureFrame();
        };

        captureFrame();
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
    });
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    setError("");

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        // Extract frames from video
        const currentCount = photos.length;
        const maxFrames = Math.min(8, 10 - currentCount);
        if (maxFrames <= 0) { setError("Maximum 10 photos per claim"); return; }
        setError("");
        const frames = await extractVideoFrames(file, maxFrames);
        if (frames.length === 0) { setError("Could not extract frames from video. Try a different format."); return; }
        setPhotos((prev) => {
          const total = [...prev, ...frames];
          return total.slice(0, 10);
        });
      } else {
        // Regular image
        if (photos.length >= 10) { setError("Maximum 10 photos per claim"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPhotos((prev) => {
            if (prev.length >= 10) return prev;
            return [...prev, { name: file.name, data: ev.target.result, size: file.size, caption: "" }];
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCaption = (idx, caption) => {
    setPhotos((prev) => prev.map((p, i) => i === idx ? { ...p, caption } : p));
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) return setError("Upload at least one photo");
    if (type === "auto" && (!vMake || !vModel || !vYear)) return setError("Please select vehicle make, model, and year");
    if (type === "property" && (!pType || !pCause || !pArea)) return setError("Please select property type, damage cause, and area affected");
    if (!claimState) return setError("Please select a state");
    setAnalyzing(true);
    setProgress(0);
    setError("");

    // Simulate progress (slower for 3 parallel runs)
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 85));
    }, 600);

    try {
      // Fetch live pricing (or use cache/fallback)
      const pricingOptions = type === "auto"
        ? { make: vMake, model: vModel, stateCode: claimState }
        : { area: pArea, cause: pCause, stateCode: claimState };
      const freshData = await fetchFreshPricing(type, pricingOptions);
      const mergedPricing = mergePricing(freshData, type, pricingOptions);

      // --- Gemini pre-lookup: model-specific OEM prices ---
      let modelPricingContext = "";
      if (type === "auto" && vMake && vModel && vYear) {
        try {
          const priceLookupRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `For a ${vYear} ${vMake} ${vModel}, provide realistic OEM and aftermarket parts prices in USD. Return ONLY a JSON object, no markdown:
{
  "front_bumper": { "oem": [low, high], "aftermarket": [low, high] },
  "rear_bumper": { "oem": [low, high], "aftermarket": [low, high] },
  "hood": { "oem": [low, high], "aftermarket": [low, high] },
  "fender": { "oem": [low, high], "aftermarket": [low, high] },
  "door": { "oem": [low, high], "aftermarket": [low, high] },
  "headlight": { "oem": [low, high], "aftermarket": [low, high] },
  "taillight": { "oem": [low, high], "aftermarket": [low, high] },
  "mirror": { "oem": [low, high], "aftermarket": [low, high] },
  "windshield": { "oem": [low, high], "aftermarket": [low, high] },
  "grille": { "oem": [low, high], "aftermarket": [low, high] },
  "quarter_panel": { "oem": [low, high], "aftermarket": [low, high] },
  "trunk_tailgate": { "oem": [low, high], "aftermarket": [low, high] },
  "seat_front": { "oem": [low, high], "aftermarket": [low, high] },
  "dashboard": { "oem": [low, high], "aftermarket": [low, high] },
  "steering_wheel": { "oem": [low, high], "aftermarket": [low, high] },
  "radiator": { "oem": [low, high], "aftermarket": [low, high] },
  "ac_condenser": { "oem": [low, high], "aftermarket": [low, high] }
}
Use real market data. OEM = genuine manufacturer parts. Aftermarket = third-party compatible parts. If aftermarket not available, use null.` }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
              }),
            }
          );
          if (priceLookupRes.ok) {
            const priceLookupData = await priceLookupRes.json();
            const priceText = priceLookupData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const cleanJson = priceText.replace(/```json\n?|```\n?/g, "").trim();
            try {
              const prices = JSON.parse(cleanJson);
              modelPricingContext = `\nMODEL-SPECIFIC OEM/AFTERMARKET PRICES for ${vYear} ${vMake} ${vModel} (use these as primary price reference):\n${JSON.stringify(prices, null, 2)}\n`;
            } catch { /* ignore parse errors, fall back to generic pricing */ }
          }
        } catch { /* network error, fall back to generic pricing */ }
      }

      const vehicleContext = type === "auto" && vMake ? `Vehicle: ${vYear} ${vMake} ${vModel}${vMileage ? `, ${parseInt(vMileage).toLocaleString()} miles` : ""}` : "";
      const propertyContext = type === "property" ? `Property: ${PROPERTY_TYPES.find(p=>p.value===pType)?.label || pType}${pCause ? `, Cause: ${DAMAGE_CAUSES.find(c=>c.value===pCause)?.label || pCause}` : ""}${pArea ? `, Area: ${AREAS_AFFECTED.find(a=>a.value===pArea)?.label || pArea}` : ""}${pSqft ? `, ~${pSqft} sq ft` : ""}${pYearBuilt ? `, Built: ${pYearBuilt}` : ""}` : "";
      const objectContext = vehicleContext || propertyContext;

      const systemPrompt = `You are ClaimPilot AI, a professional insurance damage assessment assistant.
Analyze the provided photos of ${type === "auto" ? "vehicle" : "property"} damage and generate a structured assessment.

PHOTO ANALYSIS RULES — FOLLOW STRICTLY:

GLASS & WINDOWS — analyze each glass panel individually:
- INTACT glass: surface is smooth and continuous, may have water droplets, rain, dust, or reflections. Water creates round/streaky patterns that follow gravity. Reflections show surrounding environment. These are NOT damage.
- CRACKED glass: has sharp linear fracture lines radiating from an impact point (spider web pattern), or long single cracks. Fracture lines are THIN, SHARP, and ANGULAR — they do NOT follow gravity like water.
- SHATTERED glass: has dense network of fracture lines, opaque/frosted appearance, or pieces visibly separated/missing. The glass loses transparency.
- MISSING glass: the opening is empty or covered with plastic/tape.
- A window that is rolled down or partially open is NOT damaged.
- Report each glass panel separately: windshield, rear window, left front window, left rear window, right front window, right rear window.

BODY PANELS & PARTS:
- Look for: dents (changes in surface curvature), scratches (paint removed), creases (sharp bends), tears (metal split open), missing parts (not present at all).
- Distinguish actual deformation from: dirt, mud, shadows, lighting angles, wet surfaces.
- If a part is MISSING (bumper gone, light assembly gone, trim piece gone), describe it as "missing" with severity "severe".
- If a part appears intact but dirty/wet, it is NOT damaged.

CROSS-PHOTO ANALYSIS:
- Scan ALL provided photos. A part may be visible as damaged or missing in one photo but not another.
- If a part is NOT VISIBLE in any photo, do NOT include it.
- Pay special attention to: tail lights, headlights, trim pieces, mirrors, antennas — these small parts are easy to miss.
${type === "auto" ? `
MANDATORY INSPECTION CHECKLIST — you MUST check EVERY zone below and report damage if found:
EXTERIOR: front bumper, rear bumper, hood, trunk/tailgate, roof, left front fender, right front fender, left rear quarter panel, right rear quarter panel, left front door, left rear door, right front door, right rear door.
GLASS: windshield, rear window, left front window, left rear window, right front window, right rear window, sunroof (if visible).
LIGHTS: left headlight, right headlight, left taillight, right taillight, fog lights (if visible).
SMALL PARTS: left mirror, right mirror, grille, front license plate area, rear license plate area, antenna, door handles, trim pieces.
WHEELS: left front wheel/tire, right front wheel/tire, left rear wheel/tire, right rear wheel/tire.
INTERIOR (if visible): dashboard, steering wheel, driver seat, passenger seat, rear seats, headliner, center console, door panels, airbags (deployed or not).
ENGINE (if visible): engine compartment, visible mechanical damage.
For each zone: if damaged → add to damages array. If intact/not visible → skip. Do NOT guess.` : ""}
${type === "property" ? `
MANDATORY INSPECTION CHECKLIST — you MUST check EVERY zone below:
ROOF: shingles/tiles, flashing, gutters, soffit, fascia, roof decking.
EXTERIOR WALLS: siding, stucco, brick, paint, trim, weatherproofing.
WINDOWS & DOORS: all visible windows (glass + frames), entry doors, sliding doors, garage door.
INTERIOR (if visible): drywall/plaster (ceiling + walls separately), flooring (by type: hardwood, tile, carpet, laminate), baseboards, crown molding, paint.
WET AREAS (if visible): bathroom tile, tub/shower surround, vanity/cabinets, plumbing fixtures (toilet, sink, faucet), ventilation fan.
KITCHEN (if visible): cabinets (upper + lower), countertops, appliances, sink/faucet, flooring.
SYSTEMS (if visible): electrical (outlets, switches, light fixtures, wiring), plumbing (pipes, water heater), HVAC (units, ductwork).
STRUCTURAL (if visible): foundation, framing, load-bearing walls, insulation.
For each zone: if damaged → add to damages array. If intact/not visible → skip. Do NOT guess.

PROFESSIONAL ESTIMATING FORMAT (Xactimate-style):
For EACH damaged component, you must provide:
- "room": which room/area (e.g. "Master Bathroom", "Kitchen", "Living Room", "Roof")
- "surface": which surface (e.g. "ceiling", "wall", "floor", or "fixture" / "system" / "structure")
- "quantity": estimated affected area or count
- "unit": measurement unit — "SF" (sq ft), "LF" (linear ft), "SY" (sq yard), or "EA" (each)
- "unit_cost_low" / "unit_cost_high": cost per unit (materials + labor)
These fields enable professional-grade line-item estimates similar to Xactimate reports.

COST CALCULATION GUIDANCE (typical ranges per unit):
- Drywall (install + tape + texture): $2.50–$4.00 per SF
- Paint (seal + prime + 2 coats): $1.20–$2.00 per SF
- Laminate flooring (install): $8.00–$12.00 per SF
- Tile flooring (install + mortar): $12.00–$18.00 per SF
- Insulation (batt R-11 to R-30): $0.75–$2.00 per SF
- Baseboard/trim: $3.50–$5.00 per LF
- Vanity with top: $400–$600 per LF
- Interior door (detach/reset): $25–$50 per EA
- Plumbing fixtures: toilet $250–$400 EA, sink $150–$300 EA, tub $800–$1,500 EA
- Light fixture: $80–$150 EA
- Overhead & Profit: typically 10% overhead + 10% profit on subtotal
- Material sales tax: varies by state (6%–10.25%)` : ""}
${type === "auto" && vMake ? `
VEHICLE DETAILS: ${vYear} ${vMake} ${vModel}${vMileage ? ` with ${parseInt(vMileage).toLocaleString()} miles` : ""}.
Use this information to provide accurate, model-specific repair cost estimates. Consider the vehicle's market value when assessing repair vs. replace recommendations. Factor in OEM vs aftermarket parts pricing for this specific vehicle.${modelPricingContext}` : ""}
${type === "property" ? `
PROPERTY DETAILS: ${PROPERTY_TYPES.find(p=>p.value===pType)?.label || "Unknown type"}${pCause ? `. Damage cause: ${DAMAGE_CAUSES.find(c=>c.value===pCause)?.label || pCause}` : ""}${pArea ? `. Primary area affected: ${AREAS_AFFECTED.find(a=>a.value===pArea)?.label || pArea}` : ""}${pSqft ? `. Approximate size: ${pSqft} sq ft` : ""}${pYearBuilt ? `. Year built: ${pYearBuilt}` : ""}.
Use this information to provide accurate repair estimates considering the property type, construction materials typical for this era, and the specific cause of damage.` : ""}
${(() => {
  if (type === "auto" && vMake && claimState) {
    return buildPricingContext("auto", { make: vMake, model: vModel, stateCode: claimState, freshPricing: mergedPricing });
  }
  if (type === "property" && claimState) {
    return buildPricingContext("property", { area: pArea, cause: pCause, stateCode: claimState, freshPricing: mergedPricing });
  }
  return "";
})()}

Respond ONLY with a valid JSON object (no markdown, no backticks):
${type === "property" ? `{
  "summary": "Brief 2-3 sentence overview of damage",
  "damage_type": "property",
  "severity": "minor|moderate|severe|total_loss",
  "confidence": 0.0-1.0,
  "damages": [
    {
      "component": "Specific work item (e.g. '1/2 inch drywall - hung, taped, textured')",
      "room": "Room or area name (e.g. 'Master Bathroom', 'Kitchen')",
      "surface": "ceiling|wall|floor|fixture|system|structure|exterior",
      "description": "What happened — describe SPECIFIC visual evidence",
      "severity": "minor|moderate|severe",
      "quantity": number,
      "unit": "SF|LF|SY|EA",
      "unit_cost_low": number,
      "unit_cost_high": number,
      "cost_breakdown": {
        "materials_standard": number,
        "materials_premium": number,
        "labor_hours_low": number,
        "labor_hours_high": number,
        "labor_rate": number,
        "notes": "Short explanation (e.g. 'Includes demo, disposal, and texture match')"
      },
      "estimated_cost_low": "MUST equal: (quantity × unit_cost_low) using materials_standard + (labor_hours_low × labor_rate)",
      "estimated_cost_high": "MUST equal: (quantity × unit_cost_high) using materials_premium + (labor_hours_high × labor_rate)"
    }
  ],
  "potential_damages": [
    {
      "component": "Name of part likely damaged but NOT visible in photos",
      "room": "Room or area name",
      "reason": "Why you believe this is likely damaged",
      "estimated_cost_low": number,
      "estimated_cost_high": number
    }
  ],
  "cost_summary": {
    "line_items_subtotal_low": number,
    "line_items_subtotal_high": number,
    "overhead_pct": 10,
    "profit_pct": 10,
    "tax_pct": number
  },
  "total_estimate_low": number,
  "total_estimate_high": number,
  "recommendations": ["3-5 actionable next steps, no duplicates"],
  "flags": ["3-5 distinct red flags or concerns"],
  "repair_vs_replace": "repair|replace|needs_inspection"
}

Note: total_estimate should include overhead (10%) + profit (10%) on top of line items subtotal. Tax applies to materials portion only.
Each damage item should be a specific LINE ITEM (like Xactimate), not a vague area. For example: instead of "bathroom damage", list separate items: "drywall ceiling repair", "tile floor replacement", "vanity replacement", etc.` : `{
  "summary": "Brief 2-3 sentence overview of damage",
  "damage_type": "${type}",
  "severity": "minor|moderate|severe|total_loss",
  "confidence": 0.0-1.0,
  "damages": [
    {
      "component": "Name of damaged part/area",
      "description": "What happened to it — describe SPECIFIC visual evidence",
      "severity": "minor|moderate|severe",
      "cost_breakdown": {
        "parts_oem": number_or_null,
        "parts_aftermarket": number_or_null,
        "labor_hours_low": number,
        "labor_hours_high": number,
        "labor_rate": number,
        "paint_materials": number_or_null,
        "notes": "Short explanation (e.g. 'Blend adjacent fender required', 'R&I trim pieces included')"
      },
      "estimated_cost_low": "MUST equal: parts_aftermarket + (labor_hours_low × labor_rate) + paint_materials",
      "estimated_cost_high": "MUST equal: parts_oem + (labor_hours_high × labor_rate) + paint_materials"
    }
  ],
  "potential_damages": [
    {
      "component": "Name of part likely damaged but NOT visible in photos",
      "reason": "Why you believe this part is likely damaged (e.g. 'fire damage to adjacent areas suggests...')",
      "estimated_cost_low": number,
      "estimated_cost_high": number
    }
  ],
  "total_estimate_low": number,
  "total_estimate_high": number,
  "recommendations": ["3-5 actionable next steps, no duplicates"],
  "flags": ["3-5 distinct red flags or concerns"],
  "repair_vs_replace": "repair|replace|needs_inspection"
}`}

ACCURACY RULES:
1. "damages" array: ONLY damage confirmed by visual evidence in the photos. For each item, describe the SPECIFIC visual evidence you see (e.g. "dent visible on lower section" not just "damaged").
2. "potential_damages" array: Parts you CANNOT see in photos but believe are likely damaged based on the vehicle model, damage pattern, or adjacent damage. For example: if there's fire damage in the cabin, the sunroof (which this model has) is likely affected too — put it here, NOT in "damages".
3. If you cannot confirm whether something is damage or environmental (water/dirt/shadow), add it to "flags" as "unconfirmed: [description]".
4. Be precise about location: specify left/right, front/rear, upper/lower based on what photos show.
5. Use the PRICING REFERENCE DATA above as your baseline for cost estimates.
6. total_estimate_low and total_estimate_high should ONLY include "damages" (visually confirmed). Do NOT add potential_damages to the totals.
7. Keep recommendations to 3-5 items. Keep flags to 3-5 items.
8. "cost_breakdown" is REQUIRED for EACH damage item. For auto: provide parts_oem (OEM price), parts_aftermarket (aftermarket/used price), labor_hours_low/high, labor_rate ($/hr for region), paint_materials (ONLY for exterior body panels that require painting — bumpers, fenders, doors, hood, trunk, quarter panels, rocker panels, roof. Set to null for everything else: headlights, taillights, fog lights, mirrors, grille, glass, windshield, wheels, tires, interior parts (dashboard, seats, steering wheel, headliner, console, airbags), wiring, mechanical parts — these are all replaced, never painted). For property: provide materials_standard (builder grade), materials_premium (higher grade), labor_hours_low/high, labor_rate. Always include "notes" explaining what drives the range.
9. CRITICAL MATH RULE: estimated_cost_low and estimated_cost_high MUST be calculated FROM cost_breakdown, NOT independently. For auto: low = parts_aftermarket + (labor_hours_low × labor_rate) + paint_materials (if applicable, else 0); high = parts_oem + (labor_hours_high × labor_rate) + paint_materials (if applicable, else 0). For property: low = materials_standard + (labor_hours_low × labor_rate); high = materials_premium + (labor_hours_high × labor_rate). Double-check arithmetic before returning.`;

      const userPrompt = `Assess the damage in these ${photos.length} photo(s).${objectContext ? `\n\n${objectContext}` : ""}${description ? `\n\nAdditional context from the claimant: "${description}"` : ""}${location ? `\nLocation: ${location}` : ""}`;

      // --- Gemini API (Nano Banana 2) — 3 parallel runs + merge ---
      const geminiParts = [];
      photos.forEach((p) => {
        const mimeType = p.data.startsWith("data:image/png") ? "image/png" : "image/jpeg";
        geminiParts.push({
          inline_data: { mime_type: mimeType, data: p.data.split(",")[1] },
        });
        if (p.caption) geminiParts.push({ text: `[Photo note: ${p.caption}]` });
      });
      geminiParts.push({ text: systemPrompt + "\n\n" + userPrompt });

      const geminiRequestBody = JSON.stringify({
        contents: [{ parts: geminiParts }],
        generationConfig: { temperature: 0 },
      });

      const NUM_RUNS = 3;
      console.log(`Starting ${NUM_RUNS} parallel Gemini requests...`);

      const geminiPromises = Array.from({ length: NUM_RUNS }, (_, i) =>
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiRequestBody }
        )
          .then(r => r.json())
          .then(data => {
            console.log(`Run ${i + 1} status: OK`);
            if (data.error) throw new Error(data.error.message);
            const txt = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
            const clean = txt.replace(/```json|```/g, "").trim();
            return JSON.parse(clean);
          })
          .catch(err => { console.error(`Run ${i + 1} failed:`, err.message); return null; })
      );

      const results = await Promise.all(geminiPromises);
      clearInterval(progressInterval);
      const validResults = results.filter(Boolean);
      console.log(`Valid results: ${validResults.length}/${NUM_RUNS}`);

      if (validResults.length === 0) throw new Error("All Gemini requests failed");

      // --- Merge multiple assessments ---
      const mergeAssessments = (assessments) => {
        if (assessments.length === 1) return assessments[0];

        // Normalize component name: sort words alphabetically so "front left window" == "left front window"
        const normalizeComponent = (name) => {
          const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).sort();
          return words.join("_");
        };

        // Check if two normalized keys are similar enough to merge
        const isSimilar = (a, b) => {
          if (a === b) return true;
          // One contains the other
          if (a.includes(b) || b.includes(a)) return true;
          // Share 70%+ of words
          const aw = a.split("_"), bw = b.split("_");
          const shared = aw.filter(w => bw.includes(w)).length;
          return shared / Math.max(aw.length, bw.length) >= 0.7;
        };

        // Collect all damages by normalized component name
        const damageMap = {};
        const keyMapping = {}; // maps normalized keys to canonical key

        assessments.forEach((a, runIdx) => {
          (a.damages || []).forEach(d => {
            const norm = normalizeComponent(d.component);
            // Find existing similar key
            let canonKey = null;
            for (const existing of Object.keys(damageMap)) {
              if (isSimilar(norm, existing)) { canonKey = existing; break; }
            }
            if (!canonKey) canonKey = norm;
            if (!damageMap[canonKey]) damageMap[canonKey] = { component: d.component, entries: [] };
            damageMap[canonKey].entries.push({ ...d, runIdx });
          });
        });

        // Keep components found in 2+ runs (consensus), or all if only 1 run
        const minVotes = assessments.length >= 3 ? 2 : 1;
        const mergedDamages = [];
        for (const [key, info] of Object.entries(damageMap)) {
          const uniqueRuns = new Set(info.entries.map(e => e.runIdx)).size;
          if (uniqueRuns >= minVotes) {
            const entries = info.entries;
            const avgLow = Math.round(entries.reduce((s, e) => s + (e.estimated_cost_low || 0), 0) / entries.length);
            const avgHigh = Math.round(entries.reduce((s, e) => s + (e.estimated_cost_high || 0), 0) / entries.length);
            // Pick most common severity
            const sevCounts = {};
            entries.forEach(e => { sevCounts[e.severity] = (sevCounts[e.severity] || 0) + 1; });
            const topSev = Object.entries(sevCounts).sort((a, b) => b[1] - a[1])[0][0];
            // Use longest description; pick best entry for extra fields
            const bestEntry = entries.sort((a, b) => (b.description || "").length - (a.description || "").length)[0];
            const merged = {
              component: info.component,
              description: bestEntry.description,
              severity: topSev,
              estimated_cost_low: avgLow,
              estimated_cost_high: avgHigh,
            };
            // Carry over cost_breakdown and property fields from best entry
            if (bestEntry.cost_breakdown) merged.cost_breakdown = bestEntry.cost_breakdown;
            if (bestEntry.room) merged.room = bestEntry.room;
            if (bestEntry.surface) merged.surface = bestEntry.surface;
            if (bestEntry.quantity) { merged.quantity = bestEntry.quantity; merged.unit = bestEntry.unit; merged.unit_cost_low = bestEntry.unit_cost_low; merged.unit_cost_high = bestEntry.unit_cost_high; }
            mergedDamages.push(merged);
          }
        }

        const totalLow = mergedDamages.reduce((s, d) => s + d.estimated_cost_low, 0);
        const totalHigh = mergedDamages.reduce((s, d) => s + d.estimated_cost_high, 0);

        // Pick most common severity/repair_vs_replace
        const pickMostCommon = (arr, field) => {
          const counts = {};
          arr.forEach(a => { const v = a[field]; if (v) counts[v] = (counts[v] || 0) + 1; });
          return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || arr[0]?.[field];
        };

        // Fuzzy-deduplicate recommendations & flags
        const fuzzyDedup = (items) => {
          const result = [];
          const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).sort().join(" ");
          const similarity = (a, b) => {
            const aw = a.split(" "), bw = b.split(" ");
            const shared = aw.filter(w => bw.includes(w)).length;
            return shared / Math.max(aw.length, bw.length);
          };
          for (const item of items) {
            const norm = normalize(item);
            const isDup = result.some(r => {
              const rn = normalize(r);
              return rn === norm || similarity(rn, norm) >= 0.5;
            });
            if (!isDup) result.push(item);
          }
          return result;
        };
        const allRecs = fuzzyDedup(assessments.flatMap(a => a.recommendations || [])).slice(0, 5);
        const allFlags = fuzzyDedup(assessments.flatMap(a => a.flags || [])).slice(0, 5);

        // Average confidence
        const avgConf = assessments.reduce((s, a) => s + (a.confidence || 0), 0) / assessments.length;

        // Merge potential_damages (deduplicate by component name)
        const potentialMap = {};
        assessments.forEach(a => {
          (a.potential_damages || []).forEach(pd => {
            const key = normalizeComponent(pd.component);
            if (!potentialMap[key]) potentialMap[key] = { ...pd, count: 1 };
            else {
              potentialMap[key].count++;
              potentialMap[key].estimated_cost_low = Math.round((potentialMap[key].estimated_cost_low + (pd.estimated_cost_low || 0)) / 2);
              potentialMap[key].estimated_cost_high = Math.round((potentialMap[key].estimated_cost_high + (pd.estimated_cost_high || 0)) / 2);
              if ((pd.reason || "").length > (potentialMap[key].reason || "").length) potentialMap[key].reason = pd.reason;
            }
          });
        });
        const potentialDamages = Object.values(potentialMap).map(({ count, ...rest }) => rest);
        const potentialTotalLow = potentialDamages.reduce((s, d) => s + (d.estimated_cost_low || 0), 0);
        const potentialTotalHigh = potentialDamages.reduce((s, d) => s + (d.estimated_cost_high || 0), 0);

        return {
          summary: assessments.sort((a, b) => (b.summary || "").length - (a.summary || "").length)[0].summary,
          damage_type: assessments[0].damage_type,
          severity: pickMostCommon(assessments, "severity"),
          confidence: Math.round(avgConf * 100) / 100,
          damages: mergedDamages,
          total_estimate_low: totalLow,
          total_estimate_high: totalHigh,
          potential_damages: potentialDamages,
          potential_total_low: potentialTotalLow,
          potential_total_high: potentialTotalHigh,
          recommendations: allRecs,
          flags: allFlags,
          repair_vs_replace: pickMostCommon(assessments, "repair_vs_replace"),
          _runs: assessments.length,
          _consensus: `${mergedDamages.length} components confirmed by ${minVotes}+ of ${assessments.length} runs`,
        };
      };

      const assessment = mergeAssessments(validResults);
      console.log(`Merged assessment: ${assessment.damages.length} damages, ${assessment._consensus}`);
      console.log("Merged components:", assessment.damages.map(d => d.component).join(", "));

      const validation = validateEstimates(
        assessment,
        type,
        type === "auto"
          ? { make: vMake, model: vModel, stateCode: claimState }
          : { area: pArea, cause: pCause, stateCode: claimState }
      );

      setProgress(100);

      const claim = {
        id: Date.now().toString(),
        type,
        photos: photos.map((p) => ({ name: p.name, data: p.data, caption: p.caption || "" })),
        description,
        location,
        date,
        state: claimState,
        pricingSource: mergedPricing?.source || "reference",
        assessment,
        validation,
        vehicle: type === "auto" ? { make: vMake, model: vModel, year: vYear, mileage: vMileage } : null,
        property: type === "property" ? { type: pType, cause: pCause, area: pArea, sqft: pSqft, yearBuilt: pYearBuilt, address: pAddress } : null,
        createdAt: new Date().toISOString(),
      };

      console.log("Claim built, calling onSubmit...");
      setTimeout(() => {
        setAnalyzing(false);
        onSubmit(claim);
        console.log("onSubmit called successfully");
      }, 600);
    } catch (err) {
      console.error("Analysis error:", err);
      clearInterval(progressInterval);
      setAnalyzing(false);
      setError(`Analysis failed: ${err.message}. Please try again.`);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 43, height: 43, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          background: type === "auto" ? `${palette.accent}15` : "#8B5CF615",
          color: type === "auto" ? palette.accent : "#8B5CF6",
          fontSize: 0,
        }}>
          <span style={{ transform: "scale(1.38)", display: "inline-flex" }}>
            {type === "auto" ? <Icons.Car /> : <Icons.Home />}
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: isMobile ? 15 : 17.5, fontWeight: 700, margin: 0, letterSpacing: "0.04em", lineHeight: 1.3 }}>
            {type === "auto" ? "Vehicle Damage" : "Property Damage"} Assessment
          </h2>
          <p style={{ color: palette.textDim, fontSize: 9.1, margin: 0, lineHeight: 1.3 }}>
            Upload photos and our AI will estimate repair costs.
          </p>
        </div>
      </div>

      {/* Vehicle Detail Fields */}
      {type === "auto" && (
        <div style={{
          padding: 16, borderRadius: 12, border: `1px solid ${palette.border}`,
          background: palette.surface, marginBottom: 20,
        }}>
          <div style={{
            fontSize: 14.3, fontWeight: 600, color: palette.white, marginBottom: 16, paddingBottom: 12,
            textAlign: "center", textTransform: "uppercase", letterSpacing: "0.12em",
            borderBottom: `1px solid ${palette.border}`,
          }}>
            Vehicle Information
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Select label="Make *" value={vMake} onChange={handleMakeChange} options={makes} placeholder="Select make..." />
            <Select label="Model *" value={vModel} onChange={handleModelChange} options={models} placeholder={vMake ? "Select model..." : "Select make first"} disabled={!vMake} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <Select label="Year *" value={vYear} onChange={setVYear} options={years} placeholder={vModel ? "Select year..." : "Select model first"} disabled={!vModel} />
            <Input label="Mileage (optional)" value={vMileage} onChange={setVMileage} placeholder="e.g. 85000" type="number" />
            <Select label="State *" value={claimState} onChange={setClaimState} options={US_STATES} placeholder="Select state..." />
          </div>
          {vMake && vModel && vYear && (
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: palette.accentSoft, fontSize: 12, color: palette.accent, fontWeight: 500 }}>
              {vYear} {vMake} {vModel}{vMileage ? ` · ${parseInt(vMileage).toLocaleString()} miles` : ""}
            </div>
          )}
        </div>
      )}

      {/* Property Detail Fields */}
      {type === "property" && (
        <div style={{
          padding: 16, borderRadius: 12, border: `1px solid ${palette.border}`,
          background: palette.surface, marginBottom: 20,
        }}>
          <div style={{
            fontSize: 14.3, fontWeight: 600, color: palette.white, marginBottom: 16, paddingBottom: 12,
            textAlign: "center", textTransform: "uppercase", letterSpacing: "0.12em",
            borderBottom: `1px solid ${palette.border}`,
          }}>
            Property Information
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: palette.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Property Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text" value={pAddress} onChange={(e) => handleAddrInput(e.target.value)} placeholder="Start typing address..."
                  autoComplete="off"
                  style={{
                    width: "100%", padding: "10px 42px 10px 14px", borderRadius: 8, border: `1px solid ${palette.border}`,
                    background: palette.surfaceAlt, color: palette.text, fontSize: 14, fontFamily: font,
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = palette.accent; if (addrSuggestions.length > 0) setAddrShowDropdown(true); }}
                  onBlur={(e) => { e.target.style.borderColor = palette.border; setTimeout(() => setAddrShowDropdown(false), 200); }}
                />
                {/* Address autocomplete dropdown */}
                {addrShowDropdown && addrSuggestions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 42, zIndex: 50,
                    background: palette.surface, border: `1px solid ${palette.border}`,
                    borderRadius: "0 0 8px 8px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    maxHeight: 200, overflowY: "auto",
                  }}>
                    {addrSuggestions.map((item, idx) => (
                      <div key={idx}
                        onMouseDown={(e) => { e.preventDefault(); selectAddrSuggestion(item); }}
                        style={{
                          padding: "10px 14px", fontSize: 13, color: palette.text, cursor: "pointer",
                          borderBottom: idx < addrSuggestions.length - 1 ? `1px solid ${palette.border}` : "none",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = palette.surfaceAlt}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ marginRight: 6, color: palette.accent }}>📍</span>
                        {item.display}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  title="Detect my location"
                  onClick={async () => {
                    if (!navigator.geolocation) return setPAddress("Geolocation not supported");
                    setGeoLoading(true);
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const { latitude, longitude } = pos.coords;
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, {
                            headers: { "Accept-Language": "en" },
                          });
                          const data = await res.json();
                          if (data.address) {
                            const a = data.address;
                            const parts = [a.house_number, a.road, a.city || a.town || a.village, a.state].filter(Boolean);
                            setPAddress(parts.join(", "));
                            // Auto-select state
                            const stateMatch = US_STATES.find(s => s.label.toLowerCase() === (a.state || "").toLowerCase());
                            if (stateMatch && !claimState) setClaimState(stateMatch.value);
                          } else {
                            setPAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
                          }
                        } catch { setPAddress("Could not resolve address"); }
                        setGeoLoading(false);
                      },
                      () => { setPAddress("Location access denied"); setGeoLoading(false); },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  style={{
                    position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                    background: geoLoading ? palette.surfaceAlt : "transparent", border: "none",
                    cursor: geoLoading ? "wait" : "pointer", padding: 6, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!geoLoading) e.currentTarget.style.background = palette.surfaceAlt; }}
                  onMouseLeave={(e) => { if (!geoLoading) e.currentTarget.style.background = "transparent"; }}
                >
                  {geoLoading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <Select label="State *" value={claimState} onChange={setClaimState} options={US_STATES} placeholder="Select state..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Select label="Property Type *" value={pType} onChange={setPType} options={PROPERTY_TYPES} placeholder="Select type..." />
            <Select label="Damage Cause *" value={pCause} onChange={setPCause} options={DAMAGE_CAUSES} placeholder="What caused the damage?" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <Select label="Area Affected *" value={pArea} onChange={setPArea} options={AREAS_AFFECTED} placeholder="Select area..." />
            <Input label="Sq. Footage (optional)" value={pSqft} onChange={setPSqft} placeholder="e.g. 2400" type="number" />
            <Input label="Year Built (optional)" value={pYearBuilt} onChange={setPYearBuilt} placeholder="e.g. 1995" type="number" />
          </div>
        </div>
      )}

      {/* Photo Upload */}
      <div style={{
        border: `2px dashed ${palette.borderLight}`, borderRadius: 12, padding: 32,
        textAlign: "center", marginBottom: 20, cursor: "pointer",
        background: palette.surface, transition: "border-color 0.2s",
      }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = palette.accent; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = palette.borderLight; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = palette.borderLight;
          handleFiles({ target: { files: e.dataTransfer.files } });
        }}
      >
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple hidden onChange={handleFiles} />
        <div style={{ color: palette.textMuted, marginBottom: 8 }}><Icons.Upload /></div>
        <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>Drop photos or video here or click to upload</div>
        <div style={{ fontSize: 12, color: palette.textDim, marginTop: 4 }}>JPG, PNG, MP4, MOV — up to 10 photos per claim (video auto-extracts key frames)</div>
      </div>

      {/* Photo Preview Grid with Captions */}
      {photos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {photos.map((p, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "center",
              padding: 10, borderRadius: 10, background: palette.surface,
              border: `1px solid ${palette.border}`,
            }}>
              {/* Thumbnail */}
              <div style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                <img src={p.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={(e) => { e.stopPropagation(); removePhoto(i); }} style={{
                  position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: 10,
                }}>
                  <Icons.X />
                </button>
              </div>
              {/* Caption input */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: palette.textDim, marginBottom: 4 }}>Photo {i + 1}</div>
                <input
                  type="text"
                  value={p.caption || ""}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Describe this photo (e.g. 'Driver side door, won't close')"
                  style={{
                    width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${palette.border}`,
                    background: palette.surfaceAlt, color: palette.text, fontSize: 13, fontFamily: font,
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = palette.accent}
                  onBlur={(e) => e.target.style.borderColor = palette.border}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      <div style={{ marginBottom: 16 }}>
        <Input label="Date of Damage" value={date} onChange={setDate} type="date" />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: palette.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Description (optional)
        </label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened, any relevant details..."
          rows={3}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${palette.border}`,
            background: palette.surfaceAlt, color: palette.text, fontSize: 14, fontFamily: font,
            outline: "none", resize: "vertical", boxSizing: "border-box",
          }}
          onFocus={(e) => e.target.style.borderColor = palette.accent}
          onBlur={(e) => e.target.style.borderColor = palette.border}
        />
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: palette.dangerSoft,
          color: palette.danger, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icons.AlertTriangle /> {error}
        </div>
      )}

      {/* Analyze Button / Progress */}
      {analyzing ? (
        <div style={{ padding: 20, background: palette.surface, borderRadius: 14, border: `1px solid ${palette.border}`, boxShadow: palette.cardShadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Analyzing damage...</span>
            <span style={{ fontSize: 13, color: palette.accent, fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 6, background: palette.surfaceAlt, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: `linear-gradient(90deg, #1E40AF, ${palette.accent}, #6366F1)`,
              borderRadius: 3, width: `${progress}%`, transition: "width 0.4s ease",
              boxShadow: "0 0 12px rgba(74,144,255,0.5)",
            }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: palette.textDim }}>
            {progress < 15 ? "Fetching current market prices..." : progress < 35 ? "Processing images..." : progress < 65 ? "Identifying damage areas..." : progress < 90 ? "Estimating repair costs..." : "Generating report..."}
          </div>
        </div>
      ) : (
        <button onClick={handleAnalyze} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: photos.length > 0 ? `linear-gradient(135deg, #1E40AF, ${palette.accent}, #6366F1)` : palette.surfaceAlt,
          color: photos.length > 0 ? "#fff" : palette.textDim,
          fontWeight: 600, fontSize: 15, cursor: photos.length > 0 ? "pointer" : "not-allowed",
          fontFamily: font, transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: photos.length > 0 ? palette.glowStrong : "none",
          letterSpacing: "0.02em",
        }}>
          <Icons.Camera /> Analyze Damage ({photos.length} photo{photos.length !== 1 ? "s" : ""})
        </button>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: palette.textDim, marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
        Preliminary AI estimate only — not a binding assessment. Final evaluation must be conducted by a licensed adjuster.
      </p>
    </div>
  );
}

// ============================================================
// History View
// ============================================================
function HistoryView({ claims, onSelect }) {
  if (claims.length === 0) return null;

  const severityColors = {
    minor: { bg: palette.successSoft, color: palette.success },
    moderate: { bg: palette.warningSoft, color: palette.warning },
    severe: { bg: palette.dangerSoft, color: palette.danger },
    total_loss: { bg: palette.dangerSoft, color: palette.danger },
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {claims.map((c) => {
          const sev = severityColors[c.assessment?.severity] || severityColors.moderate;
          return (
            <button key={c.id} onClick={() => onSelect(c)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 12,
              border: `1px solid ${palette.border}`, background: palette.surface, cursor: "pointer",
              textAlign: "left", width: "100%", fontFamily: font, transition: "border-color 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.borderLight}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
            >
              {/* Thumbnail */}
              <div style={{
                width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                background: palette.surfaceAlt, border: `1px solid ${palette.border}`,
              }}>
                {c.photos?.[0] && <img src={c.photos[0].data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>
                    {c.type === "auto" && c.vehicle?.make ? `${c.vehicle.year} ${c.vehicle.make} ${c.vehicle.model}` : c.type === "auto" ? "Vehicle Damage" : c.property?.type ? `${PROPERTY_TYPES.find(p=>p.value===c.property.type)?.label || "Property"} Damage` : "Property Damage"}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    background: sev.bg, color: sev.color, textTransform: "uppercase",
                  }}>
                    {c.assessment?.severity?.replace("_", " ")}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: palette.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.assessment?.summary}
                </div>
                <div style={{ fontSize: 11, color: palette.textDim, marginTop: 4 }}>
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {c.location && ` · ${c.location}`}
                  {c.assessment && ` · $${c.assessment.total_estimate_low?.toLocaleString()}–$${c.assessment.total_estimate_high?.toLocaleString()}`}
                </div>
              </div>
              <div style={{ color: palette.textDim }}><Icons.Eye /></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Report View
// ============================================================
function ReportView({ claim, onBack, isPro = false }) {
  const isMobile = useIsMobile();
  const a = claim.assessment;
  if (!a) return null;

  const severityConfig = {
    minor: { bg: palette.successSoft, color: palette.success, label: "Minor" },
    moderate: { bg: palette.warningSoft, color: palette.warning, label: "Moderate" },
    severe: { bg: palette.dangerSoft, color: palette.danger, label: "Severe" },
    total_loss: { bg: palette.dangerSoft, color: palette.danger, label: "Total Loss" },
  };
  const sev = severityConfig[a.severity] || severityConfig.moderate;

  const generateTextReport = () => {
    let report = `CLAIMLENS AI — DAMAGE ASSESSMENT REPORT\n`;
    report += `${"=".repeat(50)}\n\n`;
    report += `Date: ${new Date(claim.createdAt).toLocaleString()}\n`;
    report += `Type: ${claim.type === "auto" ? "Vehicle" : "Property"} Damage\n`;
    report += `Location: ${claim.location || "Not specified"}\n`;
    report += `Severity: ${a.severity?.toUpperCase()}\n`;
    report += `Confidence: ${Math.round((a.confidence || 0) * 100)}%\n\n`;
    report += `SUMMARY\n${"-".repeat(30)}\n${a.summary}\n\n`;
    report += `ESTIMATED COST: $${a.total_estimate_low?.toLocaleString()} — $${a.total_estimate_high?.toLocaleString()}\n\n`;
    report += `DAMAGE DETAILS\n${"-".repeat(30)}\n`;
    a.damages?.forEach((d, i) => {
      report += `${i + 1}. ${d.component} (${d.severity})\n`;
      report += `   ${d.description}\n`;
      report += `   Est: $${d.estimated_cost_low?.toLocaleString()} — $${d.estimated_cost_high?.toLocaleString()}\n\n`;
    });
    if (a.recommendations?.length) {
      report += `RECOMMENDATIONS\n${"-".repeat(30)}\n`;
      a.recommendations.forEach((r, i) => { report += `${i + 1}. ${r}\n`; });
    }
    if (a.flags?.length) {
      report += `\nFLAGS / CONCERNS\n${"-".repeat(30)}\n`;
      a.flags.forEach((f, i) => { report += `${i + 1}. ${f}\n`; });
    }
    report += `\n${"=".repeat(50)}\n`;
    report += `DISCLAIMER: This is a preliminary AI-generated estimate.\nFinal assessment must be conducted by a licensed adjuster.\n`;
    return report;
  };

  const [showPreview, setShowPreview] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const downloadReport = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPreview(true);
  };

  const sevLabel = { minor: "Minor", moderate: "Moderate", severe: "Severe", total_loss: "Total Loss" };
  const sevColorMap = { minor: "#10B981", moderate: "#F59E0B", severe: "#EF4444", total_loss: "#EF4444" };

  const buildPrintHTML = () => {
    const sc = sevColorMap[a.severity] || "#F59E0B";
    const allPhotos = claim.photos || [];
    const photoImgs = allPhotos.map((p, i) =>
      `<div style="display:inline-block;text-align:center;vertical-align:top;margin-right:8px;margin-bottom:8px;">
        <img src="${p.data}" style="width:${allPhotos.length <= 4 ? 220 : allPhotos.length <= 6 ? 180 : 150}px;height:${allPhotos.length <= 4 ? 165 : allPhotos.length <= 6 ? 135 : 112}px;object-fit:cover;border-radius:4px;border:1px solid #D1D5DB;display:block;" />
        ${p.caption ? `<div style="font-size:9px;color:#6B7280;margin-top:3px;max-width:220px;line-height:1.3;">Photo ${i+1}: ${p.caption}</div>` : `<div style="font-size:9px;color:#9CA3AF;margin-top:3px;">Photo ${i+1}</div>`}
      </div>`
    ).join("");
    // Build damage rows - grouped by room for property, flat for auto
    const isPropertyWithRooms = claim.type === "property" && (a.damages || []).some(d => d.room);
    let damageRows = "";
    if (isPropertyWithRooms) {
      const rooms = {};
      (a.damages || []).forEach((d, i) => {
        const room = d.room || "General";
        if (!rooms[room]) rooms[room] = [];
        rooms[room].push({ ...d, _idx: i });
      });
      damageRows = Object.entries(rooms).map(([room, items]) => {
        const roomLow = items.reduce((s, d) => s + (d.estimated_cost_low || 0), 0);
        const roomHigh = items.reduce((s, d) => s + (d.estimated_cost_high || 0), 0);
        const rows = items.map((d, j) => {
          const dc = sevColorMap[d.severity] || "#F59E0B";
          const qtyInfo = d.quantity && d.unit ? `<div style="font-size:9px;color:#2563EB;">${d.quantity} ${d.unit} × $${d.unit_cost_low || "?"}–$${d.unit_cost_high || "?"}/${d.unit}</div>` : "";
          const cb = d.cost_breakdown;
          const breakdownInfo = cb ? `<div style="font-size:8px;color:#6B7280;margin-top:3px;line-height:1.5;">` +
            (cb.materials_standard != null ? `Std: $${cb.materials_standard?.toLocaleString()} · Premium: $${cb.materials_premium?.toLocaleString()}<br/>` : "") +
            (cb.labor_hours_low != null ? `Labor: ${cb.labor_hours_low}–${cb.labor_hours_high} hrs × $${cb.labor_rate}/hr<br/>` : "") +
            (cb.notes ? `<span style="font-style:italic;color:#9CA3AF;">${cb.notes}</span>` : "") +
            `</div>` : "";
          return `<tr>
            <td class="tc">${d.component}${d.surface ? `<div style="font-size:9px;color:#9CA3AF;text-transform:capitalize;">${d.surface}</div>` : ""}</td>
            <td class="tc"><span class="badge" style="background:${dc}18;color:${dc};">${d.severity}</span></td>
            <td class="tc">${d.description}${qtyInfo}</td>
            <td class="tc" style="text-align:right;font-weight:600;">$${(d.estimated_cost_low||0).toLocaleString()} – $${(d.estimated_cost_high||0).toLocaleString()}${breakdownInfo}</td>
          </tr>`;
        }).join("");
        return `<tr><td colspan="4" style="background:#EFF6FF;padding:8px 10px;font-weight:700;font-size:11px;color:#1E3A5F;border-bottom:2px solid #BFDBFE;">
          ${room} <span style="float:right;font-weight:600;color:#2563EB;">$${roomLow.toLocaleString()} – $${roomHigh.toLocaleString()}</span>
        </td></tr>${rows}`;
      }).join("");
    } else {
      damageRows = (a.damages || []).map((d, i) => {
        const dc = sevColorMap[d.severity] || "#F59E0B";
        const cb = d.cost_breakdown;
        const breakdownInfo = cb ? `<div style="font-size:8px;color:#6B7280;margin-top:3px;line-height:1.5;">` +
          (cb.parts_oem != null ? `OEM: $${cb.parts_oem?.toLocaleString()} · Aftermarket: $${cb.parts_aftermarket?.toLocaleString()}<br/>` : "") +
          (cb.labor_hours_low != null ? `Labor: ${cb.labor_hours_low}–${cb.labor_hours_high} hrs × $${cb.labor_rate}/hr<br/>` : "") +
          (cb.paint_materials != null ? `Paint/Materials: $${cb.paint_materials?.toLocaleString()}<br/>` : "") +
          (cb.notes ? `<span style="font-style:italic;color:#9CA3AF;">${cb.notes}</span>` : "") +
          `</div>` : "";
        return `<tr>
          <td class="tc">${i + 1}. ${d.component}</td>
          <td class="tc"><span class="badge" style="background:${dc}18;color:${dc};">${d.severity}</span></td>
          <td class="tc">${d.description}</td>
          <td class="tc" style="text-align:right;font-weight:600;">$${(d.estimated_cost_low||0).toLocaleString()} – $${(d.estimated_cost_high||0).toLocaleString()}${breakdownInfo}</td>
        </tr>`;
      }).join("");
    }
    // Cost summary section for property
    const costSummaryHTML = a.cost_summary ? `
      <div style="margin-top:14px;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;margin-bottom:6px;">Cost Summary</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;">
          <span>Line Items Subtotal</span>
          <span>$${(a.cost_summary.line_items_subtotal_low||0).toLocaleString()} – $${(a.cost_summary.line_items_subtotal_high||0).toLocaleString()}</span>
        </div>
        ${a.cost_summary.overhead_pct ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;">
          <span>Overhead (${a.cost_summary.overhead_pct}%)</span>
          <span>$${Math.round((a.cost_summary.line_items_subtotal_low||0)*a.cost_summary.overhead_pct/100).toLocaleString()} – $${Math.round((a.cost_summary.line_items_subtotal_high||0)*a.cost_summary.overhead_pct/100).toLocaleString()}</span>
        </div>` : ""}
        ${a.cost_summary.profit_pct ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;">
          <span>Profit (${a.cost_summary.profit_pct}%)</span>
          <span>$${Math.round((a.cost_summary.line_items_subtotal_low||0)*a.cost_summary.profit_pct/100).toLocaleString()} – $${Math.round((a.cost_summary.line_items_subtotal_high||0)*a.cost_summary.profit_pct/100).toLocaleString()}</span>
        </div>` : ""}
        ${a.cost_summary.tax_pct ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;">
          <span>Material Sales Tax (~${a.cost_summary.tax_pct}%)</span>
          <span>included</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#0F172A;border-top:2px solid #CBD5E1;padding-top:6px;margin-top:4px;">
          <span>Total Estimate (RCV)</span>
          <span>$${(a.total_estimate_low||0).toLocaleString()} – $${(a.total_estimate_high||0).toLocaleString()}</span>
        </div>
      </div>` : "";
    const recs = (a.recommendations||[]).map((r,i) => `<li>${r}</li>`).join("");
    const flags = (a.flags||[]).map((f,i) => `<li>${f}</li>`).join("");
    const potentialRows = (a.potential_damages||[]).map((pd, i) => `<tr>
      <td class="tc">${i + 1}. ${pd.component}</td>
      <td class="tc" style="font-style:italic;color:#6B7280;">${pd.reason}</td>
      <td class="tc" style="text-align:right;font-weight:600;">$${(pd.estimated_cost_low||0).toLocaleString()} – $${(pd.estimated_cost_high||0).toLocaleString()}</td>
    </tr>`).join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ClaimPilot Report ${claim.id}</title>
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; color: #1F2937; background: #fff; font-size: 11px; line-height: 1.5; }
  .page { width: 8.5in; padding: 0.6in 0.7in; position: relative; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 72px; font-weight: 900; color: rgba(200,200,200,0.18); pointer-events: none; z-index: 9999; white-space: nowrap; letter-spacing: 8px; }
  .new-page { page-break-before: always; padding-top: 0.3in; }

  /* Header */
  .header { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 14px; margin-bottom: 20px; border-bottom: 3px solid #2563EB; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg, #2563EB, #7C3AED); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .logo-text { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
  .logo-sub { font-size: 10px; color: #6B7280; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
  .meta { text-align: right; font-size: 10px; color: #6B7280; line-height: 1.7; }
  .meta strong { color: #374151; }

  /* Cards */
  .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .card-dark { background: #0F172A; border: 1px solid #1E293B; color: #E2E8F0; }

  /* Summary bar */
  .summary-bar { display: flex; gap: 12px; margin-bottom: 18px; }
  .stat-box { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; text-align: center; }
  .stat-label { font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; color: #9CA3AF; margin-bottom: 4px; }
  .stat-value { font-size: 14px; font-weight: 700; color: #0F172A; }

  /* Estimate banner */
  .estimate { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border: 1px solid #93C5FD; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px; }
  .estimate-label { font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #3B82F6; }
  .estimate-value { font-size: 32px; font-weight: 800; color: #1E3A5F; margin-top: 4px; letter-spacing: -1px; }

  /* Section */
  .section { margin-bottom: 18px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0F172A; padding-bottom: 6px; margin-bottom: 10px; border-bottom: 2px solid #E2E8F0; display: flex; align-items: center; gap: 6px; }
  .section-title .dot { width: 8px; height: 8px; border-radius: 50%; background: #2563EB; }
  .section-body { font-size: 11.5px; color: #374151; line-height: 1.7; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { text-align: left; padding: 8px 10px; background: #F1F5F9; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; border-bottom: 2px solid #CBD5E1; }
  th:last-child { text-align: right; }
  .tc { padding: 9px 10px; border-bottom: 1px solid #F1F5F9; font-size: 11px; vertical-align: top; }
  tr:last-child .tc { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }

  /* Lists */
  .recs-list { padding-left: 18px; }
  .recs-list li { margin-bottom: 5px; font-size: 11px; color: #374151; line-height: 1.6; }
  .flags-list { padding-left: 18px; }
  .flags-list li { margin-bottom: 5px; font-size: 11px; color: #B45309; line-height: 1.6; }

  /* Photos */
  .photos { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Disclaimer */
  .disclaimer { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px 14px; margin-top: 20px; }
  .disclaimer p { font-size: 9.5px; color: #92400E; line-height: 1.6; }
  .disclaimer strong { color: #78350F; }

  /* Footer */
  .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; margin-top: 30px; border-top: 1px solid #E5E7EB; font-size: 9px; color: #9CA3AF; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0.6in 0.7in; }
  }
</style></head>
<body>
${!isPro ? '<div class="watermark">FREE ESTIMATE</div>' : ''}

<!-- PAGE 1: Executive Summary -->
<div class="page">
  <div class="header">
    <div class="logo">
      <div class="logo-mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <div class="logo-text">ClaimPilot AI</div>
        <div class="logo-sub">Estimate Before You Inspect</div>
      </div>
    </div>
    <div class="meta">
      <strong>Report ID:</strong> ${claim.id}<br/>
      <strong>Date:</strong> ${new Date(claim.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}<br/>
      <strong>Type:</strong> ${claim.type === "auto" ? "Vehicle Damage" : "Property Damage"}${claim.vehicle?.make ? `<br/><strong>Vehicle:</strong> ${claim.vehicle.year} ${claim.vehicle.make} ${claim.vehicle.model}${claim.vehicle.mileage ? ` (${parseInt(claim.vehicle.mileage).toLocaleString()} mi)` : ""}` : ""}${claim.property?.type ? `<br/><strong>Property:</strong> ${PROPERTY_TYPES.find(p=>p.value===claim.property.type)?.label || claim.property.type}` : ""}${claim.property?.address ? `<br/><strong>Address:</strong> ${claim.property.address}` : ""}${claim.property?.cause ? `<br/><strong>Cause:</strong> ${DAMAGE_CAUSES.find(c=>c.value===claim.property.cause)?.label || claim.property.cause}` : ""}${claim.location ? `<br/><strong>Location:</strong> ${claim.location}` : ""}
    </div>
  </div>

  <div class="summary-bar">
    <div class="stat-box">
      <div class="stat-label">Severity</div>
      <div class="stat-value" style="color:${sc};">${(sevLabel[a.severity] || a.severity || "").toUpperCase()}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Confidence</div>
      <div class="stat-value">${Math.round((a.confidence || 0) * 100)}%</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Items Assessed</div>
      <div class="stat-value">${(a.damages || []).length}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Recommendation</div>
      <div class="stat-value" style="font-size:12px;">${(a.repair_vs_replace || "N/A").replace("_", " ").toUpperCase()}</div>
    </div>
  </div>

  <div class="estimate">
    <div class="estimate-label">Estimated Total Repair Cost</div>
    <div class="estimate-value">$${(a.total_estimate_low || 0).toLocaleString()} — $${(a.total_estimate_high || 0).toLocaleString()}</div>
  </div>

  <div class="section">
    <div class="section-title"><span class="dot"></span> Executive Summary</div>
    <div class="section-body">${a.summary}</div>
  </div>

  ${photoImgs ? `
  <div class="section">
    <div class="section-title"><span class="dot"></span> Evidence Photos</div>
    <div class="photos">${photoImgs}</div>
  </div>` : ""}

  ${claim.description ? `
  <div class="section">
    <div class="section-title"><span class="dot"></span> Claimant Description</div>
    <div class="section-body" style="font-style:italic;">"${claim.description}"</div>
  </div>` : ""}

  <div class="section new-page">
    <div class="section-title"><span class="dot"></span> Damage Breakdown</div>
    <table>
      <thead><tr><th>Component</th><th>Severity</th><th>Description</th><th>Est. Cost</th></tr></thead>
      <tbody>${damageRows}</tbody>
    </table>
    ${costSummaryHTML}
  </div>

  ${potentialRows ? `
  <div class="section" style="margin-top:20px;">
    <div class="section-title"><span class="dot" style="background:#F59E0B;"></span> Potential Additional Damage <span style="font-size:9px;font-weight:400;color:#6B7280;text-transform:none;letter-spacing:0;">(not visible in photos — requires physical inspection)</span></div>
    <table>
      <thead><tr><th>Component</th><th>Reason</th><th>Est. Cost</th></tr></thead>
      <tbody>${potentialRows}</tbody>
    </table>
    ${a.potential_total_low ? `<div style="text-align:right;margin-top:8px;font-size:11px;color:#92400E;font-weight:600;">Potential additional: $${(a.potential_total_low||0).toLocaleString()} – $${(a.potential_total_high||0).toLocaleString()}</div>` : ""}
  </div>` : ""}

  ${recs ? `
  <div class="section new-page">
    <div class="section-title"><span class="dot"></span> Recommendations</div>
    <ol class="recs-list">${recs}</ol>
  </div>` : ""}

  ${flags ? `
  <div class="section">
    <div class="section-title"><span class="dot" style="background:#F59E0B;"></span> Flags &amp; Concerns</div>
    <ol class="flags-list">${flags}</ol>
  </div>` : ""}

  <div class="disclaimer">
    <p><strong>Disclaimer:</strong> This is a preliminary AI-generated estimate for informational purposes only. It does not constitute a binding assessment, appraisal, or guarantee of repair costs. A licensed insurance adjuster must conduct the final evaluation. ClaimPilot AI assumes no liability for decisions made based on this report. Actual repair costs may vary based on parts availability, labor rates, and hidden damage discovered during repair.</p>
  </div>

  <div class="footer">
    <span>ClaimPilot AI — Confidential</span>
    <span>ClaimPilot AI Report</span>
  </div>
</div>

</body></html>`;
  };

  const handleSavePDF = () => {
    const html = buildPrintHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      w.onload = () => { setTimeout(() => { w.print(); }, 400); };
    }
  };

  return (
    <div>

      {/* PDF Modal */}
      {showPDF && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", zIndex: 1001,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setShowPDF(false)}>
          <div style={{
            background: "#E5E7EB", borderRadius: 12, width: "100%", maxWidth: isMobile ? "95vw" : 820,
            maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }} onClick={(e) => e.stopPropagation()}>
            {/* Toolbar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", background: palette.surface, borderBottom: `1px solid ${palette.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>PDF Report Preview</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => {
                  const el = document.getElementById("pdf-content");
                  if (el) navigator.clipboard.writeText(el.innerText);
                }} style={{
                  padding: "6px 12px", borderRadius: 6, border: `1px solid ${palette.border}`,
                  background: palette.surfaceAlt, color: palette.text, cursor: "pointer",
                  fontFamily: font, fontSize: 12, fontWeight: 500,
                }}>
                  Copy Text
                </button>
                <button onClick={handleSavePDF} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  color: "#fff", cursor: "pointer", fontFamily: font, fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <Icons.Download /> Save as PDF
                </button>
                <button onClick={() => setShowPDF(false)} style={{
                  background: "none", border: "none", color: palette.textMuted, cursor: "pointer", padding: 4,
                }}>
                  <Icons.X />
                </button>
              </div>
            </div>
            {/* Pages preview */}
            <div style={{ flex: 1, overflow: "auto", padding: 24, background: "#6B7280" }}>
              <div id="pdf-content" dangerouslySetInnerHTML={{ __html: buildPrintHTML().replace(/<\/?html>|<\/?head>|<\/?body>|<title>.*?<\/title>|<meta[^>]*>|<!DOCTYPE[^>]*>/gi, "").replace(/<style>[\s\S]*?<\/style>/gi, "") }}
                style={{ display: "none" }} />
              {/* Page 1 */}
              <div style={{
                width: 680, margin: "0 auto 20px", background: "#fff", borderRadius: 4,
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)", overflow: "hidden",
              }}>
                <iframe
                  srcDoc={buildPrintHTML()}
                  style={{ width: "8.5in", height: "11in", border: "none", transform: "scale(0.78)", transformOrigin: "top left", display: "block" }}
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <BackArrow onClick={onBack} label="Back to Dashboard" centered />
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0 }}>Assessment Report</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadReport} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
            border: `1px solid ${palette.border}`, background: palette.surface, color: palette.text,
            cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 500,
          }}>
            <Icons.Eye /> Text
          </button>
          <button onClick={() => setShowPDF(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            border: "none", background: `linear-gradient(135deg, #1E40AF, ${palette.accent}, #6366F1)`,
            color: "#fff",
            cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 600,
            boxShadow: palette.glow,
          }}>
            <Icons.FileText /> View PDF Report
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div style={{
        padding: 20, borderRadius: 16, border: `1px solid ${palette.border}`,
        background: palette.surface, marginBottom: 16,
        boxShadow: palette.cardShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
            background: sev.bg, color: sev.color, textTransform: "uppercase",
          }}>
            {sev.label}
          </span>
          <span style={{ fontSize: 12, color: palette.textDim }}>
            Confidence: {Math.round((a.confidence || 0) * 100)}%
          </span>
          {claim.validation && claim.validation.confidenceModifier !== "unknown" && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
              background: claim.validation.confidenceModifier === "high" ? palette.successSoft
                : claim.validation.confidenceModifier === "medium" ? palette.warningSoft : palette.dangerSoft,
              color: claim.validation.confidenceModifier === "high" ? palette.success
                : claim.validation.confidenceModifier === "medium" ? palette.warning : palette.danger,
            }}>
              {claim.validation.confidenceModifier === "high" ? "Verified" : claim.validation.confidenceModifier === "medium" ? "Partial Match" : "Needs Review"}
            </span>
          )}
          <span style={{ fontSize: 12, color: palette.textDim }}>
            {claim.type === "auto" ? "Vehicle" : "Property"} · {new Date(claim.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p style={{ fontSize: 14, color: palette.text, lineHeight: 1.6, margin: 0 }}>{a.summary}</p>

        {/* Total Estimate */}
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 10, background: palette.surfaceAlt,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: palette.textDim, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
              Estimated Total Cost
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: palette.text, marginTop: 4, letterSpacing: "-0.02em" }}>
              ${a.total_estimate_low?.toLocaleString()} — ${a.total_estimate_high?.toLocaleString()}
            </div>
          </div>
          <div style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: a.repair_vs_replace === "replace" ? palette.dangerSoft : a.repair_vs_replace === "needs_inspection" ? palette.warningSoft : palette.successSoft,
            color: a.repair_vs_replace === "replace" ? palette.danger : a.repair_vs_replace === "needs_inspection" ? palette.warning : palette.success,
            textTransform: "uppercase",
          }}>
            {a.repair_vs_replace?.replace("_", " ")}
          </div>
        </div>
      </div>

      {/* Photos */}
      {claim.photos?.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${isMobile ? Math.min(claim.photos.length, 2) : Math.min(claim.photos.length, 4)}, 1fr)`,
          gap: 8, marginBottom: 16,
        }}>
          {claim.photos.map((p, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", border: `1px solid ${palette.border}` }}>
              <img src={p.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      {/* Damage Breakdown */}
      <div style={{
        padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`,
        background: palette.surface, marginBottom: 16,
      }}>
        <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, margin: 0, marginBottom: 16 }}>Damage Breakdown</h3>

        {/* Property: group by room */}
        {claim.type === "property" && a.damages?.some(d => d.room) ? (() => {
          const rooms = {};
          a.damages.forEach((d, i) => {
            const room = d.room || "General";
            if (!rooms[room]) rooms[room] = [];
            rooms[room].push({ ...d, _idx: i });
          });
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(rooms).map(([room, items]) => {
                const roomLow = items.reduce((s, d) => s + (d.estimated_cost_low || 0), 0);
                const roomHigh = items.reduce((s, d) => s + (d.estimated_cost_high || 0), 0);
                return (
                  <div key={room} style={{ borderRadius: 10, border: `1px solid ${palette.border}`, overflow: "hidden" }}>
                    <div style={{
                      padding: "10px 14px", background: palette.surfaceAlt,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderBottom: `1px solid ${palette.border}`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>{room}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: palette.accent }}>
                        ${roomLow.toLocaleString()} – ${roomHigh.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {items.map((d, j) => {
                        const ds = severityConfig[d.severity] || severityConfig.moderate;
                        return (
                          <div key={j} style={{
                            padding: "10px 14px",
                            borderBottom: j < items.length - 1 ? `1px solid ${palette.border}` : "none",
                            background: palette.surface,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{d.component}</span>
                                <span style={{
                                  fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 10,
                                  background: ds.bg, color: ds.color, textTransform: "uppercase",
                                }}>{d.severity}</span>
                                {d.surface && (
                                  <span style={{ fontSize: 10, color: palette.textDim, textTransform: "capitalize" }}>{d.surface}</span>
                                )}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: palette.text, whiteSpace: "nowrap" }}>
                                ${d.estimated_cost_low?.toLocaleString()}–${d.estimated_cost_high?.toLocaleString()}
                              </span>
                            </div>
                            {(d.quantity && d.unit) && (
                              <div style={{ fontSize: 11, color: palette.accent, marginBottom: 3 }}>
                                {d.quantity} {d.unit} × ${d.unit_cost_low?.toLocaleString() || "?"} – ${d.unit_cost_high?.toLocaleString() || "?"}/{d.unit}
                              </div>
                            )}
                            <p style={{ fontSize: 12, color: palette.textMuted, margin: 0, lineHeight: 1.4 }}>{d.description}</p>
                            {d.cost_breakdown && (
                              <div style={{
                                marginTop: 6, padding: "6px 8px", borderRadius: 6, background: palette.bg,
                                border: `1px solid ${palette.border}`, fontSize: 10, color: palette.textMuted,
                              }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 10px" }}>
                                  {d.cost_breakdown.materials_standard != null && (
                                    <>
                                      <span>Standard grade:</span>
                                      <span style={{ fontWeight: 600, color: palette.text }}>${d.cost_breakdown.materials_standard?.toLocaleString()}</span>
                                    </>
                                  )}
                                  {d.cost_breakdown.materials_premium != null && (
                                    <>
                                      <span>Premium grade:</span>
                                      <span style={{ fontWeight: 600, color: palette.warning }}>${d.cost_breakdown.materials_premium?.toLocaleString()}</span>
                                    </>
                                  )}
                                  {d.cost_breakdown.labor_hours_low != null && (
                                    <>
                                      <span>Labor:</span>
                                      <span style={{ fontWeight: 600, color: palette.text }}>
                                        {d.cost_breakdown.labor_hours_low}–{d.cost_breakdown.labor_hours_high} hrs × ${d.cost_breakdown.labor_rate}/hr
                                      </span>
                                    </>
                                  )}
                                </div>
                                {d.cost_breakdown.notes && (
                                  <div style={{ marginTop: 3, fontSize: 9.5, color: palette.textDim, fontStyle: "italic" }}>{d.cost_breakdown.notes}</div>
                                )}
                              </div>
                            )}
                            {claim.validation?.items?.[d._idx] && claim.validation.items[d._idx].status !== "unknown" && (
                              <div style={{
                                marginTop: 4, fontSize: 10, display: "flex", alignItems: "center", gap: 4,
                                color: claim.validation.items[d._idx].status === "in_range" ? palette.success
                                  : claim.validation.items[d._idx].status === "reference" ? palette.textDim : palette.warning,
                              }}>
                                <span>{claim.validation.items[d._idx].status === "in_range" ? "\u2713" : claim.validation.items[d._idx].status === "reference" ? "\u2139" : "\u26A0"}</span>
                                <span>{claim.validation.items[d._idx].message}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {/* Cost Summary for property */}
              {a.cost_summary && (
                <div style={{
                  padding: 14, borderRadius: 10, background: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: palette.text, marginBottom: 8 }}>Cost Summary</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Line Items Subtotal</span>
                      <span>${(a.cost_summary.line_items_subtotal_low || 0).toLocaleString()} – ${(a.cost_summary.line_items_subtotal_high || 0).toLocaleString()}</span>
                    </div>
                    {a.cost_summary.overhead_pct > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                        <span>Overhead ({a.cost_summary.overhead_pct}%)</span>
                        <span>${Math.round((a.cost_summary.line_items_subtotal_low || 0) * a.cost_summary.overhead_pct / 100).toLocaleString()} – ${Math.round((a.cost_summary.line_items_subtotal_high || 0) * a.cost_summary.overhead_pct / 100).toLocaleString()}</span>
                      </div>
                    )}
                    {a.cost_summary.profit_pct > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                        <span>Profit ({a.cost_summary.profit_pct}%)</span>
                        <span>${Math.round((a.cost_summary.line_items_subtotal_low || 0) * a.cost_summary.profit_pct / 100).toLocaleString()} – ${Math.round((a.cost_summary.line_items_subtotal_high || 0) * a.cost_summary.profit_pct / 100).toLocaleString()}</span>
                      </div>
                    )}
                    {a.cost_summary.tax_pct > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                        <span>Material Sales Tax (~{a.cost_summary.tax_pct}%)</span>
                        <span>included</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: palette.text, borderTop: `1px solid ${palette.border}`, paddingTop: 6, marginTop: 4 }}>
                      <span>Total Estimate</span>
                      <span>${(a.total_estimate_low || 0).toLocaleString()} – ${(a.total_estimate_high || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })() : (
          /* Auto: flat list */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {a.damages?.map((d, i) => {
              const ds = severityConfig[d.severity] || severityConfig.moderate;
              return (
                <div key={i} style={{
                  padding: 14, borderRadius: 10, background: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{d.component}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10,
                        background: ds.bg, color: ds.color, textTransform: "uppercase",
                      }}>
                        {d.severity}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>
                      ${d.estimated_cost_low?.toLocaleString()}–${d.estimated_cost_high?.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: palette.textMuted, margin: 0, lineHeight: 1.5 }}>{d.description}</p>
                  {d.cost_breakdown && (
                    <div style={{
                      marginTop: 8, padding: "8px 10px", borderRadius: 8, background: palette.bg,
                      border: `1px solid ${palette.border}`, fontSize: 11, color: palette.textMuted,
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                        {d.cost_breakdown.parts_oem != null && (
                          <>
                            <span>OEM Parts:</span>
                            <span style={{ fontWeight: 600, color: palette.text }}>${d.cost_breakdown.parts_oem?.toLocaleString()}</span>
                          </>
                        )}
                        {d.cost_breakdown.parts_aftermarket != null && (
                          <>
                            <span>Aftermarket:</span>
                            <span style={{ fontWeight: 600, color: palette.success }}>${d.cost_breakdown.parts_aftermarket?.toLocaleString()}</span>
                          </>
                        )}
                        {d.cost_breakdown.labor_hours_low != null && (
                          <>
                            <span>Labor:</span>
                            <span style={{ fontWeight: 600, color: palette.text }}>
                              {d.cost_breakdown.labor_hours_low}–{d.cost_breakdown.labor_hours_high} hrs × ${d.cost_breakdown.labor_rate}/hr
                            </span>
                          </>
                        )}
                        {d.cost_breakdown.paint_materials != null && (
                          <>
                            <span>Paint/Materials:</span>
                            <span style={{ fontWeight: 600, color: palette.text }}>${d.cost_breakdown.paint_materials?.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      {d.cost_breakdown.notes && (
                        <div style={{ marginTop: 4, fontSize: 10, color: palette.textDim, fontStyle: "italic" }}>{d.cost_breakdown.notes}</div>
                      )}
                    </div>
                  )}
                  {claim.validation?.items?.[i] && claim.validation.items[i].status !== "unknown" && (
                    <div style={{
                      marginTop: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                      color: claim.validation.items[i].status === "in_range" ? palette.success
                        : claim.validation.items[i].status === "reference" ? palette.textDim
                        : palette.warning,
                    }}>
                      <span>{claim.validation.items[i].status === "in_range" ? "\u2713" : claim.validation.items[i].status === "reference" ? "\u2139" : "\u26A0"}</span>
                      <span>{claim.validation.items[i].message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Potential Additional Damage */}
      {a.potential_damages?.length > 0 && (
        <div style={{
          padding: 20, borderRadius: 12, border: `1px dashed ${palette.border}`,
          background: palette.surfaceAlt, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, margin: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: palette.warning }}>⚡</span> Potential Additional Damage
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
              background: palette.warningSoft, color: palette.warning,
            }}>
              Not visible in photos
            </span>
          </h3>
          <p style={{ fontSize: 12, color: palette.textDim, margin: 0, marginBottom: 12 }}>
            {claim.type === "auto"
              ? "Based on vehicle model and damage pattern, these parts may also be affected. Requires physical inspection to confirm."
              : "Based on damage pattern and property type, these areas may also be affected. Requires physical inspection to confirm."}
          </p>
          {a.potential_total_low > 0 && (
            <div style={{ fontSize: 13, fontWeight: 600, color: palette.warning, marginBottom: 12 }}>
              Potential additional cost: ${a.potential_total_low?.toLocaleString()} – ${a.potential_total_high?.toLocaleString()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {a.potential_damages.map((pd, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 10, background: palette.surface,
                border: `1px solid ${palette.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{pd.component}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: palette.textMuted }}>
                    ${pd.estimated_cost_low?.toLocaleString()}–${pd.estimated_cost_high?.toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: palette.textDim, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>{pd.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Validation */}
      {claim.validation && claim.validation.totalChecked > 0 && (
        <div style={{
          padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`,
          background: palette.surface, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, margin: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            Pricing Validation
            {claim.pricingSource === "live" && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                background: palette.successSoft, color: palette.success,
              }}>
                Live Prices
              </span>
            )}
            {claim.pricingSource !== "live" && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                background: palette.surfaceAlt, color: palette.textDim,
              }}>
                Reference Prices
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
              background: claim.validation.warnings === 0 ? palette.successSoft : palette.warningSoft,
              color: claim.validation.warnings === 0 ? palette.success : palette.warning,
            }}>
              {claim.validation.totalChecked} checked · {claim.validation.warnings} flagged
            </span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {claim.validation.items.map((v, i) => (
              <div key={i} style={{
                padding: "8px 12px", borderRadius: 8, background: palette.surfaceAlt,
                borderLeft: `3px solid ${v.status === "in_range" ? palette.success : v.status === "unknown" ? palette.textDim : v.status === "reference" ? palette.accent : palette.warning}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: palette.text }}>{v.component}</span>
                <span style={{
                  fontSize: 11, color: v.status === "in_range" ? palette.success : v.status === "unknown" ? palette.textDim : v.status === "reference" ? palette.accent : palette.warning,
                }}>
                  {v.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations & Flags */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {a.recommendations?.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`, background: palette.surface }}>
            <h3 style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, marginBottom: 12, margin: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: palette.success }}><Icons.Check /></span> Recommendations
            </h3>
            {a.recommendations.map((r, i) => (
              <div key={i} style={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.6, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${palette.border}` }}>
                {r}
              </div>
            ))}
          </div>
        )}
        {a.flags?.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`, background: palette.surface }}>
            <h3 style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, marginBottom: 12, margin: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: palette.warning }}><Icons.AlertTriangle /></span> Flags
            </h3>
            {a.flags.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.6, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${palette.warningSoft}` }}>
                {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: 14, borderRadius: 10, background: palette.warningSoft,
        border: `1px solid rgba(245,158,11,0.2)`, display: "flex", alignItems: "flex-start", gap: 8,
      }}>
        <span style={{ color: palette.warning, marginTop: 1 }}><Icons.AlertTriangle /></span>
        <p style={{ fontSize: 12, color: palette.warning, margin: 0, lineHeight: 1.5 }}>
          <strong>Disclaimer:</strong> This is a preliminary AI-generated estimate for informational purposes only.
          It does not constitute a binding assessment. A licensed adjuster must conduct the final evaluation.
        </p>
      </div>

      {/* Report Preview Modal */}
      {showPreview && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }} onClick={() => setShowPreview(false)}>
          <div style={{
            background: palette.surface, borderRadius: 16, border: `1px solid ${palette.border}`,
            width: "100%", maxWidth: isMobile ? "95vw" : 700, maxHeight: "85vh", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${palette.border}`,
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Report Preview</h3>
              <button onClick={() => setShowPreview(false)} style={{
                background: "none", border: "none", color: palette.textMuted, cursor: "pointer", padding: 4,
              }}>
                <Icons.X />
              </button>
            </div>
            {/* Modal Body */}
            <div style={{
              flex: 1, overflow: "auto", padding: 24,
              background: "#fff", color: "#111",
            }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {generateTextReport()}
              </div>
            </div>
            {/* Modal Footer */}
            <div style={{
              display: "flex", gap: 10, padding: "14px 20px",
              borderTop: `1px solid ${palette.border}`, justifyContent: "flex-end",
            }}>
              <button onClick={() => setShowPreview(false)} style={{
                padding: "8px 16px", borderRadius: 8, border: `1px solid ${palette.border}`,
                background: "transparent", color: palette.textMuted, cursor: "pointer",
                fontFamily: font, fontSize: 13,
              }}>
                Close
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText(generateTextReport());
              }} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: palette.accent, color: "#fff", cursor: "pointer",
                fontFamily: font, fontSize: 13, fontWeight: 600,
              }}>
                Copy to Clipboard
              </button>
              <button onClick={() => { setShowPreview(false); setShowPDF(true); }} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${palette.accent}, #2563EB)`, color: "#fff", cursor: "pointer",
                fontFamily: font, fontSize: 13, fontWeight: 600,
              }}>
                View PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// App Root
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = DB.getUser();
    if (saved) setUser(saved);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <Dashboard
      user={user}
      onLogout={() => { DB.logout(); setUser(null); }}
      onUserUpdate={setUser}
    />
  );
}
