"use client";

import Link from "next/link";
import { Container } from "./container";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-transparent pt-24 pb-12 relative z-10">
      <div className="border-t border-zinc-200/60 mb-16 w-full" />
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-6 inline-flex">
              <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
            </Link>
            <p className="text-zinc-500 text-xs max-w-sm leading-relaxed font-normal">
              Turn wasted DevRel budget into measurable pipeline growth. We help B2B developer platforms convert community engagement into revenue opportunities.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-4">Product</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link href="/#features" className="hover:text-zinc-900 transition-colors">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-zinc-900 transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-4">Company</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-500">
              <li><Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-zinc-900 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-4">Contact</h4>
            <ul className="space-y-3.5 text-xs font-semibold text-zinc-500">
              <li>
                <a href="tel:+919168081355" className="flex items-start gap-2.5 hover:text-zinc-900 transition-colors">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" />
                  <span>+91 9168 08 1355</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact.primeinbox@gmail.com" className="flex items-start gap-2.5 hover:text-zinc-900 transition-colors">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" />
                  <span className="break-all">contact.primeinbox@gmail.com</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" />
                <span>Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200/60 text-center text-xs font-normal text-zinc-400">
          <p>© {new Date().getFullYear()} PrimeInbox. All rights reserved. | A product of Brightwave Digital Products</p>
        </div>
      </Container>
    </footer>
  );
}
