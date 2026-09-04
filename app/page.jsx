"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity, AlertTriangle, Archive, ArrowLeft, ArrowUpRight, Bell, BookOpen, Bookmark,
  CalendarDays, Check, CheckCircle2, Award,
  Bot, BrainCircuit, ChevronDown, ChevronRight, Circle, Clock3, Copy, CreditCard, Download, Dumbbell, ExternalLink, Flag, FolderKanban, Gauge, Goal, GraduationCap, Heart,
  LayoutDashboard, Leaf, ListChecks, Lock, LogOut, Menu, MessageCircle, MoreHorizontal,
  Newspaper, Palette, Pause, Pencil, Play, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Star, Target, Timer, Trash2, TrendingUp, UserRound, Users, Wallet, X, Zap
} from "lucide-react";
import { libraryCategories, libraryContent, libraryStats } from "./libraryContent";

const featureFlags = {
  consistencyHub: false,
  fitness: false,
  ranks: false,
  consistencySignals: false,
  consistencyCopyTrading: false,
  consistencyPartnerHub: false,
};

const pageFeatureMap = {
  "Consistency Hub": "consistencyHub",
  Fitness: "fitness",
  Ranks: "ranks",
};

const foundingTeamRoles = [
  {
    key: "none",
    label: "No founding role",
    summary: "Standard Motion Only member account.",
    expectations: [],
  },
  {
    key: "community_lead",
    label: "Community Lead",
    summary: "Welcomes new members and starts useful conversations that keep the network alive.",
    expectations: ["Welcome new members", "Start a few useful conversations each week", "Spot where members need direction"],
  },
  {
    key: "engagement_lead",
    label: "Engagement Lead",
    summary: "Creates light weekly activity that gets members participating without making the app noisy.",
    expectations: ["Run one challenge, poll or competition each week", "Encourage useful replies", "Feed back what gets people moving"],
  },
  {
    key: "education_lead",
    label: "Education Lead",
    summary: "Finds useful mentors, school ideas and course topics that fit Motion Only.",
    expectations: ["Suggest mentor/school opportunities", "Collect useful learning topics", "Flag weak or low-quality education ideas"],
  },
  {
    key: "networking_lead",
    label: "Networking Lead",
    summary: "Connects members who could help each other make progress.",
    expectations: ["Make useful introductions", "Look for collaboration opportunities", "Help members find the right people"],
  },
  {
    key: "member_success_lead",
    label: "Member Success Lead",
    summary: "Checks in with new or quieter members and reports what people need from the platform.",
    expectations: ["Check in with new members", "Notice quiet members", "Share feedback from the member experience"],
  },
];

function foundingRoleFor(key) {
  return foundingTeamRoles.find(role => role.key === key) || foundingTeamRoles[0];
}

function foundingLabelFor(key) {
  const role = foundingRoleFor(key);
  return role.key === "none" ? "" : role.label;
}

function featureEnabled(key) {
  return !key || featureFlags[key] !== false;
}

const nav = [
  ["Today", LayoutDashboard], ["Goals & habits", Target], ["Network", Users],
  ["Messages", MessageCircle], ["Projects", FolderKanban], ["Schedule", CalendarDays],
  ["Library", BookOpen], ["Market News", Newspaper],
];

const goals = [];

const baseHabits = [];

const motionCategories = ["Business", "Networking", "Lifestyle", "Learning", "Trading"];

const motionHelpExamples = [
  "Send 20 targeted business messages and log every reply.",
  "Follow up every warm lead and write the next step for each one.",
  "Review one trading setup and journal whether it meets the rules before acting.",
  "Spend 45 minutes learning one skill that directly improves your income or discipline.",
  "Message three useful contacts and start one proper conversation."
];

function localDateKey(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function savedGoalFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    area: row.category || "BUSINESS",
    evidence: row.evidence_count || 0,
    exp: row.exp || 0,
    date: "Active",
    color: "gold",
    today: row.today_action || "Choose one action for today",
  };
}

function savedStandardFromRow(row) {
  return {
    id: row.id,
    label: row.title,
    meta: row.category || "Daily standard",
    icon: "+",
    done: row.completed_on === localDateKey(),
  };
}

function savedMotionFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    meta: `Today - ${row.category || "Business"}`,
    category: row.category || "Business",
    done: Boolean(row.completed_at),
  };
}

function spaceFromRoomRow(row) {
  return {
    id: row.id,
    title: row.title,
    meta: `${row.room_type || "Room"} - ${row.access || "All members"}`,
    Icon: row.room_type === "Direct" ? MessageCircle : row.room_type === "Social support" ? Sparkles : Users,
    description: row.description || "Private Motion Only room for focused member discussion.",
    stat: row.access || "Private by default",
    roomType: row.room_type || "Topic discussion",
    access: row.access || "All members",
  };
}

function messageFromRoomRow(row) {
  const name = row.author_name || "Motion Only member";
  return [
    name,
    row.body,
    row.created_at ? new Date(row.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "now",
    { eligible: Boolean(row.exp_awarded), exp: row.exp_awarded || 0, label: row.exp_awarded ? `+${row.exp_awarded} EXP` : "No EXP", reason: row.quality_reason || "" },
    row.id,
    row.author_founding_role || "",
  ];
}

const SESSION_KEY = "motion-only-api-token";

function apiBaseUrl() {
  return (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
}

function supabaseConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  return { url, anonKey, enabled: Boolean(url && anonKey) };
}

function profileFromSupabaseUser(user) {
  const name = user?.user_metadata?.display_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Motion Only member";
  return {
    id: user?.id,
    email: user?.email,
    role: user?.user_metadata?.role || "member",
    foundingRole: user?.user_metadata?.founding_role || "none",
    displayName: name,
    display_name: name,
    onboardingCompleted: Boolean(user?.user_metadata?.onboarding_completed),
  };
}

function profileFromRow(row, fallback = {}) {
  return {
    ...fallback,
    id: row?.id || fallback?.id,
    email: row?.email || fallback?.email,
    role: row?.role || fallback?.role || "member",
    foundingRole: row?.founding_role || fallback?.foundingRole || "none",
    displayName: row?.display_name || fallback?.displayName || fallback?.display_name || "Motion Only member",
    display_name: row?.display_name || fallback?.display_name || fallback?.displayName || "Motion Only member",
    onboardingCompleted: Boolean(row?.onboarding_completed ?? fallback?.onboardingCompleted),
  };
}

function displayNameFor(user) {
  return user?.displayName || user?.display_name || user?.name || "Joel Gilbert";
}

function initialsFor(name = "Joel Gilbert") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "MO";
}

function FoundingTeamPanel({ currentUser }) {
  const role = foundingRoleFor(currentUser?.foundingRole);
  if (role.key === "none") return null;
  return <section className="founding-panel card">
    <div>
      <p className="eyebrow">FOUNDING TEAM</p>
      <h2>{role.label}</h2>
      <p>{role.summary}</p>
    </div>
    <div className="founding-rewards">
      {["Permanent Founding Team status", "Visible badge/profile status", "Direct access to the core team", "Input into how Motion Only is built", "Priority for future opportunities"].map(item => <span key={item}><Award size={14}/>{item}</span>)}
    </div>
    <div className="founding-expectations">
      <strong>Simple weekly expectations</strong>
      {role.expectations.map(item => <span key={item}><Check size={13}/>{item}</span>)}
      <small>Suggested contribution: 2–3 hours per week, flexible.</small>
    </div>
  </section>;
}

async function apiRequest(path, { apiBase, token, ...options } = {}) {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, { ...options, headers });
  } catch {
    throw new Error("Motion Only could not reach the secure service. Check the API link and try again.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Motion Only could not complete that request.");
  return payload;
}

const pages = {
  "Goals & habits": { eyebrow: "PROGRESS SYSTEM", title: "Goals & standards", text: "Choose the direction. Build the rhythm. Keep moving when motivation disappears." },
  Network: { eyebrow: "THE NETWORK", title: "Network rooms", text: "High-trust conversations with people who sharpen your thinking and widen what is possible." },
  Messages: { eyebrow: "PRIVATE CHANNELS", title: "Direct messages", text: "Private conversations for honest feedback, useful introductions and real accountability." },
  Projects: { eyebrow: "BUILD TOGETHER", title: "Project workspaces", text: "Invitation-only teams for turning ideas into work that moves." },
  Fitness: { eyebrow: "PHYSICAL STANDARD", title: "Fitness missions", text: "Set measurable targets, log attempts, prove progress and complete missions without guessing percentages." },
  Schedule: { eyebrow: "THE WEEK AHEAD", title: "Schedule", text: "Personal reminders, group calls and targeted accountability without the noise." },
  Library: { eyebrow: "COLLECTIVE PLAYBOOK", title: "Knowledge base", text: "Frameworks, lessons and proven practices collected by the network." },
  "Consistency Hub": { eyebrow: "THE CONSISTENCY HUB", title: "Consistency system", text: "A clean place to track discipline, learning, risk and execution without turning progress into clutter." },
  "Market News": { eyebrow: "MARKET INTELLIGENCE", title: "Stocks & shares news", text: "A clean market digest for stocks, shares and investing themes without clutter or hype." },
  Ranks: { eyebrow: "EARNED ACCESS", title: "Ranks & permissions", text: "See what unlocks as members prove consistency, useful contribution and trust inside Motion Only." },
  Admin: { eyebrow: "OPERATIONS", title: "Network operations", text: "Protect the standard. Manage access, rooms, roles and network integrity." },
  Settings: { eyebrow: "YOUR CONTROL", title: "Settings & privacy", text: "Control what you share, where you appear and how Motion Only keeps you informed." },
};

