"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Wallet, Menu, X } from "lucide-react";

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#038E80] rounded-xl flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#038E80]">CashIn Tap</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-[#038E80] transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-[#038E80] transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-[#038E80] transition-colors">Pricing</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#038E80] transition-colors px-4 py-2">Sign In</Link>
          <Link href="/register" className="text-sm font-semibold bg-[#038E80] text-white px-5 py-2 rounded-xl hover:bg-[#058174] transition-all">Get Started</Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a href="#features" className="block text-sm font-medium text-gray-600 py-2" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" className="block text-sm font-medium text-gray-600 py-2" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#pricing" className="block text-sm font-medium text-gray-600 py-2" onClick={() => setMenuOpen(false)}>Pricing</a>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <Link href="/login" className="text-center text-sm font-medium text-gray-600 py-2.5 border border-gray-200 rounded-xl">Sign In</Link>
            <Link href="/register" className="text-center text-sm font-semibold bg-[#038E80] text-white py-2.5 rounded-xl">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
