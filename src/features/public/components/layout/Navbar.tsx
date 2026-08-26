"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/Button";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "../../lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const links = [
    { href: "/courses", label: "Courses" },
    { href: "/intakes", label: "Intakes" },
    { href: "/instructors", label: "Instructors" },
    { href: "/about", label: "About" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-4 pointer-events-none"
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between pointer-events-auto transition-all duration-300 ease-in-out",
          "max-w-6xl rounded-[var(--radius-xl)] px-6",
          isScrolled
            ? "h-16 bg-[var(--color-surface)]/90 backdrop-blur-md shadow-sm border border-[var(--color-border)] py-0"
            : "h-20 bg-transparent border border-transparent py-2"
        )}
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-9 w-auto max-w-[150px] object-contain transition-transform group-hover:scale-[1.02]" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-semibold transition-colors relative group",
                  isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                )}
              >
                {link.label}
                <span 
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-[var(--color-accent)] transition-all duration-300 rounded-full",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="primary" className="rounded-full px-6">Login / Sign up</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-[var(--color-text-secondary)]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden mt-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] pointer-events-auto shadow-lg overflow-hidden">
          <div className="space-y-1 px-4 pb-4 pt-4">
            {links.map((link) => {
              const isActive = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-3 text-base font-medium transition-colors",
                    isActive 
                      ? "bg-[var(--color-primary)]/5 text-[var(--color-primary)]" 
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-primary)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-4 px-3 pt-2 border-t border-[var(--color-border)]">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full rounded-full py-6">Login / Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