function OptionsMenu({ label = "Options", items = [] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const choose = (item) => {
    item.onClick?.();
    setOpen(false);
  };
  return <span className="options-wrap" ref={menuRef}>
    <button className="options-trigger" onClick={(event) => { event.stopPropagation(); setOpen(!open); }} aria-label={label}><MoreHorizontal size={18}/></button>
    {open && <span className="options-pop" onClick={event => event.stopPropagation()}>
      {items.map((item, index) => <button className={`${item.active ? "active" : ""} ${item.danger ? "danger" : ""}`} key={`${item.label}-${index}`} onClick={() => choose(item)}>
        <span>{item.label}</span>{item.active && <Check size={13}/>}
      </button>)}
    </span>}
  </span>;
}

function Sidebar({ active, setActive, open, setOpen, currentUser, onLogout, realBeta }) {
  const name = displayNameFor(currentUser);
  const initials = initialsFor(name);
  const canUseOperations = !realBeta || ["admin", "moderator"].includes(currentUser?.role);
  const foundingLabel = foundingLabelFor(currentUser?.foundingRole);
  return (
    <>
      {open && <button className="scrim" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <button className="brand-home" onClick={() => { setActive("Today"); setOpen(false); }} aria-label="Go to Today">
            <div className="brandmark"><img src="/motion-only-logo-dark.png" alt="" /></div>
            <div><strong>MOTION <b>ONLY</b></strong><span>CONNECT · BUILD · ADVANCE</span></div>
          </button>
          <button className="close-mobile" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <p className="nav-label">MAIN MENU</p>
        <nav>
          {nav.map(([label, Icon, badge]) => (
            <button key={label} className={active === label ? "active" : ""} onClick={() => {setActive(label);setOpen(false)}}>
              <Icon size={18}/><span>{label}</span>{badge && <i>{badge}</i>}
            </button>
          ))}
        </nav>
        <div className="nav-bottom">
          <p className="nav-label">OPERATIONS</p>
          {canUseOperations && <button className={active === "Admin" ? "active" : ""} onClick={() => {setActive("Admin");setOpen(false)}}>
            <ShieldCheck size={18}/><span>Operations</span>
          </button>}
          <button className={active === "Settings" ? "active" : ""} onClick={() => {setActive("Settings");setOpen(false)}}><Settings size={18}/><span>Settings & privacy</span></button>
          {realBeta && <button className="signout-nav" onClick={() => { onLogout?.(); setOpen(false); }}>
            <LogOut size={18}/><span>Sign out</span>
          </button>}
        </div>
        <div className="profile-mini">
          <div className="avatar">{initials}</div>
          <div><strong>{name}</strong><span>{foundingLabel || (realBeta ? `${currentUser?.role || "member"} account` : "Member account")}</span></div>
          <OptionsMenu label="Profile options" items={[
            { label: "Open profile", onClick: () => { setActive("Settings"); setOpen(false); } },
            { label: "Privacy settings", onClick: () => { setActive("Settings"); setOpen(false); } },
            { label: "Account preferences", onClick: () => { setActive("Settings"); setOpen(false); } },
            ...(realBeta ? [{ label: "Sign out", danger: true, onClick: onLogout }] : []),
          ]}/>
        </div>
      </aside>
    </>
  );
}

function MotionTopbar({ setOpen, setActive, notifications, setNotifications, theme, setTheme, notificationSettings, currentUser, realBeta, onLogout, supabase }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsCleared, setNotificationsCleared] = useState(true);
  const themeRef = useRef(null);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const themes = [["dark", "Dark"], ["light", "Light"], ["natural", "Natural"]];
  const activeTheme = themes.find(([key]) => key === theme)?.[1] || "Dark";
  useEffect(() => {
    if (!themeOpen && !notifications && !profileOpen) return;
    const close = (event) => {
      if (themeOpen && !themeRef.current?.contains(event.target)) setThemeOpen(false);
      if (notifications && !notificationsRef.current?.contains(event.target)) setNotifications(false);
      if (profileOpen && !profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [themeOpen, notifications, profileOpen, setNotifications]);
  const setScheme = (value) => {
    setTheme(value);
    setThemeOpen(false);
  };
  const initials = initialsFor(displayNameFor(currentUser));
  const foundingLabel = foundingLabelFor(currentUser?.foundingRole);
  const openSettings = (message) => {
    setProfileOpen(false);
    setActive("Settings");
  };
  return (
    <header className="topbar">
      <button className="menu" onClick={() => setOpen(true)}><Menu size={21}/></button>
      <MotionExpHud supabase={supabase} currentUser={currentUser}/>
      <div className="top-actions">
        <div className="privacy-pill"><Lock size={13}/> {realBeta ? "Invite-only" : "Members only"} · private by default</div>
        <div className="theme-control" ref={themeRef}>
          <button className="icon-button theme-button" onClick={(event) => { event.stopPropagation(); setThemeOpen(!themeOpen); }} aria-label="Colour scheme"><Palette size={18}/><span>{activeTheme}</span></button>
          {themeOpen && <div className="theme-menu">
            {themes.map(([key, label]) => <button className={theme === key ? "active" : ""} key={key} onClick={() => setScheme(key)}>
              <i className={`theme-dot ${key}`}/><span>{label}</span>{theme === key && <Check size={13}/>}
            </button>)}
          </div>}
        </div>
        <button className="icon-button bell" onClick={(event) => { event.stopPropagation(); setNotificationsCleared(true); setNotifications(!notifications); }} aria-label="Notifications"><Bell size={19}/>{!notificationsCleared && <span/>}</button>
        <div className="profile-control" ref={profileRef}>
          <button className="avatar top-avatar" onClick={(event) => { event.stopPropagation(); setProfileOpen(!profileOpen); }} aria-label="Open profile menu">{initials}</button>
          {profileOpen && <div className="profile-menu">
            <div className="profile-menu-head"><span className="avatar">{initials}</span><p><strong>{displayNameFor(currentUser)}</strong><small>{foundingLabel || (realBeta ? `${currentUser?.role || "member"} account` : "Member account")}</small></p></div>
            <button onClick={() => openSettings("Profile opened.")}><Users size={15}/><span>Profile</span></button>
            <button onClick={() => openSettings("Account settings opened.")}><Settings size={15}/><span>Account settings</span></button>
            <button onClick={() => openSettings("Privacy settings opened.")}><Lock size={15}/><span>Privacy</span></button>
            {realBeta && <button className="danger" onClick={() => { setProfileOpen(false); onLogout?.(); }}><LogOut size={15}/><span>Sign out</span></button>}
          </div>}
        </div>
      </div>
      {notifications && (
        <div className="notification-pop" ref={notificationsRef}>
          <div className="pop-head"><strong>Notifications</strong><button onClick={() => setNotifications(false)}><X size={17}/></button></div>
          <div className="notice"><div className="notice-icon"><Bell size={17}/></div><p><strong>No new notifications</strong><span>Your notification list is clear.</span></p></div>
        </div>
      )}
    </header>
  );
}

function WeekStrip() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isToday = date.toDateString() === today.toDateString();
    return {
      label: isToday ? "TODAY" : date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
      day: date.getDate(),
      isToday,
    };
  });
  return <div className="week-strip">{days.map(day => <div className={day.isToday ? "today" : ""} key={`${day.label}-${day.day}`}><span>{day.label}</span><strong>{day.day}</strong>{day.isToday ? <em/> : <i/>}</div>)}</div>
}

function Home({ habits, toggleHabit, addHabit, deleteHabit, setActive, toast, supabase, currentUser }) {
  const [motions, setMotions] = useState([]);
  const [savedGoals, setSavedGoals] = useState([]);
  const [standardRows, setStandardRows] = useState(habits);
  const [panel, setPanel] = useState(null);
  const [draft, setDraft] = useState("");
  const [focus, setFocus] = useState("Business");
  const [moveDraft, setMoveDraft] = useState("");
  const [moveFocus, setMoveFocus] = useState("Business");
  const [editingMoveId, setEditingMoveId] = useState(null);
  const [motionHelpOpen, setMotionHelpOpen] = useState(false);
  const motionHelpRef = useRef(null);
  const completed = standardRows.filter(h => h.done).length;
  const completedMotions = motions.filter(m => m.done).length;
  const baseExp = completedMotions * 25 + completed * 10;
  const levelSize = 250;
  const currentLevel = Math.floor(baseExp / levelSize) + 1;
  const levelExp = baseExp % levelSize;
  const canPersist = Boolean(supabase && currentUser?.id);
  const todayKey = localDateKey();
  useEffect(() => {
    if (!canPersist) {
      setStandardRows(habits);
      setSavedGoals(goals);
      return;
    }
    let cancelled = false;
    Promise.all([
      supabase.from("motion_today_motions").select("*").eq("user_id", currentUser.id).eq("scheduled_date", todayKey).order("created_at", { ascending: false }),
      supabase.from("motion_goals").select("*").eq("user_id", currentUser.id).eq("status", "active").order("created_at", { ascending: false }).limit(6),
      supabase.from("motion_daily_standards").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
    ]).then(([motionsResult, goalsResult, standardsResult]) => {
      if (cancelled) return;
      if (!motionsResult.error) setMotions((motionsResult.data || []).map(savedMotionFromRow));
      if (!goalsResult.error) setSavedGoals((goalsResult.data || []).map(savedGoalFromRow));
      if (!standardsResult.error) setStandardRows((standardsResult.data || []).map(savedStandardFromRow));
      if (motionsResult.error || goalsResult.error || standardsResult.error) toast("Saved progress tables need the Supabase update.");
    });
    return () => { cancelled = true; };
  }, [canPersist, currentUser?.id, supabase, todayKey]);
  const startPanel = (type) => {
    setDraft("");
    setFocus("Business");
    setEditingMoveId(null);
    setPanel(type);
  };
  const clearMotionEdit = () => {
    setMoveDraft("");
    setMoveFocus("Business");
    setEditingMoveId(null);
  };
  const editMove = (motion) => {
    setMoveDraft(motion.title);
    setMoveFocus(motionCategories.find(category => motion.meta?.includes(category)) || "Business");
    setEditingMoveId(motion.id);
    setPanel(null);
  };
  const saveNewMove = (event) => {
    event.preventDefault();
    if (!moveDraft.trim()) return;
    if (editingMoveId) {
      const updatedMotion = { title: moveDraft.trim(), meta: `Today - ${moveFocus}`, category: moveFocus };
      setMotions(motions.map(motion => motion.id === editingMoveId ? { ...motion, ...updatedMotion } : motion));
      if (canPersist) {
        supabase.from("motion_today_motions").update({ title: updatedMotion.title, category: moveFocus, updated_at: new Date().toISOString() }).eq("id", editingMoveId).eq("user_id", currentUser.id).then(({ error }) => {
          if (error) toast("Move updated locally. Supabase update failed.");
        });
      }
      clearMotionEdit();
      toast("Move updated.");
      return;
    }
    const newMotion = { id: Date.now(), title: moveDraft.trim(), meta: `Today - ${moveFocus}`, category: moveFocus, done: false };
    setMotions([newMotion, ...motions]);
    if (canPersist) {
      supabase.from("motion_today_motions").insert({ user_id: currentUser.id, title: newMotion.title, category: moveFocus, scheduled_date: todayKey }).select().single().then(({ data, error }) => {
        if (error) {
          toast("Move saved locally. Supabase table needs updating.");
          return;
        }
        if (data) setMotions(current => current.map(item => item.id === newMotion.id ? savedMotionFromRow(data) : item));
      });
    }
    setMoveDraft("");
    toast("Move added to today's motion.");
  };
  const saveHabit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const newStandard = { id: Date.now(), label: draft.trim(), meta: focus, icon: "+", done: false };
    setStandardRows([newStandard, ...standardRows]);
    if (canPersist) {
      supabase.from("motion_daily_standards").insert({ user_id: currentUser.id, title: newStandard.label, category: focus }).select().single().then(({ data, error }) => {
        if (error) {
          toast("Standard saved locally. Supabase table needs updating.");
          return;
        }
        if (data) setStandardRows(current => current.map(item => item.id === newStandard.id ? savedStandardFromRow(data) : item));
      });
    } else addHabit(newStandard);
    setDraft("");
    setPanel(null);
    toast("Daily standard added privately.");
  };
  const toggleMotion = (id) => {
    const target = motions.find(motion => motion.id === id);
    const nextDone = !target?.done;
    setMotions(motions.map(motion => motion.id === id ? { ...motion, done: nextDone } : motion));
    if (canPersist) {
      supabase.from("motion_today_motions").update({ completed_at: nextDone ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", currentUser.id).then(({ error }) => {
        if (error) toast("Motion updated locally. Supabase update failed.");
      });
    }
    toast("Today's motion updated.");
  };
  const toggleStandard = (id) => {
    const target = standardRows.find(standard => standard.id === id);
    const nextDone = !target?.done;
    setStandardRows(standardRows.map(standard => standard.id === id ? { ...standard, done: nextDone } : standard));
    if (canPersist) {
      supabase.from("motion_daily_standards").update({ completed_on: nextDone ? todayKey : null, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", currentUser.id).then(({ error }) => {
        if (error) toast("Standard updated locally. Supabase update failed.");
      });
    } else toggleHabit(id);
    toast("Standard updated privately.");
  };
  const deleteStandard = (id) => {
    setStandardRows(standardRows.filter(standard => standard.id !== id));
    if (canPersist) {
      supabase.from("motion_daily_standards").delete().eq("id", id).eq("user_id", currentUser.id).then(({ error }) => {
        if (error) toast("Standard removed locally. Supabase delete failed.");
      });
    } else deleteHabit(id);
    toast("Daily standard deleted.");
  };
  const deleteMotion = (motion) => {
    setMotions(motions.filter(item => item.id !== motion.id));
    if (editingMoveId === motion.id) clearMotionEdit();
    if (canPersist) {
      supabase.from("motion_today_motions").delete().eq("id", motion.id).eq("user_id", currentUser.id).then(({ error }) => {
        if (error) toast("Move removed locally. Supabase delete failed.");
      });
    }
    toast("Move removed.");
  };
  useEffect(() => {
    if (!motionHelpOpen) return;
    const closeHelp = (event) => {
      if (!motionHelpRef.current?.contains(event.target)) setMotionHelpOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMotionHelpOpen(false);
    };
    document.addEventListener("mousedown", closeHelp);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeHelp);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [motionHelpOpen]);
  return (
    <>
      <section className="welcome">
        <div><p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()} · TODAY'S MOTION</p><h1>Progress is earned.</h1><p>Move with intent. Build with others. Keep the promise.</p></div>
      </section>
      <section className="motion-rules card">
        <div><p className="eyebrow">HOW PROGRESS IS SCORED</p><h2>No guessed percentages. Only evidence.</h2><p>Complete clear actions to earn EXP. No separate points system, no confusing progress percentages.</p></div>
        <div className="rule-grid">
          <span><strong>+25 EXP</strong>Completed daily move</span>
          <span><strong>+10 EXP</strong>Daily standard checked</span>
          <span><strong>+5 EXP</strong>Qualified network contribution</span>
          <span><strong>+10 EXP</strong>Useful project update</span>
          <span><strong>EXP</strong>One simple progress currency</span>
          <span><strong>Evidence</strong>Progress must be logged or completed</span>
        </div>
      </section>
      <FoundingTeamPanel currentUser={currentUser}/>
      <form className="today-panel motion-entry" onSubmit={saveNewMove}>
        <div>
          <div className="motion-title-row">
            <p className="eyebrow">SET TODAY'S MOTION</p>
            <span className="motion-help-wrap" ref={motionHelpRef}>
              <button type="button" className="motion-help-trigger" onClick={() => setMotionHelpOpen(open => !open)} aria-label="Explain today's motion">?</button>
              {motionHelpOpen && <div className="motion-help-pop" role="dialog" aria-label="Today's motion help">
                <button type="button" className="motion-help-close" onClick={() => setMotionHelpOpen(false)} aria-label="Close today's motion help"><X size={14}/></button>
                <strong>What this is for</strong>
                <p>This is the main action that makes today count. It should be clear, controllable and finishable — not a vague goal or a full task list.</p>
                <span>Good examples</span>
                <ul>
                  {motionHelpExamples.map(example => <li key={example}>{example}</li>)}
                </ul>
              </div>}
            </span>
          </div>
          <h2>{editingMoveId ? "Update this motion" : "Write the move that matters now"}</h2>
          <p>{editingMoveId ? "Refine the action, then update it in the same space." : "Add one clear action for today. Keep it specific enough that you can finish it or honestly say you did not."}</p>
        </div>
        <div className="today-panel-fields">
          <input value={moveDraft} onChange={event => setMoveDraft(event.target.value)} placeholder="Example: Call five qualified prospects" />
          <select value={moveFocus} onChange={event => setMoveFocus(event.target.value)} aria-label="Focus area">
            {motionCategories.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="today-panel-actions">
          {editingMoveId && <button type="button" onClick={clearMotionEdit}>Cancel edit</button>}
          <button type="submit">{editingMoveId ? "Update move" : "Save move"}</button>
        </div>
      </form>
      {panel === "habit" && <form className="today-panel" onSubmit={saveHabit}>
        <div>
          <p className="eyebrow">NEW DAILY STANDARD</p>
          <h2>Build the routine</h2>
          <p>Daily standards are repeatable actions you want to check off most days.</p>
        </div>
        <div className="today-panel-fields">
          <input value={draft} onChange={event => setDraft(event.target.value)} autoFocus placeholder="Example: 45 minutes strength training" />
          <select value={focus} onChange={event => setFocus(event.target.value)} aria-label="Focus area">
            {motionCategories.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="today-panel-actions">
          <button type="button" onClick={() => setPanel(null)}>Cancel</button>
          <button type="submit">Save standard</button>
        </div>
      </form>}
      <WeekStrip/>
      <div className="dashboard-grid">
        <main>
          <section className="card focus-card">
            <div className="section-head"><div><p className="eyebrow">TODAY'S MOTION</p><h2>Your moves for today</h2></div></div>
            {motions.length ? motions.map(motion => <div className="commitment" key={motion.id}>
              <button className={`round-check ${motion.done ? "done" : ""}`} onClick={() => toggleMotion(motion.id)}>{motion.done ? <CheckCircle2 size={21}/> : <Circle size={21}/>}</button>
              <div><strong>{motion.title}</strong><span>{motion.done ? <Check size={13}/> : <Clock3 size={13}/>} {motion.done ? "Completed today" : motion.meta}</span></div>
              <div className="motion-row-actions">
                <button type="button" onClick={() => editMove(motion)} aria-label={`Edit ${motion.title}`}><Pencil size={15}/></button>
                <button type="button" className="danger" onClick={() => deleteMotion(motion)} aria-label={`Delete ${motion.title}`}><Trash2 size={15}/></button>
              </div>
            </div>) : <div className="empty-state compact"><strong>No moves set yet</strong><span>Use the box above to set your first motion for today.</span></div>}
            <div className="focus-foot"><div><span>{completedMotions} of {motions.length} moves complete · {baseExp} EXP earned today</span><div className="mini-progress"><i style={{width:`${motions.length ? completedMotions / motions.length * 100 : 0}%`}}/></div></div><p><Lock size={12}/> Only visible to you</p></div>
          </section>

          <section className="goals-section">
            <div className="section-head"><div><p className="eyebrow">FORWARD PATH</p><h2>Goals in motion</h2></div><button className="link-btn" onClick={() => setActive("Goals & habits")}>View all <ArrowUpRight size={15}/></button></div>
            <div className="goal-grid">
              {savedGoals.length ? savedGoals.map(g => <article className="goal-card" key={g.id || g.title}>
                <div className={`goal-icon ${g.color}`}><Goal size={18}/></div>
                <OptionsMenu label="Goal options" items={[
                  { label: "Open goal", onClick: () => setActive("Goals & habits") },
                  { label: "Open evidence log", onClick: () => { setActive("Goals & habits"); toast("Evidence log opened."); } },
                  { label: "Set review reminder", onClick: () => { setActive("Schedule"); toast("Goal review reminder opened."); } },
                  { label: "Privacy: only me", active: true, onClick: () => toast("Goal remains private to you.") },
                ]}/><p className="goal-area">{g.area}</p><h3>{g.title}</h3>
                <div className="goal-progress"><i style={{width:`${Math.min((g.evidence || 0) * 20, 100)}%`}} className={g.color}/></div>
                <div className="goal-meta"><strong>{g.evidence || 0} proofs</strong><span><CalendarDays size={12}/>{g.date}</span></div>
              </article>) : <div className="empty-state goal-empty"><strong>No goals yet</strong><span>Add your first goal from Goals & habits when you are ready.</span></div>}
            </div>
          </section>
        </main>
        <aside className="right-rail">
          <section className="card habits">
            <div className="section-head"><div><p className="eyebrow">CONSISTENCY ENGINE</p><h2>Daily standards</h2></div><button onClick={() => setActive("Goals & habits")} aria-label="Open daily standards"><ChevronRight size={18}/></button></div>
            {standardRows.length ? standardRows.map(h => <div className="habit-row" key={h.id}>
              <button className="habit habit-main" onClick={() => toggleStandard(h.id)}>
                <span className="habit-symbol">{h.icon}</span><div><strong>{h.label}</strong><span>{h.meta}</span></div>
                <i className={h.done ? "checked" : ""}>{h.done && <Check size={13}/>}</i>
              </button>
              <OptionsMenu label="Daily standard options" items={[
                { label: "Delete", danger: true, onClick: () => deleteStandard(h.id) },
              ]}/>
            </div>) : <div className="empty-state compact"><strong>No daily standards yet</strong><span>Add only the repeatable actions you actually want to track.</span></div>}
            <button className="add-habit" onClick={() => startPanel("habit")}><Plus size={15}/> Add a discipline</button>
          </section>
          <section className="card pulse">
            <p className="eyebrow">EXP PROGRESS</p><div className="pulse-top"><div className="ring" style={{background:`conic-gradient(var(--gold) 0 ${Math.round((levelExp / levelSize) * 100)}%,#303639 ${Math.round((levelExp / levelSize) * 100)}%)`}}><span>{levelExp}<small>/{levelSize}</small></span></div><div><h3>Level {currentLevel}</h3><p>{levelSize - levelExp} EXP to next level</p></div></div>
            <div className="stat-row"><span>Level<strong>{currentLevel} <small>Current rank</small></strong></span><span>EXP<strong>{levelExp} <small>/ {levelSize}</small></strong></span></div>
            {featureEnabled("ranks")
              ? <button className="soft-btn" onClick={() => setActive("Ranks")}>View rank unlocks <ChevronRight size={15}/></button>
              : <button className="soft-btn" onClick={() => setActive("Goals & habits")}>Review progress <ChevronRight size={15}/></button>}
          </section>
        </aside>
      </div>
    </>
  );
}

const libraryCategoryIcons = {
  Foundations: Sparkles,
  Business: FolderKanban,
  Trading: TrendingUp,
  Fitness: Heart,
  Psychology: BrainCircuit,
};

function LibraryReader({ resource, onBack, onNext, saved, toggleSaved, toast }) {
  const [checked, setChecked] = useState([]);
  const [exampleOpen, setExampleOpen] = useState(false);
  const markCheck = (index) => setChecked((current) =>
    current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
  );
  const CategoryIcon = libraryCategoryIcons[resource.category] || BookOpen;
  const hasExampleLoop = resource.id === "motion-only-operating-system";

  return (
    <article className="library-reader">
      <div className="reader-actions library-reader-actions">
        <button className="reader-back" onClick={onBack}><ArrowLeft size={16}/> Back to library</button>
        <button className={`save-resource ${saved ? "saved" : ""}`} onClick={toggleSaved}>
          <Bookmark size={15} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save"}
        </button>
      </div>

      <header className="reader-hero">
        <div className="reader-category"><CategoryIcon size={16}/>{resource.category} / {resource.type}</div>
        <h1>{resource.title}</h1>
        <p>{resource.summary}</p>
        <div className="reader-meta">
          <span><Clock3 size={13}/>{resource.minutes} min</span>
          <span><Target size={13}/>{resource.level}</span>
          <span><Lock size={13}/>Private progress</span>
        </div>
        {hasExampleLoop && <button className="example-loop-button" onClick={() => setExampleOpen(true)}><Sparkles size={15}/> View example loop</button>}
        <div className="reader-outcome"><span>YOU WILL LEAVE WITH</span><strong>{resource.outcome}</strong></div>
      </header>

      {exampleOpen && (
        <div className="modal-scrim" role="presentation" onMouseDown={() => setExampleOpen(false)}>
          <div className="admin-modal example-loop-modal" onMouseDown={event => event.stopPropagation()}>
            <header>
              <div><p className="eyebrow">EXAMPLE EXECUTION LOOP</p><h2>How a member might fill this in</h2><span>This is a practical example, not a perfect life plan. The point is to show how direction turns into weekly action.</span></div>
              <button onClick={() => setExampleOpen(false)}><X size={18}/></button>
            </header>
            <div className="example-loop-content">
              {[
                ["Direction", "This is the bigger direction behind the work. It does not need to be perfectly measurable. It reminds the member what kind of life, business or standard they are building.", "Example: build a disciplined business and body without gambling, drifting or relying on motivation."],
                ["12-week outcome", "This is the main result for the next 12 weeks. Keep it to one clear result so the member knows what they are trying to move.", "Example: build a qualified GBP 25,000 monthly sales pipeline by 30 September, measured by decision-maker conversations and written next steps."],
                ["Why now", "This explains why the outcome matters at this point in the member's life. It gives the goal urgency without needing hype.", "Example: the business needs cleaner deal flow now, and a stronger pipeline would reduce reactive decisions."],
                ["Lead measures", "These are the repeatable actions that give the outcome a chance. The member cannot fully control the result, but they can control these inputs.", "Example: 50 targeted business messages per week, 5 qualified sales conversations per week, and every warm lead followed up."],
                ["This week's three commitments", "These are the three promises that would make this week count. They should be specific enough to mark as done or not done.", "Example: send the offer deck to 10 qualified prospects, book 2 sales calls, and rewrite the offer headline."],
                ["Likely obstacle and response", "This is the backup plan. It stops one busy day from becoming a lost week by deciding what happens when the obvious problem shows up.", "Example: if client work overruns the morning, the sales block moves to 16:00 and the minimum becomes five targeted follow-ups."],
                ["Keep / change / stop", "This is the weekly review. The member keeps what worked, changes one thing that would improve next week, and stops one behaviour that is creating drag.", "Example: keep morning planning, change sales outreach to before admin, stop checking charts outside the planned trading window."],
              ].map(([label, text, example], index) => (
                <article key={label}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <div><strong>{label}</strong><p>{text}</p><em>{example}</em></div>
                </article>
              ))}
              <div className="example-loop-note"><Lock size={15}/><span>In the real app, this kind of loop should be private by default. Members can share parts only when they want feedback or accountability.</span></div>
            </div>
          </div>
        </div>
      )}

      {resource.safety && (
        <div className="reader-safety">
          <AlertTriangle size={19}/>
          <div><strong>Read this first</strong><p>{resource.safety}</p></div>
        </div>
      )}

      <div className="reader-layout">
        <div className="reader-body">
          {resource.sections.map((section, sectionIndex) => (
            <section className="reader-section" id={`${resource.id}-${sectionIndex}`} key={section.heading}>
              <span className="section-number">{String(sectionIndex + 1).padStart(2, "0")}</span>
              <h2>{section.heading}</h2>
              {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.steps && (
                <ol className="reader-steps">
                  {section.steps.map((step, index) => <li key={step}><i>{index + 1}</i><span>{step}</span></li>)}
                </ol>
              )}
              {section.bullets && (
                <ul className="reader-bullets">
                  {section.bullets.map((bullet) => <li key={bullet}><ChevronRight size={14}/><span>{bullet}</span></li>)}
                </ul>
              )}
              {section.examples && (
                <div className="reader-examples">
                  {section.examples.map((example, index) => (
                    <article key={`${example.title}-${index}`}>
                      <span>{example.label || "Example"}</span>
                      <h3>{example.title}</h3>
                      <p>{example.text}</p>
                      {example.demo && <em>{example.demo}</em>}
                    </article>
                  ))}
                </div>
              )}
              {section.table && (
                <div className="reader-table-wrap">
                  <table className="reader-table">
                    <thead><tr>{section.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                    <tbody>{section.table.rows.map((row) => <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {section.callout && (
                <div className="reader-callout"><span>{section.callout.label}</span><p>{section.callout.text}</p></div>
              )}
            </section>
          ))}

          <section className="resource-checklist" id="library-checklist">
            <div className="checklist-title">
              <div><p className="eyebrow">ACTION CHECK</p><h2>Ready to use</h2></div>
              <strong>{checked.length} / {resource.checklist.length}</strong>
            </div>
            <div className="checklist-progress"><i style={{width:`${checked.length / resource.checklist.length * 100}%`}}/></div>
            {resource.checklist.map((item, index) => (
              <button className={checked.includes(index) ? "complete" : ""} onClick={() => markCheck(index)} key={item}>
                <i>{checked.includes(index) && <Check size={14}/>}</i><span>{item}</span>
              </button>
            ))}
            <p className="private-note"><Lock size={12}/>Your checks stay on this device and are private to you.</p>
          </section>

          {resource.template && (
            <section className="resource-template">
              <div className="template-head">
                <div><p className="eyebrow">WORKSHEET</p><h2>{resource.template.title}</h2><p>{resource.template.intro}</p></div>
                <button onClick={() => toast(`${resource.template.title} added to your private workspace.`)}><Plus size={14}/>Use template</button>
              </div>
              <div className="template-fields">
                {resource.template.fields.map(([label, prompt], index) => (
                  <div key={label}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{label}</strong><small>{prompt}</small></span></div>
                ))}
              </div>
            </section>
          )}

          <section className="resource-sources">
            <p className="eyebrow">SOURCE NOTES</p>
            <h2>Read further</h2>
            <p>These references support the guide and provide the fuller official or research context. Motion Only content is educational and should be adapted to your circumstances.</p>
            {resource.sources.length ? (
              <div>{resource.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  <span>{source.label}</span><ArrowUpRight size={14}/>
                </a>
              ))}</div>
            ) : <span className="no-sources">Motion Only operating guidance. No external source required.</span>}
          </section>
        </div>

        <aside className="reader-index">
          <p className="eyebrow">IN THIS GUIDE</p>
          {resource.sections.map((section, index) => (
            <a href={`#${resource.id}-${index}`} key={section.heading}><span>{String(index + 1).padStart(2, "0")}</span>{section.heading}</a>
          ))}
          <a href="#library-checklist"><span>✓</span>Action checklist</a>
          <div className="index-standard"><ShieldCheck size={16}/><span><strong>Motion Only standard</strong>Practical, sourced and private by default.</span></div>
        </aside>
      </div>

      <footer className="reader-next">
        <span>NEXT IN {resource.category.toUpperCase()}</span>
        <button onClick={onNext}><strong>Continue the track</strong><ChevronRight size={18}/></button>
      </footer>
    </article>
  );
}

function LibraryPage({ toast }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(["motion-only-operating-system"]);
  const filtered = useMemo(() => libraryContent.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const haystack = `${item.title} ${item.category} ${item.type} ${item.summary} ${item.outcome}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [query, category]);

  const openResource = (resource) => {
    setSelected(resource);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleSaved = (id) => {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const nextResource = () => {
    const track = libraryContent.filter((item) => item.category === selected.category);
    const next = track[(track.findIndex((item) => item.id === selected.id) + 1) % track.length];
    openResource(next);
  };

  if (selected) {
    return <LibraryReader
      key={selected.id}
      resource={selected}
      onBack={() => {setSelected(null); window.scrollTo({ top: 0, behavior: "smooth" });}}
      onNext={nextResource}
      saved={saved.includes(selected.id)}
      toggleSaved={() => toggleSaved(selected.id)}
      toast={toast}
    />;
  }

  return (
    <div className="library-page">
      <section className="library-hero">
        <div>
          <p className="eyebrow">THE MOTION ONLY FIELD LIBRARY</p>
          <h1>Knowledge that moves.</h1>
          <p>Practical systems for building the work, protecting the downside and staying consistent. No hype. No filler. Every guide ends in an action.</p>
        </div>
        <div className="library-stats">
          <span><strong>{libraryStats.resources}</strong>Complete resources</span>
          <span><strong>{libraryStats.tracks}</strong>Focused tracks</span>
          <span><strong>{libraryStats.templates}</strong>Working templates</span>
        </div>
      </section>

      <section className="featured-resources">
        <div className="section-head">
          <div><p className="eyebrow">START WITH THE SYSTEM</p><h2>Core field guides</h2></div>
          <span className="private-library"><Lock size={12}/>Reading activity is private</span>
        </div>
        <div className="featured-grid">
          {libraryContent.filter((item) => item.featured).map((item, index) => {
            const Icon = libraryCategoryIcons[item.category];
            return (
              <button onClick={() => openResource(item)} key={item.id}>
                <span className="featured-number">0{index + 1}</span>
                <i><Icon size={19}/></i>
                <small>{item.category} / {item.minutes} min</small>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <em>Open field guide <ArrowUpRight size={14}/></em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="library-catalogue">
        <div className="catalogue-head">
          <div><p className="eyebrow">COMPLETE LIBRARY</p><h2>Choose the next constraint</h2></div>
          <div className="library-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, systems and templates..."/></div>
        </div>
        <div className="category-tabs">
          {libraryCategories.map((item) => (
            <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>
              {item}<span>{item === "All" ? libraryContent.length : libraryContent.filter((resource) => resource.category === item).length}</span>
            </button>
          ))}
        </div>
        <div className="catalogue-summary">
          <span>{filtered.length} resources</span>
          <span><ShieldCheck size={13}/>Educational, sourced and private by default</span>
        </div>
        <div className="library-grid">
          {filtered.map((item) => {
            const Icon = libraryCategoryIcons[item.category];
            const isSaved = saved.includes(item.id);
            return (
              <article className="library-card" key={item.id}>
                <div className="library-card-top">
                  <i><Icon size={18}/></i>
                  <button aria-label={isSaved ? "Remove saved resource" : "Save resource"} onClick={() => toggleSaved(item.id)}>
                    <Bookmark size={15} fill={isSaved ? "currentColor" : "none"}/>
                  </button>
                </div>
                <span className="resource-type">{item.category} / {item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="resource-meta"><span><Clock3 size={12}/>{item.minutes} min</span><span>{item.level}</span></div>
                <button className="open-resource" onClick={() => openResource(item)}>Open resource <ArrowUpRight size={14}/></button>
              </article>
            );
          })}
          {!filtered.length && <div className="library-empty"><Search size={24}/><strong>No resources found</strong><span>Try a different search or track.</span></div>}
        </div>
      </section>

      <section className="library-principles">
        <div><ShieldCheck size={21}/><span><strong>Built for responsible progress</strong>Trading education is process-led, fitness guidance includes clear safety boundaries, and business playbooks avoid manipulative claims.</span></div>
        <div><Lock size={21}/><span><strong>Private by default</strong>Your saved resources, worksheet use and completion activity are never shared unless you choose to share them.</span></div>
        <div><ListChecks size={21}/><span><strong>Action at the end</strong>Every resource includes a completion check and a working template, so reading turns into motion.</span></div>
      </section>
    </div>
  );
}

function SchedulePage({ toast }) {
  const [scope, setScope] = useState("All");
  const [creating, setCreating] = useState(null);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState({ title: "", date: todayIso, time: "19:00", target: "Personal", member: "Joel Gilbert" });
  const [events, setEvents] = useState([]);
  const filtered = scope === "All" ? events : events.filter(event => event.type === scope);
  const upcoming = events.filter(event => !event.done).length;
  const byDate = filtered.reduce((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event];
    return groups;
  }, {});
  const monthStart = new Date(`${todayIso.slice(0, 7)}-01T12:00:00`);
  const monthLabel = monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const monthDays = new Date(2026, 8, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: leadingDays }, (_, index) => ({ key: `blank-${index}`, blank: true })),
    ...Array.from({ length: monthDays }, (_, index) => {
      const day = index + 1;
      const date = `2026-08-${String(day).padStart(2, "0")}`;
      return { key: date, day, date, items: byDate[date] || [] };
    })
  ];
  const firstActiveDate = filtered[0]?.date || "2026-08-08";
  const [selectedDate, setSelectedDate] = useState(firstActiveDate);
  const selectedItems = byDate[selectedDate] || [];
  const resetDraft = (type) => {
    setDraft({ title: "", date: selectedDate, time: "19:00", target: type === "personal" ? "Personal" : "All members", member: "Joel Gilbert" });
    setCreating(type);
  };
  const saveEvent = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const type = creating === "personal" ? "Personal" : draft.target === "Moderators" ? "Role" : draft.target === "Specific member" ? "Targeted" : "Network";
    const target = draft.target === "Specific member" ? draft.member : draft.target === "Personal" ? "Only you" : draft.target;
    const created = {
      id: Date.now(),
      title: draft.title.trim(),
      date: draft.date,
      time: draft.time,
      type,
      target,
      owner: creating === "personal" ? "Joel Gilbert" : "Admin",
      done: false,
      note: type === "Personal" ? "Private reminder. Only you can see it." : "Admin scheduled reminder."
    };
    setEvents([created, ...events]);
    setCreating(null);
    toast(type === "Personal" ? "Personal reminder saved." : "Admin schedule item created.");
  };
  const toggleEvent = (id) => {
    setEvents(events.map(event => event.id === id ? { ...event, done: !event.done } : event));
    toast("Schedule updated.");
  };

  return (
    <div className="schedule-page">
      <section className="schedule-hero">
        <div>
          <p className="eyebrow">THE WEEK AHEAD</p>
          <h1>Schedule</h1>
          <p>Personal reminders, group calls and targeted accountability. Personal items stay private; admin items show only to the intended members.</p>
        </div>
        <div className="schedule-actions">
          <button className="primary" onClick={() => resetDraft("personal")}><Plus size={16}/> Personal reminder</button>
          <button className="soft-btn" onClick={() => resetDraft("admin")}><ShieldCheck size={15}/> Admin event</button>
        </div>
      </section>

      <section className="schedule-stats">
        <span><strong>{upcoming}</strong>Upcoming</span>
        <span><strong>{events.filter(event => event.type === "Network").length}</strong>Network events</span>
        <span><strong>{events.filter(event => event.type === "Targeted" || event.type === "Role").length}</strong>Targeted</span>
      </section>

      {creating && <form className="schedule-form" onSubmit={saveEvent}>
        <div>
          <p className="eyebrow">{creating === "personal" ? "PRIVATE REMINDER" : "ADMIN SCHEDULE"}</p>
          <h2>{creating === "personal" ? "Set a reminder" : "Set a group or targeted item"}</h2>
        </div>
        <input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} autoFocus placeholder={creating === "personal" ? "Example: Review weekly progress" : "Example: Group call"} />
        <input type="date" value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} />
        <input type="time" value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} />
        <select value={draft.target} onChange={event => setDraft({ ...draft, target: event.target.value })}>
          {creating === "personal" ? <option>Personal</option> : <>
            <option>All members</option>
            <option>Moderators</option>
            <option>Specific member</option>
          </>}
        </select>
        {creating === "admin" && draft.target === "Specific member" && <input value={draft.member} onChange={event => setDraft({ ...draft, member: event.target.value })} placeholder="Member name" />}
        <div className="schedule-form-actions">
          <button type="button" onClick={() => setCreating(null)}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>}

      <div className="schedule-tabs">
        {["All", "Personal", "Network", "Role", "Targeted"].map(item => <button className={scope === item ? "active" : ""} onClick={() => setScope(item)} key={item}>{item}</button>)}
      </div>

      <div className="schedule-layout">
        <section className="calendar-shell">
          <div className="calendar-head">
            <div><p className="eyebrow">MONTH VIEW</p><h2>{monthLabel}</h2></div>
            <button onClick={() => resetDraft("personal")}><Plus size={14}/> Add to selected day</button>
          </div>
          <div className="calendar-weekdays">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {calendarCells.map(cell => cell.blank ? <span className="calendar-blank" key={cell.key}/> : (
              <button className={`calendar-cell ${selectedDate === cell.date ? "selected" : ""} ${cell.items.length ? "has-items" : ""}`} onClick={() => setSelectedDate(cell.date)} key={cell.key}>
                <strong>{cell.day}</strong>
                <span>{cell.items.length ? `${cell.items.length} item${cell.items.length > 1 ? "s" : ""}` : "Clear"}</span>
                <i>
                  {cell.items.slice(0,3).map(item => <b className={item.type.toLowerCase()} key={item.id}/>)}
                </i>
              </button>
            ))}
          </div>
        </section>
        <aside className="day-agenda">
          <div className="schedule-date"><CalendarDays size={16}/><span>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span></div>
          {selectedItems.length ? selectedItems.map(item => <button className={`schedule-item ${item.done ? "done" : ""}`} onClick={() => toggleEvent(item.id)} key={item.id}>
            <i>{item.done ? <Check size={14}/> : <Clock3 size={14}/>}</i>
            <span><strong>{item.title}</strong><small>{item.time} - {item.type} - {item.target}</small><em>{item.note}</em></span>
            <Lock size={13}/>
          </button>) : <div className="agenda-empty"><strong>No scheduled items</strong><span>Add a reminder or admin event for this day.</span></div>}
          <div className="schedule-policy">
            <ShieldCheck size={18}/>
            <h2>Visibility</h2>
            <p>Personal reminders are private. Admin events can target everyone, a role, or a specific member.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

const lowValueContributionPhrases = [
  "nice", "same", "agreed", "facts", "lol", "lmao", "thanks", "thanks bro", "let's go", "lets go",
  "fire", "good stuff", "big win", "dm me", "check dm", "sent you a dm", "follow me", "like this",
];

function wordsIn(text = "") {
  return text.trim().split(/\s+/).filter(Boolean);
}

function normaliseContribution(text = "") {
  return text.toLowerCase().replace(/https?:\/\/\S+/g, " link ").replace(/[^a-z0-9£$% ]+/g, " ").replace(/\s+/g, " ").trim();
}

function hasMeaningfulSignal(text = "", sectionName = "Network") {
  const lowered = text.toLowerCase();
  const generalSignals = ["because", "lesson", "question", "feedback", "example", "result", "next step", "blocked", "blocker", "decision", "proof", "evidence", "review", "plan", "?"];
  const roomSignals = {
    Network: ["context", "learned", "try", "improve", "resource", "support", "accountability"],
    Messages: ["can you", "i need", "follow up", "intro", "check in", "accountability"],
    Projects: ["update", "done", "next", "blocked", "decision", "owner", "deadline", "file", "uploaded", "review"],
  };
  return [...generalSignals, ...(roomSignals[sectionName] || [])].some(signal => lowered.includes(signal));
}

function evaluateContribution(text = "", sectionName = "Network", existingMessages = []) {
  const trimmed = text.trim();
  const wordCount = wordsIn(trimmed).length;
  const normalised = normaliseContribution(trimmed);
  const previous = existingMessages.map(message => normaliseContribution(message[1] || ""));
  const mostlyEmojiOrSymbols = trimmed.length > 0 && normalised.replace(/\blink\b/g, "").length < Math.max(4, trimmed.length * 0.2);
  const linkOnly = /https?:\/\/\S+/i.test(trimmed) && wordCount < 8;
  const exactLowValue = lowValueContributionPhrases.includes(normalised);
  const repeated = normalised.length > 8 && previous.slice(-8).some(body => body === normalised || body.includes(normalised) || normalised.includes(body));

  if (!trimmed) return { eligible: false, exp: 0, label: "Write a useful contribution", reason: "No message entered yet." };
  if (wordCount < 8) return { eligible: false, exp: 0, label: "No EXP", reason: "Too short. Add context, a question, a lesson, or a next step." };
  if (mostlyEmojiOrSymbols || linkOnly) return { eligible: false, exp: 0, label: "No EXP", reason: "Links or reactions need useful context before they count." };
  if (exactLowValue) return { eligible: false, exp: 0, label: "No EXP", reason: "This looks like a low-value reaction, not a contribution." };
  if (repeated) return { eligible: false, exp: 0, label: "No EXP", reason: "Repeated or copied messages do not earn EXP." };

  const signal = hasMeaningfulSignal(trimmed, sectionName);
  if (sectionName === "Projects" && signal) return { eligible: true, exp: 10, label: "+10 EXP eligible", reason: "Project update has useful context or a next step." };
  if (signal) return { eligible: true, exp: 5, label: "+5 EXP eligible", reason: "Contribution appears useful enough to earn chat EXP." };
  return { eligible: false, exp: 0, label: "Needs signal", reason: "Long enough, but add a question, result, lesson, blocker, decision, or next step." };
}

function DeepWorkPage({ name, toast, notificationSettings, setNotificationSettings, supabase, currentUser }) {
  const pageCopy = pages[name];
  const sectionName = name === "Network" ? "Network" : name;
  const data = {
    Network: {
      label: "room",
      openLabel: "Open room",
      emptyAction: "Start discussion",
      items: [],
      messages: []
    },
    Messages: {
      label: "conversation",
      openLabel: "Open conversation",
      emptyAction: "Send message",
      items: [],
      messages: []
    },
    Projects: {
      label: "workspace",
      openLabel: "Open workspace",
      emptyAction: "Post update",
      items: [],
      messages: []
    }
  }[sectionName];
  const [items, setItems] = useState(data.items);
  const [selected, setSelected] = useState(data.items[0] || null);
  const [opened, setOpened] = useState(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(data.messages);
  const [pinnedSpaces, setPinnedSpaces] = useState([]);
  const [actionPanel, setActionPanel] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [workspaceMedia, setWorkspaceMedia] = useState([]);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomDraft, setRoomDraft] = useState({
    title: "",
    purpose: "",
    access: "All members",
    type: "Topic discussion",
    posting: "Members can post. Admins and moderators can pin or remove posts.",
    moderation: "Report queue enabled",
  });
  const [workspaceDraft, setWorkspaceDraft] = useState({
    title: "",
    purpose: "",
    access: "Invitation only",
    type: "Accountability sprint",
    outcome: "",
    review: "Weekly review",
  });
  const activeRoomId = opened?.id || selected?.id || null;
  const draftQuality = evaluateContribution(draft, sectionName, messages);
  useEffect(() => {
    if (!supabase || !currentUser || !["Network", "Messages"].includes(sectionName)) return;
    let cancelled = false;
    const kind = sectionName === "Messages" ? "direct" : "network";
    supabase
      .from("motion_rooms")
      .select("*")
      .eq("kind", kind)
      .order("created_at", { ascending: true })
      .then(({ data: rows, error }) => {
        if (cancelled) return;
        if (error) {
          toast("Chat rooms need the Supabase chat update.");
          return;
        }
        const nextItems = (rows || []).map(spaceFromRoomRow);
        setItems(nextItems);
        setSelected(current => current || nextItems[0] || null);
      });
    return () => { cancelled = true; };
  }, [supabase, currentUser?.id, sectionName]);

  useEffect(() => {
    if (!supabase || !currentUser || !opened?.id || !["Network", "Messages"].includes(sectionName)) return;
    let cancelled = false;
    const loadMessages = () => {
      supabase
        .from("motion_room_messages")
        .select("id, room_id, author_id, author_name, author_founding_role, body, exp_awarded, quality_label, quality_reason, created_at")
        .eq("room_id", opened.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(100)
        .then(({ data: rows, error }) => {
          if (cancelled) return;
          if (error) {
            toast("Messages need the Supabase chat update.");
            return;
          }
          setMessages((rows || []).map(messageFromRoomRow));
        });
    };
    loadMessages();
    const channel = supabase
      .channel(`motion-room-${opened.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "motion_room_messages", filter: `room_id=eq.${opened.id}` }, loadMessages)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUser?.id, opened?.id, sectionName]);

  const createItem = () => {
    if (sectionName === "Network") {
      setCreatingRoom(true);
      return;
    }
    const title = sectionName === "Network" ? "New private room" : sectionName === "Messages" ? "New member conversation" : "New private workspace";
    const created = { title, meta:"Created now - Private", Icon:sectionName === "Network" ? Users : sectionName === "Messages" ? MessageCircle : FolderKanban, description:"Created privately for Motion Only. Access is controlled by invite and role.", stat:"Private" };
    setItems([created, ...items]);
    setSelected(created);
    toast(`${title} created.`);
  };
  const submitRoom = async (event) => {
    event.preventDefault();
    const title = roomDraft.title.trim() || "New private room";
    const purpose = roomDraft.purpose.trim() || "Private Motion Only room for focused member discussion.";
    const created = {
      title,
      meta: `Created now - ${roomDraft.access}`,
      Icon: roomDraft.type === "Social support" ? Sparkles : Users,
      description: purpose,
      stat: `${roomDraft.type} - Private by default`,
    };
    if (supabase && currentUser) {
      const { data: row, error } = await supabase
        .from("motion_rooms")
        .insert({
          title,
          description: purpose,
          kind: "network",
          room_type: roomDraft.type,
          access: roomDraft.access,
          posting_rules: roomDraft.posting,
          moderation: roomDraft.moderation,
          created_by: currentUser.id,
        })
        .select()
        .single();
      if (error) {
        toast("Room could not be created. Check the chat tables/policies.");
        return;
      }
      created.id = row.id;
      created.meta = `${row.room_type} - ${row.access}`;
      created.stat = row.access;
    }
    setItems([created, ...items]);
    setSelected(created);
    setCreatingRoom(false);
    setRoomDraft({ title: "", purpose: "", access: "All members", type: "Topic discussion", posting: "Members can post. Admins and moderators can pin or remove posts.", moderation: "Report queue enabled" });
    toast(`${title} created.`);
  };
  const submitWorkspace = (event) => {
    event.preventDefault();
    const title = workspaceDraft.title.trim() || "New private workspace";
    const purpose = workspaceDraft.purpose.trim() || "A private project space for members to work toward one clear outcome together.";
    const created = {
      title,
      meta: `Created now - ${workspaceDraft.access}`,
      Icon: workspaceDraft.type.includes("Trading") ? TrendingUp : workspaceDraft.type.includes("Content") ? Sparkles : workspaceDraft.type.includes("Fitness") ? Heart : FolderKanban,
      description: purpose,
      stat: workspaceDraft.outcome.trim() ? workspaceDraft.outcome.trim() : `${workspaceDraft.type} - 0%`,
    };
    setItems([created, ...items]);
    setSelected(created);
    setWorkspaceDraft({ title: "", purpose: "", access: "Invitation only", type: "Accountability sprint", outcome: "", review: "Weekly review" });
    toast(`${title} workspace created.`);
  };
  const send = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const quality = evaluateContribution(draft, sectionName, messages);
    const body = draft.trim();
    if (supabase && currentUser && activeRoomId && ["Network", "Messages"].includes(sectionName)) {
      const { data: row, error } = await supabase
        .from("motion_room_messages")
        .insert({
          room_id: activeRoomId,
          author_id: currentUser.id,
          author_name: displayNameFor(currentUser),
          author_founding_role: foundingLabelFor(currentUser.foundingRole),
          body,
          exp_awarded: quality.eligible ? quality.exp : 0,
          quality_label: quality.label,
          quality_reason: quality.reason,
        })
        .select("id, room_id, author_id, author_name, author_founding_role, body, exp_awarded, quality_label, quality_reason, created_at")
        .single();
      if (error) {
        toast("Message could not be saved. Check the Supabase chat update.");
        return;
      }
      setMessages([...messages, messageFromRoomRow(row)]);
    } else {
      setMessages([...messages, [displayNameFor(currentUser), body, "now", quality]]);
    }
    setDraft("");
    toast(quality.eligible ? `${sectionName === "Projects" ? "Workspace update posted" : "Message sent"}. ${quality.label}.` : `${sectionName === "Projects" ? "Workspace update posted" : "Message sent"}. No EXP awarded.`);
  };
  const uploadWorkspaceMedia = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const uploads = files.map(file => ({
      type: file.type.startsWith("image/") ? "image" : "file",
      title: file.name,
      meta: `${file.type.startsWith("image/") ? "Image" : "File"} - uploaded now`,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setWorkspaceMedia([...uploads, ...workspaceMedia]);
    event.target.value = "";
    toast(`${uploads.length} media item${uploads.length > 1 ? "s" : ""} added to workspace.`);
  };
  const pinMessage = (message) => {
    const exists = pinnedMessages.some(([author, body]) => author === message[0] && body === message[1]);
    if (!exists) setPinnedMessages([message, ...pinnedMessages]);
    toast("Message pinned to workspace.");
  };
  const pinSpace = (space = selected) => {
    if (!space) return;
    if (!pinnedSpaces.some(item => item.title === space.title)) setPinnedSpaces([space, ...pinnedSpaces]);
    toast(`${space.title} pinned.`);
  };
  const unpinSpace = (space) => {
    setPinnedSpaces(pinnedSpaces.filter(item => item.title !== space.title));
    toast(`${space.title} unpinned.`);
  };
  const notificationsOn = notificationSettings?.[sectionName] ?? true;
  const toggleNotifications = () => {
    setNotificationSettings(settings => ({ ...settings, [sectionName]: !notificationsOn }));
    toast(`${sectionName} notifications ${notificationsOn ? "hidden from" : "shown in"} the main list.`);
  };
  const actionModal = actionPanel && <div className="modal-scrim" role="presentation" onMouseDown={() => setActionPanel(null)}>
    <section className="admin-modal mini-action-modal" onMouseDown={event => event.stopPropagation()}>
      <header><div><p className="eyebrow">SPACE CONTROL</p><h2>{actionPanel}</h2><span>{actionPanel} settings and content for this private Motion Only space.</span></div><button onClick={() => setActionPanel(null)}><X size={18}/></button></header>
      <div className="settings-control toggle-list">
        {["View current items","Add new item","Privacy: members in this space only"].map((item, index) => <button key={item} onClick={() => toast(`${item} selected.`)}><span><strong>{item}</strong><small>{index === 2 ? "Recommended privacy setting" : "Available in private beta prototype"}</small></span><i className={index === 2 ? "on" : ""}>{index === 2 ? "On" : "Open"}</i></button>)}
      </div>
    </section>
  </div>;
  const chatScrollStyles = <style>{`
    .room-board{height:min(650px,calc(100vh - 260px));min-height:510px}
    .room-feed{min-height:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(203,162,75,.62) rgba(17,19,21,.75)}
    .room-feed::-webkit-scrollbar,.message-feed.scrollable::-webkit-scrollbar{width:8px}
    .room-feed::-webkit-scrollbar-track,.message-feed.scrollable::-webkit-scrollbar-track{background:rgba(17,19,21,.75)}
    .room-feed::-webkit-scrollbar-thumb,.message-feed.scrollable::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(216,168,63,.9),rgba(138,103,35,.85));border-radius:999px}
    .room-composer{flex:none}
    .message-feed.scrollable{max-height:min(460px,calc(100vh - 360px));overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(203,162,75,.62) rgba(17,19,21,.75)}
    @media(max-width:820px){.room-board{height:min(620px,calc(100vh - 220px));min-height:0}.room-feed{max-height:none}.message-feed.scrollable{max-height:420px}}
  `}</style>;

  if (opened) {
    if (sectionName === "Network" || sectionName === "Messages") {
      const isConversation = sectionName === "Messages";
      const isSocialRoom = opened.title.toLowerCase().includes("content") || opened.title.toLowerCase().includes("social");
      const roomMessages = messages;
      return <div className="room-space">
        {chatScrollStyles}
        <button className="reader-back" onClick={() => setOpened(null)}><ArrowLeft size={16}/> Back to {isConversation ? "conversations" : "rooms"}</button>
        <section className="room-shell">
          <header className="room-header">
            <div><p className="eyebrow">{isConversation ? "PRIVATE CONVERSATION" : "LIVE ROOM"}</p><h1>{opened.title}</h1><p>{opened.description}</p></div>
            <div className="room-presence"><strong>{isConversation ? "1" : "0"}</strong><span>{isConversation ? "member" : "active now"}</span><i><b>JG</b></i></div>
          </header>
          <div className="room-standard"><ShieldCheck size={17}/><span><strong>{isConversation ? "Conversation standard" : "Room standard"}</strong>{isConversation ? "Keep it direct, useful and private. This is for accountability, feedback and introductions that actually move work forward." : isSocialRoom ? "Ask for the exact support you need. Comment properly, do not spam, and share useful content lessons back into the room." : "Process-led discussion. No hype, no signals, no pressure. Share thinking, context and lessons."}</span></div>
          <div className="room-board">
            <aside className="room-side">
              <p className="eyebrow">{isConversation ? "CONVERSATION" : "IN THIS ROOM"}</p>
              {[notificationsOn ? "Hide notifications" : "Show notifications", ...(isConversation ? ["Pinned notes","Shared links","Member profile","Archive conversation"] : isSocialRoom ? ["Support requests","Content tips","Winning examples","Report concern"] : ["Pinned standards","Weekly prompt","Member intros","Report concern"])].map(item => <button key={item} onClick={() => item.includes("notifications") ? toggleNotifications() : setActionPanel(item)}>{item}<ChevronRight size={14}/></button>)}
            </aside>
            <main className="room-feed">
              {isSocialRoom && <div className="social-room-strip">
                <span><strong>0</strong> posts need support</span>
                <span><strong>0</strong> comments given today</span>
                <span><strong>0</strong> content tips pinned</span>
              </div>}
              {roomMessages.length ? roomMessages.map(([author, body, time, quality, id, foundingRole], index) => <article className="room-message" key={`${id || author}-${index}`}>
                <i>{author.split(" ").map(part => part[0]).join("").slice(0,2)}</i>
                <div><header><strong>{author}{foundingRole && <em className="founding-badge">{foundingRole}</em>}</strong><span>{time}</span></header><p>{body}</p>{quality && <small className={`quality-badge ${quality.eligible ? "eligible" : ""}`}>{quality.label}</small>}</div>
              </article>) : <div className="empty-state compact"><strong>No messages yet</strong><span>Start the conversation when there is something useful to share.</span></div>}
              <form className="room-composer" onSubmit={send}>
                <input value={draft} onChange={event => setDraft(event.target.value)} placeholder={isConversation ? "Write a private reply..." : isSocialRoom ? "Share a post link, support request or content tip..." : "Add to the room..."} />
                <button type="submit">{isConversation ? "Send" : "Post"}</button>
                <div className={`quality-meter ${draftQuality.eligible ? "eligible" : ""}`}><strong>{draftQuality.label}</strong><span>{draftQuality.reason}</span></div>
              </form>
            </main>
          </div>
        </section>
        {actionModal}
      </div>;
    }
    return <div className="work-page open">
      {chatScrollStyles}
      <button className="reader-back" onClick={() => setOpened(null)}><ArrowLeft size={16}/> Back to {sectionName.toLowerCase()}</button>
      <section className="work-room">
        <header>
          <div><p className="eyebrow">{sectionName === "Projects" ? "PRIVATE WORKSPACE" : sectionName === "Messages" ? "PRIVATE CHANNEL" : "TOPIC ROOM"}</p><h1>{opened.title}</h1><p>{opened.description}</p></div>
          <div className="work-stat"><span>{opened.meta}</span><strong>{opened.stat}</strong></div>
        </header>
        <div className="work-meta">
          <span><Lock size={13}/> Private by default</span>
          <span><Users size={13}/> Access controlled</span>
          <span><ShieldCheck size={13}/> Moderation ready</span>
        </div>
        {sectionName === "Projects" && <div className="workspace-progress"><span>Workspace progress</span><strong>0%</strong><i><b style={{width:"0%"}}/></i></div>}
        {sectionName === "Projects" && <div className="workspace-board">
          <section className="workspace-pins">
            <div className="section-head"><div><p className="eyebrow">PINNED</p><h2>Key messages</h2></div></div>
            {pinnedMessages.length ? pinnedMessages.map(([author, body, time], index) => <article key={`${author}-${index}`}><strong>{author}</strong><p>{body}</p><span>{time}</span></article>) : <div className="empty-state compact"><strong>No pinned messages</strong><span>Pin important updates when the workspace starts moving.</span></div>}
          </section>
          <section className="workspace-media">
            <div className="section-head"><div><p className="eyebrow">MEDIA</p><h2>Images, links & files</h2></div><label className="upload-btn"><Plus size={14}/> Upload<input type="file" multiple onChange={uploadWorkspaceMedia}/></label></div>
            <div className="media-grid">{workspaceMedia.length ? workspaceMedia.map((item, index) => <button key={`${item.title}-${index}`} onClick={() => toast(`${item.title} opened.`)}>
              {item.url ? <img src={item.url} alt="" /> : <i>{item.type === "link" ? "LINK" : item.type === "image" ? "IMG" : "FILE"}</i>}
              <span><strong>{item.title}</strong><small>{item.meta}</small></span>
            </button>) : <div className="empty-state compact"><strong>No media yet</strong><span>Upload images, links or files when this workspace has real content.</span></div>}</div>
          </section>
        </div>}
        <div className="message-feed scrollable">
          {messages.length ? messages.map((message, index) => {
            const [author, body, time, quality] = message;
            return <div className="feed-item" key={`${author}-${index}`}>
            <i>{author.split(" ").map(part => part[0]).join("").slice(0,2)}</i>
            <span><strong>{author}</strong><p>{body}</p>{quality && <small className={`quality-badge ${quality.eligible ? "eligible" : ""}`}>{quality.label}</small>}</span>
            {sectionName === "Projects" && <button className="pin-btn" onClick={() => pinMessage(message)} type="button"><Bookmark size={13}/> Pin</button>}
          </div>}) : <div className="empty-state compact"><strong>No workspace updates yet</strong><span>Post the first update once this workspace is active.</span></div>}
        </div>
        <form className="composer" onSubmit={send}>
          <input value={draft} onChange={event => setDraft(event.target.value)} placeholder={sectionName === "Projects" ? "Post a private workspace update..." : "Write a message..."} />
          <button type="submit">{data.emptyAction}</button>
          <div className={`quality-meter ${draftQuality.eligible ? "eligible" : ""}`}><strong>{draftQuality.label}</strong><span>{draftQuality.reason}</span></div>
        </form>
      </section>
    </div>;
  }

  return <div className="feature-page work-page">
    <div className="feature-hero"><p className="eyebrow">{pageCopy.eyebrow}</p><h1>{pageCopy.title}</h1><p>{pageCopy.text}</p>{sectionName !== "Projects" && <button className="primary" onClick={createItem}><Plus size={16}/> Create {data.label}</button>}</div>
    {sectionName === "Projects" && <form className="today-panel workspace-entry" onSubmit={submitWorkspace}>
      <div>
        <p className="eyebrow">CREATE WORKSPACE</p>
        <h2>Set up a private project</h2>
        <p>Create an invitation-only space for a clear outcome, shared updates, pinned decisions, files and member accountability.</p>
      </div>
      <div className="room-create-grid">
        <label><span>Workspace name</span><input value={workspaceDraft.title} onChange={event => setWorkspaceDraft({...workspaceDraft, title:event.target.value})} placeholder="Example: Pipeline Sprint" /></label>
        <label><span>Workspace type</span><select value={workspaceDraft.type} onChange={event => setWorkspaceDraft({...workspaceDraft, type:event.target.value})}><option>Accountability sprint</option><option>Business build</option><option>Trading discipline</option><option>Content push</option><option>Fitness standard</option><option>Launch project</option></select></label>
        <label><span>Access</span><select value={workspaceDraft.access} onChange={event => setWorkspaceDraft({...workspaceDraft, access:event.target.value})}><option>Invitation only</option><option>Selected roles</option><option>Admins only</option><option>Project leads</option></select></label>
        <label><span>Review rhythm</span><select value={workspaceDraft.review} onChange={event => setWorkspaceDraft({...workspaceDraft, review:event.target.value})}><option>Weekly review</option><option>Daily check-in</option><option>Twice-weekly review</option><option>Milestone only</option></select></label>
        <label className="wide"><span>Purpose</span><textarea value={workspaceDraft.purpose} onChange={event => setWorkspaceDraft({...workspaceDraft, purpose:event.target.value})} placeholder="What is this workspace for, and who should be in it?" /></label>
        <label className="wide"><span>First outcome</span><input value={workspaceDraft.outcome} onChange={event => setWorkspaceDraft({...workspaceDraft, outcome:event.target.value})} placeholder="Example: Book 10 qualified sales calls in 30 days" /></label>
      </div>
      <div className="today-panel-actions">
        <button type="submit">Create workspace</button>
      </div>
    </form>}
    {pinnedSpaces.length > 0 && <div className="pinned-strip">
      <p className="eyebrow">PINNED</p>
      <div>{pinnedSpaces.map(space => <button key={space.title} onClick={() => setSelected(space)}><Bookmark size={13}/><span>{space.title}</span><X size={12} onClick={(event) => { event.stopPropagation(); unpinSpace(space); }}/></button>)}</div>
    </div>}
    <div className={`feature-workspace ${selected ? "has-detail" : ""}`}>
      <div className="feature-list">{items.length ? items.map((item,i)=><button className={`feature-row ${selected?.title === item.title ? "selected" : ""}`} key={item.title} onClick={()=>setSelected(item)}>
        <span className={`feature-icon f${i}`}><item.Icon size={20}/></span><span><strong>{item.title}</strong><small>{item.meta}</small></span><ChevronRight size={18}/>
      </button>) : <div className="empty-state"><strong>No {data.label}s yet</strong><span>Create the first private {data.label} when you are ready.</span></div>}</div>
      {selected && <aside className="detail-panel">
        <button className="detail-close" onClick={() => setSelected(null)} aria-label="Close detail"><X size={17}/></button>
        <span className="detail-icon"><selected.Icon size={22}/></span>
        <p className="eyebrow">PRIVATE DETAIL</p><h2>{selected.title}</h2><p>{selected.description}</p>
        <div className="detail-stat"><span>Current position</span><strong>{selected.stat}</strong></div>
        <div className="detail-privacy"><Lock size={14}/><div><strong>Private by default</strong><span>Only explicit members can access this.</span></div></div>
        {["Network","Messages","Projects"].includes(sectionName) && <div className="detail-options">
          <OptionsMenu label={`${sectionName} options`} items={[
            ...(["Network","Messages"].includes(sectionName) ? [{ label: notificationsOn ? "Hide from notifications" : "Show in notifications", active: notificationsOn, onClick: toggleNotifications }] : []),
            { label: sectionName === "Projects" ? "Pin workspace" : sectionName === "Messages" ? "Pin conversation" : "Pin room", onClick: () => pinSpace(selected) },
            { label: "Manage privacy", onClick: () => toast(`${selected.title} privacy settings opened.`) },
            { label: sectionName === "Projects" ? "Archive workspace" : sectionName === "Messages" ? "Archive conversation" : "Leave room", danger: true, onClick: () => toast(`${selected.title} action confirmed.`) },
          ]}/>
        </div>}
        <button className="primary detail-action" onClick={() => setOpened(selected)}>{data.openLabel} <ArrowUpRight size={15}/></button>
      </aside>}
    </div>
    {creatingRoom && <div className="modal-scrim" role="presentation" onMouseDown={() => setCreatingRoom(false)}>
      <form className="admin-modal room-create-modal" onSubmit={submitRoom} onMouseDown={event => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">CREATE ROOM</p><h2>Room settings</h2><span>Set the purpose, access and rules before the room goes live. Rooms stay private by default.</span></div>
          <button type="button" onClick={() => setCreatingRoom(false)} aria-label="Close"><X size={18}/></button>
        </header>
        <div className="room-create-grid">
          <label><span>Room name</span><input value={roomDraft.title} onChange={event => setRoomDraft({...roomDraft, title:event.target.value})} placeholder="e.g. Content & Social Room" /></label>
          <label><span>Room type</span><select value={roomDraft.type} onChange={event => setRoomDraft({...roomDraft, type:event.target.value})}><option>Topic discussion</option><option>Social support</option><option>Announcements</option><option>Role-only room</option><option>Accountability room</option></select></label>
          <label><span>Access</span><select value={roomDraft.access} onChange={event => setRoomDraft({...roomDraft, access:event.target.value})}><option>All members</option><option>Admins only</option><option>Moderators only</option><option>Selected roles</option><option>Invitation only</option></select></label>
          <label><span>Moderation</span><select value={roomDraft.moderation} onChange={event => setRoomDraft({...roomDraft, moderation:event.target.value})}><option>Report queue enabled</option><option>Posts require approval</option><option>Admins only can post</option><option>Read-only archive</option></select></label>
          <label className="wide"><span>Purpose</span><textarea value={roomDraft.purpose} onChange={event => setRoomDraft({...roomDraft, purpose:event.target.value})} placeholder="What should members use this room for?" /></label>
          <label className="wide"><span>Posting rules</span><textarea value={roomDraft.posting} onChange={event => setRoomDraft({...roomDraft, posting:event.target.value})} /></label>
        </div>
        <div className="room-create-footer">
          <span><Lock size={14}/> Private by default. Access can be changed later from Operations.</span>
          <button className="primary" type="submit"><Plus size={15}/> Create room</button>
        </div>
      </form>
    </div>}
    {actionModal}
  </div>;
}

const adminMembers = [];

function OperationsPage({ toast, supabase, currentUser }) {
  const controls = [
    { key:"members", title:"Members", meta:"No members yet", Icon:Users, description:"View member names, status, focus and account health.", stat:"Ready for invites" },
    { key:"invitations", title:"Invitations", meta:"No pending invites", Icon:Archive, description:"Issue, expire and review private invitations to the network.", stat:"Invite-only" },
    { key:"roles", title:"Roles & access", meta:"Core permissions", Icon:ShieldCheck, description:"Control who can create rooms, lead projects and moderate discussions.", stat:"Private by default" },
    { key:"rooms", title:"Rooms", meta:"No active rooms", Icon:MessageCircle, description:"Create, archive and moderate topic rooms.", stat:"Ready to create" },
    { key:"moderation", title:"Moderation", meta:"Clear queue", Icon:Heart, description:"Review reports and protect the standard of every Motion Only space.", stat:"No reports" },
  ];
  const [activeControl, setActiveControl] = useState(null);
  const [memberRows, setMemberRows] = useState(adminMembers.map((name, index) => ({
    name,
    id: "",
    email: "",
    role: index === 0 ? "Admin" : index % 9 === 0 ? "Moderator" : "Member",
    foundingRole: "none",
    status: index % 11 === 0 && index !== 0 ? "Watch" : "Active",
    focus: ["Business","Trading","Fitness"][index % 3],
  })));
  const [invites, setInvites] = useState([]);
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "member", foundingRole: "none", code: "" });
  const [lastInvite, setLastInvite] = useState(null);
  const canPersistAdmin = Boolean(supabase && currentUser?.id);
  const makeInviteCode = (email) => {
    const handle = String(email || "")
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 10)
      .toUpperCase() || "MEMBER";
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `MOTION-${handle}-${suffix}`;
  };
  const testerMessageForInvite = (invite) => `You've been invited to test Motion Only.

Go to:
https://motiononly.netlify.app

Sign up using this exact email:
${invite.email}

Your invite code is:
${invite.code}

${invite.foundingRole && invite.foundingRole !== "none" ? `Your Motion Only role is:
${foundingLabelFor(invite.foundingRole)}

` : ""}The app is invite-only, so the email and code need to match exactly.`;
  const copyInviteMessage = async (invite) => {
    const message = testerMessageForInvite(invite);
    try {
      await navigator.clipboard.writeText(message);
      toast("Invite message copied.");
    } catch {
      toast(message);
    }
  };
  useEffect(() => {
    if (!canPersistAdmin) return;
    let cancelled = false;
    Promise.all([
      supabase
      .from("motion_profiles")
      .select("id, email, display_name, role, founding_role, founding_status, updated_at")
      .order("created_at", { ascending: false }),
      supabase
        .from("motion_invites")
        .select("id, email, code, role, founding_role, expires_at, accepted_at")
        .order("created_at", { ascending: false }),
    ]).then(([membersResult, invitesResult]) => {
        if (cancelled) return;
        if (membersResult.error) {
          toast("Member roles need admin access in Supabase.");
        } else {
          setMemberRows((membersResult.data || []).map(row => ({
            id: row.id,
            email: row.email,
            name: row.display_name || row.email,
            role: row.role || "member",
            foundingRole: row.founding_role || "none",
            status: row.founding_status ? "Founding Team" : "Active",
            focus: foundingLabelFor(row.founding_role) || "Member",
          })));
        }
        if (invitesResult.error) {
          toast("Invite codes need admin access in Supabase.");
        } else {
          setInvites((invitesResult.data || []).map(row => ({
            id: row.id,
            email: row.email,
            code: row.code,
            role: row.role || "member",
            foundingRole: row.founding_role || "none",
            expiresAt: row.expires_at,
            acceptedAt: row.accepted_at,
            status: row.accepted_at ? "Accepted" : "Ready to send",
          })));
        }
      });
    return () => { cancelled = true; };
  }, [canPersistAdmin, currentUser?.id, supabase]);
  const createInvite = async (event) => {
    event.preventDefault();
    const email = inviteDraft.email.trim().toLowerCase();
    const code = (inviteDraft.code.trim() || makeInviteCode(email)).toUpperCase();
    const role = inviteDraft.role || "member";
    const foundingRole = inviteDraft.foundingRole || "none";
    if (!email.includes("@")) {
      toast("Add a valid email first.");
      return;
    }
    const nextInvite = { email, code, role, foundingRole, status: "Ready to send", acceptedAt: null };
    setInvites([nextInvite, ...invites.filter(invite => invite.code !== code)]);
    setInviteDraft({ email: "", role: "member", foundingRole: "none", code: "" });
    setLastInvite(nextInvite);
    if (canPersistAdmin) {
      const { error } = await supabase.from("motion_invites").upsert({
        email,
        code,
        role,
        founding_role: foundingRole,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        accepted_by: null,
        accepted_at: null,
      }, { onConflict: "code" });
      if (error) {
        toast("Invite code could not be saved. Check admin permissions.");
        return;
      }
    }
    toast(`Invite code created for ${email}.`);
  };
  const setMemberRole = async (index, role) => {
    const member = memberRows[index];
    setMemberRows(memberRows.map((row, rowIndex) => rowIndex === index ? { ...row, role } : row));
    if (canPersistAdmin && member?.id) {
      const { error } = await supabase.from("motion_profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", member.id);
      if (error) {
        toast("Role could not be saved. Check admin permissions.");
        return;
      }
    }
    toast(`${member.name} access role updated.`);
  };
  const setFoundingRole = async (index, foundingRole) => {
    const member = memberRows[index];
    const foundingStatus = foundingRole !== "none";
    setMemberRows(memberRows.map((row, rowIndex) => rowIndex === index ? { ...row, foundingRole, status: foundingStatus ? "Founding Team" : "Active", focus: foundingLabelFor(foundingRole) || "Member" } : row));
    if (canPersistAdmin && member?.id) {
      const { error } = await supabase.from("motion_profiles").update({ founding_role: foundingRole, founding_status: foundingStatus, updated_at: new Date().toISOString() }).eq("id", member.id);
      if (error) {
        toast("Founding Team role could not be saved. Check admin permissions.");
        return;
      }
    }
    toast(`${member.name} founding role updated.`);
  };
  const current = activeControl ? controls.find(control => control.key === activeControl) : null;

  const renderControl = () => {
    if (!current) return null;
    if (current.key === "members") return <div className="admin-table">
      {memberRows.length ? memberRows.map((member, index) => <div className="admin-row" key={member.name}>
        <span><strong>{member.name}</strong><small>{member.email ? `${member.email} - ` : ""}{member.focus} - {member.status}</small></span>
        <select value={member.role} onChange={event => setMemberRole(index, event.target.value)}>
          <option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
        </select>
        <select value={member.foundingRole} onChange={event => setFoundingRole(index, event.target.value)}>
          {foundingTeamRoles.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}
        </select>
        <button onClick={() => toast(`${member.name} profile opened.`)}>Open</button>
      </div>) : <div className="empty-state compact"><strong>No members yet</strong><span>Accepted invitations will appear here.</span></div>}
    </div>;
    if (current.key === "invitations") return <div className="admin-table">
      <form className="admin-inline invite-code-form" onSubmit={createInvite}>
        <input name="email" type="email" value={inviteDraft.email} onChange={event => setInviteDraft({ ...inviteDraft, email: event.target.value })} placeholder="member@email.com" />
        <select name="role" value={inviteDraft.role} onChange={event => setInviteDraft({ ...inviteDraft, role: event.target.value })}><option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select>
        <select name="foundingRole" value={inviteDraft.foundingRole} onChange={event => setInviteDraft({ ...inviteDraft, foundingRole: event.target.value })}>
          {foundingTeamRoles.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}
        </select>
        <input name="code" value={inviteDraft.code} onChange={event => setInviteDraft({ ...inviteDraft, code: event.target.value.toUpperCase() })} placeholder="Auto code or custom" />
        <button type="submit">Create code</button>
      </form>
      <div className="invite-help"><Lock size={14}/><span>Create the Motion Only code here, choose their access level and optional Founding Team role, then use Supabase “Send invitation” or send the message manually. The email and code must match at signup.</span></div>
      {lastInvite && <div className="invite-message-box">
        <strong>Latest invite message</strong>
        <pre>{testerMessageForInvite(lastInvite)}</pre>
        <button onClick={() => copyInviteMessage(lastInvite)}><Copy size={14}/> Copy message</button>
      </div>}
      {invites.length ? invites.map((invite) => <div className="admin-row invite-admin-row" key={invite.code}>
        <span><strong>{invite.email}</strong><small>{invite.role} invitation - {foundingLabelFor(invite.foundingRole) || "No founding role"} - {invite.status} - {invite.code}</small></span>
        <button onClick={() => copyInviteMessage(invite)}><Copy size={14}/> Copy</button>
        <button onClick={() => toast("Use Supabase Auth > Users > Add user > Send invitation to email them.")}>Send email</button>
      </div>) : <div className="empty-state compact"><strong>No pending invites</strong><span>Create an invite when you are ready to bring someone in.</span></div>}
    </div>;
    if (current.key === "roles") return <div className="role-grid founding-role-grid">
      {foundingTeamRoles.filter(role => role.key !== "none").map(role => <section key={role.key}>
        <h3>{role.label}</h3>
        <p>{role.summary}</p>
        {role.expectations.map(item => <label key={item}><input type="checkbox" checked readOnly />{item}</label>)}
      </section>)}
      {["Member","Moderator","Admin","Project lead"].map(role => <section key={role}>
        <h3>{role}</h3>
        {["View private app","Create personal goals","Create rooms","Moderate reports","Invite members","Change roles"].map((permission, index) => (
          <label key={permission}><input type="checkbox" defaultChecked={role === "Admin" || index < (role === "Moderator" ? 4 : role === "Project lead" ? 3 : 2)} />{permission}</label>
        ))}
      </section>)}
    </div>;
    if (current.key === "rooms") return <div className="admin-table">
      <div className="empty-state compact"><strong>No rooms yet</strong><span>Created network rooms will appear here for moderation and access control.</span></div>
    </div>;
    return <div className="admin-table">
      <div className="empty-state compact"><strong>No moderation reports</strong><span>Reported messages, rooms and workspace content will appear here.</span></div>
    </div>;
  };

  return <div className="feature-page operations-page">
    <div className="feature-hero"><p className="eyebrow">OPERATIONS</p><h1>Network operations</h1><p>Admin-only controls for members, invitations, roles, rooms and moderation.</p></div>
    <div className="feature-workspace has-detail">
      <div className="feature-list">{controls.map((item,i)=><button className={`feature-row ${activeControl === item.key ? "selected" : ""}`} key={item.key} onClick={()=>setActiveControl(item.key)}>
        <span className={`feature-icon f${i}`}><item.Icon size={20}/></span><span><strong>{item.title}</strong><small>{item.meta}</small></span><ChevronRight size={18}/>
      </button>)}</div>
      <aside className="detail-panel">
        <span className="detail-icon">{current ? <current.Icon size={22}/> : <ShieldCheck size={22}/>}</span>
        <p className="eyebrow">{current ? "CONTROL WINDOW" : "ADMIN AREA"}</p>
        <h2>{current ? current.title : "Choose a section"}</h2>
        <p>{current ? current.description : "Select a control from the list to open its admin settings window."}</p>
        {current && <button className="primary detail-action" onClick={() => setActiveControl(current.key)}>Open controls <ArrowUpRight size={15}/></button>}
      </aside>
    </div>
    {current && <div className="modal-scrim" onClick={() => setActiveControl(null)}>
      <section className="admin-modal" onClick={event => event.stopPropagation()}>
        <header><div><p className="eyebrow">OPERATIONS CONTROL</p><h2>{current.title}</h2><span>{current.description}</span></div><button onClick={() => setActiveControl(null)}><X size={18}/></button></header>
        {renderControl()}
      </section>
    </div>}
  </div>;
}

function SimpleGoalsHabitsPage({ toast, supabase, currentUser }) {
  const [goalRows, setGoalRows] = useState(goals.map((goal, index) => ({
    ...goal,
    evidence: 0,
    exp: 0,
    today: ["Send five qualified business messages", "Trade only if the A+ setup appears", "Complete strength session and Zone 2"][index],
  })));
  const [standardRows, setStandardRows] = useState(baseHabits);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", area: "Business", type: "Goal" });
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const canPersist = Boolean(supabase && currentUser?.id);
  const todayKey = localDateKey();
  const completed = standardRows.filter(standard => standard.done).length;
  const goalEvidence = goalRows.reduce((sum, goal) => sum + (goal.evidence || 0), 0);
  const goalExp = goalRows.reduce((sum, goal) => sum + (goal.exp || 0), 0);
  const standardsExp = completed * 10;
  useEffect(() => {
    if (!canPersist) return;
    let cancelled = false;
    Promise.all([
      supabase.from("motion_goals").select("*").eq("user_id", currentUser.id).eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("motion_daily_standards").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
      supabase.from("motion_daily_notes").select("*").eq("user_id", currentUser.id).eq("note_date", todayKey).maybeSingle(),
    ]).then(([goalsResult, standardsResult, noteResult]) => {
      if (cancelled) return;
      if (!goalsResult.error) setGoalRows((goalsResult.data || []).map(savedGoalFromRow));
      if (!standardsResult.error) setStandardRows((standardsResult.data || []).map(savedStandardFromRow));
      if (!noteResult.error && noteResult.data?.note) setSavedNote(noteResult.data.note);
      if (goalsResult.error || standardsResult.error || noteResult.error) toast("Saved progress tables need the Supabase update.");
    });
    return () => { cancelled = true; };
  }, [canPersist, currentUser?.id, supabase, todayKey]);
  const toggleStandard = (id) => {
    const target = standardRows.find(standard => standard.id === id);
    const nextDone = !target?.done;
    setStandardRows(standardRows.map(standard => standard.id === id ? { ...standard, done: nextDone } : standard));
    if (canPersist) {
      supabase.from("motion_daily_standards").update({ completed_on: nextDone ? todayKey : null, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", currentUser.id).then(({ error }) => {
        if (error) toast("Standard updated locally. Supabase update failed.");
      });
    }
    toast("Standard updated privately.");
  };
  const logGoal = (index) => {
    const target = goalRows[index];
    const nextEvidence = (target?.evidence || 0) + 1;
    const nextExp = (target?.exp || 0) + 25;
    setGoalRows(goalRows.map((goal, goalIndex) => goalIndex === index ? { ...goal, evidence: nextEvidence, exp: nextExp } : goal));
    if (canPersist && target?.id) {
      supabase.from("motion_goals").update({ evidence_count: nextEvidence, exp: nextExp, updated_at: new Date().toISOString() }).eq("id", target.id).eq("user_id", currentUser.id).then(({ error }) => {
        if (error) toast("Evidence logged locally. Supabase update failed.");
      });
    }
    toast("Evidence logged. +25 EXP.");
  };
  const saveItem = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    if (draft.type === "Habit") {
      const newStandard = { id: Date.now(), label: draft.title.trim(), meta: draft.area, icon: "+", done: false };
      setStandardRows([newStandard, ...standardRows]);
      if (canPersist) {
        supabase.from("motion_daily_standards").insert({ user_id: currentUser.id, title: newStandard.label, category: draft.area }).select().single().then(({ data, error }) => {
          if (error) {
            toast("Habit saved locally. Supabase table needs updating.");
            return;
          }
          if (data) setStandardRows(current => current.map(item => item.id === newStandard.id ? savedStandardFromRow(data) : item));
        });
      }
    } else {
      const newGoal = { id: Date.now(), title: draft.title.trim(), area: draft.area, evidence: 0, exp: 0, date: "Active", color: "gold", today: "Choose one action for today" };
      setGoalRows([newGoal, ...goalRows]);
      if (canPersist) {
        supabase.from("motion_goals").insert({ user_id: currentUser.id, title: newGoal.title, category: draft.area, today_action: newGoal.today }).select().single().then(({ data, error }) => {
          if (error) {
            toast("Goal saved locally. Supabase table needs updating.");
            return;
          }
          if (data) setGoalRows(current => current.map(item => item.id === newGoal.id ? savedGoalFromRow(data) : item));
        });
      }
    }
    setDraft({ title: "", area: "Business", type: "Goal" });
    setCreating(false);
    toast(`${draft.type} added privately.`);
  };
  const saveNote = (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    const nextNote = note.trim();
    setSavedNote(nextNote);
    if (canPersist) {
      supabase.from("motion_daily_notes").upsert({ user_id: currentUser.id, note_date: todayKey, note: nextNote, updated_at: new Date().toISOString() }, { onConflict: "user_id,note_date" }).then(({ error }) => {
        if (error) toast("Note saved locally. Supabase update failed.");
      });
    }
    setNote("");
    toast("Daily note saved privately.");
  };
  return <div className="simple-goals-page">
    <section className="simple-goals-hero">
      <div><p className="eyebrow">GOALS & HABITS</p><h1>Keep it moving</h1><p>Simple enough to use daily: know the goal, do the standard, log the progress, review the week.</p></div>
      <button className="primary" onClick={() => setCreating(!creating)}><Plus size={16}/> Add goal or habit</button>
    </section>
    {creating && <form className="simple-create" onSubmit={saveItem}>
      <select value={draft.type} onChange={event => setDraft({...draft, type:event.target.value})}><option>Goal</option><option>Habit</option></select>
      <select value={draft.area} onChange={event => setDraft({...draft, area:event.target.value})}>{motionCategories.map(category => <option key={category}>{category}</option>)}</select>
      <input autoFocus value={draft.title} onChange={event => setDraft({...draft, title:event.target.value})} placeholder="What are you committing to?" />
      <button type="button" onClick={() => setCreating(false)}>Cancel</button><button type="submit">Save</button>
    </form>}
    <div className="simple-scoreboard">
      <span><strong>{goalEvidence}</strong>Evidence logs</span>
      <span><strong>{goalExp + standardsExp}</strong>EXP earned here</span>
      <span><strong>{completed}/{standardRows.length}</strong>Standards done</span>
    </div>
    <section className="accountability-strip">
      <div><p className="eyebrow">ACCOUNTABILITY MODEL</p><h2>Private first. Shared when useful.</h2><p>Members can keep goals private, share a commitment with a trusted member, or ask for a check-in. The app should hold people to evidence, not public embarrassment.</p></div>
      <div className="accountability-steps">
        <span><strong>1</strong>Set a clear outcome</span>
        <span><strong>2</strong>Choose today’s proof</span>
        <span><strong>3</strong>Log evidence</span>
        <span><strong>4</strong>Ask for a check-in if needed</span>
      </div>
    </section>
    <div className="simple-goals-layout">
      <section className="simple-panel">
        <div className="section-head"><div><p className="eyebrow">DIRECTION</p><h2>Goals</h2></div></div>
        {goalRows.length ? goalRows.map((goal, index) => <article className="simple-goal-row" key={`${goal.title}-${index}`}>
          <div><span>{goal.area}</span><h3>{goal.title}</h3><p>Today’s proof: {goal.today}</p></div>
          <div><strong>{goal.evidence || 0}</strong><small>evidence logs</small><button onClick={() => logGoal(index)}>Log evidence +25 EXP</button><button onClick={() => toast("Accountability check-in requested privately.")}>Request check-in</button></div>
        </article>) : <div className="empty-state"><strong>No goals yet</strong><span>Add one clear goal when you are ready to track it.</span></div>}
      </section>
      <aside className="simple-panel">
        <div className="section-head"><div><p className="eyebrow">TODAY</p><h2>Daily standards</h2></div></div>
        {standardRows.length ? standardRows.map(standard => <button className={`simple-standard ${standard.done ? "done" : ""}`} key={standard.id} onClick={() => toggleStandard(standard.id)}>
          <i>{standard.done ? <Check size={14}/> : null}</i><span><strong>{standard.label}</strong><small>{standard.meta}</small></span>
        </button>) : <div className="empty-state compact"><strong>No daily standards yet</strong><span>Add a habit from the button above when you know what you want to repeat.</span></div>}
        <form className="simple-note" onSubmit={saveNote}>
          <p className="eyebrow">PRIVATE NOTE</p>
          {savedNote && <small>Saved today: {savedNote}</small>}
          <input value={note} onChange={event => setNote(event.target.value)} placeholder="One sentence: what moved today?" />
          <button type="submit">Save note</button>
        </form>
      </aside>
    </div>
  </div>;
}

