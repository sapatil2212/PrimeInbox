"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Mail } from "lucide-react";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-4 md:px-0">
      {/* Visual Spring-based Navbar Container - Constant Width to prevent layout snapping */}
      <motion.div
        animate={{
          y: isScrolled ? 16 : 0,
          borderRadius: isScrolled ? "9999px" : "0px",
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0)",
          borderColor: isScrolled ? "rgba(9, 9, 11, 0.06)" : "rgba(9, 9, 11, 0)",
          boxShadow: isScrolled ? "0 10px 30px -10px rgba(0,0,0,0.06)" : "0 0px 0px rgba(0,0,0,0)",
          paddingTop: isScrolled ? "10px" : "20px",
          paddingBottom: isScrolled ? "10px" : "20px",
        }}
        transition={{
          type: "spring",
          stiffness: 140,
          damping: 22,
        }}
        className="mx-auto w-[calc(100%-2rem)] max-w-6xl border-b backdrop-blur-xl pointer-events-auto flex items-center justify-between z-50 relative"
      >
        <Container className="flex items-center justify-between !px-6 max-w-full">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white p-1.5 rounded-full border border-blue-200/50">
            {NAV_LINKS.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative text-sm font-medium px-4 py-2 text-zinc-600 hover:text-zinc-950 transition-colors rounded-full"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {hoveredIndex === idx && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 bg-blue-50/70 rounded-full border border-blue-100/40"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors px-4 py-2 hover:bg-zinc-100 rounded-full border border-transparent hover:border-zinc-200/30"
            >
              Log in
            </Link>
            <Link href="/signup">
              <ShimmerButton 
                className="h-10 px-5 rounded-full text-xs font-semibold bg-black hover:bg-zinc-900"
                shimmerColor="#3B82F6"
              >
                14 days free trial
              </ShimmerButton>
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-950 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </Container>
      </motion.div>

      {/* Mobile Menu - Stays clean and floating */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "md:hidden absolute left-4 right-4 bg-white border border-zinc-200 p-5 shadow-xl flex flex-col gap-5 rounded-2xl pointer-events-auto z-40",
              isScrolled ? "top-[78px]" : "top-[86px]"
            )}
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium p-3 hover:bg-zinc-50 rounded-xl text-zinc-700 hover:text-zinc-950 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <hr className="border-zinc-200" />
            <div className="flex flex-row items-center gap-2.5">
              <Link href="/login" className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 h-10 rounded-xl text-xs whitespace-nowrap"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <ShimmerButton 
                  className="w-full justify-center h-10 rounded-xl text-xs whitespace-nowrap bg-black hover:bg-zinc-900" 
                  shimmerColor="#3B82F6"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  14 days free trial
                </ShimmerButton>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
