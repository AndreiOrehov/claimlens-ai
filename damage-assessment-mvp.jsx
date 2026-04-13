import { useState, useEffect, useCallback, useRef } from "react";
import { US_STATES, buildPricingContext, validateEstimates, getVehicleClass, fetchFreshPricing, mergePricing, STATE_SALES_TAX, LABOR_RATE_CATEGORIES, DIAGNOSTIC_FLAT_RATES, STATE_FRAUD_WARNINGS, STANDARD_FRAUD_DISCLAIMER, ALTERNATE_PARTS_DISCLAIMER, getPartPrice } from "./pricing-db.js";
import { VEHICLE_TRIMS } from "./vehicle-trims.js";
import { VEHICLE_SPECS } from "./vehicle-specs.js";
import { PARTS_CATALOG_PROMPT, ALL_PARTS } from "./parts-catalog.js";
import { processDetection, INDICATOR_WEIGHTS } from "./detection-engine.js";
import { LABOR_TIMES, getLaborHours, getRefinishHours, getRepairHours, getClassMultiplier } from "./labor-times.js";

// ============================================================
// ClaimPilot AI — Insurance Damage Assessment MVP
// ============================================================
const APP_VERSION = "0.9.1";

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
    // Strip full-size photos from localStorage (they're too large — ~1-3MB each as base64)
    // Photos stay in memory for the current session's report view
    const storableClaim = { ...claim };
    const photoCount = storableClaim.photos?.length || 0;
    storableClaim.photos = (storableClaim.photos || []).map(p => ({
      name: p.name, caption: p.caption || "", data: "",
    }));
    storableClaim._photoCount = photoCount;
    const claims = DB.getClaims(userId);
    claims.unshift(storableClaim);
    try {
      localStorage.setItem(`cl_claims_${userId}`, JSON.stringify(claims));
    } catch (e) {
      // Still too big — trim oldest claims
      console.warn("Storage quota exceeded, trimming old claims...");
      while (claims.length > 1) {
        claims.pop();
        try { localStorage.setItem(`cl_claims_${userId}`, JSON.stringify(claims)); return; } catch { /* keep trimming */ }
      }
    }
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
    { free: "Full damage breakdown", pro: "Full damage breakdown" },
    { free: "—", pro: "Batch upload (up to 10 claims)" },
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
  "Audi": { "A3": [2006,2026], "A3 Sportback": [2022,2026], "A4": [1996,2026], "A4 allroad": [2013,2026], "A5": [2008,2026], "A5 Sportback": [2018,2026], "A6": [1995,2026], "A6 allroad": [2020,2026], "A7": [2012,2026], "A8": [1997,2026], "A8 L": [2004,2026], "Q3": [2015,2026], "Q4 e-tron": [2022,2026], "Q5": [2009,2026], "Q5 Sportback": [2021,2026], "Q7": [2007,2026], "Q8": [2019,2026], "Q8 e-tron": [2024,2026], "e-tron GT": [2022,2026], "RS 3": [2017,2026], "RS 5": [2013,2026], "RS 6 Avant": [2021,2026], "RS 7": [2014,2026], "RS e-tron GT": [2022,2026], "S3": [2015,2026], "S4": [2000,2026], "S5": [2008,2026], "S6": [2013,2026], "S7": [2013,2026], "SQ5": [2014,2026], "SQ7": [2020,2026], "SQ8": [2020,2026], "TT": [2000,2023], "TT RS": [2012,2023] },
  "BMW": { "228i": [2020,2026], "230i": [2017,2026], "M235i": [2014,2016], "M240i": [2017,2026], "320i": [2012,2026], "328i": [2007,2016], "330i": [2017,2026], "330e": [2016,2026], "335i": [2007,2015], "340i": [2016,2019], "M340i": [2020,2026], "428i": [2014,2016], "430i": [2017,2026], "440i": [2017,2020], "M440i": [2021,2026], "525i": [1997,2007], "528i": [2008,2016], "530i": [2017,2026], "530e": [2018,2026], "535i": [2008,2016], "540i": [2017,2026], "M550i": [2018,2026], "740i": [2016,2026], "745e": [2020,2022], "750i": [2006,2026], "760i": [2023,2026], "X1": [2013,2026], "X2": [2018,2026], "X3": [2004,2026], "X4": [2015,2026], "X5": [2000,2026], "X6": [2008,2026], "X7": [2019,2026], "M3": [1995,2026], "M4": [2015,2026], "M5": [1999,2026], "M8": [2020,2026], "iX": [2022,2026], "i4": [2022,2026], "i5": [2024,2026], "i7": [2023,2026] },
  "Buick": { "Enclave": [2008,2026], "Encore": [2013,2026], "Encore GX": [2020,2026], "Envision": [2016,2026], "LaCrosse": [2005,2019], "Regal": [2011,2020] },
  "Cadillac": { "CT4": [2020,2026], "CT5": [2020,2026], "Escalade": [1999,2026], "XT4": [2019,2026], "XT5": [2017,2026], "XT6": [2020,2026], "LYRIQ": [2023,2026], "CTS": [2003,2019], "ATS": [2013,2019] },
  "Chevrolet": { "Aveo": [2004,2011], "Blazer": [2019,2026], "Blazer EV": [2024,2026], "Bolt EV": [2017,2023], "Bolt EUV": [2022,2023], "Camaro": [2010,2024], "Captiva": [2012,2015], "City Express": [2015,2018], "Cobalt": [2005,2010], "Colorado": [2004,2026], "Corvette": [1997,2026], "Cruze": [2011,2019], "Equinox": [2005,2026], "Equinox EV": [2024,2026], "Express": [2003,2026], "HHR": [2006,2011], "Impala": [2000,2020], "Malibu": [1997,2025], "Monte Carlo": [2000,2007], "Orlando": [2012,2014], "Silverado 1500": [1999,2026], "Silverado 2500HD": [2001,2026], "Silverado 3500HD": [2001,2026], "Silverado EV": [2024,2026], "Sonic": [2012,2020], "Spark": [2013,2022], "SS": [2014,2017], "Suburban": [2000,2026], "Tahoe": [2000,2026], "Tracker": [2021,2022], "Trailblazer": [2002,2009], "Trailblazer (New)": [2021,2026], "Traverse": [2009,2026], "Trax": [2013,2026], "Uplander": [2005,2008], "Volt": [2011,2019] },
  "Chrysler": { "200": [2011,2017], "300": [2005,2023], "Aspen": [2007,2009], "Pacifica": [2004,2008], "Pacifica (New)": [2017,2026], "PT Cruiser": [2001,2010], "Sebring": [2001,2010], "Town & Country": [2001,2016], "Voyager": [2020,2022] },
  "Dodge": { "Avenger": [2008,2014], "Caliber": [2007,2012], "Caravan": [2001,2020], "Challenger": [2008,2023], "Charger": [2006,2026], "Dart": [2013,2016], "Durango": [1998,2026], "Grand Caravan": [2001,2020], "Hornet": [2023,2026], "Journey": [2009,2020], "Magnum": [2005,2008], "Neon": [2000,2005], "Nitro": [2007,2011], "Ram 1500": [2002,2010], "Ram 2500": [2003,2010], "Viper": [2003,2017] },
  "Ford": { "Bronco": [2021,2026], "Bronco Sport": [2021,2026], "C-Max": [2013,2018], "Crown Victoria": [2000,2011], "E-Series": [2003,2026], "EcoSport": [2018,2022], "Edge": [2007,2024], "Escape": [2001,2026], "Excursion": [2000,2005], "Expedition": [1997,2026], "Explorer": [1995,2026], "Explorer Sport Trac": [2001,2010], "F-150": [1997,2026], "F-150 Lightning": [2022,2026], "F-250": [1999,2026], "F-350": [1999,2026], "Fiesta": [2011,2019], "Five Hundred": [2005,2007], "Flex": [2009,2019], "Focus": [2000,2018], "Freestar": [2004,2007], "Freestyle": [2005,2007], "Fusion": [2006,2020], "Maverick": [2022,2026], "Mustang": [1994,2026], "Mustang Mach-E": [2021,2026], "Ranger": [1998,2026], "Taurus": [2000,2019], "Transit": [2015,2026], "Transit Connect": [2010,2026], "Windstar": [2000,2003] },
  "Genesis": { "G70": [2019,2026], "G80": [2017,2026], "G90": [2017,2026], "GV60": [2023,2026], "GV70": [2022,2026], "GV80": [2021,2026], "Electrified G80": [2023,2026], "Electrified GV70": [2024,2026] },
  "GMC": { "Acadia": [2007,2026], "Canyon": [2004,2026], "Envoy": [2002,2009], "Hummer EV": [2022,2026], "Sierra 1500": [1999,2026], "Sierra 2500HD": [2001,2026], "Sierra 3500HD": [2001,2026], "Terrain": [2010,2026], "Yukon": [2000,2026], "Yukon XL": [2000,2026] },
  "Honda": { "Accord": [1990,2026], "Civic": [1990,2026], "Clarity": [2017,2021], "CR-V": [1997,2026], "CR-Z": [2011,2016], "Crosstour": [2010,2015], "Element": [2003,2011], "Fit": [2007,2020], "HR-V": [2016,2026], "Insight": [2010,2022], "Odyssey": [1999,2026], "Passport": [2019,2026], "Pilot": [2003,2026], "Prologue": [2024,2026], "Ridgeline": [2006,2026], "S2000": [2000,2009] },
  "Hyundai": { "Accent": [2000,2022], "Azera": [2006,2017], "Elantra": [1996,2026], "Elantra GT": [2013,2020], "Genesis Coupe": [2010,2016], "Ioniq": [2017,2022], "Ioniq 5": [2022,2026], "Ioniq 6": [2023,2026], "Kona": [2018,2026], "Kona Electric": [2019,2026], "Nexo": [2019,2025], "Palisade": [2020,2026], "Santa Cruz": [2022,2026], "Santa Fe": [2001,2026], "Sonata": [1999,2026], "Tiburon": [2003,2008], "Tucson": [2005,2026], "Veloster": [2012,2021], "Venue": [2020,2026], "Veracruz": [2007,2012] },
  "Infiniti": { "EX35": [2008,2012], "FX35": [2003,2012], "FX37": [2013,2013], "FX50": [2009,2013], "G35": [2003,2008], "G37": [2008,2013], "M35": [2006,2010], "M37": [2011,2013], "M56": [2011,2013], "Q40": [2015,2015], "Q50": [2014,2026], "Q60": [2014,2024], "Q70": [2014,2019], "QX30": [2017,2019], "QX50": [2014,2026], "QX55": [2022,2026], "QX56": [2004,2013], "QX60": [2013,2026], "QX80": [2014,2026] },
  "Jaguar": { "E-PACE": [2018,2025], "F-PACE": [2017,2026], "F-TYPE": [2014,2024], "I-PACE": [2019,2025], "XE": [2017,2020], "XF": [2009,2024], "XJ": [2004,2019], "XK": [2007,2015] },
  "Jeep": { "Cherokee": [2001,2023], "Commander": [2006,2010], "Compass": [2007,2026], "Gladiator": [2020,2026], "Grand Cherokee": [1999,2026], "Grand Cherokee L": [2021,2026], "Grand Wagoneer": [2022,2026], "Liberty": [2002,2012], "Patriot": [2007,2017], "Renegade": [2015,2026], "Wagoneer": [2022,2026], "Wrangler": [1997,2026] },
  "Kia": { "Amanti": [2004,2009], "Borrego": [2009,2011], "Cadenza": [2014,2020], "Carnival": [2022,2026], "EV6": [2022,2026], "EV9": [2024,2026], "Forte": [2010,2026], "K5": [2021,2026], "K900": [2015,2020], "Niro": [2017,2026], "Niro EV": [2019,2026], "Optima": [2001,2020], "Rio": [2001,2023], "Rondo": [2007,2010], "Sedona": [2002,2021], "Seltos": [2021,2026], "Sorento": [2003,2026], "Soul": [2010,2026], "Soul EV": [2015,2020], "Spectra": [2001,2009], "Sportage": [2005,2026], "Stinger": [2018,2023], "Telluride": [2020,2026] },
  "Lexus": { "CT 200h": [2011,2017], "ES 250": [2019,2026], "ES 300h": [2013,2026], "ES 330": [2004,2006], "ES 350": [2007,2026], "GS 300": [1998,2005], "GS 350": [2007,2020], "GS 430": [2001,2005], "GS 450h": [2007,2018], "GS 460": [2008,2012], "GS F": [2016,2020], "GX 460": [2010,2026], "GX 470": [2003,2009], "GX 550": [2024,2026], "HS 250h": [2010,2012], "IS 200t": [2016,2017], "IS 250": [2006,2015], "IS 300": [2001,2026], "IS 350": [2006,2026], "IS 500": [2022,2026], "IS F": [2008,2014], "LC 500": [2018,2026], "LC 500h": [2018,2026], "LFA": [2012,2012], "LS 400": [1995,2000], "LS 430": [2001,2006], "LS 460": [2007,2017], "LS 500": [2018,2026], "LS 500h": [2018,2026], "LS 600h": [2008,2014], "LX 470": [1998,2007], "LX 570": [2008,2021], "LX 600": [2022,2026], "NX 200t": [2015,2017], "NX 250": [2022,2026], "NX 300": [2018,2021], "NX 300h": [2015,2021], "NX 350": [2022,2026], "NX 350h": [2022,2026], "NX 450h+": [2022,2026], "RC 200t": [2016,2017], "RC 300": [2018,2026], "RC 350": [2015,2026], "RC F": [2015,2026], "RX 300": [1999,2003], "RX 330": [2004,2006], "RX 350": [2007,2026], "RX 350h": [2023,2026], "RX 400h": [2006,2008], "RX 450h": [2010,2026], "RX 450h+": [2023,2026], "RX 500h": [2023,2026], "SC 430": [2002,2010], "TX 350": [2024,2026], "TX 500h": [2024,2026], "TX 550h+": [2024,2026], "UX 200": [2019,2026], "UX 250h": [2019,2026], "RZ 300e": [2023,2026], "RZ 450e": [2023,2026] },
  "Land Rover": { "Defender": [2020,2026], "Discovery": [2017,2026], "Discovery Sport": [2015,2026], "Freelander": [2002,2005], "LR2": [2008,2015], "LR3": [2005,2009], "LR4": [2010,2016], "Range Rover": [2003,2026], "Range Rover Evoque": [2012,2026], "Range Rover Sport": [2006,2026], "Range Rover Velar": [2018,2026] },
  "Lincoln": { "Aviator": [2003,2026], "Continental": [2017,2020], "Corsair": [2020,2026], "MKC": [2015,2019], "MKS": [2009,2016], "MKT": [2010,2019], "MKX": [2007,2018], "MKZ": [2007,2020], "Nautilus": [2019,2026], "Navigator": [1998,2026], "Town Car": [2000,2011], "Zephyr": [2006,2006] },
  "Lucid": { "Air": [2022,2026], "Gravity": [2025,2026] },
  "Maserati": { "Ghibli": [2014,2024], "GranTurismo": [2008,2026], "Grecale": [2023,2026], "Levante": [2017,2025], "MC20": [2022,2026], "Quattroporte": [2005,2024] },
  "Mazda": { "CX-3": [2016,2021], "CX-5": [2013,2026], "CX-7": [2007,2012], "CX-9": [2007,2023], "CX-30": [2020,2026], "CX-50": [2023,2026], "CX-70": [2025,2026], "CX-90": [2024,2026], "Mazda2": [2011,2014], "Mazda3": [2004,2026], "Mazda5": [2006,2015], "Mazda6": [2003,2021], "MX-5 Miata": [1990,2026], "RX-8": [2004,2011], "Tribute": [2001,2011] },
  "Mercedes-Benz": { "A 220": [2019,2022], "AMG GT": [2016,2026], "AMG GT 63": [2019,2026], "B 250": [2014,2019], "C 230": [2002,2007], "C 250": [2012,2015], "C 280": [2006,2007], "C 300": [2008,2026], "C 350": [2008,2014], "C 43 AMG": [2017,2026], "C 63 AMG": [2008,2026], "CLA 250": [2014,2026], "CLE 300": [2024,2026], "CLE 450": [2024,2026], "CLK 350": [2006,2009], "CLS 450": [2019,2026], "CLS 550": [2007,2018], "E 300": [2017,2026], "E 320": [2003,2009], "E 350": [2006,2016], "E 450": [2019,2026], "E 53 AMG": [2019,2026], "E 550": [2007,2016], "E 63 AMG": [2007,2026], "EQB 250+": [2023,2026], "EQE 350+": [2023,2026], "EQS 450+": [2022,2026], "EQS 580": [2022,2026], "G 550": [2002,2026], "G 63 AMG": [2013,2026], "GL 450": [2007,2016], "GL 550": [2008,2016], "GLA 250": [2015,2026], "GLB 250": [2020,2026], "GLC 300": [2016,2026], "GLC 43 AMG": [2017,2023], "GLC 63 AMG": [2018,2023], "GLE 350": [2016,2026], "GLE 450": [2020,2026], "GLE 53 AMG": [2020,2026], "GLE 63 AMG": [2016,2026], "GLK 250": [2013,2015], "GLK 350": [2010,2015], "GLS 450": [2017,2026], "GLS 580": [2020,2026], "GLS 63 AMG": [2021,2026], "ML 350": [2006,2015], "ML 550": [2008,2015], "R 350": [2006,2013], "S 500": [1996,2020], "S 550": [2007,2020], "S 580": [2021,2026], "S 63 AMG": [2008,2026], "SL 550": [2007,2026], "SLC 300": [2017,2020], "SLK 350": [2005,2016] },
  "Mini": { "Clubman": [2008,2026], "Convertible": [2005,2026], "Countryman": [2011,2026], "Hardtop 2 Door": [2002,2026], "Hardtop 4 Door": [2015,2026], "Paceman": [2013,2016] },
  "Mitsubishi": { "Eclipse": [2000,2012], "Eclipse Cross": [2018,2026], "Endeavor": [2004,2011], "Galant": [2004,2012], "Lancer": [2002,2017], "Mirage": [2014,2026], "Mirage G4": [2017,2026], "Outlander": [2003,2026], "Outlander PHEV": [2018,2026], "Outlander Sport": [2011,2026], "Raider": [2006,2009] },
  "Nissan": { "350Z": [2003,2009], "370Z": [2009,2020], "Altima": [1998,2026], "Armada": [2004,2026], "Ariya": [2023,2026], "Cube": [2009,2014], "Frontier": [1998,2026], "GT-R": [2009,2024], "Juke": [2011,2017], "Kicks": [2018,2026], "Leaf": [2011,2024], "Maxima": [1995,2023], "Murano": [2003,2025], "NV200": [2013,2021], "Pathfinder": [1996,2026], "Quest": [2004,2017], "Rogue": [2008,2026], "Rogue Select": [2014,2015], "Rogue Sport": [2017,2022], "Sentra": [2000,2026], "Titan": [2004,2025], "Titan XD": [2016,2023], "Versa": [2007,2026], "Versa Note": [2014,2019], "Xterra": [2000,2015], "Z": [2023,2026] },
  "Polestar": { "Polestar 2": [2021,2026], "Polestar 3": [2025,2026], "Polestar 4": [2025,2026] },
  "Porsche": { "718 Boxster": [2017,2026], "718 Cayman": [2017,2026], "911": [1999,2026], "Boxster": [1997,2016], "Cayenne": [2003,2026], "Cayman": [2006,2016], "Macan": [2015,2026], "Panamera": [2010,2026], "Taycan": [2020,2026] },
  "Ram": { "1500": [2011,2026], "1500 Classic": [2019,2026], "2500": [2011,2026], "3500": [2011,2026], "ProMaster": [2014,2026], "ProMaster City": [2015,2022] },
  "Rivian": { "R1S": [2022,2026], "R1T": [2022,2026], "R2": [2026,2026] },
  "Scion": { "FR-S": [2013,2016], "iA": [2016,2016], "iM": [2016,2016], "tC": [2005,2016], "xA": [2004,2006], "xB": [2004,2015], "xD": [2008,2014] },
  "Subaru": { "Ascent": [2019,2026], "Baja": [2003,2006], "BRZ": [2013,2026], "Crosstrek": [2013,2026], "Forester": [1998,2026], "Impreza": [1993,2026], "Legacy": [1995,2024], "Outback": [2000,2026], "Solterra": [2023,2026], "Tribeca": [2006,2014], "WRX": [2002,2026], "WRX STI": [2004,2021] },
  "Tesla": { "Cybertruck": [2024,2026], "Model 3": [2017,2026], "Model S": [2012,2026], "Model X": [2016,2026], "Model Y": [2020,2026] },
  "Toyota": { "4Runner": [1996,2026], "86/GR86": [2017,2026], "Avalon": [1995,2022], "bZ4X": [2023,2026], "C-HR": [2018,2022], "Camry": [1992,2026], "Corolla": [1990,2026], "Corolla Cross": [2022,2026], "Corolla iM": [2017,2018], "Crown": [2023,2026], "FJ Cruiser": [2007,2014], "Grand Highlander": [2024,2026], "GR Corolla": [2023,2026], "GR Supra": [2020,2026], "Highlander": [2001,2026], "Land Cruiser": [1998,2026], "Matrix": [2003,2013], "Mirai": [2016,2026], "Prius": [2001,2026], "Prius Prime": [2017,2026], "Prius V": [2012,2017], "RAV4": [1996,2026], "RAV4 Prime": [2021,2026], "Sequoia": [2001,2026], "Sienna": [1998,2026], "Tacoma": [1995,2026], "Tundra": [2000,2026], "Venza": [2009,2026], "Yaris": [2004,2020], "Yaris iA": [2017,2018] },
  "Volkswagen": { "Arteon": [2019,2023], "Atlas": [2018,2026], "Atlas Cross Sport": [2020,2026], "Beetle": [1998,2019], "CC": [2009,2017], "Eos": [2007,2016], "Golf": [1999,2025], "Golf Alltrack": [2017,2019], "Golf GTI": [2006,2026], "Golf R": [2012,2026], "Golf SportWagen": [2015,2019], "ID.4": [2021,2026], "ID.Buzz": [2025,2026], "Jetta": [1999,2026], "Jetta GLI": [2006,2026], "Passat": [1998,2022], "Phaeton": [2004,2006], "Routan": [2009,2014], "Taos": [2022,2026], "Tiguan": [2009,2026], "Touareg": [2004,2017] },
  "Volvo": { "C30": [2008,2013], "C40 Recharge": [2022,2026], "C70": [2006,2013], "EX30": [2024,2026], "EX90": [2024,2026], "S40": [2004,2011], "S60": [2001,2026], "S80": [2004,2016], "S90": [2017,2026], "V60": [2015,2026], "V60 Cross Country": [2015,2026], "V90": [2017,2022], "V90 Cross Country": [2017,2026], "XC40": [2019,2026], "XC40 Recharge": [2021,2026], "XC60": [2010,2026], "XC70": [2004,2016], "XC90": [2003,2026] },
  "Alfa Romeo": { "4C": [2015,2020], "Giulia": [2017,2026], "Stelvio": [2018,2026], "Tonale": [2024,2026] },
  "Fiat": { "124 Spider": [2017,2020], "500": [2012,2019], "500 Abarth": [2012,2019], "500L": [2014,2020], "500X": [2016,2023], "500e": [2013,2019] },
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
  const [geminiTier, setGeminiTier] = useState("pro"); // "pro" = 3.1 Pro, "regular" = 2.5 Flash
  const fileRef = useRef(null);

  // Vehicle fields
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vYear, setVYear] = useState("");
  const [vTrim, setVTrim] = useState("");
  const [vEngine, setVEngine] = useState("");
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

  // Cascading vehicle logic: Make → Year → Model
  const makes = Object.keys(VEHICLE_DB).sort();
  // All years across all models for selected make
  const years = vMake ? (() => {
    const ySet = new Set();
    for (const [, range] of Object.entries(VEHICLE_DB[vMake])) {
      for (let y = range[0]; y <= range[1]; y++) ySet.add(y);
    }
    return Array.from(ySet).sort((a, b) => b - a).map(String);
  })() : [];
  // Models available in selected year
  const models = (vMake && vYear) ? Object.entries(VEHICLE_DB[vMake])
    .filter(([, range]) => +vYear >= range[0] && +vYear <= range[1])
    .map(([name]) => name).sort() : [];

  const trims = (vMake && vModel && VEHICLE_TRIMS[vMake]?.[vModel]) || [];
  const engines = (vMake && vModel && VEHICLE_SPECS[vMake]?.[vModel]?.engines) || [];
  const handleMakeChange = (val) => { setVMake(val); setVYear(""); setVModel(""); setVTrim(""); setVEngine(""); };
  const handleYearChange = (val) => { setVYear(val); setVModel(""); setVTrim(""); setVEngine(""); };
  const handleModelChange = (val) => {
    setVModel(val); setVTrim("");
    // Auto-select engine if only one option
    const eng = (vMake && val && VEHICLE_SPECS[vMake]?.[val]?.engines) || [];
    setVEngine(eng.length === 1 ? eng[0] : "");
  };

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
        // Regular image — resize to max 2048px for optimal Gemini performance
        if (photos.length >= 10) { setError("Maximum 10 photos per claim"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 2048;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
              const scale = MAX_DIM / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const resized = canvas.toDataURL("image/jpeg", 0.92);
            setPhotos((prev) => {
              if (prev.length >= 10) return prev;
              return [...prev, { name: file.name, data: resized, size: file.size, caption: "" }];
            });
          };
          img.src = ev.target.result;
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

      // --- Gemini pre-lookup: model-specific OEM prices + ACV ---
      let modelPricingContext = "";
      let acvContext = "";
      let acvData = null; // { low, high, mileage_factor }
      if (type === "auto" && vMake && vModel && vYear) {
        // Check ACV cache first (keyed by year+make+model+mileage bucket, TTL 7 days)
        const mileageBucket = vMileage ? Math.round(parseInt(vMileage) / 10000) * 10000 : 0;
        const acvCacheKey = `cl_acv_${vYear}_${vMake}_${vModel}_${vTrim || ""}_${mileageBucket}_${claimState || ""}`.toLowerCase().replace(/\s+/g, "_");
        try {
          const cached = JSON.parse(localStorage.getItem(acvCacheKey));
          if (cached && Date.now() - cached._ts < 7 * 24 * 60 * 60 * 1000) {
            acvData = cached;
            acvContext = `\nVEHICLE ACV (Actual Cash Value): $${acvData.acv_low?.toLocaleString()} – $${acvData.acv_high?.toLocaleString()} (mid: $${acvData.acv_mid?.toLocaleString()}). Condition assumed: ${acvData.condition_assumed}. ${acvData.mileage_adjustment || ""}\nUse this ACV to determine total loss threshold: if total repair cost exceeds 70-75% of ACV, recommend total loss.\n`;
            console.log("ACV loaded from cache:", acvData.acv_mid);
          }
        } catch { /* cache miss */ }

        // --- Perplexity helper for text lookups (searches real web data) ---
        const perplexityTextCall = async (prompt, maxTokens = 400) => {
          const key = import.meta.env.VITE_PERPLEXITY_API_KEY;
          if (!key) return null;
          try {
            const res = await fetch("https://api.perplexity.ai/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
              body: JSON.stringify({
                model: "sonar",
                messages: [{ role: "user", content: prompt }],
                temperature: 0,
                max_tokens: maxTokens,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const text = data.choices?.[0]?.message?.content || "";
              return text;
            }
            console.warn(`Perplexity: ${res.status}`, await res.text().catch(() => ""));
            return null;
          } catch (e) { console.warn("Perplexity failed:", e.message); return null; }
        };

        // --- OpenAI fallback for text lookups ---
        const openaiTextCall = async (prompt, maxTokens = 400) => {
          const key = import.meta.env.VITE_OPENAI_API_KEY;
          if (!key) return null;
          try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0,
                max_tokens: maxTokens,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const text = data.choices?.[0]?.message?.content || "";
              return text;
            }
            console.warn(`OpenAI: ${res.status}`, await res.text().catch(() => ""));
            return null;
          } catch (e) { console.warn("OpenAI failed:", e.message); return null; }
        };

        // --- Gemini fallback for text lookups ---
        const geminiTextCall = async (prompt, maxTokens = 400) => {
          const key = import.meta.env.VITE_GEMINI_API_KEY;
          const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
          for (const model of models) {
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: maxTokens } }),
                });
                if (res.ok) {
                  const data = await res.json();
                  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                }
                if (res.status === 429 || res.status === 503) { console.warn(`Gemini ${model}: ${res.status}, retry...`); continue; }
                break;
              } catch (e) { console.warn(`Gemini ${model} failed:`, e.message); }
            }
          }
          return null;
        };

        // --- Price lookup: OpenAI primary (stable JSON), Perplexity/Gemini fallback ---
        const priceLookup = async (prompt, maxTokens = 400) => {
          const result = await openaiTextCall(prompt, maxTokens);
          if (result) { console.log("Price lookup: OpenAI ✓"); return result; }
          const result2 = await perplexityTextCall(prompt, maxTokens);
          if (result2) { console.log("Price lookup: Perplexity fallback ✓"); return result2; }
          const result3 = await geminiTextCall(prompt, maxTokens);
          if (result3) { console.log("Price lookup: Gemini fallback ✓"); return result3; }
          console.warn("Price lookup: all providers failed");
          return null;
        };

        // --- ACV lookup: Perplexity primary (real web search), OpenAI/Gemini fallback ---
        const acvLookup = async (prompt, maxTokens = 400) => {
          const result = await perplexityTextCall(prompt, maxTokens);
          if (result) { console.log("ACV lookup: Perplexity ✓"); return result; }
          const result2 = await openaiTextCall(prompt, maxTokens);
          if (result2) { console.log("ACV lookup: OpenAI fallback ✓"); return result2; }
          const result3 = await geminiTextCall(prompt, maxTokens);
          if (result3) { console.log("ACV lookup: Gemini fallback ✓"); return result3; }
          console.warn("ACV lookup: all providers failed");
          return null;
        };

        // --- Run all pre-lookups in parallel ---
        // 1. OEM/Aftermarket prices — OpenAI primary (stable), Perplexity/Gemini fallback
        const priceGroups = [
          "front_bumper,rear_bumper,hood,fender,door",
          "headlight,taillight,mirror,windshield,grille",
          "quarter_panel,trunk_tailgate,radiator,ac_condenser",
        ];
        const pricePrompt = (keys) => `Search for ${vYear} ${vMake} ${vModel} replacement auto body parts prices in USD. I need OEM and aftermarket price ranges for each part listed below. If you cannot find an exact price, provide your best estimate based on similar vehicles in this class.

Parts needed: ${keys}

IMPORTANT: Respond with ONLY a JSON object, no explanation, no markdown. Every key must have a value (never null).
Format: {"part_name":{"o":[low,high],"a":[low,high]}}
Where o=OEM price range, a=aftermarket price range.
If aftermarket is not available for this part, estimate it as 40-60% of OEM.
Example: {"front_bumper":{"o":[800,1200],"a":[350,550]}}`;
        const pricePromises = priceGroups.map(keys => priceLookup(pricePrompt(keys), 400).catch(() => null));

        // 2. ACV: MarketCheck (primary) + Gemini (fallback) — skip both if cached
        const mcKey = import.meta.env.VITE_MARKETCHECK_API_KEY;
        const stateZip = US_STATES.find(s => s.value === claimState);
        const zipCode = stateZip?.zip || "90210"; // fallback zip

        // MarketCheck: real market data from dealer listings
        // MC model names differ from ours (e.g. MC:"LS" vs ours:"LS 460", MC:"3 Series" vs ours:"330i")
        // Strategy: try exact → try base (strip numbers) → try make+year only (filter by heading)
        const mcBaseModel = vModel.replace(/\s+\d{2,4}[a-z]*\+?$/i, "").trim();
        const mcTimeout = (promise, ms) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
        const mcBuildUrl = (model) => `https://api.marketcheck.com/v2/search/car/active?api_key=${mcKey}&year=${vYear}&make=${encodeURIComponent(vMake)}${model ? `&model=${encodeURIComponent(model)}` : ""}&zip=${zipCode}&radius=100&rows=30&sort_by=distance&sort_order=asc`;
        const marketCheckPromise = (!acvData && mcKey) ? (async () => {
          try {
            // Try 1: exact model name
            let res = await mcTimeout(fetch(mcBuildUrl(vModel)), 8000);
            if (res.ok) {
              const data = await res.clone().json();
              if ((data.num_found || 0) >= 3) return res;
              // Try 2: base model (strip trailing numbers)
              if (mcBaseModel !== vModel) {
                console.log(`MarketCheck: "${vModel}" → ${data.num_found || 0}, trying "${mcBaseModel}"...`);
                const res2 = await mcTimeout(fetch(mcBuildUrl(mcBaseModel)), 8000);
                if (res2.ok) {
                  const data2 = await res2.clone().json();
                  if ((data2.num_found || 0) >= 3) return res2;
                }
              }
              // Try 3: make+year only, filter by model keyword in heading
              console.log(`MarketCheck: "${mcBaseModel}" → few results, trying make+year with heading filter...`);
              const res3 = await mcTimeout(fetch(mcBuildUrl("")), 8000);
              if (res3.ok) {
                const data3 = await res3.json();
                // Filter listings whose heading contains our model name keywords
                const keywords = vModel.toLowerCase().split(/[\s-]+/).filter(w => w.length > 1);
                const filtered = (data3.listings || []).filter(l => {
                  const h = (l.heading || "").toLowerCase();
                  return keywords.some(kw => h.includes(kw));
                });
                if (filtered.length >= 3) {
                  console.log(`MarketCheck: heading filter matched ${filtered.length} of ${data3.num_found} listings`);
                  // Return a synthetic response with filtered listings
                  return new Response(JSON.stringify({ num_found: filtered.length, listings: filtered }), { status: 200 });
                }
              }
              // Return whatever we got from try 1
              return res;
            }
            return res;
          } catch (e) { console.warn("MarketCheck request failed:", e.message); return null; }
        })() : Promise.resolve(null);

        // AI fallback for ACV: only if no cache AND no MarketCheck key
        const acvAiPromise = (!acvData && !mcKey) ? acvLookup(
          `ACV (pre-accident fair market value) for ${vYear} ${vMake} ${vModel}${vMileage ? `, ${parseInt(vMileage).toLocaleString()} mi` : ""}${claimState ? `, ${stateZip?.label || claimState}` : ""}. JSON only: {"acv_low":N,"acv_high":N,"acv_mid":N,"condition_assumed":"good|fair|excellent","source_basis":"brief"}`,
          256
        ).catch(() => null) : Promise.resolve(null);

        const [priceRes1, priceRes2, priceRes3, marketCheckRes, acvAiRes] = await Promise.all([...pricePromises, marketCheckPromise, acvAiPromise]);

        // Parse OEM/aftermarket price lookups (merge 3 parallel text responses)
        try {
          const prices = {};
          [priceRes1, priceRes2, priceRes3].forEach((text, i) => {
            if (text) console.log(`Price response ${i + 1} raw:`, text.substring(0, 300));
          });
          for (const text of [priceRes1, priceRes2, priceRes3]) {
            try {
              if (!text) continue;
              const cleanJson = text.replace(/```json\n?|```\n?/g, "").trim();
              const rawPrices = JSON.parse(cleanJson);
              for (const [k, v] of Object.entries(rawPrices)) {
                if (!v || typeof v !== "object") continue; // skip null/invalid entries
                prices[k] = { oem: v.oem || v.o || null, aftermarket: v.aftermarket || v.a || null };
              }
            } catch (e) { console.warn(`Price parse failed:`, e.message); }
          }
          if (Object.keys(prices).length > 0) {
            modelPricingContext = `\nMODEL-SPECIFIC OEM/AFTERMARKET PRICES for ${vYear} ${vMake} ${vModel} (use these as primary price reference):\n${JSON.stringify(prices, null, 2)}\n`;
            console.log(`Price lookup: ${Object.keys(prices).length} parts loaded`);
          }
        } catch { /* parse error */ }

        // Parse ACV — MarketCheck primary, Gemini fallback
        if (!acvData) {
          // Try MarketCheck first — parse search results into stats
          let mcSuccess = false;
          try {
            if (marketCheckRes?.ok) {
              const mcData = await marketCheckRes.json();
              // Search endpoint returns { num_found, listings: [...] }
              const listings = mcData.listings || mcData.results || [];
              const prices = listings.map(l => l.price).filter(p => p && p > 0).sort((a, b) => a - b);
              const miles = listings.map(l => l.miles).filter(m => m && m > 0);
              const count = prices.length;
              console.log(`MarketCheck: ${mcData.num_found || 0} found, ${count} with prices`, prices.slice(0, 5));

              if (count >= 3) {
                // Calculate stats from listings
                const median = prices[Math.floor(count / 2)];
                const mean = Math.round(prices.reduce((s, p) => s + p, 0) / count);
                const minP = prices[0];
                const maxP = prices[count - 1];
                const medianMiles = miles.length > 0 ? miles.sort((a, b) => a - b)[Math.floor(miles.length / 2)] : null;

                // Mileage adjustment
                let mileageAdj = "";
                let adjFactor = 1;
                if (vMileage && medianMiles) {
                  const milesDiff = parseInt(vMileage) - medianMiles;
                  const perMile = median > 30000 ? 0.12 : median > 15000 ? 0.08 : 0.05;
                  adjFactor = 1 - (milesDiff * perMile / median);
                  adjFactor = Math.max(0.7, Math.min(1.3, adjFactor));
                  mileageAdj = milesDiff > 0
                    ? `Vehicle has ${Math.abs(milesDiff).toLocaleString()} more miles than market median (${medianMiles.toLocaleString()}) — value adjusted down`
                    : milesDiff < -5000 ? `Vehicle has ${Math.abs(milesDiff).toLocaleString()} fewer miles than market median — value adjusted up` : "";
                }
                const adjMedian = Math.round(median * adjFactor);
                // Use ~15th and ~85th percentile for range
                const p15 = prices[Math.max(0, Math.floor(count * 0.15))];
                const p85 = prices[Math.min(count - 1, Math.floor(count * 0.85))];
                const acvLow = Math.round(p15 * adjFactor);
                const acvHigh = Math.round(p85 * adjFactor);

                acvData = {
                  acv_low: acvLow,
                  acv_high: acvHigh,
                  acv_mid: adjMedian,
                  condition_assumed: "good",
                  mileage_adjustment: mileageAdj,
                  source_basis: `MarketCheck: ${count} comparable listings within 100mi, median $${median.toLocaleString()}`,
                  _mc_raw: { median, mean, min: minP, max: maxP, count, medianMiles },
                };
                mcSuccess = true;
                console.log(`ACV from MarketCheck: $${adjMedian.toLocaleString()} (${count} listings, median $${median.toLocaleString()})`);
              } else {
                console.log(`MarketCheck: only ${count} priced listings — falling back to Gemini`);
              }
            }
          } catch (e) { console.warn("MarketCheck ACV parse failed:", e.message); }

          // AI fallback if MarketCheck failed or unavailable
          if (!mcSuccess) {
            try {
              const aiText = acvAiRes || (mcKey ? await textLookup(
                `ACV (pre-accident fair market value) for ${vYear} ${vMake} ${vModel}${vMileage ? `, ${parseInt(vMileage).toLocaleString()} mi` : ""}${claimState ? `, ${stateZip?.label || claimState}` : ""}. JSON only: {"acv_low":N,"acv_high":N,"acv_mid":N,"condition_assumed":"good|fair|excellent","source_basis":"brief"}`,
                256
              ).catch(() => null) : null);
              if (aiText) {
                const cleanAcv = aiText.replace(/```json\n?|```\n?/g, "").trim();
                acvData = JSON.parse(cleanAcv);
                acvData.source_basis = (acvData.source_basis || "AI estimate") + " (AI fallback)";
                console.log("ACV from AI fallback:", acvData.acv_mid);
              }
            } catch { /* AI also failed */ }
          }

          // Build context + cache
          if (acvData) {
            acvContext = `\nVEHICLE ACV (Actual Cash Value): $${acvData.acv_low?.toLocaleString()} – $${acvData.acv_high?.toLocaleString()} (mid: $${acvData.acv_mid?.toLocaleString()}). ${acvData.condition_assumed ? `Condition: ${acvData.condition_assumed}.` : ""} ${acvData.mileage_adjustment || ""}\nSource: ${acvData.source_basis || "estimated"}\nUse this ACV to determine total loss threshold: if total repair cost exceeds 70-75% of ACV, recommend total loss.\n`;
            try { localStorage.setItem(acvCacheKey, JSON.stringify({ ...acvData, _ts: Date.now() })); } catch { /* storage full */ }
            console.log("ACV cached:", acvData.acv_mid, "| Source:", acvData.source_basis);
          }
        }
      }

      const vehicleContext = type === "auto" && vMake ? `Vehicle: ${vYear} ${vMake} ${vModel}${vTrim ? ` ${vTrim}` : ""}${vEngine ? `, ${vEngine}` : ""}${vMileage ? `, ${parseInt(vMileage).toLocaleString()} miles` : ""}` : "";
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
VEHICLE DETAILS: ${vYear} ${vMake} ${vModel}${vTrim ? ` ${vTrim}` : ""}${vEngine ? `, Engine: ${vEngine}` : ""}${vMileage ? ` with ${parseInt(vMileage).toLocaleString()} miles` : ""}.
Use this information to provide accurate, model-specific repair cost estimates. Consider the vehicle's market value when assessing repair vs. replace recommendations. Factor in OEM vs aftermarket parts pricing for this specific vehicle.${modelPricingContext}${acvContext}` : ""}
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
  "confidence": 0.0-1.0,
  "damages": [
    {
      "component": "MUST be from CLOSED PARTS VOCABULARY in snake_case (e.g. 'front_bumper_cover', 'front_fender_LH', 'headlamp_assembly_RH')",
      "damage_indicators": ["crushed", "torn", "pushed_in"],
      "description": "What you see — describe SPECIFIC visual evidence (cracks, dents, deformation, misalignment)"
    }
  ],
  "potential_damages": [
    {
      "component": "Name of part likely damaged but NOT visible in photos",
      "reason": "Why you believe this is likely damaged"
    }
  ],
  "recommendations": ["3-5 actionable next steps"],
  "flags": ["3-5 distinct red flags or concerns"],
  "repair_vs_replace": "repair|replace|needs_inspection"
}