function parseRunTimeToSeconds(value = "") {
  const parts = value.trim().split(":").map(part => Number(part));
  if (!parts.length || parts.some(Number.isNaN)) return null;
  if (parts.length === 1) return Math.round(parts[0] * 60);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function formatRunTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function FitnessPage({ toast }) {
  const [missions, setMissions] = useState([
    {
      id: 1,
      title: "5K under 27 minutes",
      type: "Run",
      distanceKm: 5,
      targetSeconds: 27 * 60,
      exp: 120,
      status: "active",
      attempts: [],
    },
  ]);
  const [draft, setDraft] = useState({ title: "", distanceKm: "5", targetTime: "27:00" });
  const [runDraft, setRunDraft] = useState({ missionId: 1, distanceKm: "5", time: "", evidence: "" });
  const completedMissions = missions.filter(mission => mission.status === "complete").length;
  const earnedExp = missions.filter(mission => mission.status === "complete").reduce((sum, mission) => sum + mission.exp, 0);

  const addMission = (event) => {
    event.preventDefault();
    const targetSeconds = parseRunTimeToSeconds(draft.targetTime);
    const distance = Number(draft.distanceKm);
    if (!draft.title.trim() || !targetSeconds || !distance) return;
    const mission = {
      id: Date.now(),
      title: draft.title.trim(),
      type: "Run",
      distanceKm: distance,
      targetSeconds,
      exp: 120,
      status: "active",
      attempts: [],
    };
    setMissions([mission, ...missions]);
    setRunDraft(current => ({ ...current, missionId: mission.id, distanceKm: String(distance) }));
    setDraft({ title: "", distanceKm: "5", targetTime: "27:00" });
    toast("Fitness mission added privately.");
  };

  const logRun = (event) => {
    event.preventDefault();
    const mission = missions.find(item => item.id === Number(runDraft.missionId));
    const seconds = parseRunTimeToSeconds(runDraft.time);
    const distance = Number(runDraft.distanceKm);
    if (!mission || !seconds || !distance) return;
    const complete = distance >= mission.distanceKm && seconds <= mission.targetSeconds;
    const attempt = {
      id: Date.now(),
      distanceKm: distance,
      seconds,
      evidence: runDraft.evidence.trim(),
      complete,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    };
    setMissions(missions.map(item => item.id === mission.id ? {
      ...item,
      status: complete ? "complete" : item.status,
      attempts: [attempt, ...item.attempts],
    } : item));
    setRunDraft({ missionId: mission.id, distanceKm: String(mission.distanceKm), time: "", evidence: "" });
    toast(complete ? `Mission complete. +${mission.exp} EXP earned.` : "Run logged. Keep the mission active.");
  };

  const selectedMission = missions.find(item => item.id === Number(runDraft.missionId)) || missions[0];

  return <div className="fitness-page">
    <section className="fitness-hero">
      <div>
        <p className="eyebrow">FITNESS MISSIONS</p>
        <h1>Make the body measurable.</h1>
        <p>Set a clear physical target, log real attempts and complete the mission only when the result proves it. No random percentages, no vague “progress”.</p>
      </div>
      <div className="fitness-score">
        <span><strong>{completedMissions}</strong>Missions complete</span>
        <span><strong>{earnedExp}</strong>Fitness EXP</span>
        <span><strong>{earnedExp}</strong>Total EXP earned</span>
      </div>
    </section>

    <section className="fitness-rules card">
      <div><p className="eyebrow">HOW IT WORKS</p><h2>Target. Attempt. Prove. Complete.</h2><p>The web version uses honest evidence logging. Later, the mobile app can connect Strava, Apple Health, Garmin or GPS so runs can verify automatically.</p></div>
      <div className="fitness-rule-grid">
        <span><Flag size={16}/><strong>Mission target</strong>Example: 5K under 27:00.</span>
        <span><Timer size={16}/><strong>Run attempt</strong>Log distance and time after the run.</span>
        <span><CheckCircle2 size={16}/><strong>Completion rule</strong>Distance must meet the target and time must beat it.</span>
      </div>
    </section>

    <div className="fitness-layout">
      <main>
        <form className="fitness-create" onSubmit={addMission}>
          <div>
            <p className="eyebrow">SET FITNESS MISSION</p>
            <h2>Create a measurable target</h2>
            <p>Best missions have a clear distance, time, lift, weight or consistency target.</p>
          </div>
          <input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Example: Run 5K in under 27 minutes" />
          <input value={draft.distanceKm} onChange={event => setDraft({ ...draft, distanceKm: event.target.value })} inputMode="decimal" aria-label="Target distance in kilometres" />
          <input value={draft.targetTime} onChange={event => setDraft({ ...draft, targetTime: event.target.value })} placeholder="27:00" aria-label="Target time" />
          <button type="submit"><Plus size={15}/> Add mission</button>
        </form>

        <section className="fitness-missions card">
          <div className="section-head"><div><p className="eyebrow">ACTIVE TARGETS</p><h2>Your fitness missions</h2></div></div>
          {missions.map(mission => {
            const bestAttempt = mission.attempts.reduce((best, attempt) => !best || attempt.seconds < best.seconds ? attempt : best, null);
            return <article className={`fitness-mission ${mission.status}`} key={mission.id}>
              <div className="mission-icon">{mission.status === "complete" ? <CheckCircle2 size={22}/> : <Activity size={22}/>}</div>
              <div>
                <span>{mission.type} mission</span>
                <h3>{mission.title}</h3>
                <p>Complete when you record {mission.distanceKm}K or more in {formatRunTime(mission.targetSeconds)} or faster.</p>
                <div className="mission-meta">
                  <small>{mission.attempts.length} attempts</small>
                  <small>Best: {bestAttempt ? `${bestAttempt.distanceKm}K / ${formatRunTime(bestAttempt.seconds)}` : "No run logged"}</small>
                  <small>{mission.status === "complete" ? `+${mission.exp} EXP earned` : `Reward: +${mission.exp} EXP`}</small>
                </div>
              </div>
              <OptionsMenu label="Fitness mission options" items={[
                { label: "Log run for this", onClick: () => setRunDraft({ missionId: mission.id, distanceKm: String(mission.distanceKm), time: "", evidence: "" }) },
                { label: "Delete", danger: true, onClick: () => { setMissions(missions.filter(item => item.id !== mission.id)); toast("Fitness mission removed."); } },
              ]}/>
            </article>;
          })}
        </section>
      </main>

      <aside className="fitness-log card">
        <p className="eyebrow">RUN LOG</p>
        <h2>Record an attempt</h2>
        <p>When the logged result beats the target, the mission becomes complete and EXP is awarded.</p>
        <form onSubmit={logRun}>
          <label><span>Mission</span><select value={runDraft.missionId} onChange={event => {
            const next = missions.find(mission => mission.id === Number(event.target.value));
            setRunDraft({ ...runDraft, missionId: Number(event.target.value), distanceKm: String(next?.distanceKm || 5) });
          }}>{missions.map(mission => <option key={mission.id} value={mission.id}>{mission.title}</option>)}</select></label>
          <label><span>Distance ran</span><input value={runDraft.distanceKm} onChange={event => setRunDraft({ ...runDraft, distanceKm: event.target.value })} inputMode="decimal" placeholder="5" /></label>
          <label><span>Finish time</span><input value={runDraft.time} onChange={event => setRunDraft({ ...runDraft, time: event.target.value })} placeholder="26:48" /></label>
          <label><span>Evidence optional</span><input value={runDraft.evidence} onChange={event => setRunDraft({ ...runDraft, evidence: event.target.value })} placeholder="Screenshot, Strava link, treadmill note..." /></label>
          <button type="submit">Log attempt</button>
        </form>
        {selectedMission && <div className="fitness-attempts">
          <strong>Latest attempts</strong>
          {selectedMission.attempts.length ? selectedMission.attempts.slice(0, 4).map(attempt => <div key={attempt.id}>
            <span>{attempt.date}</span><p>{attempt.distanceKm}K in {formatRunTime(attempt.seconds)} {attempt.complete ? "· mission complete" : "· logged"}</p>
          </div>) : <em>No attempts yet. First one sets the benchmark.</em>}
        </div>}
      </aside>
    </div>
  </div>;
}

const rankLadder = [
  {
    rank: "Entry",
    level: 1,
    exp: "0 EXP",
    pace: "1 message every 5 minutes",
    principle: "Learn the standards before adding noise.",
    unlocks: ["Read all public network rooms", "Create private goals, habits and fitness missions", "React to posts and save library guides"],
  },
  {
    rank: "Mover",
    level: 3,
    exp: "500 EXP",
    pace: "1 message every 3 minutes",
    principle: "Shows up consistently and contributes without needing attention.",
    unlocks: ["Post normally in core rooms", "Request accountability check-ins", "Join open project workspaces"],
  },
  {
    rank: "Operator",
    level: 6,
    exp: "1,500 EXP",
    pace: "1 message every 90 seconds",
    principle: "Can be trusted to help the room move forward.",
    unlocks: ["Create accountability threads", "Suggest library additions", "Nominate one new invite for admin approval"],
  },
  {
    rank: "Builder",
    level: 10,
    exp: "3,500 EXP",
    pace: "1 message every 45 seconds",
    principle: "Turns ideas into useful work with other members.",
    unlocks: ["Start project workspaces", "Post skill requests for projects", "Pin project updates and organise project media"],
  },
  {
    rank: "Contributor",
    level: 15,
    exp: "7,000 EXP",
    pace: "Standard chat access",
    principle: "Creates material that helps others execute better.",
    unlocks: ["Submit courses or guides for review", "Host private study/work sessions", "Create templates for business, fitness or trading journals"],
  },
  {
    rank: "Analyst",
    level: 22,
    exp: "13,000 EXP",
    pace: "Standard chat access",
    principle: "Has proven discipline before discussing higher-risk markets.",
    unlocks: ["Post educational trading setup reviews", "Lead market review rooms with risk rules", "Share analysis only with context, invalidation and disclaimers"],
  },
  {
    rank: "Lead",
    level: 30,
    exp: "22,000 EXP",
    pace: "Trusted access",
    principle: "Can protect the standard and create opportunities for others.",
    unlocks: ["Issue limited invite codes", "Open application-only projects", "Mentor lower ranks and flag moderation issues"],
  },
  {
    rank: "Council",
    level: 40,
    exp: "38,000 EXP",
    pace: "Leadership access",
    principle: "Stewards the network, not just their own progress.",
    unlocks: ["Approve courses and advanced rooms", "Help set network standards", "Review invite access and sensitive permissions with admins"],
  },
];

function RanksPage() {
  const currentLevel = 1;
  const nextRank = rankLadder.find(rank => rank.level > currentLevel);
  return <div className="ranks-page">
    <section className="ranks-hero">
      <div>
        <p className="eyebrow">EARNED ACCESS</p>
        <h1>Ranks unlock responsibility.</h1>
        <p>EXP should not just make a number bigger. In Motion Only, ranks show trust. The more consistently someone contributes, the more permission they earn to speak, build, invite and lead.</p>
      </div>
      <div className="rank-current-card">
        <span>Your current rank</span>
        <strong>Entry</strong>
        <p>Next unlock: {nextRank?.rank} at level {nextRank?.level}</p>
        <i><b style={{ width: "18%" }}/></i>
      </div>
    </section>

    <section className="rank-rules card">
      <div><p className="eyebrow">PERMISSION MODEL</p><h2>Access follows proof.</h2><p>Ranks are earned through completed motions, verified fitness missions, useful network contributions, project updates and consistent standards. Admins can still manually restrict or promote if behaviour demands it.</p></div>
      <div className="rank-rule-grid">
        <span><MessageCircle size={16}/><strong>Chat speed</strong>New members move slower to reduce spam and low-value messages.</span>
        <span><ShieldCheck size={16}/><strong>Trust unlocks</strong>Invites, courses, projects and specialist rooms require proven consistency.</span>
        <span><AlertTriangle size={16}/><strong>Trading safety</strong>Higher ranks can share education and setup analysis, not reckless guaranteed calls.</span>
      </div>
    </section>

    <section className="rank-timeline">
      {rankLadder.map((rank, index) => <article className={index === 0 ? "current" : ""} key={rank.rank}>
        <div className="rank-marker"><Star size={17}/><span>{String(index + 1).padStart(2, "0")}</span></div>
        <div className="rank-card">
          <header>
            <div><p className="eyebrow">LEVEL {rank.level} · {rank.exp}</p><h2>{rank.rank}</h2><span>{rank.principle}</span></div>
            <strong>{rank.pace}</strong>
          </header>
          <div className="rank-unlocks">
            {rank.unlocks.map(unlock => <span key={unlock}><CheckCircle2 size={14}/>{unlock}</span>)}
          </div>
        </div>
      </article>)}
    </section>

    <section className="rank-note">
      <Lock size={16}/>
      <p><strong>Important:</strong> rank unlocks should be automatic where possible, but sensitive permissions like invites, courses, trading education rooms and leadership powers should still be reviewable by admins. That keeps the network exclusive without letting the system get abused.</p>
    </section>
  </div>;
}

function expNumber(value = "0 EXP") {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function rankForExp(totalExp = 0) {
  const current = [...rankLadder].reverse().find(rank => totalExp >= expNumber(rank.exp)) || rankLadder[0];
  const next = rankLadder.find(rank => expNumber(rank.exp) > totalExp) || null;
  return { current, next };
}

function MotionExpHud({ supabase, currentUser }) {
  const [earnedExp, setEarnedExp] = useState(0);

  useEffect(() => {
    if (!supabase || !currentUser?.id) {
      setEarnedExp(0);
      return;
    }

    let cancelled = false;
    Promise.all([
      supabase.from("motion_goals").select("exp").eq("user_id", currentUser.id),
      supabase.from("motion_room_messages").select("exp_awarded").eq("author_id", currentUser.id).is("deleted_at", null),
      supabase.from("motion_today_motions").select("completed_at").eq("user_id", currentUser.id).not("completed_at", "is", null),
      supabase.from("motion_daily_standards").select("completed_on").eq("user_id", currentUser.id).not("completed_on", "is", null),
    ]).then(([goalsResult, messagesResult, motionsResult, standardsResult]) => {
      if (cancelled) return;
      const goalExp = (goalsResult.data || []).reduce((sum, item) => sum + (item.exp || 0), 0);
      const messageExp = (messagesResult.data || []).reduce((sum, item) => sum + (item.exp_awarded || 0), 0);
      const motionExp = (motionsResult.data || []).length * 25;
      const standardsExp = (standardsResult.data || []).length * 10;
      setEarnedExp(goalExp + messageExp + motionExp + standardsExp);
    }).catch(() => {
      if (!cancelled) setEarnedExp(0);
    });

    return () => { cancelled = true; };
  }, [supabase, currentUser?.id]);

  const levelSize = 500;
  const level = Math.floor(earnedExp / levelSize) + 1;
  const levelExp = earnedExp % levelSize;
  const progress = Math.min(100, Math.round((levelExp / levelSize) * 100));
  const { current: rank, next } = rankForExp(earnedExp);
  const nextRankExp = next ? Math.max(0, expNumber(next.exp) - earnedExp) : 0;

  return (
    <section className="motion-exp-hud" aria-label="Motion Only EXP progress">
      <style>{`
        .topbar{height:104px;align-items:center}
        .motion-exp-hud{align-self:stretch;flex:1;min-width:0;margin:0 28px 0 -22px;padding:14px 0 18px;display:grid;grid-template-columns:54px minmax(180px,1fr) auto;gap:12px;align-items:center;position:relative}
        .motion-level-number{font:300 56px/.82 "Trebuchet MS","Segoe UI",system-ui,sans-serif;color:#f7f5ec;letter-spacing:-3px;margin-left:0;text-shadow:0 0 16px rgba(255,255,255,.16),0 0 30px rgba(203,162,75,.16)}
        .motion-rank-strip{min-width:0;padding-bottom:0}
        .motion-rank-strip p{margin:0 0 7px;color:#757b7d;font-size:8px;font-weight:800;letter-spacing:1.9px;text-transform:uppercase}
        .motion-rank-strip h2{margin:0;color:var(--ink);font:700 19px/.9 "Inter",system-ui,sans-serif;text-transform:uppercase;letter-spacing:2px}
        .motion-exp-track{height:2px;background:rgba(203,162,75,.1);border:0;overflow:visible;box-shadow:0 0 8px rgba(203,162,75,.1);position:absolute;left:66px;right:170px;bottom:0}
        .motion-exp-fill{display:block;height:100%;width:var(--hud-progress);background:linear-gradient(90deg,#9a7027 0%,var(--gold) 58%,#f6d684 100%);box-shadow:0 0 10px rgba(203,162,75,.95),0 0 22px rgba(203,162,75,.38);position:relative}
        .motion-exp-fill:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);opacity:.45}
        .motion-exp-meta{display:flex;justify-content:space-between;gap:12px;margin-top:7px;color:#777e80;font-size:7px;text-transform:uppercase;letter-spacing:.7px}
        .motion-exp-meta strong{color:#d8d1bd}
        .motion-next-rank{padding:0 0 0 15px;border-left:1px solid rgba(203,162,75,.18);min-width:145px}
        .motion-next-rank span{display:block;color:#777e80;font-size:8px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
        .motion-next-rank strong{display:block;color:var(--gold);font:700 21px/.9 "Barlow Condensed",sans-serif;text-transform:uppercase}
        body[data-theme="light"] .motion-exp-track,body[data-theme="natural"] .motion-exp-track{background:rgba(255,255,255,.36)}
        body[data-theme="light"] .motion-rank-strip p,body[data-theme="light"] .motion-exp-meta,body[data-theme="light"] .motion-next-rank span,body[data-theme="natural"] .motion-rank-strip p,body[data-theme="natural"] .motion-exp-meta,body[data-theme="natural"] .motion-next-rank span{color:#6f6a5e}
        @media(max-width:1080px){.motion-next-rank{display:none}.motion-exp-hud{margin-right:16px}.motion-exp-track{right:0}}
        @media(max-width:760px){.topbar{height:82px}.motion-exp-hud{margin:0 8px 0 0;padding:11px 0 16px;grid-template-columns:40px minmax(0,1fr);gap:9px}.motion-level-number{font-size:42px;letter-spacing:-2px}.motion-rank-strip h2{font-size:14px;letter-spacing:1.2px}.motion-rank-strip p{font-size:6px;margin-bottom:5px}.motion-exp-meta{display:none}.motion-exp-track{left:50px;right:0}}
      `}</style>
      <div className="motion-level-number">{level}</div>
      <div className="motion-rank-strip">
        <p>Motion level · {rank.rank}</p>
        <h2>{displayNameFor(currentUser)}</h2>
        <div className="motion-exp-track" style={{ "--hud-progress": `${progress}%` }}><i className="motion-exp-fill"/></div>
        <div className="motion-exp-meta">
          <span><strong>{levelExp}</strong> / {levelSize} EXP to Level {level + 1}</span>
          <span>{earnedExp.toLocaleString("en-GB")} total EXP</span>
        </div>
      </div>
      <div className="motion-next-rank">
        <span>{next ? "Next rank" : "Highest rank"}</span>
        <strong>{next ? next.rank : rank.rank}</strong>
        <span>{next ? `${nextRankExp.toLocaleString("en-GB")} EXP away` : "Fully unlocked"}</span>
      </div>
    </section>
  );
}

const marketBriefs = [
  {
    id: 1,
    tag: "UK MARKET",
    source: "Motion Only",
    title: "FTSE watchlist: banks, miners and energy remain the key movers",
    summary: "Track sector strength first. For UK shares, avoid reacting to one headline until you understand whether the move is market-wide, sector-wide or company-specific.",
    impact: "Good for building a cleaner watchlist before looking at individual stocks.",
    time: "Morning brief",
    url: "",
  },
  {
    id: 2,
    tag: "US STOCKS",
    source: "Motion Only",
    title: "Large-cap tech: trend strength still needs earnings confirmation",
    summary: "Price strength means more when revenue, margins and guidance support it. The useful question is not just 'is it up?' but 'what would invalidate the move?'",
    impact: "Useful for members tracking growth stocks without chasing candles.",
    time: "Market theme",
    url: "",
  },
  {
    id: 3,
    tag: "RISK",
    source: "Motion Only",
    title: "Rates and inflation data remain major portfolio drivers",
    summary: "Before adding exposure, check whether the next economic release could change the wider risk mood. Position size matters more when macro events are close.",
    impact: "Helps members avoid taking unnecessary risk before scheduled news.",
    time: "Macro note",
    url: "",
  },
];

const marketWatchAreas = [
  ["FTSE 100", "UK large caps", "Watch banks, miners, energy and defensives"],
  ["S&P 500", "US benchmark", "Check breadth, not only mega-cap movement"],
  ["NASDAQ", "Growth / tech", "Treat hype carefully around earnings"],
  ["Commodities", "Gold / oil", "Useful for inflation and risk sentiment"],
];

function MarketNewsPage({ toast }) {
  const [filter, setFilter] = useState("All");
  const [articles, setArticles] = useState(marketBriefs);
  const [feedStatus, setFeedStatus] = useState("Curated fallback");
  const [lastUpdated, setLastUpdated] = useState("Static briefing");
  const filters = ["All", ...Array.from(new Set(articles.map(item => item.tag))).slice(0, 7)];
  const visibleBriefs = filter === "All"
    ? articles
    : articles.filter(item => item.tag.toLowerCase() === filter.toLowerCase());

  useEffect(() => {
    let cancelled = false;
    fetch("/.netlify/functions/market-news")
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Feed unavailable")))
      .then(data => {
        if (cancelled || !Array.isArray(data.articles) || !data.articles.length) return;
        setArticles(data.articles);
        setFeedStatus(data.sourceMode === "live-public-feeds" ? "Live public feeds" : "Curated fallback");
        setLastUpdated(data.updatedAt ? new Date(data.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Recently");
      })
      .catch(() => {
        if (!cancelled) {
          setFeedStatus("Curated fallback");
          setLastUpdated("Live feed unavailable");
        }
      });
    return () => { cancelled = true; };
  }, []);

  return <div className="market-page">
    <section className="market-hero">
      <div>
        <p className="eyebrow">MARKET INTELLIGENCE</p>
        <h1>Stocks without the noise.</h1>
        <p>A simple portal for stocks, shares and investing themes. Built to help members read the market, manage risk and avoid headline-chasing.</p>
      </div>
      <div className="market-digest-card">
        <span>{feedStatus}</span>
        <strong>Brief. Context. Risk.</strong>
        <p>Updated: {lastUpdated}. Public headlines only, with source links where available. No copied articles, no profit bait.</p>
      </div>
    </section>

    <section className="market-policy card">
      <AlertTriangle size={19}/>
      <div>
        <strong>Information only</strong>
        <p>This area is for market news, education and watchlist context. It should not be used for guaranteed returns, pressure to buy, or blind copy-trading.</p>
      </div>
    </section>

    <div className="market-tabs">
      {filters.map(item => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}
    </div>

    <div className="market-layout">
      <main className="market-feed">
        {visibleBriefs.map(item => <article className="market-card" key={item.id}>
          <header>
            <span>{item.tag}</span>
            <small>{item.source || "Source"} · {item.time}</small>
          </header>
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
          <div className="market-impact">
            <strong>Why it matters</strong>
            <span>{item.impact}</span>
          </div>
          <div className="market-actions">
            <button onClick={() => toast("Saved to market watchlist.")}><Bookmark size={14}/> Save</button>
            <button onClick={() => toast("Discussion prompt opened.")}><MessageCircle size={14}/> Discuss</button>
            <button onClick={() => item.url ? window.open(item.url, "_blank", "noopener,noreferrer") : toast("No source link available for this fallback brief.")}><ExternalLink size={14}/> Source</button>
          </div>
        </article>)}
      </main>

      <aside className="market-side">
        <section className="market-watch card">
          <p className="eyebrow">WATCH AREAS</p>
          <h2>Clean watchlist</h2>
          {marketWatchAreas.map(([name, type, note]) => <button key={name} onClick={() => toast(`${name} opened.`)}>
            <span><strong>{name}</strong><small>{type}</small></span>
            <em>{note}</em>
          </button>)}
        </section>
        <section className="market-checklist card">
          <p className="eyebrow">BEFORE YOU ACT</p>
          {["What changed?", "Is it confirmed by data?", "Where is the invalidation?", "What is the risk if wrong?"].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}
        </section>
      </aside>
    </div>
  </div>;
}

const tchSignals = [
  { market: "EUR / USD", direction: "BUY", price: "1.0842", stop: "1.0788", target: "1.0910", confidence: 86, type: "Forex", change: "+0.62%" },
  { market: "XAU / USD", direction: "BUY", price: "2,391.40", stop: "2,372.00", target: "2,428.00", confidence: 81, type: "Metal", change: "+1.14%" },
  { market: "GBP / JPY", direction: "SELL", price: "195.28", stop: "196.10", target: "193.90", confidence: 74, type: "Forex", change: "-0.38%" },
  { market: "NAS 100", direction: "BUY", price: "23,184", stop: "22,940", target: "23,420", confidence: 78, type: "Index", change: "+0.44%" },
];

const tchCourses = [
  { tag: "FOUNDATIONS", title: "Market structure", lessons: 12, progress: 68, note: "Reading control, direction and levels before planning an entry." },
  { tag: "EXECUTION", title: "Entries & confirmations", lessons: 9, progress: 32, note: "Turning a market idea into a rule-based trade plan." },
  { tag: "RISK", title: "Capital preservation", lessons: 10, progress: 10, note: "Position sizing, invalidation and when not to trade." },
  { tag: "MINDSET", title: "Trading psychology", lessons: 8, progress: 0, note: "Avoiding revenge trades, FOMO and emotional execution." },
];

const weekOneTradeRules = [
  "4H zone marked",
  "Zone alert triggered",
  "EURUSD only",
  "1:1 RR planned",
  "No recovery trade",
  "Stop not moved",
];

const behaviourRules = [
  "I do not trade to recover money",
  "I do not increase risk",
  "I do not move my stop",
  "I do not take a third trade",
  "If I break a rule, trading ends for the day",
  "I use TradingView alerts so I am not tempted",
];

const starterTradeLog = [
  { time: "09:42", pair: "EURUSD", direction: "Sell", setup: "Price tapped upper 4H zone", risk: "1.0%", rr: "1:1", result: "Win", journal: "Logged", rules: [true, true, true, true, true, true], note: "Waited for alert. No early entry." },
  { time: "13:18", pair: "EURUSD", direction: "Buy", setup: "Price tapped lower 4H zone", risk: "1.0%", rr: "1:1", result: "Loss", journal: "Logged", rules: [true, true, true, true, true, true], note: "Loss accepted. No revenge trade." },
];

function ConsistencyMetric({ label, value, note, icon: Icon }) {
  return <div className="tch-metric"><span><Icon size={17}/></span><small>{label}</small><strong>{value}</strong><em>{note}</em></div>;
}

function TradeDashboardPanel({ toast }) {
  const [tradeLog, setTradeLog] = useState(starterTradeLog);
  const [draft, setDraft] = useState({ time: "", direction: "Buy", setup: "", risk: "1.0%", rr: "1:1", result: "Pending", journal: "Not logged", note: "", rules: weekOneTradeRules.map(() => false) });
  const completedTrades = tradeLog.length;
  const cleanTrades = tradeLog.filter(trade => trade.rules.every(Boolean)).length;
  const journalsLogged = tradeLog.filter(trade => trade.journal === "Logged").length;
  const riskDeviations = tradeLog.filter(trade => trade.risk !== "1.0%").length;
  const adherence = completedTrades ? Math.round((cleanTrades / completedTrades) * 100) : 0;

  const updateRule = (index) => setDraft(current => ({ ...current, rules: current.rules.map((rule, ruleIndex) => ruleIndex === index ? !rule : rule) }));
  const addTrade = (event) => {
    event.preventDefault();
    if (!draft.time || !draft.setup.trim()) return toast("Add the trade time and setup before logging.");
    setTradeLog(current => [{ ...draft, pair: "EURUSD", setup: draft.setup.trim(), note: draft.note.trim() || "No note added." }, ...current]);
    setDraft({ time: "", direction: "Buy", setup: "", risk: "1.0%", rr: "1:1", result: "Pending", journal: "Not logged", note: "", rules: weekOneTradeRules.map(() => false) });
    toast("Trade logged. Discipline score updated.");
  };

  return <div className="trade-dashboard">
    <section className="tch-panel lesson-brief">
      <div>
        <p className="eyebrow">TCH MENTORSHIP · OBJECTIVE WEEK 1</p>
        <h2>Profit is not the goal. Discipline is.</h2>
        <p>The first lesson is simple: trade one pair, one rule-set, one week. The dashboard measures whether the process was followed, not whether the trade won.</p>
      </div>
      <div className="objective-list">
        <span><CheckCircle2 size={15}/> 100% rule adherence</span>
        <span><ShieldCheck size={15}/> 0 risk deviations</span>
        <span><BookOpen size={15}/> Journal every trade properly</span>
      </div>
    </section>

    <div className="trade-scoreboard">
      <ConsistencyMetric icon={Target} label="Rule adherence" value={`${adherence}%`} note={`${cleanTrades}/${completedTrades} trades fully clean`}/>
      <ConsistencyMetric icon={AlertTriangle} label="Risk deviations" value={riskDeviations} note="Target is zero for Week 1"/>
      <ConsistencyMetric icon={BookOpen} label="Journals logged" value={`${journalsLogged}/${completedTrades}`} note="Every trade needs a proper note"/>
      <ConsistencyMetric icon={Timer} label="Session" value="Open" note="No setup in session = no trade"/>
    </div>

    <div className="trade-dashboard-grid">
      <section className="tch-panel week-rules">
        <div className="panel-head"><div><small>MARKET</small><h3>EURUSD only</h3></div><span>1 pair</span></div>
        <div className="market-rule-card"><b>Session: OPEN</b><p>If no setup appears during the session, the correct action is no trade.</p></div>
        <div className="rule-block">
          <h4>Setup rules</h4>
          {["Mark 4 hour zones only", "Set alerts at the zone above and below current price", "When the alert triggers, enter at 1:1 risk to reward", "Price into upper zone = sell trade", "Price into lower zone = buy trade", "If every criteria is not met, no trade"].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}
        </div>
        <div className="rule-block behaviour">
          <h4>Behaviour rules</h4>
          {behaviourRules.map(item => <span key={item}><i><Lock size={11}/></i>{item}</span>)}
        </div>
      </section>

      <section className="tch-panel trade-log-entry">
        <div className="panel-head"><div><small>LOG A TRADE</small><h3>Process check before outcome</h3></div><span>{draft.rules.filter(Boolean).length}/{weekOneTradeRules.length} rules</span></div>
        <form onSubmit={addTrade}>
          <div className="trade-form-grid">
            <label>Time<input value={draft.time} onChange={event => setDraft({...draft, time:event.target.value})} placeholder="09:30"/></label>
            <label>Pair<input value="EURUSD" readOnly/></label>
            <label>Direction<select value={draft.direction} onChange={event => setDraft({...draft, direction:event.target.value})}><option>Buy</option><option>Sell</option></select></label>
            <label>Risk<select value={draft.risk} onChange={event => setDraft({...draft, risk:event.target.value})}><option>1.0%</option><option>0.5%</option><option>1.5%</option><option>Deviation</option></select></label>
            <label>Risk reward<select value={draft.rr} onChange={event => setDraft({...draft, rr:event.target.value})}><option>1:1</option><option>Less than 1:1</option><option>More than 1:1</option></select></label>
            <label>Result<select value={draft.result} onChange={event => setDraft({...draft, result:event.target.value})}><option>Pending</option><option>Win</option><option>Loss</option><option>Break even</option><option>No trade</option></select></label>
            <label className="wide">Setup taken<input value={draft.setup} onChange={event => setDraft({...draft, setup:event.target.value})} placeholder="Price tapped lower 4H zone after alert"/></label>
            <label className="wide">Journal note<input value={draft.note} onChange={event => setDraft({...draft, note:event.target.value})} placeholder="What happened? Did you follow the rule-set?"/></label>
          </div>
          <div className="rule-check-grid">
            {weekOneTradeRules.map((rule, index) => <button type="button" className={draft.rules[index] ? "checked" : ""} key={rule} onClick={() => updateRule(index)}><i>{draft.rules[index] ? <Check size={12}/> : null}</i>{rule}</button>)}
          </div>
          <div className="journal-toggle">
            <button type="button" className={draft.journal === "Logged" ? "active" : ""} onClick={() => setDraft({...draft, journal: draft.journal === "Logged" ? "Not logged" : "Logged"})}><BookOpen size={14}/> Journal {draft.journal === "Logged" ? "complete" : "not logged"}</button>
            <button type="submit" className="primary"><Plus size={14}/> Add trade</button>
          </div>
        </form>
      </section>
    </div>

    <section className="tch-panel trade-sheet">
      <div className="panel-head"><div><small>TRADE DASHBOARD</small><h3>Week 1 logbook</h3></div><span>{completedTrades} trades logged</span></div>
      <div className="motion-sheet">
        <div className="sheet-row sheet-head"><span>Time</span><span>Pair</span><span>Direction</span><span>Setup</span><span>Risk</span><span>RR</span><span>Result</span><span>Rules</span><span>Journal</span></div>
        {tradeLog.map((trade, index) => <div className="sheet-row" key={`${trade.time}-${index}`}>
          <span>{trade.time}</span>
          <span>{trade.pair}</span>
          <span className={trade.direction.toLowerCase()}>{trade.direction}</span>
          <span>{trade.setup}<small>{trade.note}</small></span>
          <span className={trade.risk === "1.0%" ? "good" : "bad"}>{trade.risk}</span>
          <span>{trade.rr}</span>
          <span className={trade.result.toLowerCase().replace(" ", "-")}>{trade.result}</span>
          <span>{trade.rules.every(Boolean) ? "Clean" : `${trade.rules.filter(Boolean).length}/${trade.rules.length}`}</span>
          <span>{trade.journal}</span>
        </div>)}
      </div>
    </section>
  </div>;
}

const partnerRows = [
  { member: "Aston Channer", source: "Telegram", broker: "Partner Broker A", model: "CPA", status: "Invited", stage: "Awaiting signup", value: "£0", disclosure: "Sent" },
  { member: "Liam Carter", source: "Network room", broker: "Partner Broker A", model: "IB", status: "Verified", stage: "Active", value: "Tracked", disclosure: "Accepted" },
  { member: "Marcus Reed", source: "1-1 call", broker: "Partner Broker B", model: "CPA", status: "Signed up", stage: "KYC pending", value: "Pending", disclosure: "Sent" },
];

function PartnerHubPanel({ toast }) {
  const [rows, setRows] = useState(partnerRows);
  const [draft, setDraft] = useState({ member: "", source: "Telegram", broker: "Partner Broker A", model: "CPA", status: "Invited", stage: "Awaiting signup", value: "£0", disclosure: "Sent" });
  const cpaRows = rows.filter(row => row.model === "CPA").length;
  const ibRows = rows.filter(row => row.model === "IB").length;
  const accepted = rows.filter(row => row.disclosure === "Accepted").length;

  const addPartnerRow = (event) => {
    event.preventDefault();
    if (!draft.member.trim()) return toast("Add the member or lead name first.");
    setRows(current => [{ ...draft, member: draft.member.trim() }, ...current]);
    setDraft({ member: "", source: "Telegram", broker: "Partner Broker A", model: "CPA", status: "Invited", stage: "Awaiting signup", value: "£0", disclosure: "Sent" });
    toast("Partner lead added.");
  };

  return <div className="partner-hub">
    <section className="tch-panel partner-brief">
      <div>
        <p className="eyebrow">ADMIN / APPROVED PARTNERS</p>
        <h2>Partner Hub</h2>
        <p>Track CPA and IB relationships without turning the mentorship into a broker funnel. This area is for approved operators to manage referrals, disclosures and partner status.</p>
      </div>
      <div className="partner-warning"><ShieldCheck size={18}/><span>No income claims. No deposit pressure. Any broker relationship must be disclosed clearly before a member acts.</span></div>
    </section>

    <div className="trade-scoreboard">
      <ConsistencyMetric icon={Users} label="Tracked leads" value={rows.length} note="Internal partner pipeline"/>
      <ConsistencyMetric icon={Wallet} label="CPA entries" value={cpaRows} note="One-off acquisition model"/>
      <ConsistencyMetric icon={TrendingUp} label="IB entries" value={ibRows} note="Ongoing volume-share model"/>
      <ConsistencyMetric icon={ShieldCheck} label="Disclosures accepted" value={`${accepted}/${rows.length}`} note="Required before referral action"/>
    </div>

    <div className="partner-grid">
      <section className="tch-panel partner-form">
        <div className="panel-head"><div><small>ADD PARTNER LEAD</small><h3>Referral tracker</h3></div><span>Controlled</span></div>
        <form onSubmit={addPartnerRow}>
          <label>Member or lead<input value={draft.member} onChange={event => setDraft({...draft, member:event.target.value})} placeholder="Name"/></label>
          <label>Source<select value={draft.source} onChange={event => setDraft({...draft, source:event.target.value})}><option>Telegram</option><option>Network room</option><option>1-1 call</option><option>Content enquiry</option><option>Existing member</option></select></label>
          <label>Broker partner<select value={draft.broker} onChange={event => setDraft({...draft, broker:event.target.value})}><option>Partner Broker A</option><option>Partner Broker B</option><option>Manual review needed</option></select></label>
          <label>Commercial model<select value={draft.model} onChange={event => setDraft({...draft, model:event.target.value})}><option>CPA</option><option>IB</option><option>None / education only</option></select></label>
          <label>Status<select value={draft.status} onChange={event => setDraft({...draft, status:event.target.value})}><option>Invited</option><option>Signed up</option><option>Verified</option><option>Rejected</option><option>Paused</option></select></label>
          <label>Stage<select value={draft.stage} onChange={event => setDraft({...draft, stage:event.target.value})}><option>Awaiting signup</option><option>KYC pending</option><option>Active</option><option>Needs follow-up</option><option>No action</option></select></label>
          <button className="primary" type="submit"><Plus size={14}/> Add to tracker</button>
        </form>
      </section>

      <section className="tch-panel partner-policy">
        <div className="panel-head"><div><small>BOUNDARIES</small><h3>What this must never become</h3></div><Lock size={18}/></div>
        {["Do not promise profit, income or low-risk results.", "Do not pressure deposits, borrowing or account funding.", "Do not hide CPA, IB, affiliate or commission relationships.", "Do not let trading education become a recruitment script.", "Do not give partner access to private trade journals or progress data."].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}
      </section>
    </div>

    <section className="tch-panel partner-sheet-panel">
      <div className="panel-head"><div><small>CPA / IB DASHBOARD</small><h3>Partner pipeline</h3></div><span>{rows.length} records</span></div>
      <div className="partner-sheet">
        <div className="partner-row partner-head"><span>Member</span><span>Source</span><span>Broker</span><span>Model</span><span>Status</span><span>Stage</span><span>Value</span><span>Disclosure</span></div>
        {rows.map((row, index) => <div className="partner-row" key={`${row.member}-${index}`}>
          <span>{row.member}</span>
          <span>{row.source}</span>
          <span>{row.broker}</span>
          <span className="gold">{row.model}</span>
          <span>{row.status}</span>
          <span>{row.stage}</span>
          <span>{row.value}</span>
          <span className={row.disclosure === "Accepted" ? "gold" : ""}>{row.disclosure}</span>
        </div>)}
      </div>
    </section>
  </div>;
}

function ConsistencyHubPage({ toast }) {
  const [section, setSection] = useState("Overview");
  const [signalFilter, setSignalFilter] = useState("All");
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [copyActive, setCopyActive] = useState(true);
  const [risk, setRisk] = useState(1);
  const filteredSignals = signalFilter === "All" ? tchSignals : tchSignals.filter(signal => signal.type === signalFilter);
  const tabs = [
    ["Overview", LayoutDashboard],
    ["Trade Dashboard", ListChecks],
    featureEnabled("consistencySignals") && ["Signals", TrendingUp],
    ["Academy", GraduationCap],
    featureEnabled("consistencyCopyTrading") && ["Copy Trading", Copy],
    featureEnabled("consistencyPartnerHub") && ["Partner Hub", Wallet],
  ].filter(Boolean);

  return <div className="consistency-page full-hub">
    <section className="consistency-hero">
      <div>
        <p className="eyebrow">THE CONSISTENCY HUB</p>
        <h1>Consistency is the edge.</h1>
        <p>A trading mentorship area inside Motion Only: education, discipline, risk rules and execution tracking in one clean hub.</p>
        <div className="consistency-actions">
          <button className="primary" onClick={() => setSection("Trade Dashboard")}><ArrowUpRight size={15}/> Open trade dashboard</button>
          <button className="soft-btn" onClick={() => setSection("Academy")}>Open academy <ChevronRight size={15}/></button>
        </div>
      </div>
      <div className="consistency-terminal">
        <div className="terminal-head"><span>MO / TCH</span><i>Mentorship</i></div>
        <strong>Education. Discipline. Execution.</strong>
        <div className="terminal-line"><span>Risk profile</span><b>Moderate</b></div>
        <div className="terminal-line"><span>Current lesson</span><b>EURUSD rule adherence</b></div>
        <div className="terminal-line"><span>Next lesson</span><b>Market structure</b></div>
        <svg viewBox="0 0 320 110" className="consistency-chart" aria-hidden="true">
          <path d="M4 90 L56 72 L96 80 L146 42 L196 58 L248 27 L316 18"/>
          <circle cx="146" cy="42" r="4"/>
          <circle cx="316" cy="18" r="4"/>
        </svg>
      </div>
    </section>

    <nav className="tch-tabs">
      {tabs.map(([label, Icon]) => <button className={section === label ? "active" : ""} key={label} onClick={() => setSection(label)}><Icon size={15}/>{label}</button>)}
    </nav>

    {section === "Overview" && <>
      <div className="tch-metrics">
        <ConsistencyMetric icon={Wallet} label="Connected equity" value="£12,480.60" note="Demo brokerage data"/>
        <ConsistencyMetric icon={TrendingUp} label="Month to date" value="+£1,284.20" note="Shown for prototype only"/>
        <ConsistencyMetric icon={Copy} label="Copied trades" value="24" note="18 wins · 6 losses"/>
        <ConsistencyMetric icon={ShieldCheck} label="Risk used" value="1.2%" note="2.0% daily limit"/>
      </div>
      <div className="tch-overview-grid">
        <section className="tch-panel performance-panel">
          <div className="panel-head"><div><small>ACCOUNT PERFORMANCE</small><h3>£12,480.60</h3></div><select><option>Last 30 days</option><option>Last 90 days</option></select></div>
          <svg className="dash-chart" viewBox="0 0 700 230"><path className="dash-grid" d="M0 40H700M0 100H700M0 160H700M0 220H700"/><path className="dash-area" d="M0 204 C65 190 78 194 125 162 S208 184 250 142 S327 154 370 117 S452 129 505 81 S598 96 700 28 V230H0Z"/><path className="dash-line" d="M0 204 C65 190 78 194 125 162 S208 184 250 142 S327 154 370 117 S452 129 505 81 S598 96 700 28"/></svg>
          <div className="chart-labels"><span>22 JUL</span><span>29 JUL</span><span>05 AUG</span><span>12 AUG</span><span>20 AUG</span></div>
        </section>
        <section className="tch-panel activity-panel">
          <div className="panel-head"><div><small>RECENT ACTIVITY</small><h3>Latest trades</h3></div><button onClick={() => setSection("Trade Dashboard")}>View all</button></div>
          {tchSignals.slice(0, 3).map((signal, index) => <div className="trade-item" key={signal.market}><span className={`trade-side ${signal.direction.toLowerCase()}`}>{signal.direction[0]}</span><div><b>{signal.market}</b><small>{index === 0 ? "12 min ago" : index === 1 ? "2h ago" : "Yesterday"}</small></div><div><b className={index === 2 ? "loss" : "gain"}>{index === 2 ? "-£42.10" : index === 1 ? "+£187.40" : "+£64.20"}</b><small>{signal.direction} · Closed</small></div></div>)}
        </section>
      </div>
      <div className="tch-lower-grid">
        <section className="tch-panel next-lesson"><span className="eyebrow">CONTINUE LEARNING</span><h3>Reading market structure</h3><p>Module 2 · Lesson 4 of 8</p><i><b style={{width:"48%"}}/></i><button onClick={() => setSection("Academy")}><Play size={14}/> Resume lesson</button></section>
        <section className="tch-panel system-status"><div><span className="status-pulse"/><small>MENTORSHIP STATUS</small><h3>Week 1 dashboard active</h3><p>EURUSD · Discipline before profit</p></div><button onClick={() => setSection("Trade Dashboard")}><SlidersHorizontal size={16}/></button></section>
      </div>
    </>}

    {section === "Trade Dashboard" && <TradeDashboardPanel toast={toast}/>}

    {featureEnabled("consistencySignals") && section === "Signals" && <>
      <div className="tch-title"><div><p className="eyebrow">TCH TRADE DESK</p><h2>Signals</h2><span>Owner-led trade ideas with entries, invalidation and risk context.</span></div><div className="market-status"><i/> Market open</div></div>
      <div className="signal-toolbar"><div>{["All","Forex","Metal","Index"].map(item => <button className={signalFilter === item ? "active" : ""} onClick={() => setSignalFilter(item)} key={item}>{item}</button>)}</div><button onClick={() => toast("Signal filters opened.")}><SlidersHorizontal size={14}/> Filters</button></div>
      <div className="signal-cards">{filteredSignals.map(signal => <article key={signal.market} className="app-signal"><div className="signal-card-top"><div className="pair-icon">{signal.market.slice(0,2)}</div><div><b>{signal.market}</b><small>{signal.type} · Educational setup</small></div><span className={`direction ${signal.direction.toLowerCase()}`}>{signal.direction}</span></div><div className="signal-prices"><div><small>Entry</small><b>{signal.price}</b></div><div><small>Stop</small><b>{signal.stop}</b></div><div><small>Target</small><b>{signal.target}</b></div></div><div className="signal-risk"><span>Confidence {signal.confidence}%</span><i><b style={{width:`${signal.confidence}%`}}/></i><span>Risk 1.0%</span></div><button onClick={() => setSelectedSignal(signal)}>View full analysis <ArrowUpRight size={14}/></button></article>)}</div>
      {selectedSignal && <div className="modal-scrim" role="presentation" onMouseDown={() => setSelectedSignal(null)}><section className="admin-modal signal-modal" onMouseDown={event => event.stopPropagation()}><header><div><p className="eyebrow">EDUCATIONAL SETUP</p><h2>{selectedSignal.market}</h2><span>{selectedSignal.direction} setup with entry, invalidation and risk context.</span></div><button onClick={() => setSelectedSignal(null)}><X size={18}/></button></header><div className="signal-modal-body"><div className="drawer-chart"><TrendingUp size={42}/><p>Price structure chart placeholder</p></div><h3>Trade thesis</h3><p>Price has reclaimed a previous structural level and confirmed strength on the higher timeframe. The setup remains valid only while price respects the stated invalidation level.</p><div className="drawer-levels"><div><small>Entry</small><b>{selectedSignal.price}</b></div><div><small>Target</small><b>{selectedSignal.target}</b></div><div><small>Risk</small><b>1.0%</b></div></div><div className="risk-callout"><AlertTriangle size={17}/><span>This is not personal financial advice. Check suitability and size risk independently.</span></div></div></section></div>}
    </>}

    {section === "Academy" && <>
      <div className="tch-title"><div><p className="eyebrow">TCH ACADEMY</p><h2>Your learning path</h2><span>Build a repeatable process one skill at a time.</span></div><div className="academy-total"><b>14</b><span>Lessons completed</span></div></div>
      <section className="featured-course"><div><span className="eyebrow">CONTINUE WHERE YOU LEFT OFF</span><h2>Reading market structure</h2><p>Learn to identify control, direction and the levels that matter before planning an entry.</p><div className="feature-progress"><i><b style={{width:"48%"}}/></i><span>48% complete</span></div><button className="primary"><Play size={14}/> Continue lesson</button></div><div className="course-visual"><span>02 / 04</span><svg viewBox="0 0 300 160"><path d="M5 135L65 110 105 125 155 67 200 88 292 18"/><circle cx="155" cy="67" r="6"/><circle cx="292" cy="18" r="6"/></svg><small>Higher highs · Higher lows</small></div></section>
      <div className="course-grid">{tchCourses.map((course, index) => <article className="academy-course" key={course.title}><div className={`course-thumb thumb-${index}`}><span>{String(index+1).padStart(2,"0")}</span><BookOpen size={23}/></div><div className="course-info"><small>{course.tag}</small><h3>{course.title}</h3><p>{course.lessons} lessons · {course.note}</p><i><b style={{width:`${course.progress}%`}}/></i><div><span>{course.progress ? `${course.progress}% complete` : "Not started"}</span><button onClick={() => toast(`${course.title} opened.`)}><ChevronRight size={16}/></button></div></div></article>)}</div>
    </>}

    {featureEnabled("consistencyCopyTrading") && section === "Copy Trading" && <CopyTradingPanel copyActive={copyActive} setCopyActive={setCopyActive} risk={risk} setRisk={setRisk} toast={toast}/>}

    {featureEnabled("consistencyPartnerHub") && section === "Partner Hub" && <PartnerHubPanel toast={toast}/>}
  </div>;
}

function CopyTradingPanel({ copyActive, setCopyActive, risk, setRisk, toast }) {
  return <><div className="tch-title"><div><p className="eyebrow">OWNER TRADE AUTOMATION</p><h2>Copy trading</h2><span>Mirror eligible owner trades inside strict user-defined limits.</span></div><div className={`copy-state ${copyActive ? "on" : "off"}`}><i/><span>{copyActive ? "System active" : "System paused"}</span></div></div><div className="copy-layout"><div><section className="tch-panel strategy-summary"><div className="strategy-head"><div className="strategy-mark"><TrendingUp size={22}/></div><div><small>ACTIVE STRATEGY</small><h2>Motion Core Strategy</h2><p>Owner-led · Forex, gold & indices</p></div><button className={copyActive ? "pause" : "start"} onClick={() => setCopyActive(!copyActive)}>{copyActive ? <><Pause size={15}/> Pause copying</> : <><Play size={15}/> Start copying</>}</button></div><div className="strategy-stats"><div><small>Allocation</small><b>£5,000</b></div><div><small>Open positions</small><b>{copyActive ? "3" : "0"}</b></div><div><small>This month</small><b className="gain">+£428.30</b></div><div><small>Risk mode</small><b>Balanced</b></div></div><div className="owner-note"><UserRound size={18}/><div><b>How copying works</b><p>When the owner opens an eligible strategy trade, the system calculates position size from the limits and sends it to the connected broker. Members can pause instantly.</p></div></div></section><section className="tch-panel open-trades"><div className="panel-head"><div><small>MIRRORED POSITIONS</small><h3>Open trades</h3></div><span>3 active</span></div>{tchSignals.slice(0,3).map((signal, index) => <div className="position-row" key={signal.market}><div><span className={`trade-side ${signal.direction.toLowerCase()}`}>{signal.direction[0]}</span><p><b>{signal.market}</b><small>{signal.direction} · {index + 1}.0 lots</small></p></div><div><small>Open price</small><b>{signal.price}</b></div><div><small>Live P/L</small><b className={index === 2 ? "loss" : "gain"}>{index === 2 ? "-£18.40" : index === 1 ? "+£94.20" : "+£31.80"}</b></div><button onClick={() => toast("Position opened.")}><ExternalLink size={15}/></button></div>)}</section></div><aside className="copy-settings"><section className="tch-panel broker-card"><div className="panel-head"><div><small>BROKER CONNECTION</small><h3>MetaTrader 5</h3></div><span className="connected"><i/>Connected</span></div><div className="broker-id"><span>MT</span><div><b>Demo broker</b><small>Account ···· 4821</small></div></div><button onClick={() => toast("Broker settings opened.")}>Manage connection <Settings size={14}/></button></section><section className="tch-panel limits-card"><div className="panel-head"><div><small>YOUR GUARDRAILS</small><h3>Risk limits</h3></div><ShieldCheck size={18}/></div><label>Risk per trade <b>{risk.toFixed(1)}%</b></label><input type="range" min="0.25" max="2" step="0.25" value={risk} onChange={event => setRisk(Number(event.target.value))}/><div className="range-labels"><span>0.25%</span><span>2.0%</span></div><label>Daily loss limit <b>2.0%</b></label><div className="select-look">2.0% of equity <ChevronDown size={14}/></div><label>Maximum open trades <b>4</b></label><div className="select-look">4 simultaneous trades <ChevronDown size={14}/></div><button className="primary" onClick={() => toast("Risk limits saved.")}>Save limits</button></section><div className="emergency"><AlertTriangle size={18}/><div><b>Emergency stop</b><p>Close copied positions and disable automation.</p></div><button onClick={() => toast("Emergency stop requires confirmation.")}>Stop</button></div></aside></div></>;
}

function AccountTab({ tab, toast }) {
  if (tab === "Security") return <><div className="account-head"><div className="setting-icon"><ShieldCheck size={20}/></div><div><h2>Security</h2><p>Protect access to the mentorship area.</p></div></div>{["Password", "Two-factor authentication", "Active sessions"].map((item, index) => <div className="setting-row" key={item}><div><b>{item}</b><p>{index === 0 ? "Last changed 3 months ago" : index === 1 ? "Recommended before live trading features." : "1 session · Windows · London"}</p></div><button onClick={() => toast(`${item} opened.`)}>{index === 1 ? "Enable" : "Review"}</button></div>)}</>;
  if (tab === "Billing") return <><div className="account-head"><div className="setting-icon"><CreditCard size={20}/></div><div><h2>Membership & billing</h2><p>Manage access to the trading mentorship.</p></div></div><div className="plan-box"><div><span>ACTIVE PLAN</span><h3>Motion Only member</h3><p>Mentorship access is part of the invite-only beta.</p></div><div><b>Free</b><span>/ beta</span></div></div><div className="setting-row"><div><b>Invoice history</b><p>No paid invoices during the free private beta.</p></div><button onClick={() => toast("No invoices in beta.")}><Download size={14}/> View</button></div></>;
  if (tab === "Preferences") return <><div className="account-head"><div className="setting-icon"><Settings size={20}/></div><div><h2>Preferences</h2><p>Choose how the hub alerts you.</p></div></div>{["New signal alerts","Trade execution notifications","Weekly market briefing","Academy progress reminders"].map((item, index) => <div className="toggle-row" key={item}><div><b>{item}</b><p>{index === 0 ? "Receive an alert when a reviewed setup is published." : "Keep up to date with mentorship activity."}</p></div><button onClick={() => toast(`${item} updated.`)}>On</button></div>)}</>;
  return <><div className="account-head"><div className="large-avatar">JG</div><div><h2>Profile information</h2><p>Update how the mentorship area recognises you.</p></div></div><div className="form-grid"><label>First name<input defaultValue="Joel"/></label><label>Last name<input defaultValue="Gilbert"/></label><label className="full">Email address<input type="email" defaultValue="joel@example.com"/></label><label>Trading experience<select defaultValue="Under 2 years"><option>New to trading</option><option>Under 2 years</option><option>2-5 years</option><option>5+ years</option></select></label><label>Risk profile<select defaultValue="Moderate"><option>Conservative</option><option>Moderate</option><option>Aggressive</option></select></label></div><button className="primary" onClick={() => toast("Profile saved.")}>Save changes</button></>;
}

function SettingsPrivacyPage({ toast, notificationSettings, setNotificationSettings, theme, setTheme }) {
  const controls = [
    { key:"privacy", title:"Privacy defaults", meta:"Maximum privacy", Icon:Lock, description:"Choose what is visible by default across goals, progress, achievements, projects and profile details." },
    { key:"notifications", title:"Notifications", meta:"Network, messages and projects", Icon:Bell, description:"Control what appears in the main notification list and what stays quiet." },
    { key:"profile", title:"Profile visibility", meta:"Members only", Icon:Users, description:"Control what other verified Motion Only members can see on your profile." },
    { key:"security", title:"Login & security", meta:"Email, password and magic link", Icon:ShieldCheck, description:"Manage sign-in options and protected account access for the private beta." },
    { key:"appearance", title:"Appearance", meta:"Dark, light or natural", Icon:Palette, description:"Choose the colour scheme while keeping Motion Only gold consistent." },
  ];
  const [activeControl, setActiveControl] = useState(null);
  const [privacy, setPrivacy] = useState({
    goals: "Only me",
    achievements: "Only me unless shared",
    profile: "Members only",
    projects: "Invite-only members",
  });
  const current = activeControl ? controls.find(control => control.key === activeControl) : null;
  const toggleNotification = (key) => {
    setNotificationSettings(settings => ({ ...settings, [key]: !settings[key] }));
    toast(`${key} notifications updated.`);
  };
  const renderSettingsControl = () => {
    if (!current) return null;
    if (current.key === "privacy") return <div className="settings-control">
      {Object.entries(privacy).map(([key, value]) => <label key={key}><span>{key.replace(/^\w/, letter => letter.toUpperCase())}</span><select value={value} onChange={event => setPrivacy({ ...privacy, [key]: event.target.value })}><option>Only me</option><option>Only me unless shared</option><option>Members only</option><option>Invite-only members</option></select></label>)}
      <p><Lock size={15}/> Recommended: keep goals, progress and project content private unless someone explicitly shares it.</p>
    </div>;
    if (current.key === "notifications") return <div className="settings-control toggle-list">
      {["Network","Messages","Projects"].map(key => <button key={key} onClick={() => toggleNotification(key)}><span><strong>{key}</strong><small>{notificationSettings[key] ? "Shown in main notification list" : "Hidden from main notification list"}</small></span><i className={notificationSettings[key] ? "on" : ""}>{notificationSettings[key] ? "On" : "Off"}</i></button>)}
    </div>;
    if (current.key === "profile") return <div className="settings-control toggle-list">
      {["Show name to members","Show current focus areas","Show achievements I choose to share","Hide progress numbers by default"].map((item, index) => <button key={item} onClick={() => toast(`${item} updated.`)}><span><strong>{item}</strong><small>{index === 3 ? "Recommended for privacy" : "Members-only setting"}</small></span><i className={index === 3 ? "on" : "on"}>On</i></button>)}
    </div>;
    if (current.key === "security") return <div className="settings-control toggle-list">
      {["Email and password login","Magic link option","Require invite code on registration","New device email alert"].map(item => <button key={item} onClick={() => toast(`${item} setting opened.`)}><span><strong>{item}</strong><small>Private beta protection</small></span><i className="on">On</i></button>)}
    </div>;
    return <div className="settings-control appearance-grid">
      {["dark","light","natural"].map(key => <button className={theme === key ? "active" : ""} key={key} onClick={() => { setTheme(key); toast(`${key} scheme selected.`); }}><i className={`theme-dot ${key}`}/><strong>{key}</strong><span>{key === "dark" ? "Default Motion Only" : key === "light" ? "Clean high-contrast" : "Warm focused tone"}</span></button>)}
    </div>;
  };
  return <div className="feature-page operations-page settings-page">
    <div className="feature-hero"><p className="eyebrow">YOUR CONTROL</p><h1>Settings & privacy</h1><p>Control what you share, what gets your attention, and how Motion Only protects your private progress.</p></div>
    <div className="feature-list">{controls.map((control, index) => <button className="feature-row" key={control.key} onClick={() => setActiveControl(control.key)}>
      <span className={`feature-icon f${index}`}><control.Icon size={20}/></span><span><strong>{control.title}</strong><small>{control.meta}</small></span><ChevronRight size={18}/>
    </button>)}</div>
    {current && <div className="modal-scrim" role="presentation" onMouseDown={() => setActiveControl(null)}>
      <section className="admin-modal settings-modal" onMouseDown={event => event.stopPropagation()}>
        <header><div><p className="eyebrow">SETTINGS</p><h2>{current.title}</h2><span>{current.description}</span></div><button onClick={() => setActiveControl(null)}><X size={18}/></button></header>
        {renderSettingsControl()}
      </section>
    </div>}
  </div>;
}

function FeaturePage({ name, toast }) {
  const p = pages[name] || { eyebrow: "MOTION ONLY", title: name, text: "This area is prepared for the next build pass." };
  return <div className="feature-page">
    <div className="feature-hero"><p className="eyebrow">{p.eyebrow}</p><h1>{p.title}</h1><p>{p.text}</p><button className="primary" onClick={() => toast(`${p.title} settings opened.`)}><Settings size={16}/> Open settings</button></div>
    <div className="feature-list">
      <button className="feature-row" onClick={() => toast(`${p.title} overview opened.`)}><span className="feature-icon f1"><ArrowUpRight size={20}/></span><span><strong>Overview</strong><small>Private by default</small></span><ChevronRight size={18}/></button>
      <button className="feature-row" onClick={() => toast(`${p.title} privacy opened.`)}><span className="feature-icon f2"><Lock size={20}/></span><span><strong>Privacy</strong><small>Only shared when you choose</small></span><ChevronRight size={18}/></button>
    </div>
  </div>;
}

function AuthGate({ apiBase, supabase, onSession }) {
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState(params.get("code") ? "join" : "signin");
  const [method, setMethod] = useState("password");
  const [inviteCode, setInviteCode] = useState(params.get("code") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const normalEmail = email.trim().toLowerCase();
      if (supabase) {
        if (mode === "join") {
          const code = inviteCode.trim();
          const { data: inviteResult, error: inviteError } = await supabase
            .rpc("claim_motion_invite", { invite_code: code, invite_email: normalEmail });
          if (inviteError) throw inviteError;
          const invite = Array.isArray(inviteResult) ? inviteResult[0] : inviteResult;
          if (!invite) throw new Error("Invite code was not recognised.");
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: normalEmail,
            password,
            options: {
              data: { display_name: name.trim(), role: invite.role || "member", founding_role: invite.founding_role || "none" },
              emailRedirectTo: window.location.origin,
            },
          });
          if (signUpError) throw signUpError;
          if (data.user) {
            await supabase.from("motion_profiles").upsert({
              id: data.user.id,
              email: normalEmail,
              display_name: name.trim(),
              role: invite.role || "member",
              founding_role: invite.founding_role || "none",
              founding_status: invite.founding_role && invite.founding_role !== "none",
            });
            await supabase.rpc("mark_motion_invite_accepted", { invite_code: code });
          }
          if (data.session) onSession({ token: data.session.access_token, user: profileFromSupabaseUser(data.user) });
          else setMessage("Account created. Check your email to confirm access, then sign in.");
          return;
        }
        if (method === "magic") {
          const { error: magicError } = await supabase.auth.signInWithOtp({
            email: normalEmail,
            options: { emailRedirectTo: window.location.origin },
          });
          if (magicError) throw magicError;
          setMessage("If this email has access, a secure sign-in link is on its way.");
          return;
        }
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: normalEmail, password });
        if (signInError) throw signInError;
        onSession({ token: data.session?.access_token, user: profileFromSupabaseUser(data.user) });
        return;
      }
      if (mode === "join") {
        const result = await apiRequest("/v1/auth/accept-invite", {
          apiBase,
          method: "POST",
          body: JSON.stringify({
            inviteCode: inviteCode.trim(),
            email: normalEmail,
            password,
            name: name.trim(),
          }),
        });
        onSession(result);
        return;
      }
      if (method === "magic") {
        const result = await apiRequest("/v1/auth/magic-link", {
          apiBase,
          method: "POST",
          body: JSON.stringify({ email: normalEmail }),
        });
        setMessage(result.developmentLink ? `Development magic link created: ${result.developmentLink}` : "If this email has an active account, a secure sign-in link is on its way.");
        return;
      }
      const result = await apiRequest("/v1/auth/password", {
        apiBase,
        method: "POST",
        body: JSON.stringify({ email: normalEmail, password }),
      });
      onSession(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Motion Only could not complete that request.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = email.trim().includes("@") && !busy && (
    mode === "join"
      ? inviteCode.trim().length >= 8 && name.trim().length >= 2 && password.length >= 8
      : method === "magic" || password.length >= 8
  );

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMethod("password");
    setMessage("");
    setError("");
    setPassword("");
  };

  return <main className="auth-shell">
    <section className="auth-brand">
      <div className="brand auth-logo">
        <div className="brandmark"><img src="/motion-only-logo-dark.png" alt="" /></div>
        <div><strong>MOTION <b>ONLY</b></strong><span>CONNECT · BUILD · ADVANCE</span></div>
      </div>
      <p className="eyebrow">PRIVATE MEMBERSHIP</p>
      <h1>Progress starts here.</h1>
      <p>A private network for business, trading and fitness progress. Free membership, invite-only access, private by default.</p>
      <div className="auth-proof">
        <span><Lock size={15}/> Single-use invites</span>
        <span><ShieldCheck size={15}/> Email + password</span>
        <span><Sparkles size={15}/> Optional magic link</span>
      </div>
    </section>

    <form className="auth-card" onSubmit={submit}>
      <div className="auth-tabs">
        <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>Member sign in</button>
        <button type="button" className={mode === "join" ? "active" : ""} onClick={() => switchMode("join")}>Use invitation</button>
      </div>

      {mode === "join" && <>
        <label><span>Invitation code</span><input value={inviteCode} onChange={event => setInviteCode(event.target.value)} autoComplete="one-time-code" placeholder="Paste your private invite code" /></label>
        <label><span>Your name</span><input value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="How members should know you" /></label>
      </>}

      <label><span>Email address</span><input value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" /></label>

      {mode === "signin" && <div className="auth-methods">
        <button type="button" className={method === "password" ? "active" : ""} onClick={() => { setMethod("password"); setMessage(""); }}>Password</button>
        <button type="button" className={method === "magic" ? "active" : ""} onClick={() => { setMethod("magic"); setMessage(""); }}>Magic link</button>
      </div>}

      {(mode === "join" || method === "password") ? (
        <label><span>Password</span><input value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "join" ? "new-password" : "current-password"} type="password" placeholder="Minimum 8 characters" /></label>
      ) : (
        <div className="magic-panel"><Bell size={17}/><span>We’ll send a single-use sign-in link to your member email. It expires quickly for security.</span></div>
      )}

      {message && <p className="auth-message">{message}</p>}
      {error && <p className="auth-error">{error}</p>}

      <button className="primary auth-submit" disabled={!canSubmit} type="submit">
        <ArrowUpRight size={16}/>{busy ? "Please wait" : mode === "join" ? "Create secure account" : method === "magic" ? "Send magic link" : "Sign in"}
      </button>
      <p className="auth-footnote">Goals, progress, project content and achievement evidence stay private unless a member chooses to share them.</p>
    </form>
  </main>;
}

function InstallPrompt({ toast }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("motion-only-install-dismissed") === "true");
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setStandalone(Boolean(isStandalone));

    const handlePrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setStandalone(true);
      setInstallEvent(null);
      toast("Motion Only installed.");
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [toast]);

  if (dismissed || standalone) return null;

  const dismiss = () => {
    localStorage.setItem("motion-only-install-dismissed", "true");
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) {
      toast("On iPhone, use Share then Add to Home Screen.");
      return;
    }
    installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    setInstallEvent(null);
  };

  return (
    <div className="install-prompt">
      <div>
        <strong>Install Motion Only</strong>
        <span>Open it from your home screen during the private test.</span>
      </div>
      <button onClick={install}><ArrowUpRight size={14}/> Install</button>
      <button onClick={dismiss} aria-label="Dismiss install prompt"><X size={15}/></button>
    </div>
  );
}

