"use client";

import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <img src="/brand/nenasala-logo.png" alt="Nenasala" className="h-10 w-auto max-w-[180px] object-contain" />
            </Link>
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
              Modern education powered by a modern digital platform. Building skills for the future.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wider uppercase">Explore</h3>
            <ul className="mt-4 space-y-3">
              <li><Link to="/courses" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Courses</Link></li>
              <li><Link to="/intakes" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Intakes</Link></li>
              <li><Link to="/instructors" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Instructors</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><Link to="/about" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-3">
              <li><Link to="/faq" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">FAQ</Link></li>
              <li><Link to="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Student Login</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-[var(--color-border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} Nenasala Peradeniya. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-sm text-[var(--color-text-muted)]">Privacy Policy</span>
            <span className="text-sm text-[var(--color-text-muted)]">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
