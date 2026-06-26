"use client";

import { useState, useEffect } from"react";
import { toast } from"sonner";
import { 
 User, 
 Settings, 
 Key, 
 Shield, 
 Loader2, 
 Globe, 
 Layout, 
 Eye, 
 Copy, 
 Check, 
 Trash2,
 Lock,
 Plus
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

interface UserProfile {
 id: string;
 name: string;
 email: string;
 role: string;
 timezone: string;
 language: string;
 theme: string;
 profileImage: string | null;
 contactNo: string | null;
 whatsappNo: string | null;
}

export default function SettingsPage() {
 const [activeTab, setActiveTab] = useState<"profile" | "company">("profile");
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 // Profile Form States
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [language, setLanguage] = useState("en");
 const [theme, setTheme] = useState("light");
 const [profileImage, setProfileImage] = useState("");
 const [contactNo, setContactNo] = useState("");
 const [whatsappNo, setWhatsappNo] = useState("");
 const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

 // Password Change States
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [isChangingPassword, setIsChangingPassword] = useState(false);

 const fetchSettings = async () => {
 try {
 const res = await fetch("/api/auth/session");
 if (res.ok) {
 const data = await res.json();
 const user = data.user;
 setProfile(user);
 setName(user.name || "");
 setEmail(user.email || "");
 setLanguage(user.language || "en");
 setTheme(user.theme || "light");
 setProfileImage(user.profileImage || "");
 setContactNo(user.contactNo || "");
 setWhatsappNo(user.whatsappNo || "");
 }
 } catch (error) {
 console.error("Failed to load settings:", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchSettings();
 }, []);

 const handleUpdateProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsUpdatingProfile(true);

 try {
 const res = await fetch("/api/auth/complete-profile", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ 
 name, 
 email,
 language, 
 theme, 
 profileImage: profileImage || null, 
 contactNo: contactNo || null, 
 whatsappNo: whatsappNo || null 
 }),
 });

 if (!res.ok) {
 throw new Error("Failed to update profile settings");
 }

 toast.success("Profile settings updated successfully!");
 fetchSettings();
 } catch (err: any) {
 toast.error(err.message || "Failed to update profile");
 } finally {
 setIsUpdatingProfile(false);
 }
 };

 const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

 if (isLoading) {
 return (
 <div className="flex-1 flex items-center justify-center min-h-[50vh]">
 <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
 </div>
 );
 }

 return (
  <div className="flex-1 flex flex-col gap-6">
  
  {/* Header */}
  <header className="shrink-0 pb-2">
  <h1 className="text-xl font-bold tracking-tight text-zinc-800">
  Settings
  </h1>
  <p className="text-xs text-zinc-500 font-medium">Manage your personal profile, company details, and preferences.</p>
  </header>

  {/* Tabs */}
  <div className="flex border-b border-zinc-100 gap-6 select-none shrink-0">
  <button 
  onClick={() => setActiveTab("profile")}
  className={cn(
 "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
  activeTab ==="profile" ?"border-indigo-600 text-indigo-600" :"border-transparent text-zinc-500 hover:text-zinc-750"
  )}
  >
  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> User Profile</span>
  </button>
  <button 
  onClick={() => setActiveTab("company")}
  className={cn(
 "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
  activeTab ==="company" ?"border-indigo-600 text-indigo-600" :"border-transparent text-zinc-500 hover:text-zinc-750"
  )}
  >
  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Workspace Settings</span>
  </button>
  </div>

  {/* Tabs Contents */}
  <div className="flex-1 max-w-2xl">
  
  {/* PROFILE TAB */}
  {activeTab ==="profile" && (
  <div className="space-y-8">
    <form onSubmit={handleUpdateProfile} className="space-y-5">
    
    {/* Profile Picture / Avatar URL */}
    <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
      <div className="w-14 h-14 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center font-bold text-zinc-550 text-base overflow-hidden shrink-0">
        {profileImage ? (
          <img src={profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          name.split(" ").map(n => n[0]).join("")
        )}
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Avatar Image URL</label>
        <input 
          type="text" 
          placeholder="https://images.unsplash.com/photo-..." 
          value={profileImage}
          onChange={(e) => setProfileImage(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold placeholder-zinc-400"
        />
      </div>
    </div>

    <div className="space-y-4">
    {/* Row 1: Name & Email */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Full Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Email Address</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
          required
        />
      </div>
    </div>

    {/* Row 2: Contact Number & WhatsApp */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Contact Number</label>
        <input 
          type="text" 
          placeholder="+1 (555) 000-0000"
          value={contactNo}
          onChange={(e) => setContactNo(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold placeholder-zinc-400"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">WhatsApp Number</label>
        <input 
          type="text" 
          placeholder="+1 (555) 000-0000"
          value={whatsappNo}
          onChange={(e) => setWhatsappNo(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold placeholder-zinc-400"
        />
      </div>
    </div>

    {/* Row 3: Language */}
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Language</label>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
        >
          <option value="en">English (US)</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
    </div>
    </div>

    <ShimmerButton 
    type="submit"
    disabled={isUpdatingProfile}
    className="h-9 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer select-none"
    shimmerColor="#818cf8"
    >
    {isUpdatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
    Save Profile Settings
    </ShimmerButton>
    </form>

    {/* Change Password Sub-section */}
    <div className="border-t border-zinc-100 pt-6 mt-8 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-1.5"><Lock className="w-4 h-4 text-indigo-650" /> Change Password</h3>
        <p className="text-[10px] text-zinc-450 mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Current Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Confirm New Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
              required
            />
          </div>
        </div>
        <button 
          type="submit"
          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="h-8 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Update Password
        </button>
      </form>
    </div>
  </div>
  )}

  {/* WORKSPACE TAB */}
  {activeTab ==="company" && profile && (
  <div className="space-y-6">
  <GlowCard className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.02)">
  <div className="p-4 space-y-4">
  <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-1.5"><Shield className="w-4 h-4 text-indigo-600" /> Tenant Information</h3>
  
  <div className="space-y-3 text-xs divide-y divide-zinc-100">
  <div className="flex justify-between items-center py-2">
  <span className="text-zinc-500 font-semibold">Tenant ID</span>
  <span className="font-mono text-zinc-600 text-[10px] select-all">{(profile as any).company?.id}</span>
  </div>
  
  <div className="flex justify-between items-center py-2 pt-2">
  <span className="text-zinc-500 font-semibold">Workspace Name</span>
  <span className="font-bold text-zinc-700">{(profile as any).company?.name}</span>
  </div>

  <div className="flex justify-between items-center py-2 pt-2">
  <span className="text-zinc-500 font-semibold">Workspace URL Slug</span>
  <span className="font-mono text-zinc-600">{(profile as any).company?.workspaceSlug}</span>
  </div>

  <div className="flex justify-between items-center py-2 pt-2">
  <span className="text-zinc-500 font-semibold">Subscription Plan</span>
  <span className="font-bold text-indigo-600 uppercase">{(profile as any).company?.subscriptionPlan}</span>
  </div>
  </div>
  </div>
  </GlowCard>
  </div>
  )}

  </div>

  </div>
  );
}