export default function App() {
  const apiBase = useMemo(() => apiBaseUrl(), []);
  const supabaseSettings = useMemo(() => supabaseConfig(), []);
  const supabase = useMemo(() => supabaseSettings.enabled ? createClient(supabaseSettings.url, supabaseSettings.anonKey) : null, [supabaseSettings]);
  const realBeta = Boolean(apiBase || supabase);
  const [active, setActive] = useState("Today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({ Network: true, Messages: true, Projects: true });
  const [habits, setHabits] = useState(baseHabits);
  const [toastText, setToastText] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("motion-only-theme") || "dark");
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem(SESSION_KEY) || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(!realBeta);
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("motion-only-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (!realBeta || supabase) return;
    if (!sessionToken) {
      setAuthChecked(true);
      setCurrentUser(null);
      return;
    }
    let cancelled = false;
    setAuthChecked(false);
    apiRequest("/v1/me", { apiBase, token: sessionToken })
      .then(user => {
        if (!cancelled) {
          setCurrentUser(user);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(SESSION_KEY);
          setSessionToken("");
          setCurrentUser(null);
          setAuthChecked(true);
        }
      });
    return () => { cancelled = true; };
  }, [apiBase, realBeta, sessionToken]);
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    const applySupabaseSession = async (session) => {
      const user = session?.user;
      setSessionToken(session?.access_token || "");
      if (!user) {
        setCurrentUser(null);
        setAuthChecked(true);
        return;
      }
      const fallback = profileFromSupabaseUser(user);
      const { data: profile } = await supabase.from("motion_profiles").select("*").eq("id", user.id).maybeSingle();
      if (!cancelled) {
        setCurrentUser(profile ? profileFromRow(profile, fallback) : fallback);
        setAuthChecked(true);
      }
    };
    setAuthChecked(false);
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      applySupabaseSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySupabaseSession(session);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);
  const toast = (text) => { setToastText(text); setTimeout(() => setToastText(""), 2800); };
  const toggleHabit = id => { setHabits(habits.map(h => h.id === id ? {...h, done: !h.done} : h)); toast("Habit check-in saved privately."); };
  const addHabit = habit => setHabits([{ id: Date.now(), ...habit }, ...habits]);
  const deleteHabit = id => { setHabits(habits.filter(habit => habit.id !== id)); toast("Daily standard deleted."); };
  const onSession = ({ token, user }) => {
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setCurrentUser(user);
    setAuthChecked(true);
  };
  const logout = () => {
    if (supabase) supabase.auth.signOut().catch(() => undefined);
    else if (sessionToken) apiRequest("/v1/auth/logout", { apiBase, token: sessionToken, method: "POST" }).catch(() => undefined);
    localStorage.removeItem(SESSION_KEY);
    setSessionToken("");
    setCurrentUser(null);
    setActive("Today");
    toast("Signed out.");
  };
  const visibleActive = featureEnabled(pageFeatureMap[active]) ? active : "Today";
  if (realBeta && !authChecked) return <div className="auth-loading"><div className="brand auth-logo"><div className="brandmark"><img src="/motion-only-logo-dark.png" alt="" /></div><div><strong>MOTION <b>ONLY</b></strong><span>CONNECT · BUILD · ADVANCE</span></div></div><p>Checking secure session…</p></div>;
  if (realBeta && !currentUser) return <AuthGate apiBase={apiBase} supabase={supabase} onSession={onSession}/>;
  return <div className="app-shell">
    <Sidebar active={visibleActive} setActive={setActive} open={menuOpen} setOpen={setMenuOpen} currentUser={currentUser} onLogout={logout} realBeta={realBeta}/>
    <div className="content-shell">
      <MotionTopbar setOpen={setMenuOpen} setActive={setActive} notifications={notifications} setNotifications={setNotifications} theme={theme} setTheme={setTheme} notificationSettings={notificationSettings} currentUser={currentUser} realBeta={realBeta} onLogout={logout} supabase={supabase}/>
      <div className="content">{visibleActive === "Today"
        ? <Home habits={habits} toggleHabit={toggleHabit} addHabit={addHabit} deleteHabit={deleteHabit} setActive={setActive} toast={toast} supabase={supabase} currentUser={currentUser}/>
        : visibleActive === "Goals & habits"
          ? <SimpleGoalsHabitsPage toast={toast} supabase={supabase} currentUser={currentUser}/>
        : visibleActive === "Schedule"
          ? <SchedulePage toast={toast}/>
        : visibleActive === "Fitness"
          ? <FitnessPage toast={toast}/>
        : ["Network","Messages","Projects"].includes(visibleActive)
          ? <DeepWorkPage key={visibleActive} name={visibleActive} toast={toast} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} supabase={supabase} currentUser={currentUser}/>
        : visibleActive === "Library"
          ? <LibraryPage toast={toast}/>
        : visibleActive === "Consistency Hub"
          ? <ConsistencyHubPage toast={toast} setActive={setActive}/>
        : visibleActive === "Market News"
          ? <MarketNewsPage toast={toast}/>
        : visibleActive === "Ranks"
          ? <RanksPage/>
        : visibleActive === "Admin"
          ? <OperationsPage toast={toast} supabase={supabase} currentUser={currentUser}/>
        : visibleActive === "Settings"
          ? <SettingsPrivacyPage toast={toast} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} theme={theme} setTheme={setTheme}/>
          : <FeaturePage key={visibleActive} name={visibleActive} toast={toast}/>}
      </div>
    </div>
    <InstallPrompt toast={toast}/>
    {toastText && <div className="toast"><CheckCircle2 size={17}/>{toastText}</div>}
  </div>;
}
