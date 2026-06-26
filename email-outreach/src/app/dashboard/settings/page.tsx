"use client";

import { useState, useEffect, useRef } from"react";
import { useRouter } from"next/navigation";
import { toast } from "@/components/ui/feedback";
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
 Plus,
 Upload
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
 const router = useRouter();
 const [activeTab, setActiveTab] = useState<"profile" | "company">("profile");
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 // Profile Form States
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [language, setLanguage] = useState("en");
 const [theme, setTheme] = useState("light");
 const [profileImage, setProfileImage] = useState("");
 const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
 const avatarInputRef = useRef<HTMLInputElement>(null);
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

 const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.type.startsWith("image/")) {
 toast.error("Please select an image file.");
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 toast.error("Image must be 5MB or smaller.");
 return;
 }

 setIsUploadingAvatar(true);
 try {
 const formData = new FormData();
 formData.append("file", file);
 formData.append("category", "avatars");

 const res = await fetch("/api/media/upload", { method: "POST", body: formData });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || "Upload failed");

 setProfileImage(data.url);
 toast.success("Avatar uploaded. Save your profile to apply it.");
 } catch (err: any) {
 toast.error(err.message || "Failed to upload avatar");
 } finally {
 setIsUploadingAvatar(false);
 if (avatarInputRef.current) avatarInputRef.current.value = "";
 }
 };

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
 router.refresh(); // Revalidate server components (sidebar/header avatar)
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
  <div className="flex-1 flex flex-col items-center w-full">
  <div className="w-full max-w-2xl flex flex-col gap-6">

  {/* Header */}
  <header className="text-center pt-2">
  <h1 className="text-2xl font-black tracking-tight text-zinc-900">
  Settings
  </h1>
  <p className="text-sm text-zinc-500 font-medium mt-1">Manage your personal profile, company details, and preferences.</p>
  </header>

  {/* Tabs */}
  <div className="flex items-center justify-center gap-1 bg-zinc-100/70 p-1 rounded-xl mx-auto select-none">
  <button 
  onClick={() => setActiveTab("profile")}
  className={cn(
 "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
  activeTab ==="profile" ?"bg-white text-indigo-600 shadow-sm" :"text-zinc-500 hover:text-zinc-800"
  )}
  >
  <User className="w-3.5 h-3.5" /> User Profile
  </button>
  <button 
  onClick={() => setActiveTab("company")}
  className={cn(
 "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
  activeTab ==="company" ?"bg-white text-indigo-600 shadow-sm" :"text-zinc-500 hover:text-zinc-800"
  )}
  >
  <Globe className="w-3.5 h-3.5" /> Workspace
  </button>
  </div>

  {/* Tabs Contents */}
  <div className="w-full">
  
  {/* PROFILE TAB */}
  {activeTab ==="profile" && (
  <div className="space-y-6">
    <form onSubmit={handleUpdateProfile} className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
    
    <div>
      <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Profile Information</h2>
      <p className="text-xs text-zinc-500 font-medium mt-0.5">Update your personal details and avatar.</p>
    </div>

    {/* Profile Picture / Avatar Upload */}
    <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
      <div className="w-16 h-16 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center font-bold text-zinc-550 text-base overflow-hidden shrink-0">
        {profileImage ? (
          <img src={profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          name.split(" ").map(n => n[0]).join("")
        )}
      </div>
      <div className="flex-1 space-y-2">
        <label className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Profile Avatar</label>
        <div className="flex items-center gap-2">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="h-9 px-4 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {profileImage ? "Change photo" : "Upload photo"}
          </button>
          {profileImage && !isUploadingAvatar && (
            <button
              type="button"
              onClick={() => setProfileImage("")}
              className="h-9 px-3 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-xs font-bold text-zinc-500 hover:text-red-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 font-medium">JPG, PNG or GIF, up to 5MB. Saved to your workspace storage.</p>
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
          className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Email Address</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
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
          className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold placeholder-zinc-400"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">WhatsApp Number</label>
        <input 
          type="text" 
          placeholder="+1 (555) 000-0000"
          value={whatsappNo}
          onChange={(e) => setWhatsappNo(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold placeholder-zinc-400"
        />
      </div>
    </div>
    </div>

    <div className="flex justify-end pt-1">
    <ShimmerButton 
    type="submit"
    disabled={isUpdatingProfile}
    className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer select-none"
    shimmerColor="#818cf8"
    >
    {isUpdatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
    Save Profile Settings
    </ShimmerButton>
    </div>
    </form>

    {/* Change Password Card */}
    <form onSubmit={handlePasswordChange} className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div>
        <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-500" /> Change Password</h2>
        <p className="text-xs text-zinc-500 font-medium mt-0.5">Use a long, random password to keep your account secure.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Current Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
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
              className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
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
              className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-700 font-semibold"
              required
            />
          </div>
        </div>
        <div className="flex justify-end pt-1">
        <button 
          type="submit"
          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="h-9 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Update Password
        </button>
        </div>
      </div>
    </form>
  </div>
  )}

  {/* WORKSPACE TAB */}
  {activeTab ==="company" && profile && (
  <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
  <div>
  <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500" /> Tenant Information</h2>
  <p className="text-xs text-zinc-500 font-medium mt-0.5">Read-only details about your workspace.</p>
  </div>
  
  <div className="text-xs divide-y divide-zinc-100 border-t border-zinc-100">
  <div className="flex justify-between items-center py-3">
  <span className="text-zinc-500 font-semibold">Tenant ID</span>
  <span className="font-mono text-zinc-600 text-[10px] select-all">{(profile as any).company?.id}</span>
  </div>
  
  <div className="flex justify-between items-center py-3">
  <span className="text-zinc-500 font-semibold">Workspace Name</span>
  <span className="font-bold text-zinc-700">{(profile as any).company?.name}</span>
  </div>

  <div className="flex justify-between items-center py-3">
  <span className="text-zinc-500 font-semibold">Workspace URL Slug</span>
  <span className="font-mono text-zinc-600">{(profile as any).company?.workspaceSlug}</span>
  </div>

  <div className="flex justify-between items-center py-3">
  <span className="text-zinc-500 font-semibold">Subscription Plan</span>
  <span className="font-bold text-indigo-600 uppercase">{(profile as any).company?.subscriptionPlan}</span>
  </div>
  </div>
  </div>
  )}

  </div>

  </div>
  </div>
  );
}