IMPORTANT: Do NOT include any dollar amounts, labor hours, labor rates, paint hours, part prices, or cost estimates.
Do NOT assess severity levels, operation types (R&R, Repair, etc.), or part types (OEM, AFT, etc.).
Your ONLY job is to DETECT damage and describe WHAT INDICATORS you see. ALL derivation is done by our rules engine.`}

COMPONENT & INDICATOR NAMING (enforced by response schema):
- Component names and damage indicators are constrained by the JSON response schema enum — use ONLY values from those enums.
- For sided parts, append "_LH" or "_RH" (e.g. "headlamp_assembly_LH", "front_fender_RH").
- NEVER use generic names like "bumper" — use "front_bumper_cover" or "rear_bumper_cover".
- Each damage item MUST have at least one indicator.
- Be SPECIFIC: "buckled" = panel lost shape. "dented" = pushed inward but shape intact. "scratched" = surface marks only.
- When in doubt between two indicators, include BOTH.

DAMAGE DETECTION RULES (for auto claims):
YOU ARE A DAMAGE DETECTOR ONLY. You detect WHAT is damaged and describe WHAT YOU SEE.
Do NOT assess severity, operation type, part type, or any costs. ALL of that is calculated by our rules engine.

1. Each damage item = ONE component with its indicators. Report each damaged component ONCE with ALL applicable indicators.
2. "damages" array: ONLY damage confirmed by visual evidence. Describe SPECIFIC visual evidence in "description".
3. "potential_damages": parts NOT visible but likely damaged based on impact direction and energy transfer.

SYSTEMATIC ZONE-BY-ZONE SCAN — You MUST inspect EVERY zone in order. For each zone, report any damage found or skip if no damage is visible. Do NOT stop after finding the obvious damage — check ALL zones:
1. FRONT-CENTER: bumper cover, grille, hood, windshield, emblem
2. FRONT-LEFT: left headlamp, left fog lamp, left fender, left mirror, left front wheel/tire
3. FRONT-RIGHT: right headlamp, right fog lamp, right fender, right mirror, right front wheel/tire
4. LEFT SIDE: left doors, left rocker panel, left body side molding
5. RIGHT SIDE: right doors, right rocker panel, right body side molding
6. REAR-LEFT: left tail lamp, left rear quarter panel, left rear wheel/tire
7. REAR-RIGHT: right tail lamp, right rear quarter panel, right rear wheel/tire
8. REAR-CENTER: rear bumper cover, trunk/tailgate, rear spoiler, license plate area
9. ROOF & UPPER: roof panel, sunroof, antenna, roof rack
10. STRUCTURAL (if visible): radiator support, frame rails, core support, bumper reinforcement

SYMMETRIC DAMAGE CHECK (CRITICAL):
- Vehicles are symmetric. Every headlamp, fender, fog lamp, mirror, door, tail lamp, quarter panel, and wheel exists on BOTH sides.
- If you detect damage to ANY sided component (e.g. Headlamp RH), you MUST explicitly inspect the OTHER side (e.g. Headlamp LH) and report it if damaged.
- For front-end collisions: ALWAYS check BOTH headlamps, BOTH fenders, and BOTH fog lamps separately.
- For rear-end collisions: ALWAYS check BOTH tail lamps and BOTH rear quarter panels separately.
- NEVER report a generic unsided "Headlamp" or "Fender" — ALWAYS specify LH or RH.
- Symmetric damage is COMMON — do not assume only one side is affected.

COMPONENT IDENTIFICATION RULES (CRITICAL — read carefully):
- FLAT/DEFLATED/DAMAGED TIRE: Report as "wheel_tire_LH" or "wheel_tire_RH" — NEVER as bumper, fender, or any other component. A tire is a TIRE, not a body panel.
- MISSING DOOR GLASS: Report as "side_window_glass_LH" or "side_window_glass_RH" — NOT as "front_door_shell" or "rear_door_shell". Missing glass does NOT mean the door needs replacement.
- MISSING REAR QUARTER GLASS: Report as "quarter_glass_LH" or "quarter_glass_RH".
- MISSING WINDSHIELD: Report as "windshield".
- A component with TAPE covering an opening = the component behind the tape is MISSING (glass, panel, etc.), not the tape itself.
- Report the ACTUAL damaged/missing component, not adjacent panels. If a tire is flat, report the tire — not the bumper or fender near it.

GENERAL ACCURACY RULES:
1. If you cannot confirm whether something is damage or environmental (water/dirt/shadow), add to "flags" — do NOT include it in "damages".
2. Be precise about location: left/right, front/rear.
3. Keep recommendations to 3-5. Keep flags to 3-5.
4. Do NOT include any dollar amounts, hours, rates, or cost calculations anywhere in your response.`;

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
      geminiParts.push({ text: userPrompt });

      // Strict JSON schema for auto claims — Gemini ONLY detects damage indicators, no severity/operation/costs
      // Enum constraints force Gemini to pick from closed vocabularies → trivial consensus matching
      const allIndicators = Object.keys(INDICATOR_WEIGHTS);
      const autoResponseSchema = type === "auto" ? {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          damage_type: { type: "STRING", enum: ["auto"] },
          confidence: { type: "NUMBER" },
          damages: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                component: { type: "STRING", enum: ALL_PARTS },
                damage_indicators: {
                  type: "ARRAY",
                  items: { type: "STRING", enum: allIndicators },
                },
                description: { type: "STRING" },
              },
              required: ["component", "damage_indicators", "description"],
            },
          },
          potential_damages: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                component: { type: "STRING" },
                reason: { type: "STRING" },
              },
            },
          },
          areas_not_visible: {
            type: "ARRAY",
            description: "Parts/zones NOT shown in any photo — helps distinguish 'not damaged' from 'not visible'",
            items: { type: "STRING" },
          },
          recommendations: { type: "ARRAY", items: { type: "STRING" } },
          flags: { type: "ARRAY", items: { type: "STRING" } },
          repair_vs_replace: { type: "STRING", enum: ["repair", "replace", "needs_inspection"] },
        },
        required: ["summary", "damage_type", "confidence", "damages", "areas_not_visible", "recommendations", "flags", "repair_vs_replace"],
      } : null;

      const geminiRequestBody = JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: geminiParts }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          ...(autoResponseSchema ? { responseSchema: autoResponseSchema } : {}),
        },
      });

      const NUM_RUNS = 3;
      const PRIMARY_MODEL = geminiTier === "pro" ? "gemini-3.1-pro-preview" : "gemini-2.5-flash";
      const FALLBACK_1 = geminiTier === "pro" ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";
      const FALLBACK_2 = "gemini-3-flash-preview";
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // --- Gemini API ---
      const geminiApiUrl = (model) =>
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

      const fetchGeminiRun = async (runIdx, model) => {
        const r = await fetch(geminiApiUrl(model), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: geminiRequestBody,
        });
        const data = await r.json();
        if (data.error) throw new Error(data.error.message);
        const txt = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
        const clean = txt.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
      };

      console.log(`Starting ${NUM_RUNS} parallel runs (${PRIMARY_MODEL} → ${FALLBACK_1} → ${FALLBACK_2})...`);

      const geminiPromises = Array.from({ length: NUM_RUNS }, (_, i) =>
        fetchGeminiRun(i, PRIMARY_MODEL)
          .then(result => { console.log(`Run ${i + 1} (${PRIMARY_MODEL}): OK`); return result; })
          .catch(async (err) => {
            console.warn(`Run ${i + 1} (${PRIMARY_MODEL}) failed: ${err.message} — retry in 3s...`);
            await delay(3000);
            return fetchGeminiRun(i, PRIMARY_MODEL)
              .then(result => { console.log(`Run ${i + 1} (${PRIMARY_MODEL} retry): OK`); return result; })
              .catch(async (err2) => {
                console.warn(`Run ${i + 1} (${PRIMARY_MODEL} retry) failed: ${err2.message} — trying ${FALLBACK_1}...`);
                return fetchGeminiRun(i, FALLBACK_1)
                  .then(result => { console.log(`Run ${i + 1} (${FALLBACK_1}): OK`); return result; })
                  .catch(async (err3) => {
                    console.warn(`Run ${i + 1} (${FALLBACK_1}) failed: ${err3.message} — trying ${FALLBACK_2}...`);
                    return fetchGeminiRun(i, FALLBACK_2)
                      .then(result => { console.log(`Run ${i + 1} (${FALLBACK_2}): OK`); return result; })
                      .catch(err4 => { console.error(`Run ${i + 1} ALL models failed:`, err4.message); return null; });
                  });
              });
          })
      );

      const settled = await Promise.allSettled(geminiPromises);
      clearInterval(progressInterval);
      const validResults = settled
        .filter(r => r.status === "fulfilled" && r.value)
        .map(r => r.value);
      console.log(`Valid results: ${validResults.length}/${NUM_RUNS}`);
      validResults.forEach((r, i) => console.log(`Run ${i + 1}: ${r.damages?.length || 0} damages, severity=${r.severity}, components:`, (r.damages || []).map(d => d.component).join(", ")));

      if (validResults.length === 0) throw new Error("All Gemini requests failed");

      // --- Merge multiple assessments ---
      const mergeAssessments = (assessments) => {
        const isAutoType = assessments[0]?.damage_type === "auto" || assessments[0]?.damage_type === undefined;

        // --- AUTO CLAIMS: Use detection engine for deterministic derivation ---
        // Engine handles: merge runs → indicator consensus → derive severity/operation/part_type
        //                 → guaranteed structural pairs → R&I cascade → inspection checklist
        let mergedDamages, engineChecklist, enginePotentials, engineAssessment;
        if (isAutoType) {
          const detection = processDetection(assessments, { make: vMake, model: vModel, year: vYear }, photos);
          mergedDamages = detection.damages;
          engineChecklist = detection.adjuster_checklist;
          enginePotentials = detection.potential_damages;
          engineAssessment = detection.mergedAssessment;
          console.log(`[engine] ${mergedDamages.length} damages, enrichmentFlags:`, mergedDamages._enrichmentFlags);
        } else {
          // --- PROPERTY CLAIMS: Legacy merge with low/high ranges ---
          const normalizeComponent = (name) => {
            const words = name.toLowerCase().replace(/_/g, " ").replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).sort();
            return words.join("_");
          };
          const getSide = (key) => {
            const words = key.split("_");
            if (words.includes("lh") || words.includes("left")) return "L";
            if (words.includes("rh") || words.includes("right")) return "R";
            return null;
          };
          const isSimilar = (a, b) => {
            if (a === b) return true;
            const sideA = getSide(a), sideB = getSide(b);
            if (sideA && sideB && sideA !== sideB) return false;
            if ((sideA && !sideB) || (!sideA && sideB)) return false;
            if (a.includes(b) || b.includes(a)) return true;
            const aw = a.split("_"), bw = b.split("_");
            const shared = aw.filter(w => bw.includes(w)).length;
            return shared / Math.max(aw.length, bw.length) >= 0.7;
          };
          const damageMap = {};
          assessments.forEach((a, runIdx) => {
            (a.damages || []).forEach(d => {
              const norm = normalizeComponent(d.component);
              let canonKey = null;
              for (const existing of Object.keys(damageMap)) {
                if (isSimilar(norm, existing)) { canonKey = existing; break; }
              }
              if (!canonKey) canonKey = norm;
              if (!damageMap[canonKey]) damageMap[canonKey] = { component: d.component, entries: [] };
              damageMap[canonKey].entries.push({ ...d, runIdx });
            });
          });
          const minVotes = assessments.length === 1 ? 1 : 2;
          mergedDamages = [];
          for (const [key, info] of Object.entries(damageMap)) {
            const uniqueRuns = new Set(info.entries.map(e => e.runIdx)).size;
            if (uniqueRuns >= minVotes) {
              const entries = info.entries;
              const bestEntry = entries.sort((a, b) => (b.description || "").length - (a.description || "").length)[0];
              const avgLow = Math.round(entries.reduce((s, e) => s + (e.estimated_cost_low || 0), 0) / entries.length);
              const avgHigh = Math.round(entries.reduce((s, e) => s + (e.estimated_cost_high || 0), 0) / entries.length);
              const merged = {
                component: info.component, description: bestEntry.description, severity: bestEntry.severity || "moderate",
                estimated_cost_low: avgLow, estimated_cost_high: avgHigh,
              };
              if (bestEntry.cost_breakdown) merged.cost_breakdown = bestEntry.cost_breakdown;
              if (bestEntry.room) merged.room = bestEntry.room;
              if (bestEntry.surface) merged.surface = bestEntry.surface;
              if (bestEntry.quantity) { merged.quantity = bestEntry.quantity; merged.unit = bestEntry.unit; merged.unit_cost_low = bestEntry.unit_cost_low; merged.unit_cost_high = bestEntry.unit_cost_high; }
              mergedDamages.push(merged);
            }
          }
        }

        // --- Post-processing PHASE 2: override hours, rates, and prices with our database ---
        // This is the KEY to stable estimates: Gemini detects WHAT is damaged,
        // but all dollar values come from our deterministic database.
        if (type === "auto") {
          const vehClass = getVehicleClass(vMake, vModel);
          const classMulti = getClassMultiplier(vehClass);
          const classFactor = (classMulti[0] + classMulti[1]) / 2;
          const stateData = US_STATES.find(s => s.value === claimState) || { autoLaborRate: 143 };
          // autoLaborRate is general auto repair rate; body rate is ~55% of that
          // This aligns with real insurer data: GEICO CA body=$78, our CA auto=$150, 78/150=0.52
          // Using 0.55 as middle ground between insurer DRP and retail body shop rates
          const stateBodyRate = Math.round(stateData.autoLaborRate * 0.55);
          const statePaintRate = stateBodyRate; // Paint rate ≈ body rate in most markets
          let overrideCount = 0;
          for (const d of mergedDamages) {
            if (!d.operation) continue;
            const compName = d.component || "";
            const op = (d.operation || "").toUpperCase();

            // 0. CREATE labor/paint from DB if Gemini omitted them (JSON schema makes them optional)
            if (!d.labor && op !== "SUBLET" && op !== "REFINISH" && op !== "BLEND") {
              const dbEntry = getLaborHours(compName);
              if (dbEntry) {
                const dbMid = Math.round(((dbEntry.hours[0] + dbEntry.hours[1]) / 2) * classFactor * 10) / 10;
                d.labor = { hours: dbMid, rate: stateBodyRate, type: dbEntry.type || "body" };
                overrideCount++;
              } else if (op === "REPAIR") {
                const sev = (d.severity || "moderate").toLowerCase();
                const compRepair = getRepairHours(compName, sev);
                if (compRepair) {
                  const repMid = Math.round(((compRepair.hours[0] + compRepair.hours[1]) / 2) * classFactor * 10) / 10;
                  d.labor = { hours: repMid, rate: stateBodyRate, type: compRepair.type || "body" };
                } else {
                  const repairHrs = sev === "minor" ? LABOR_TIMES.repair.light.hours
                    : sev === "severe" ? LABOR_TIMES.repair.heavy.hours
                    : LABOR_TIMES.repair.moderate.hours;
                  const repMid = Math.round(((repairHrs[0] + repairHrs[1]) / 2) * classFactor * 10) / 10;
                  d.labor = { hours: repMid, rate: stateBodyRate, type: "body" };
                }
                overrideCount++;
              } else {
                d.labor = { hours: 1.0, rate: stateBodyRate, type: "body" };
              }
            }
            // Create paint for exterior R&R panels that need refinish
            const PAINTABLE = ["bumper_cover", "fender", "hood", "door_shell", "door_skin", "trunk_lid", "deck_lid", "quarter_panel", "rocker_panel", "roof_panel", "tailgate", "liftgate", "rear_body_panel", "body_side_panel", "rear_spoiler"];
            const NOT_PAINTABLE = ["reinforcement", "absorber", "bracket", "insulator", "hinge", "latch", "liner", "shield", "sensor", "harness", "mount", "support", "crossmember", "frame_rail", "floor_pan"];
            const cl = compName.toLowerCase();
            if (!d.paint && (op === "R&R" || op === "R&I" || op === "REPAIR" || op === "REFINISH" || op === "BLEND") && PAINTABLE.some(p => cl.includes(p)) && !NOT_PAINTABLE.some(p => cl.includes(p))) {
              const dbPaint = getRefinishHours(compName);
              if (dbPaint) {
                const paintMid = Math.round(((dbPaint.hours[0] + dbPaint.hours[1]) / 2) * 10) / 10;
                d.paint = { hours: paintMid, rate: statePaintRate, materials: Math.round(paintMid * (LABOR_TIMES.paint_materials.mid || 40)) };
              }
            }

            // 1. Override labor RATES with state database rates (deterministic)
            if (d.labor) {
              const typeMultiplier = LABOR_RATE_CATEGORIES[d.labor.type]?.multiplier || 1.0;
              d.labor.rate = Math.round(stateBodyRate * typeMultiplier);
            }
            if (d.paint) {
              d.paint.rate = statePaintRate;
            }

            // 2. Override labor HOURS from database — ALWAYS use DB values, never trust Gemini
            if (d.labor && (op === "R&R" || op === "R&I")) {
              const dbEntry = getLaborHours(compName);
              if (dbEntry) {
                const dbMid = Math.round(((dbEntry.hours[0] + dbEntry.hours[1]) / 2) * classFactor * 10) / 10;
                d.labor.hours = dbMid;
                d.labor.type = dbEntry.type || d.labor.type;
                const typeMultiplier = LABOR_RATE_CATEGORIES[d.labor.type]?.multiplier || 1.0;
                d.labor.rate = Math.round(stateBodyRate * typeMultiplier);
                overrideCount++;
              }
            } else if (d.labor && op === "REPAIR") {
              // For REPAIR: 1) per-component repair hours, 2) 60% of R&R, 3) generic severity
              const sev = (d.severity || "moderate").toLowerCase();
              const compRepair = getRepairHours(compName, sev);
              if (compRepair) {
                const repMid = Math.round(((compRepair.hours[0] + compRepair.hours[1]) / 2) * classFactor * 10) / 10;
                d.labor.hours = repMid;
                d.labor.type = compRepair.type || d.labor.type;
                overrideCount++;
              } else {
                const dbEntry = getLaborHours(compName);
                if (dbEntry) {
                  const repMid = Math.round(((dbEntry.hours[0] + dbEntry.hours[1]) / 2) * 0.6 * classFactor * 10) / 10;
                  d.labor.hours = repMid;
                  d.labor.type = dbEntry.type || d.labor.type;
                  overrideCount++;
                } else {
                  const repairHrs = sev === "minor" ? LABOR_TIMES.repair.light.hours
                    : sev === "severe" ? LABOR_TIMES.repair.heavy.hours
                    : LABOR_TIMES.repair.moderate.hours;
                  const repMid = Math.round(((repairHrs[0] + repairHrs[1]) / 2) * classFactor * 10) / 10;
                  d.labor.hours = repMid;
                  overrideCount++;
                }
              }
            } else if (d.labor && (op === "REFINISH" || op === "BLEND")) {
              // Refinish/Blend: ALL work is in paint hours, not body labor
              d.labor.hours = 0;
            } else if (d.labor && op === "SUBLET") {
              // Sublet: zero out labor hours (cost is in sublet field)
              d.labor.hours = 0;
            }

            // 3. Override paint hours from database — for ANY operation that has paint
            if (d.paint) {
              const dbPaint = getRefinishHours(compName);
              if (dbPaint) {
                const paintMid = (dbPaint.hours[0] + dbPaint.hours[1]) / 2;
                d.paint.hours = op === "BLEND"
                  ? Math.round(paintMid * LABOR_TIMES.blend.two_stage_pct * 10) / 10
                  : Math.round(paintMid * 10) / 10;
                // Three-stage paint: +35% hours for Tesla, luxury brands (pearl/metallic tricoat)
                const flags = mergedDamages._enrichmentFlags;
                if (flags?.isThreeStage) {
                  d.paint.hours = Math.round(d.paint.hours * 1.35 * 10) / 10;
                }
                d.paint.materials = Math.round(d.paint.hours * (LABOR_TIMES.paint_materials.mid || 40));
              }
            }

            // 4. Create/override part PRICES from database (deterministic)
            if (op === "R&R" || op === "R&I") {
              const dbPrice = getPartPrice(compName, op, vehClass);
              if (dbPrice) {
                const partType = d.part_type || "AFT";
                d.part_info = {
                  type: partType,
                  price: dbPrice.price,
                  oem_price: dbPrice.oem_price,
                };
              }
            }

            // 5. Create sublet cost from DB for Sublet operations
            if (op === "SUBLET" && !d.sublet) {
              const cn = compName.toLowerCase().replace(/[\s\-]+/g, "_");
              if (cn.includes("pre_repair") || cn.includes("pre_scan")) {
                d.sublet = (DIAGNOSTIC_FLAT_RATES.pre_repair_scan.low + DIAGNOSTIC_FLAT_RATES.pre_repair_scan.high) / 2;
              } else if (cn.includes("post_repair") || cn.includes("post_scan")) {
                d.sublet = (DIAGNOSTIC_FLAT_RATES.post_repair_scan.low + DIAGNOSTIC_FLAT_RATES.post_repair_scan.high) / 2;
              } else if (cn.includes("align")) {
                d.sublet = (DIAGNOSTIC_FLAT_RATES.four_wheel_align.low + DIAGNOSTIC_FLAT_RATES.four_wheel_align.high) / 2;
              } else if (cn.includes("adas") || cn.includes("calibrat")) {
                d.sublet = (DIAGNOSTIC_FLAT_RATES.adas_static_calibration.low + DIAGNOSTIC_FLAT_RATES.adas_static_calibration.high) / 2;
              } else if (cn.includes("scan") || cn.includes("diagnostic")) {
                d.sublet = (DIAGNOSTIC_FLAT_RATES.pre_post_scan_combo.low + DIAGNOSTIC_FLAT_RATES.pre_post_scan_combo.high) / 2;
              } else if (cn.includes("ac_recharge") || cn.includes("a_c") || cn.includes("recharge")) {
                d.sublet = 150;
              } else if (cn.includes("frame_setup") || cn.includes("jig")) {
                // Frame jig setup: 8 hrs × frame rate (from GEICO data)
                const frameRate = Math.round(stateBodyRate * (LABOR_RATE_CATEGORIES.frame?.multiplier || 1.5));
                d.sublet = 8 * frameRate;
              } else if (cn.includes("suspension_ri") || cn.includes("susp")) {
                // Rear/front suspension R&I: ~5-8 hrs mechanical
                const mechRate = Math.round(stateBodyRate * (LABOR_RATE_CATEGORIES.mechanical?.multiplier || 2.0));
                d.sublet = 6 * mechRate;
              } else {
                d.sublet = 100; // generic sublet fallback
              }
              d.sublet = Math.round(d.sublet);
            }

            // 6. Recalculate estimated_cost from DB-built breakdown
            const laborCost = d.labor ? Math.round(d.labor.hours * d.labor.rate) : 0;
            const paintCost = d.paint ? Math.round(d.paint.hours * d.paint.rate) + (d.paint.materials || 0) : 0;
            const partCost = d.part_info?.price || 0;
            const subletCost = d.sublet || 0;
            const recalc = laborCost + paintCost + partCost + subletCost;
            d.estimated_cost = recalc;
          }
          if (overrideCount > 0) console.log(`Overrides applied: ${overrideCount} labor hours, rates=$${stateBodyRate}/hr (class factor: ${classFactor.toFixed(2)})`);
        }

        // Calculate totals — Mitchell auto uses single estimated_cost, property uses low/high
        const isMitchell = mergedDamages.some(d => d.operation !== undefined);
        const totalEstimate = isMitchell
          ? mergedDamages.reduce((s, d) => s + (d.estimated_cost || 0), 0)
          : 0;
        const totalLow = isMitchell ? totalEstimate : mergedDamages.reduce((s, d) => s + (d.estimated_cost_low || 0), 0);
        const totalHigh = isMitchell ? totalEstimate : mergedDamages.reduce((s, d) => s + (d.estimated_cost_high || 0), 0);

        // Build estimate_summary for Mitchell auto by aggregating across merged damages
        let mergedEstimateSummary = null;
        if (isMitchell) {
          mergedEstimateSummary = {
            body_labor_hours: 0, body_labor_amount: 0,
            mechanical_labor_hours: 0, mechanical_labor_amount: 0,
            structural_labor_hours: 0, structural_labor_amount: 0,
            diagnostic_labor_hours: 0, diagnostic_labor_amount: 0,
            paint_labor_hours: 0, paint_labor_amount: 0,
            paint_materials: 0, parts_total: 0, parts_oem_total: 0,
            sublet_total: 0, parts_tax_rate: 0, parts_tax_amount: 0,
            gross_total: totalEstimate, net_total: totalEstimate,
          };
          for (const d of mergedDamages) {
            if (d.labor) {
              const hrs = d.labor.hours || 0;
              const amt = hrs * (d.labor.rate || 0);
              const lt = d.labor.type || "body";
              if (lt === "body") { mergedEstimateSummary.body_labor_hours += hrs; mergedEstimateSummary.body_labor_amount += amt; }
              else if (lt === "mechanical") { mergedEstimateSummary.mechanical_labor_hours += hrs; mergedEstimateSummary.mechanical_labor_amount += amt; }
              else if (lt === "structural" || lt === "frame") { mergedEstimateSummary.structural_labor_hours += hrs; mergedEstimateSummary.structural_labor_amount += amt; }
              else if (lt === "diagnostic" || lt === "aluminum" || lt === "glass") { mergedEstimateSummary.diagnostic_labor_hours += hrs; mergedEstimateSummary.diagnostic_labor_amount += amt; }
              else if (lt === "paint") { mergedEstimateSummary.paint_labor_hours += hrs; mergedEstimateSummary.paint_labor_amount += amt; }
            }
            if (d.paint) {
              mergedEstimateSummary.paint_labor_hours += d.paint.hours || 0;
              mergedEstimateSummary.paint_labor_amount += (d.paint.hours || 0) * (d.paint.rate || 0);
              mergedEstimateSummary.paint_materials += d.paint.materials || 0;
            }
            if (d.part_info) {
              mergedEstimateSummary.parts_total += d.part_info.price || 0;
              mergedEstimateSummary.parts_oem_total += d.part_info.oem_price || d.part_info.price || 0;
            }
            mergedEstimateSummary.sublet_total += d.sublet || 0;
          }
          // Compute parts tax based on state
          const taxRate = STATE_SALES_TAX[claimState] || 0;
          mergedEstimateSummary.parts_tax_rate = taxRate;
          mergedEstimateSummary.parts_tax_amount = Math.round(mergedEstimateSummary.parts_total * taxRate * 100) / 100;
          mergedEstimateSummary.net_total = Math.round((totalEstimate + mergedEstimateSummary.parts_tax_amount) * 100) / 100;
          // Round all values
          for (const k of Object.keys(mergedEstimateSummary)) {
            if (typeof mergedEstimateSummary[k] === "number") mergedEstimateSummary[k] = Math.round(mergedEstimateSummary[k] * 100) / 100;
          }
          // NOTE: We no longer override with AI's estimate_summary because our
          // mergedEstimateSummary is built from post-override line items (corrected labor hours).
          // AI's summary uses pre-override hours which causes summary ≠ line items mismatch.
        }

        // Fuzzy-deduplicate helper
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

        // --- Recommendations, flags, confidence ---
        const allRecs = isAutoType && engineAssessment
          ? engineAssessment.recommendations.slice(0, 5)
          : fuzzyDedup(assessments.flatMap(a => a.recommendations || [])).slice(0, 5);
        const allFlags = isAutoType && engineAssessment
          ? engineAssessment.flags.slice(0, 5)
          : fuzzyDedup(assessments.flatMap(a => a.flags || [])).slice(0, 5);
        const avgConf = isAutoType && engineAssessment
          ? engineAssessment.confidence
          : assessments.reduce((s, a) => s + (a.confidence || 0), 0) / assessments.length;

        // --- Potential damages ---
        let potentialDamages, potentialTotal, potentialTotalLow, potentialTotalHigh;
        if (isAutoType && enginePotentials) {
          potentialDamages = enginePotentials;
          potentialTotal = 0; // No costs on potentials
          potentialTotalLow = 0;
          potentialTotalHigh = 0;
        } else {
          // Property: merge potential damages with costs
          const normalizeComp = (name) => name.toLowerCase().replace(/_/g, " ").replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).sort().join("_");
          const potentialMap = {};
          assessments.forEach(a => {
            (a.potential_damages || []).forEach(pd => {
              const key = normalizeComp(pd.component || "");
              if (!potentialMap[key]) potentialMap[key] = { ...pd, count: 1 };
              else {
                potentialMap[key].count++;
                if (pd.estimated_cost_low !== undefined) {
                  potentialMap[key].estimated_cost_low = Math.round(((potentialMap[key].estimated_cost_low || 0) + (pd.estimated_cost_low || 0)) / 2);
                  potentialMap[key].estimated_cost_high = Math.round(((potentialMap[key].estimated_cost_high || 0) + (pd.estimated_cost_high || 0)) / 2);
                }
                if ((pd.reason || "").length > (potentialMap[key].reason || "").length) potentialMap[key].reason = pd.reason;
              }
            });
          });
          potentialDamages = Object.values(potentialMap).map(({ count, ...rest }) => rest);
          potentialTotal = 0;
          potentialTotalLow = potentialDamages.reduce((s, d) => s + (d.estimated_cost_low || 0), 0);
          potentialTotalHigh = potentialDamages.reduce((s, d) => s + (d.estimated_cost_high || 0), 0);
        }

        // Merge vehicle_acv — average across runs that have it
        const acvRuns = assessments.filter(a => a.vehicle_acv?.mid);
        let mergedAcv = null;
        if (acvRuns.length > 0) {
          mergedAcv = {
            low: Math.round(acvRuns.reduce((s, a) => s + (a.vehicle_acv.low || 0), 0) / acvRuns.length),
            high: Math.round(acvRuns.reduce((s, a) => s + (a.vehicle_acv.high || 0), 0) / acvRuns.length),
            mid: Math.round(acvRuns.reduce((s, a) => s + (a.vehicle_acv.mid || 0), 0) / acvRuns.length),
            source: acvRuns[0].vehicle_acv.source || "",
          };
        }

        // Merge total_loss_analysis — use SINGLE estimate vs ACV
        let mergedTotalLoss = null;
        if (mergedAcv?.mid) {
          const repairEstimate = isMitchell ? totalEstimate : Math.round(totalLow * 0.6 + totalHigh * 0.4);
          const acvValue = mergedAcv.mid;
          const pct = Math.round((repairEstimate / acvValue) * 100);
          const rec = pct > 75 ? "total_loss" : pct > 60 ? "borderline" : "repair";
          const reasoning = rec === "total_loss"
            ? `Estimated repair $${repairEstimate.toLocaleString()} = ${pct}% of ACV $${acvValue.toLocaleString()}, exceeds 75% total loss threshold`
            : rec === "borderline"
            ? `Estimated repair $${repairEstimate.toLocaleString()} = ${pct}% of ACV $${acvValue.toLocaleString()}, approaching total loss threshold — physical inspection required`
            : `Estimated repair $${repairEstimate.toLocaleString()} = ${pct}% of ACV $${acvValue.toLocaleString()}, within economic repair range`;
          mergedTotalLoss = { repair_estimate: repairEstimate, acv_value: acvValue, repair_to_acv_pct: pct, threshold_pct: 75, recommendation: rec, reasoning };
        }

        // Adjuster checklist: engine provides deterministic list for auto; property uses Gemini
        const allChecklist = isAutoType && engineChecklist
          ? engineChecklist.slice(0, 15)
          : fuzzyDedup(assessments.flatMap(a => a.adjuster_checklist || [])).slice(0, 10);

        // Determine severity from total_loss analysis or engine
        const baseSeverity = isAutoType && engineAssessment
          ? engineAssessment.severity
          : assessments.reduce((counts, a) => { const v = a.severity; if (v) counts[v] = (counts[v] || 0) + 1; return counts; }, {});
        const pickMostCommon = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "moderate";
        const severity = mergedTotalLoss?.recommendation === "total_loss" ? "total_loss"
          : typeof baseSeverity === "string" ? baseSeverity
          : pickMostCommon(baseSeverity);

        const result = {
          summary: isAutoType && engineAssessment
            ? engineAssessment.summary
            : assessments.sort((a, b) => (b.summary || "").length - (a.summary || "").length)[0]?.summary || "",
          damage_type: assessments[0].damage_type,
          severity,
          confidence: Math.round(avgConf * 100) / 100,
          damages: mergedDamages,
          vehicle_acv: mergedAcv,
          total_loss_analysis: mergedTotalLoss,
          adjuster_checklist: allChecklist,
          potential_damages: potentialDamages,
          recommendations: allRecs,
          flags: allFlags,
          repair_vs_replace: mergedTotalLoss?.recommendation === "total_loss" ? "replace"
            : mergedTotalLoss?.recommendation === "borderline" ? "needs_inspection"
            : mergedTotalLoss?.recommendation === "repair" ? "repair"
            : isAutoType && engineAssessment ? engineAssessment.repair_vs_replace
            : "needs_inspection",
          _runs: assessments.length,
          _consensus: `${mergedDamages.length} components (detection engine)`,
          // Aggregate areas_not_visible — keep only zones reported by ALL runs (intersection)
          areas_not_visible: isAutoType
            ? assessments
                .map(a => new Set(a.areas_not_visible || []))
                .reduce((acc, s) => acc ? new Set([...acc].filter(x => s.has(x))) : s, null)
                ? [...assessments
                    .map(a => new Set(a.areas_not_visible || []))
                    .reduce((acc, s) => new Set([...acc].filter(x => s.has(x))))]
                : []
            : [],
        };

        if (isMitchell) {
          result.total_estimate = totalEstimate;
          result.estimate_summary = mergedEstimateSummary;
          result.potential_total = potentialTotal;
        } else {
          result.total_estimate_low = totalLow;
          result.total_estimate_high = totalHigh;
          result.potential_total_low = potentialTotalLow;
          result.potential_total_high = potentialTotalHigh;
        }

        return result;
      };

      const assessment = mergeAssessments(validResults);
      assessment.geminiRuns = `${validResults.length}/${NUM_RUNS}`;
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

      // Override AI's ACV with pre-lookup data if available (more accurate)
      if (acvData && acvData.acv_mid) {
        assessment.vehicle_acv = {
          low: acvData.acv_low,
          high: acvData.acv_high,
          mid: acvData.acv_mid,
          source: acvData.source_basis || "Gemini pre-lookup",
        };
        // Recalculate total loss analysis with pre-lookup ACV — single number like real adjusters
        // Mitchell auto: use total_estimate directly; Property fallback: weighted midpoint
        const repairEstimate = assessment.total_estimate
          ? assessment.total_estimate
          : Math.round((assessment.total_estimate_low || 0) * 0.6 + (assessment.total_estimate_high || 0) * 0.4);
        const acvMid = acvData.acv_mid;
        const pct = Math.round((repairEstimate / acvMid) * 100);
        const rec = pct > 75 ? "total_loss" : pct > 60 ? "borderline" : "repair";
        assessment.total_loss_analysis = {
          repair_estimate: repairEstimate,
          acv_value: acvMid,
          repair_to_acv_pct: pct,
          threshold_pct: 75,
          recommendation: rec,
          reasoning: rec === "total_loss"
            ? `Estimated repair $${repairEstimate.toLocaleString()} = ${pct}% of ACV $${acvMid.toLocaleString()}, exceeds 75% total loss threshold`
            : rec === "borderline"
            ? `Estimated repair $${repairEstimate.toLocaleString()} = ${pct}% of ACV $${acvMid.toLocaleString()}, approaching total loss threshold — physical inspection required`
            : `Estimated repair $${repairEstimate.toLocaleString()} = ${pct}% of ACV $${acvMid.toLocaleString()}, within economic repair range`,
        };
        // Sync severity AND repair_vs_replace with total_loss_analysis
        if (rec === "total_loss") { assessment.severity = "total_loss"; assessment.repair_vs_replace = "replace"; }
        else if (rec === "borderline") { if (assessment.severity === "total_loss") assessment.severity = "severe"; assessment.repair_vs_replace = "needs_inspection"; }
        else if (rec === "repair") { if (assessment.severity === "total_loss") assessment.severity = "severe"; assessment.repair_vs_replace = "repair"; }
      } else if (type === "auto" && !assessment.vehicle_acv?.mid) {
        // ACV lookup failed — show warning block so adjusters know manual appraisal is needed
        assessment.vehicle_acv = { low: 0, high: 0, mid: 0, source: "unavailable" };
        const repairEstimate = assessment.total_estimate || 0;
        assessment.total_loss_analysis = {
          repair_estimate: repairEstimate,
          acv_value: 0,
          repair_to_acv_pct: 0,
          threshold_pct: 75,
          recommendation: "needs_appraisal",
          reasoning: `ACV data unavailable — manual vehicle appraisal required to determine total loss status. Repair estimate: $${repairEstimate.toLocaleString()}.${vYear && parseInt(vYear) < 2010 ? " Vehicle age (" + vYear + ") suggests ACV may be low — total loss likely." : ""}`,
        };
      }

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
        vehicle: type === "auto" ? { make: vMake, model: vModel, year: vYear, trim: vTrim || "Base", engine: vEngine, mileage: vMileage } : null,
        property: type === "property" ? { type: pType, cause: pCause, area: pArea, sqft: pSqft, yearBuilt: pYearBuilt, address: pAddress } : null,
        createdAt: new Date().toISOString(),
        aiModel: geminiTier === "pro" ? "Gemini 3.1 Pro" : "Gemini 2.5 Flash",
        appVersion: APP_VERSION,
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
            <Select label="Year *" value={vYear} onChange={handleYearChange} options={years} placeholder={vMake ? "Select year..." : "Select make first"} disabled={!vMake} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Select label="Model *" value={vModel} onChange={handleModelChange} options={models} placeholder={vYear ? "Select model..." : "Select year first"} disabled={!vYear} />
            <Select label="Trim" value={vTrim} onChange={setVTrim} options={trims} placeholder={trims.length ? "Select trim..." : "Base"} disabled={!vModel} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <Select label="Engine" value={vEngine} onChange={setVEngine} options={engines} placeholder={engines.length <= 1 ? (engines[0] || "N/A") : "Select engine..."} disabled={!vModel || engines.length <= 1} />
            <Input label="Mileage" value={vMileage} onChange={setVMileage} placeholder="e.g. 85000" type="number" />
            <Select label="State *" value={claimState} onChange={setClaimState} options={US_STATES} placeholder="Select state..." />
          </div>
          {vMake && vModel && vYear && (
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: palette.accentSoft, fontSize: 12, color: palette.accent, fontWeight: 500 }}>
              {vYear} {vMake} {vModel}{vTrim ? ` ${vTrim}` : ""}{vEngine ? ` · ${vEngine}` : ""}{vMileage ? ` · ${parseInt(vMileage).toLocaleString()} mi` : ""}
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

      {/* AI Model Tier Selector */}
      {type === "auto" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: palette.textMuted, whiteSpace: "nowrap" }}>AI Model:</span>
          <div style={{ display: "flex", flex: 1, background: palette.surfaceAlt, borderRadius: 8, padding: 2 }}>
            {[
              { key: "pro", label: "Pro", sub: "Gemini 3.1 Pro" },
              { key: "regular", label: "Regular", sub: "Gemini 2.5 Flash" },
            ].map(opt => (
              <button key={opt.key} onClick={() => setGeminiTier(opt.key)} style={{
                flex: 1, padding: "6px 8px", border: "none", borderRadius: 6, cursor: "pointer",
                fontFamily: font, fontSize: 12, fontWeight: geminiTier === opt.key ? 600 : 400,
                background: geminiTier === opt.key ? palette.accent : "transparent",
                color: geminiTier === opt.key ? "#fff" : palette.textMuted,
                transition: "all 0.2s",
                boxShadow: geminiTier === opt.key ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
              }}>
                {opt.label}
              </button>
            ))}
          </div>
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
                    {c.type === "auto" && c.vehicle?.make ? `${c.vehicle.year} ${c.vehicle.make} ${c.vehicle.model}${c.vehicle.trim ? ` ${c.vehicle.trim}` : ""}` : c.type === "auto" ? "Vehicle Damage" : c.property?.type ? `${PROPERTY_TYPES.find(p=>p.value===c.property.type)?.label || "Property"} Damage` : "Property Damage"}
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
                  {c.assessment && (c.assessment.total_estimate != null
                    ? ` · $${c.assessment.total_estimate?.toLocaleString()}`
                    : ` · $${c.assessment.total_estimate_low?.toLocaleString()}–$${c.assessment.total_estimate_high?.toLocaleString()}`)}
                  {c.assessment?.total_loss_analysis?.recommendation === "total_loss" && (
                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: palette.dangerSoft, color: palette.danger, textTransform: "uppercase" }}>Total Loss</span>
                  )}
                  {c.assessment?.total_loss_analysis?.recommendation === "borderline" && (
                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: palette.warningSoft, color: palette.warning, textTransform: "uppercase" }}>Borderline</span>
                  )}
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
    report += `Build: v${APP_VERSION}\n`;
    report += `Type: ${claim.type === "auto" ? "Vehicle" : "Property"} Damage\n`;
    report += `Location: ${claim.location || "Not specified"}\n`;
    report += `Severity: ${a.severity?.toUpperCase()}\n`;
    report += `Confidence: ${Math.round((a.confidence || 0) * 100)}%\n\n`;
    report += `SUMMARY\n${"-".repeat(30)}\n${a.summary}\n\n`;
    report += a.total_estimate != null
      ? `ESTIMATED COST: $${a.total_estimate?.toLocaleString()}\n\n`
      : `ESTIMATED COST: $${a.total_estimate_low?.toLocaleString()} — $${a.total_estimate_high?.toLocaleString()}\n\n`;
    if (claim.type === "auto" && a.total_loss_analysis) {
      const tla = a.total_loss_analysis;
      report += `TOTAL LOSS ANALYSIS\n${"-".repeat(30)}\n`;
      if (tla.recommendation === "needs_appraisal") {
        report += `Vehicle ACV: UNAVAILABLE — Manual appraisal required\n`;
        report += `Repair Estimate: $${(tla.repair_estimate || 0).toLocaleString()}\n`;
      } else {
        report += `Vehicle ACV: $${a.vehicle_acv?.low?.toLocaleString()} — $${a.vehicle_acv?.high?.toLocaleString()} (mid: $${a.vehicle_acv?.mid?.toLocaleString()})\n`;
        report += `Repair Estimate: $${(tla.repair_estimate || 0).toLocaleString()} | ACV: $${(tla.acv_value || 0).toLocaleString()} | Ratio: ${tla.repair_to_acv_pct}% (threshold: ${tla.threshold_pct}%)\n`;
      }
      report += `Determination: ${tla.recommendation?.toUpperCase().replace("_", " ")}\n`;
      report += `${tla.reasoning}\n\n`;
    }
    report += `DAMAGE DETAILS\n${"-".repeat(30)}\n`;
    a.damages?.forEach((d, i) => {
      const op = d.operation ? ` [${d.operation}]` : "";
      const partType = d.part_info?.type ? ` (${d.part_info.type})` : "";
      report += `${i + 1}. ${d.component}${op}${partType} — ${d.severity}\n`;
      report += `   ${d.description}\n`;
      if (d.estimated_cost != null) {
        report += `   Est: $${d.estimated_cost?.toLocaleString()}`;
        if (d.labor?.hours) report += ` | Labor: ${d.labor.hours} hrs × $${d.labor.rate}/hr (${d.labor.type})`;
        if (d.part_info?.price) report += ` | Part: $${d.part_info.price}`;
        if (d.paint?.hours) report += ` | Paint: ${d.paint.hours} hrs`;
        if (d.sublet) report += ` | Sublet: $${d.sublet}`;
        report += "\n";
      } else {
        report += `   Est: $${d.estimated_cost_low?.toLocaleString()} — $${d.estimated_cost_high?.toLocaleString()}\n`;
      }
      if (d.notes) report += `   Note: ${d.notes}\n`;
      report += "\n";
    });
    if (a.estimate_summary) {
      report += `ESTIMATE SUMMARY\n${"-".repeat(30)}\n`;
      if (a.estimate_summary.body_labor_hours > 0) report += `Body Labor: ${a.estimate_summary.body_labor_hours} hrs = $${a.estimate_summary.body_labor_amount?.toLocaleString()}\n`;
      if (a.estimate_summary.mechanical_labor_hours > 0) report += `Mechanical Labor: ${a.estimate_summary.mechanical_labor_hours} hrs = $${a.estimate_summary.mechanical_labor_amount?.toLocaleString()}\n`;
      if (a.estimate_summary.structural_labor_hours > 0) report += `Structural/Frame Labor: ${a.estimate_summary.structural_labor_hours} hrs = $${a.estimate_summary.structural_labor_amount?.toLocaleString()}\n`;
      if (a.estimate_summary.diagnostic_labor_hours > 0) report += `Diagnostic/ADAS: ${a.estimate_summary.diagnostic_labor_hours} hrs = $${a.estimate_summary.diagnostic_labor_amount?.toLocaleString()}\n`;
      if (a.estimate_summary.paint_labor_hours > 0) report += `Paint Labor: ${a.estimate_summary.paint_labor_hours} hrs = $${a.estimate_summary.paint_labor_amount?.toLocaleString()}\n`;
      if (a.estimate_summary.paint_materials > 0) report += `Paint Materials: $${a.estimate_summary.paint_materials?.toLocaleString()}\n`;
      if (a.estimate_summary.parts_total > 0) report += `Parts Total: $${a.estimate_summary.parts_total?.toLocaleString()}\n`;
      if (a.estimate_summary.sublet_total > 0) report += `Sublet: $${a.estimate_summary.sublet_total?.toLocaleString()}\n`;
      report += `GROSS TOTAL: $${a.estimate_summary.gross_total?.toLocaleString()}\n`;
      if (a.estimate_summary.parts_tax_amount > 0) {
        report += `Parts Tax (${(a.estimate_summary.parts_tax_rate * 100).toFixed(1)}%): $${a.estimate_summary.parts_tax_amount?.toLocaleString()}\n`;
        report += `NET TOTAL (incl. tax): $${a.estimate_summary.net_total?.toLocaleString()}\n`;
      }
      report += "\n";
    }
    if (a.recommendations?.length) {
      report += `RECOMMENDATIONS\n${"-".repeat(30)}\n`;
      a.recommendations.forEach((r, i) => { report += `${i + 1}. ${r}\n`; });
    }
    if (a.flags?.length) {
      report += `\nFLAGS / CONCERNS\n${"-".repeat(30)}\n`;
      a.flags.forEach((f, i) => { report += `${i + 1}. ${f}\n`; });
    }
    if (claim.type === "auto" && a.adjuster_checklist?.length) {
      report += `\nADJUSTER INSPECTION CHECKLIST\n${"-".repeat(30)}\n`;
      a.adjuster_checklist.forEach((item, i) => { report += `☐ ${i + 1}. ${item}\n`; });
    }
    if (claim.type === "auto" && a.areas_not_visible?.length) {
      report += `\nAREAS NOT VISIBLE IN PHOTOS\n${"-".repeat(30)}\n`;
      report += `The following areas were not visible in the submitted photos and could not be assessed:\n`;
      a.areas_not_visible.forEach((area, i) => { report += `• ${area.replace(/_/g, " ")}\n`; });
    }
    if (claim.type === "auto" && a.damages?.some(d => d.part_info?.type && d.part_info.type !== "OEM")) {
      report += `\nALTERNATE PARTS NOTICE\n${"-".repeat(30)}\n${ALTERNATE_PARTS_DISCLAIMER}\n`;
    }
    report += `\nFRAUD WARNING${claim.state ? ` (${claim.state})` : ""}\n${"-".repeat(30)}\n`;
    report += `${claim.state && STATE_FRAUD_WARNINGS[claim.state] ? STATE_FRAUD_WARNINGS[claim.state] : STANDARD_FRAUD_DISCLAIMER}\n`;
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
      // Auto: Mitchell-style rows
      const opColorMap = { "R&R": "#2563EB", "R&I": "#7C3AED", "Repair": "#059669", "Refinish": "#D97706", "Blend": "#8B5CF6", "Sublet": "#DC2626" };
      const ptColorMap = { "OEM": "#2563EB", "AFT": "#059669", "LKQ": "#D97706", "REMAN": "#7C3AED", "RECON": "#8B5CF6" };
      damageRows = (a.damages || []).map((d, i) => {
        const dc = sevColorMap[d.severity] || "#F59E0B";
        const opC = opColorMap[d.operation] || "#6B7280";
        const opBadge = d.operation ? `<span class="badge" style="background:${opC}18;color:${opC};margin-right:4px;">${d.operation}</span>` : "";
        const ptBadge = d.part_info?.type ? `<span class="badge" style="background:${ptColorMap[d.part_info.type] || "#6B7280"}15;color:${ptColorMap[d.part_info.type] || "#6B7280"};">${d.part_info.type}</span>` : "";
        // Mitchell detail lines
        const details = [];
        if (d.labor?.hours) details.push(`${d.labor.type} labor: ${d.labor.hours} hrs × $${d.labor.rate}/hr`);
        if (d.part_info?.price) details.push(`Part: $${d.part_info.price.toLocaleString()}${d.part_info.oem_price && d.part_info.oem_price !== d.part_info.price ? ` (OEM: $${d.part_info.oem_price.toLocaleString()})` : ""}`);
        if (d.paint?.hours) details.push(`Paint: ${d.paint.hours} hrs${d.paint.materials ? ` + $${d.paint.materials} materials` : ""}`);
        if (d.sublet) details.push(`Sublet: $${d.sublet.toLocaleString()}`);
        const detailHTML = details.length > 0 ? `<div style="font-size:8px;color:#6B7280;margin-top:3px;line-height:1.5;">${details.join(" · ")}${d.notes ? `<br/><span style="font-style:italic;color:#9CA3AF;">${d.notes}</span>` : ""}</div>` : "";
        const costStr = d.estimated_cost != null ? `$${d.estimated_cost.toLocaleString()}` : `$${(d.estimated_cost_low||0).toLocaleString()} – $${(d.estimated_cost_high||0).toLocaleString()}`;
        return `<tr>
          <td class="tc">${opBadge}${i + 1}. ${d.component} ${ptBadge}${d._confidence === "low" ? ` <span style="font-size:7px;color:#F59E0B;font-weight:600;" title="Found in ${d._runs} AI runs">⚠ 1 run</span>` : ""}</td>
          <td class="tc"><span class="badge" style="background:${dc}18;color:${dc};">${d.severity}</span></td>
          <td class="tc">${d.description}</td>
          <td class="tc" style="text-align:right;font-weight:600;">${costStr}${detailHTML}</td>
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
      <td class="tc" style="text-align:right;font-weight:600;color:#92400E;">Requires inspection</td>
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
      <strong>Date:</strong> ${new Date(claim.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${new Date(claim.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}<br/>
      <strong>Build:</strong> v${APP_VERSION}${claim.aiModel ? ` · ${claim.aiModel}` : ""}${a.geminiRuns ? ` · Runs: ${a.geminiRuns}` : ""}<br/>
      <strong>Type:</strong> ${claim.type === "auto" ? "Vehicle Damage" : "Property Damage"}${claim.vehicle?.make ? `<br/><strong>Vehicle:</strong> ${claim.vehicle.year} ${claim.vehicle.make} ${claim.vehicle.model}${claim.vehicle.trim && claim.vehicle.trim !== "Base" ? ` ${claim.vehicle.trim}` : ""}${claim.vehicle.engine ? ` · ${claim.vehicle.engine}` : ""}${claim.vehicle.mileage ? ` (${parseInt(claim.vehicle.mileage).toLocaleString()} mi)` : ""}` : ""}${claim.property?.type ? `<br/><strong>Property:</strong> ${PROPERTY_TYPES.find(p=>p.value===claim.property.type)?.label || claim.property.type}` : ""}${claim.property?.address ? `<br/><strong>Address:</strong> ${claim.property.address}` : ""}${claim.property?.cause ? `<br/><strong>Cause:</strong> ${DAMAGE_CAUSES.find(c=>c.value===claim.property.cause)?.label || claim.property.cause}` : ""}${claim.location ? `<br/><strong>Location:</strong> ${claim.location}` : ""}
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
    <div class="estimate-value">${a.total_estimate != null ? `$${a.total_estimate.toLocaleString()}` : `$${(a.total_estimate_low || 0).toLocaleString()} — $${(a.total_estimate_high || 0).toLocaleString()}`}</div>
    <div style="font-size:9px;color:#6B7280;margin-top:4px;text-align:center;">${a.total_estimate != null ? "Gross estimate before tax & deductible" : "Low estimate → High estimate"}</div>
  </div>
  ${a.estimate_summary ? `
  <div style="margin-bottom:18px;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;margin-bottom:6px;">Estimate Summary</div>
    ${a.estimate_summary.body_labor_hours > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Body Labor (${a.estimate_summary.body_labor_hours} hrs)</span><span>$${a.estimate_summary.body_labor_amount?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.mechanical_labor_hours > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Mechanical Labor (${a.estimate_summary.mechanical_labor_hours} hrs)</span><span>$${a.estimate_summary.mechanical_labor_amount?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.structural_labor_hours > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Structural/Frame Labor (${a.estimate_summary.structural_labor_hours} hrs)</span><span>$${a.estimate_summary.structural_labor_amount?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.diagnostic_labor_hours > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Diagnostic/ADAS (${a.estimate_summary.diagnostic_labor_hours} hrs)</span><span>$${a.estimate_summary.diagnostic_labor_amount?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.paint_labor_hours > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Paint Labor (${a.estimate_summary.paint_labor_hours} hrs)</span><span>$${a.estimate_summary.paint_labor_amount?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.paint_materials > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Paint Materials</span><span>$${a.estimate_summary.paint_materials?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.parts_total > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Parts Total</span><span>$${a.estimate_summary.parts_total?.toLocaleString()}</span></div>` : ""}
    ${a.estimate_summary.sublet_total > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:3px;"><span>Sublet</span><span>$${a.estimate_summary.sublet_total?.toLocaleString()}</span></div>` : ""}
    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#0F172A;border-top:2px solid #CBD5E1;padding-top:6px;margin-top:4px;"><span>Gross Total</span><span>$${a.estimate_summary.gross_total?.toLocaleString()}</span></div>
    ${a.estimate_summary.parts_tax_amount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-top:3px;"><span>Parts Tax (${(a.estimate_summary.parts_tax_rate * 100).toFixed(1)}%)</span><span>$${a.estimate_summary.parts_tax_amount?.toLocaleString()}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#2563EB;margin-top:4px;"><span>Net Total (incl. tax)</span><span>$${a.estimate_summary.net_total?.toLocaleString()}</span></div>` : ""}
  </div>` : ""}

  ${claim.type === "auto" && a.total_loss_analysis ? (() => {
    const tla = a.total_loss_analysis;
    const isAppraisal = tla.recommendation === "needs_appraisal";
    const borderColor = tla.recommendation === "total_loss" ? "#FECACA" : tla.recommendation === "borderline" ? "#FDE68A" : isAppraisal ? "#BFDBFE" : "#A7F3D0";
    const bgColor = tla.recommendation === "total_loss" ? "#FEF2F2" : tla.recommendation === "borderline" ? "#FFFBEB" : isAppraisal ? "#EFF6FF" : "#F0FDF4";
    const textColor = tla.recommendation === "total_loss" ? "#DC2626" : tla.recommendation === "borderline" ? "#D97706" : isAppraisal ? "#2563EB" : "#059669";
    const title = tla.recommendation === "total_loss" ? "TOTAL LOSS DETERMINATION" : tla.recommendation === "borderline" ? "BORDERLINE — REQUIRES INSPECTION" : isAppraisal ? "ACV UNAVAILABLE — MANUAL APPRAISAL REQUIRED" : "ECONOMIC REPAIR";
    const icon = isAppraisal ? "!" : tla.recommendation === "total_loss" || tla.recommendation === "borderline" ? "!" : "✓";
    return `<div style="margin-bottom:18px;padding:14px 18px;border-radius:8px;border:1px solid ${borderColor};background:${bgColor};">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${textColor};">${icon} ${title}</span>
      ${!isAppraisal ? `<span style="font-size:12px;font-weight:700;color:${textColor};">${tla.repair_to_acv_pct}% of ACV</span>` : ""}
    </div>
    <div style="display:flex;gap:12px;margin-bottom:10px;">
      <div style="flex:1;text-align:center;padding:8px;background:#fff;border-radius:6px;border:1px solid #E5E7EB;">
        <div style="font-size:8px;text-transform:uppercase;font-weight:700;color:#9CA3AF;letter-spacing:0.5px;">Repair Estimate</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;margin-top:2px;">$${(tla.repair_estimate||0).toLocaleString()}</div>
      </div>
      <div style="flex:1;text-align:center;padding:8px;background:#fff;border-radius:6px;border:1px solid #E5E7EB;">
        <div style="font-size:8px;text-transform:uppercase;font-weight:700;color:#9CA3AF;letter-spacing:0.5px;">Vehicle ACV</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;margin-top:2px;">${isAppraisal ? "N/A — Appraisal Required" : "$" + (tla.acv_value||0).toLocaleString()}</div>
      </div>
      <div style="flex:1;text-align:center;padding:8px;background:#fff;border-radius:6px;border:1px solid #E5E7EB;">
        <div style="font-size:8px;text-transform:uppercase;font-weight:700;color:#9CA3AF;letter-spacing:0.5px;">Threshold</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;margin-top:2px;">${tla.threshold_pct}%</div>
      </div>
    </div>
    <div style="font-size:10px;color:#374151;line-height:1.6;">${tla.reasoning}</div>
    ${a.vehicle_acv?.source && a.vehicle_acv.source !== "unavailable" ? `<div style="font-size:8px;color:#9CA3AF;margin-top:4px;">Source: ${a.vehicle_acv.source}</div>` : ""}
  </div>`;
  })() : ""}

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
      <thead><tr><th>Component</th><th>Reason</th><th>Status</th></tr></thead>
      <tbody>${potentialRows}</tbody>
    </table>
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

  ${claim.type === "auto" && (a.adjuster_checklist||[]).length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="dot" style="background:#2563EB;"></span> Adjuster Inspection Checklist</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${a.adjuster_checklist.map((item, i) => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:7px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
          <div style="min-width:20px;height:20px;border-radius:4px;border:2px solid #CBD5E1;display:flex;align-items:center;justify-content:center;background:#fff;flex-shrink:0;margin-top:1px;">
            <span style="font-size:9px;font-weight:700;color:#64748B;">${i + 1}</span>
          </div>
          <span style="font-size:10px;color:#374151;line-height:1.6;">${item}</span>
        </div>
      `).join("")}
    </div>
  </div>` : ""}

  ${claim.type === "auto" && (a.areas_not_visible||[]).length > 0 ? `
  <div class="section">
    <div class="section-title"><span class="dot" style="background:#94A3B8;"></span> Areas Not Visible in Photos</div>
    <p style="font-size:10px;color:#64748B;margin:0 0 8px 0;">The following areas were not visible in the submitted photos and could not be assessed:</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${a.areas_not_visible.map(area => `
        <span style="font-size:9.5px;color:#475569;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:4px;padding:4px 8px;">${area.replace(/_/g, " ")}</span>
      `).join("")}
    </div>
  </div>` : ""}

  ${claim.type === "auto" && (a.damages || []).some(d => d.part_info?.type && d.part_info.type !== "OEM") ? `
  <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:6px;padding:12px 14px;margin-top:16px;">
    <p style="font-size:9.5px;color:#1E40AF;line-height:1.6;margin:0;"><strong>Alternate Parts Notice:</strong> ${ALTERNATE_PARTS_DISCLAIMER}</p>
  </div>` : ""}

  <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:12px 14px;margin-top:10px;">
    <p style="font-size:9px;color:#991B1B;line-height:1.6;margin:0;"><strong>Fraud Warning${claim.state ? ` (${claim.state})` : ""}:</strong> ${claim.state && STATE_FRAUD_WARNINGS[claim.state] ? STATE_FRAUD_WARNINGS[claim.state] : STANDARD_FRAUD_DISCLAIMER}</p>
  </div>

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
              {a.total_estimate != null
                ? `$${a.total_estimate?.toLocaleString()}`
                : `$${a.total_estimate_low?.toLocaleString()} — $${a.total_estimate_high?.toLocaleString()}`}
            </div>
            {claim.type === "auto" && a.total_estimate != null && (
              <div style={{ fontSize: 10, color: palette.textDim, marginTop: 2 }}>Gross estimate before tax & deductible</div>
            )}
            {claim.type !== "auto" && (
              <div style={{ fontSize: 10, color: palette.textDim, marginTop: 2 }}>Low estimate → High estimate</div>
            )}
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

        {/* Total Loss Analysis + ACV */}
        {claim.type === "auto" && a.total_loss_analysis && (() => {
          const tla = a.total_loss_analysis;
          const isAppraisal = tla.recommendation === "needs_appraisal";
          const bgColor = tla.recommendation === "total_loss" ? palette.dangerSoft
            : tla.recommendation === "borderline" ? palette.warningSoft
            : isAppraisal ? "rgba(37,99,235,0.08)" : palette.successSoft;
          const borderColor = tla.recommendation === "total_loss" ? "rgba(255,90,90,0.25)"
            : tla.recommendation === "borderline" ? "rgba(255,179,71,0.25)"
            : isAppraisal ? "rgba(37,99,235,0.25)" : "rgba(52,211,153,0.25)";
          const textColor = tla.recommendation === "total_loss" ? palette.danger
            : tla.recommendation === "borderline" ? palette.warning
            : isAppraisal ? "#60A5FA" : palette.success;
          const title = tla.recommendation === "total_loss" ? "⚠ Total Loss"
            : tla.recommendation === "borderline" ? "⚠ Borderline"
            : isAppraisal ? "⚠ ACV Unavailable" : "✓ Economic Repair";
          return (
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 10,
            background: bgColor, border: `1px solid ${borderColor}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: textColor }}>
                {title}
              </span>
              {!isAppraisal && (
                <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>
                  {tla.repair_to_acv_pct}% of ACV
                </span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
              <div style={{ textAlign: "center", padding: "6px 0", borderRadius: 6, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, color: palette.textDim, textTransform: "uppercase", fontWeight: 600 }}>Repair Estimate</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginTop: 2 }}>
                  ${tla.repair_estimate?.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "6px 0", borderRadius: 6, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, color: palette.textDim, textTransform: "uppercase", fontWeight: 600 }}>Vehicle ACV</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginTop: 2 }}>
                  {isAppraisal ? "N/A" : `$${tla.acv_value?.toLocaleString()}`}
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "6px 0", borderRadius: 6, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, color: palette.textDim, textTransform: "uppercase", fontWeight: 600 }}>Threshold</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginTop: 2 }}>
                  {tla.threshold_pct}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: palette.textMuted, lineHeight: 1.5 }}>
              {tla.reasoning}
            </div>
            {a.vehicle_acv?.source && a.vehicle_acv.source !== "unavailable" && (
              <div style={{ fontSize: 9, color: palette.textDim, marginTop: 4 }}>Source: {a.vehicle_acv.source}</div>
            )}
          </div>
          );
        })()}
      </div>

      {/* Photos */}
      {claim.photos?.some(p => p.data && p.data.length > 10) && (
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${isMobile ? Math.min(claim.photos.filter(p=>p.data).length, 2) : Math.min(claim.photos.filter(p=>p.data).length, 4)}, 1fr)`,
          gap: 8, marginBottom: 16,
        }}>
          {claim.photos.filter(p => p.data && p.data.length > 10).map((p, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", border: `1px solid ${palette.border}` }}>
              <img src={p.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
      {claim._photoCount > 0 && !claim.photos?.some(p => p.data && p.data.length > 10) && (
        <div style={{ padding: 12, borderRadius: 10, background: palette.surfaceAlt, border: `1px solid ${palette.border}`, marginBottom: 16, textAlign: "center" }}>
          <span style={{ fontSize: 12, color: palette.textDim }}>{claim._photoCount} photo{claim._photoCount > 1 ? "s" : ""} were submitted (not stored in history)</span>
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
          /* Auto: Mitchell-style line items */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {a.damages?.map((d, i) => {
              const ds = severityConfig[d.severity] || severityConfig.moderate;
              const opColors = { "R&R": "#2563EB", "R&I": "#7C3AED", "Repair": "#059669", "Refinish": "#D97706", "Blend": "#8B5CF6", "Sublet": "#DC2626" };
              const partTypeColors = { "OEM": "#2563EB", "AFT": "#059669", "LKQ": "#D97706", "REMAN": "#7C3AED", "RECON": "#8B5CF6" };
              return (
                <div key={i} style={{
                  padding: 14, borderRadius: 10, background: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {d.operation && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: `${opColors[d.operation] || palette.accent}18`,
                          color: opColors[d.operation] || palette.accent,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>{d.operation}</span>
                      )}
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{d.component}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10,
                        background: ds.bg, color: ds.color, textTransform: "uppercase",
                      }}>{d.severity}</span>
                      {d.part_info?.type && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                          background: `${partTypeColors[d.part_info.type] || palette.textDim}15`,
                          color: partTypeColors[d.part_info.type] || palette.textDim,
                        }}>{d.part_info.type}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: palette.text, whiteSpace: "nowrap" }}>
                      ${d.estimated_cost != null ? d.estimated_cost?.toLocaleString() : `${d.estimated_cost_low?.toLocaleString()}–${d.estimated_cost_high?.toLocaleString()}`}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: palette.textMuted, margin: 0, lineHeight: 1.5 }}>{d.description}</p>
                  {/* Mitchell detail row */}
                  {(d.labor || d.part_info?.price || d.paint?.hours) && (
                    <div style={{
                      marginTop: 8, padding: "8px 10px", borderRadius: 8, background: palette.bg,
                      border: `1px solid ${palette.border}`, fontSize: 11, color: palette.textMuted,
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                        {d.part_info?.price != null && (
                          <>
                            <span>Part ({d.part_info.type || "N/A"}):</span>
                            <span style={{ fontWeight: 600, color: palette.text }}>${d.part_info.price?.toLocaleString()}</span>
                          </>
                        )}
                        {d.part_info?.oem_price != null && d.part_info.oem_price !== d.part_info.price && (
                          <>
                            <span>OEM Price:</span>
                            <span style={{ fontWeight: 600, color: palette.textDim }}>${d.part_info.oem_price?.toLocaleString()}</span>
                          </>
                        )}
                        {d.labor?.hours != null && (
                          <>
                            <span>Labor ({d.labor.type}):</span>
                            <span style={{ fontWeight: 600, color: palette.text }}>
                              {d.labor.hours} hrs × ${d.labor.rate}/hr = ${Math.round(d.labor.hours * d.labor.rate).toLocaleString()}
                            </span>
                          </>
                        )}
                        {d.paint?.hours != null && (
                          <>
                            <span>Paint:</span>
                            <span style={{ fontWeight: 600, color: palette.text }}>
                              {d.paint.hours} hrs × ${d.paint.rate}/hr{d.paint.materials ? ` + $${d.paint.materials} materials` : ""}
                            </span>
                          </>
                        )}
                        {d.sublet != null && d.sublet > 0 && (
                          <>
                            <span>Sublet:</span>
                            <span style={{ fontWeight: 600, color: palette.danger }}>${d.sublet?.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      {d.notes && (
                        <div style={{ marginTop: 4, fontSize: 10, color: palette.textDim, fontStyle: "italic" }}>{d.notes}</div>
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
            {/* Estimate Summary for Mitchell auto */}
            {a.estimate_summary && (
              <div style={{
                padding: 14, borderRadius: 10, background: palette.surface,
                border: `1px solid ${palette.border}`, marginTop: 4,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.text, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estimate Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                  {a.estimate_summary.body_labor_hours > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Body Labor ({a.estimate_summary.body_labor_hours} hrs)</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.body_labor_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.mechanical_labor_hours > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Mechanical Labor ({a.estimate_summary.mechanical_labor_hours} hrs)</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.mechanical_labor_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.structural_labor_hours > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Structural/Frame Labor ({a.estimate_summary.structural_labor_hours} hrs)</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.structural_labor_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.diagnostic_labor_hours > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Diagnostic/ADAS ({a.estimate_summary.diagnostic_labor_hours} hrs)</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.diagnostic_labor_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.paint_labor_hours > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Paint Labor ({a.estimate_summary.paint_labor_hours} hrs)</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.paint_labor_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.paint_materials > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Paint Materials</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.paint_materials?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.parts_total > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Parts Total</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.parts_total?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.sublet_total > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted }}>
                      <span>Sublet</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.sublet_total?.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: palette.text, borderTop: `1px solid ${palette.border}`, paddingTop: 6, marginTop: 4 }}>
                    <span>Gross Total</span>
                    <span>${a.estimate_summary.gross_total?.toLocaleString()}</span>
                  </div>
                  {a.estimate_summary.parts_tax_amount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: palette.textMuted, marginTop: 4 }}>
                      <span>Parts Tax ({(a.estimate_summary.parts_tax_rate * 100).toFixed(1)}%)</span>
                      <span style={{ fontWeight: 600, color: palette.text }}>${a.estimate_summary.parts_tax_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  {a.estimate_summary.net_total > 0 && a.estimate_summary.parts_tax_amount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: palette.accent, marginTop: 4 }}>
                      <span>Net Total (incl. tax)</span>
                      <span>${a.estimate_summary.net_total?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {a.potential_damages.map((pd, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 10, background: palette.surface,
                border: `1px solid ${palette.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{pd.component}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: palette.warning, background: `${palette.warning}15`, padding: "2px 8px", borderRadius: 6 }}>
                    Requires inspection
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

      {/* Adjuster Checklist */}
      {claim.type === "auto" && a.adjuster_checklist?.length > 0 && (
        <div style={{
          padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`,
          background: palette.surface, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, margin: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: palette.accent }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </span>
            Adjuster Inspection Checklist
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: palette.accentSoft, color: palette.accent }}>
              {a.adjuster_checklist.length} items
            </span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {a.adjuster_checklist.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px",
                borderRadius: 8, background: palette.surfaceAlt,
                border: `1px solid ${palette.border}`,
              }}>
                <div style={{
                  minWidth: 22, height: 22, borderRadius: 6, border: `2px solid ${palette.borderLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                  background: palette.bg, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: palette.textDim }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas Not Visible */}
      {claim.type === "auto" && a.areas_not_visible?.length > 0 && (
        <div style={{
          padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`,
          background: palette.surface, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, margin: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: palette.textDim }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
            Areas Not Visible in Photos
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: "rgba(148,163,184,0.1)", color: palette.textDim }}>
              {a.areas_not_visible.length} zones
            </span>
          </h3>
          <p style={{ fontSize: 12, color: palette.textDim, margin: "0 0 10px 0" }}>
            These areas were not visible in the submitted photos and could not be assessed:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {a.areas_not_visible.map((area, i) => (
              <span key={i} style={{
                fontSize: 12, color: palette.textMuted, background: palette.surfaceAlt,
                border: `1px solid ${palette.border}`, borderRadius: 6, padding: "5px 10px",
              }}>
                {area.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alternate Parts Disclaimer — shown when non-OEM parts are used */}
      {claim.type === "auto" && a.damages?.some(d => d.part_info?.type && d.part_info.type !== "OEM") && (
        <div style={{
          padding: 14, borderRadius: 10, background: `${palette.accent}08`,
          border: `1px solid ${palette.accent}25`, marginBottom: 12,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ color: palette.accent, marginTop: 1, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </span>
          <p style={{ fontSize: 11, color: palette.textMuted, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: palette.text }}>Alternate Parts Notice:</strong> {ALTERNATE_PARTS_DISCLAIMER}
          </p>
        </div>
      )}

      {/* Fraud Warning — state-specific or standard */}
      {claim.state && (
        <div style={{
          padding: 14, borderRadius: 10, background: `${palette.danger}08`,
          border: `1px solid ${palette.danger}20`, marginBottom: 12,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ color: palette.danger, marginTop: 1, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          <p style={{ fontSize: 10, color: palette.textDim, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: palette.textMuted }}>Fraud Warning ({claim.state}):</strong>{" "}
            {STATE_FRAUD_WARNINGS[claim.state] || STANDARD_FRAUD_DISCLAIMER}
          </p>
        </div>
      )}

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
