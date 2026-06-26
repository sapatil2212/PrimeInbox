"use client";

import { useState, useEffect } from "react";
import { Cookie, Shield, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("cookie-consent-preferences");
    if (!consent) {
      // Small delay for natural appearance
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPrefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem("cookie-consent-preferences", JSON.stringify(allPrefs));
    setPreferences(allPrefs);
    setIsOpen(false);
  };

  const handleRejectNonEssential = () => {
    const essentialPrefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem("cookie-consent-preferences", JSON.stringify(essentialPrefs));
    setPreferences(essentialPrefs);
    setIsOpen(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookie-consent-preferences", JSON.stringify(preferences));
    setIsOpen(false);
    setShowPreferences(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg relative">
          
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-50 rounded-xl text-gray-600 shrink-0 border border-gray-200">
              <Cookie className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                We value your privacy
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies to enhance your experience, analyze our traffic, and serve personalized marketing messages.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectNonEssential}
                className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                Reject Non-Essential
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                Customize
              </Button>
            </div>
            <Button
              onClick={handleAcceptAll}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
            >
              Accept All Cookies
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPreferences(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">Cookie Preferences</h2>
              </div>
              <button 
                onClick={() => setShowPreferences(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable preferences list */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 leading-relaxed">
                Customize your cookie preferences below. Essential cookies are required for the application to function correctly and cannot be disabled.
              </p>

              {/* Necessary */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">Strictly Necessary Cookies</span>
                    <span className="text-[10px] font-medium bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded border border-gray-300">Required</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Essential for secure logins, session security, authentication, and core functionality.
                  </p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-indigo-600 focus:ring-indigo-500/20 focus:ring-2 accent-indigo-600 cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">Analytics Cookies</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Used to understand visitor usage patterns, identify issues, and track site performance analytics.
                  </p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500/20 focus:ring-2 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">Marketing Cookies</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Used to track advertisements performance and help display personalized outreach materials.
                  </p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500/20 focus:ring-2 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(false)}
                className="border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePreferences}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
