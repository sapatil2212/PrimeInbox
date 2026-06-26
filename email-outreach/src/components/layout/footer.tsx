"use client";

import Link from "next/link";
import { Container } from "./container";
import { Mail, MessageCircle, Users, Code } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-transparent pt-24 pb-12 relative z-10">
      <div className="border-t border-zinc-200/60 mb-16 w-full" />
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-6 inline-flex">
              <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
            </Link>
            <p className="text-zinc-550 text-sm max-w-sm mb-6 leading-relaxed font-semibold">
              Turn wasted DevRel budget into measurable pipeline growth. We help B2B developer platforms convert community engagement into revenue opportunities.
            </p>
            <div className="flex items-center gap-4 text-zinc-500">
              <a href="#" className="hover:text-zinc-900 transition-colors p-2 bg-zinc-150/40 border border-zinc-200/60 hover:border-zinc-300 rounded-lg"><MessageCircle className="w-4 h-4" /></a>
              <a href="#" className="hover:text-zinc-900 transition-colors p-2 bg-zinc-150/40 border border-zinc-200/60 hover:border-zinc-300 rounded-lg"><Users className="w-4 h-4" /></a>
              <a href="#" className="hover:text-zinc-900 transition-colors p-2 bg-zinc-150/40 border border-zinc-200/60 hover:border-zinc-300 rounded-lg"><Code className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-4">Product</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Integrations</Link></li>
              <li><Link href="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-4">Resources</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Developer Forum</Link></li>
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Support Docs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-4">Company</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link href="/about" className="hover:text-zinc-900 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-zinc-900 transition-colors">Careers</Link></li>
              <li><Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms of Use</Link></li>
              <li><Link href="/contact" className="hover:text-zinc-900 transition-colors">Contact Relations</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-zinc-500">
          <p>© {new Date().getFullYear()} PrimeInbox, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-zinc-900 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
