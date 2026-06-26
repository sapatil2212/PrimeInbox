"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Mail, 
  LogOut, 
  User, 
  Settings, 
  CreditCard, 
  BarChart3, 
  Send, 
  Users, 
  Key, 
  ShieldAlert, 
  LayoutDashboard,
  Sparkles,
  Search,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Building,
  UserPlus,
  BookOpen,
  FolderHeart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string | null;
  };
  company: {
    id: string;
    name: string;
    workspaceSlug: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
}

export function DashboardLayoutShell({ children, user, company }: DashboardLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Reduce root font size for the dashboard to make elements more compact and professional
  useEffect(() => {
    const html = document.documentElement;
    html.style.fontSize = "14.5px";
    return () => {
      html.style.fontSize = "";
    };
  }, []);

  // Command palette listener (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to log out.");
    }
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Campaigns", href: "/dashboard/campaigns", icon: Send },
    { label: "Leads", href: "/dashboard/leads", icon: Users },
    { label: "Templates", href: "/dashboard/templates", icon: BookOpen },
    { label: "SMTP Accounts", href: "/dashboard/smtp", icon: Key },
    { label: "AI Studio", href: "/dashboard/ai-studio", icon: Sparkles },
    { label: "CRM", href: "/dashboard/crm", icon: Building },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { label: "Team", href: "/dashboard/team", icon: UserPlus },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Commands for command palette
  const commands = [
    { name: "Create Campaign", desc: "Start a new outreach sequence", href: "/dashboard/campaigns/create" },
    { name: "Import Leads", desc: "Upload CSV or list leads", href: "/dashboard/leads" },
    { name: "Connect SMTP", desc: "Add email sending accounts", href: "/dashboard/smtp" },
    { name: "Compose Template", desc: "Design outreach template", href: "/dashboard/templates" },
    { name: "AI Studio sequence", desc: "Generate sequence using Gemini", href: "/dashboard/ai-studio" },
    { name: "CRM Contacts", desc: "View managed CRM pipeline", href: "/dashboard/crm" },
    { name: "Workspace Settings", desc: "Adjust timezone or company profile", href: "/dashboard/settings" },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-850 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.02),transparent_60%)] pointer-events-none z-0" />
      
      {/* Sidebar for Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-zinc-200/80 shrink-0 transition-all duration-300 z-[20] relative",
          isCollapsed ? "w-20 p-4" : "w-64 p-6"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center mb-8 relative">
          <div className="flex items-center gap-2.5 min-w-0">
            {isCollapsed ? (
              <img src="/logo/favicon.png" alt="PrimeInbox" className="w-8 h-8 rounded-xl object-contain shrink-0" />
            ) : (
              <img src="/logo/primeinbox-logo.png" alt="PrimeInbox" className="h-9 w-auto object-contain shrink-0" />
            )}
          </div>
        </div>

        {/* Sidebar Collapse Toggle Button centered on the border line */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7.5 w-6 h-6 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all z-30 shadow-sm flex items-center justify-center cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>



        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 select-none">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all group border border-transparent",
                  isActive 
                    ? "bg-indigo-50 text-indigo-650 border-indigo-100/50"
                    : "text-zinc-650 hover:text-zinc-950 hover:bg-zinc-100/50 hover:border-zinc-200/40"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105", isActive ? "text-indigo-600" : "text-zinc-450 group-hover:text-zinc-700")} />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}

          {/* Super Admin Module */}
          {user.role === "SUPER_ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all group border border-transparent mt-4",
                pathname.startsWith("/admin")
                  ? "bg-red-50 text-red-750 border-red-100"
                  : "text-red-650 hover:text-red-800 hover:bg-red-50/50 hover:border-red-100/50"
              )}
              title={isCollapsed ? "Super Admin" : undefined}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Super Admin</span>}
            </Link>
          )}
        </nav>

        {/* Tenant Workspace Widget */}
        {!isCollapsed ? (
          <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl shadow-inner shrink-0">
            <div className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Workspace</div>
            <div className="font-bold text-sm text-zinc-850 truncate mt-0.5">{company.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-500 truncate">Plan: {company.subscriptionPlan}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-650 rounded-md uppercase border border-indigo-500/10">Active</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex justify-center shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-xs hover:border-zinc-400 cursor-pointer shadow-sm" title={company.name}>
              {company.name[0]}
            </div>
          </div>
        )}

        {/* Sidebar Footer - User Profile */}
        <div className="border-t border-zinc-200/80 pt-4 mt-4 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-600 font-bold shrink-0 text-xs overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.split(" ").map(n => n[0]).join("")
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-800 truncate">{user.name}</div>
                <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 text-zinc-500 hover:text-red-600 transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-over Sidebar Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)}>
          <aside className="w-64 bg-white border-r border-zinc-200 h-full flex flex-col p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/logo/primeinbox-logo.png" alt="PrimeInbox" className="h-9 w-auto object-contain shrink-0" />
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Workspace</div>
              <div className="font-bold text-sm text-zinc-800 truncate">{company.name}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Plan: {company.subscriptionPlan}</div>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border border-transparent",
                      isActive 
                        ? "bg-indigo-50 text-indigo-650 border-indigo-100/50"
                        : "text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              {user.role === "SUPER_ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-650 hover:text-red-800 hover:bg-red-50 border border-transparent mt-4"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Super Admin</span>
                </Link>
              )}
            </nav>

            <div className="border-t border-zinc-200 pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-650 font-bold text-xs shrink-0">
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-800 truncate">{user.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-red-650"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white/60 border-b border-zinc-200/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30 relative">
          
          {/* Top Left: Hamburger & Page name */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
              <span>PrimeInbox</span>
              <span>/</span>
              <span className="text-zinc-800 capitalize">
                {pathname.split("/")[2] || "Overview"}
              </span>
            </div>
          </div>

          {/* Top Right: Actions & Profile */}
          <div className="flex items-center gap-3 relative">
            
            {/* Search Input Bar (Shortcut trigger) */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 hover:border-zinc-300 text-xs text-zinc-650 hover:text-zinc-850 transition-all font-semibold"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search outreach...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded font-mono text-[9px]">Ctrl K</kbd>
            </button>

            {/* Notifications Center */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              </button>
              
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="font-bold text-xs text-zinc-900">Notifications</span>
                      <button className="text-[10px] text-indigo-600 font-bold hover:underline">Mark all read</button>
                    </div>
                    <div className="space-y-2 text-xs divide-y divide-zinc-100 max-h-60 overflow-y-auto pr-1">
                      <div className="pt-2 flex gap-2.5 items-start">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-zinc-800">SMTP limits reset completed</p>
                          <p className="text-[10px] text-zinc-450">All SMTP accounts hourly limit resets processed.</p>
                        </div>
                      </div>
                      <div className="pt-2 flex gap-2.5 items-start">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-zinc-800">AI campaign generated</p>
                          <p className="text-[10px] text-zinc-450">Your AI sequence is ready for review.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-8 h-8 rounded-full border border-zinc-200 hover:border-zinc-300 bg-white flex items-center justify-center font-bold text-zinc-550 text-xs overflow-hidden cursor-pointer"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.name.split(" ").map(n => n[0]).join("")
                )}
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl z-40 p-2 divide-y divide-zinc-100">
                    <div className="px-3 py-2 text-xs">
                      <div className="font-bold text-zinc-800 truncate">{user.name}</div>
                      <div className="text-[10px] text-zinc-450 truncate">{user.role}</div>
                    </div>
                    <div className="py-1">
                      <Link 
                        href="/dashboard/settings" 
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        <User className="w-3.5 h-3.5" /> Profile Settings
                      </Link>
                      <Link 
                        href="/dashboard/settings" 
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        <Settings className="w-3.5 h-3.5" /> Workspace
                      </Link>
                    </div>
                    <div className="pt-1">
                      <button 
                        onClick={() => {
                          setProfileMenuOpen(false);
                           handleLogout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 overflow-y-auto relative p-6 md:p-8 flex flex-col">
          {children}
        </main>
      </div>

      {/* Command Palette Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 border-b border-zinc-100 gap-2 shrink-0">
              <Search className="w-4 h-4 text-zinc-450" />
              <input 
                type="text" 
                placeholder="Type a command or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm text-zinc-800 placeholder-zinc-400 font-semibold"
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="text-[10px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded text-zinc-500"
              >
                ESC
              </button>
            </div>

            {/* Results Grid */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] font-bold text-zinc-450 px-3 py-1">Quick Actions</div>
              {filteredCommands.map((cmd) => (
                <Link
                  key={cmd.name}
                  href={cmd.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex flex-col px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-xs font-bold text-zinc-800">{cmd.name}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{cmd.desc}</span>
                </Link>
              ))}
              {filteredCommands.length === 0 && (
                <div className="text-xs text-zinc-500 text-center py-6">No matching actions found.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
