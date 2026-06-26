"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/ui/feedback";
import {
  ShieldAlert,
  LogOut,
  Settings,
  Database,
  Activity,
  Users,
  Building,
  BarChart3,
  RefreshCw,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Terminal,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string | null;
  };
}

export function AdminLayoutShell({ children, user }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const response = await fetch("/api/auth/superadmin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      toast.success("Logged out of admin panel");
      router.push("/superadmin/login");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to log out.");
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const navLinks = [
    { label: "Overview", href: "/admin", icon: BarChart3, exact: true },
    { label: "Tenants", href: "/admin/tenants", icon: Building },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Demo Enquiry", href: "/admin/demo-enquiry", icon: Calendar },
    { label: "System Health", href: "/admin/health", icon: Activity },
    { label: "Logs", href: "/admin/logs", icon: Terminal },
    { label: "Database", href: "/admin/database", icon: Database },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const quickActions = [
    { name: "View Tenants", desc: "Manage workspace tenants", href: "/admin/tenants" },
    { name: "Demo Enquiries", desc: "Inbound demo requests", href: "/admin/demo-enquiry" },
    { name: "System Health", desc: "Check system diagnostics", href: "/admin/health" },
    { name: "View Logs", desc: "Monitor system logs", href: "/admin/logs" },
    { name: "Database Status", desc: "Check database connection", href: "/admin/database" },
  ];

  const filteredActions = quickActions.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-850 flex flex-col md:flex-row relative overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-zinc-200/80 shrink-0 transition-all duration-300 z-[20] relative",
          isCollapsed ? "w-20 p-4" : "w-60 p-5"
        )}
      >
        {/* Sidebar Header - Logo */}
        <div className="flex items-center mb-8 relative">
          <div className="flex items-center gap-2 min-w-0">
            {isCollapsed ? (
              <img src="/logo/favicon.png" alt="PrimeInbox" className="w-8 h-8 rounded-lg object-contain shrink-0" />
            ) : (
              <img src="/logo/primeinbox-logo.png" alt="PrimeInbox" className="h-8 w-auto object-contain shrink-0" />
            )}
          </div>
        </div>

        {/* Admin badge */}
        {!isCollapsed && (
          <div className="mb-5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/70 w-fit">
            <ShieldAlert className="w-3 h-3 text-zinc-500" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Super Admin</span>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 w-6 h-6 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-all z-30 flex items-center justify-center cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 select-none">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all group border border-transparent",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 border-zinc-200/60"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-zinc-700" : "text-zinc-400 group-hover:text-zinc-600")} />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Exit to Dashboard */}
        {!isCollapsed ? (
          <Link
            href="/dashboard"
            className="mt-4 p-2.5 bg-zinc-50 border border-zinc-200/70 rounded-lg hover:bg-zinc-100 transition-all shrink-0"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Dashboard</span>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="mt-4 flex justify-center shrink-0"
            title="Exit to Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/70 flex items-center justify-center text-zinc-500 hover:bg-zinc-100">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
          </Link>
        )}

        {/* Sidebar Footer - User Profile */}
        <div className="border-t border-zinc-200/70 pt-4 mt-4 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/70 flex items-center justify-center text-zinc-600 font-bold shrink-0 text-[10px] overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-800 truncate">{user.name}</div>
                <div className="text-[9px] text-zinc-400 truncate">{user.role}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-over Sidebar Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <aside
            className="w-60 bg-white border-r border-zinc-200 h-full flex flex-col p-5 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header - Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo/primeinbox-logo.png" alt="PrimeInbox" className="h-8 w-auto object-contain shrink-0" />
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/70 w-fit">
              <ShieldAlert className="w-3 h-3 text-zinc-500" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Super Admin</span>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname === link.href || pathname.startsWith(link.href + "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all border border-transparent",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 border-zinc-200/60"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className="p-2.5 bg-zinc-50 border border-zinc-200/70 rounded-lg hover:bg-zinc-100 transition-all"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit to Dashboard</span>
              </div>
            </Link>

            <div className="border-t border-zinc-200/70 pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-[10px] shrink-0">
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-zinc-800 truncate">{user.name}</div>
                  <div className="text-[9px] text-zinc-400 truncate">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-zinc-200/80 px-6 flex items-center justify-between shrink-0">
          {/* Top Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 md:hidden transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-400 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
              <span>Admin Panel</span>
              <span>/</span>
              <span className="text-zinc-700 capitalize">
                {pathname === "/admin" ? "Overview" : pathname.split("/")[2] || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Top Right */}
          <div className="flex items-center gap-2.5 relative">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-zinc-600")} />
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-[11px] text-zinc-500 hover:text-zinc-700 transition-all font-semibold"
            >
              <Search className="w-3 h-3" />
              <span>Quick actions...</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[9px]">
                Ctrl K
              </kbd>
            </button>



            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-8 h-8 rounded-full border border-zinc-200 hover:border-zinc-300 bg-white flex items-center justify-center font-bold text-zinc-500 text-[10px] overflow-hidden cursor-pointer"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.name.split(" ").map((n) => n[0]).join("")
                )}
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-xl z-40 p-2 divide-y divide-zinc-100">
                    <div className="px-3 py-2 text-[11px]">
                      <div className="font-bold text-zinc-800 truncate">{user.name}</div>
                      <div className="text-[10px] text-zinc-400 font-bold truncate">{user.role}</div>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                      >
                        <Settings className="w-3 h-3" /> Settings
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                      >
                        <ArrowLeft className="w-3 h-3" /> Exit Admin
                      </Link>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                      >
                        <LogOut className="w-3 h-3" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>

      {/* Command Palette Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-zinc-200 rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-zinc-100 gap-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Type a command or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-[13px] text-zinc-800 placeholder-zinc-400 font-semibold"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-[10px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded text-zinc-400"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] font-bold text-zinc-400 px-3 py-1">Admin Quick Actions</div>
              {filteredActions.map((cmd) => (
                <Link
                  key={cmd.name}
                  href={cmd.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex flex-col px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-[11px] font-bold text-zinc-800">{cmd.name}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{cmd.desc}</span>
                </Link>
              ))}
              {filteredActions.length === 0 && (
                <div className="text-[11px] text-zinc-400 text-center py-6">No matching actions found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
