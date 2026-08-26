"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { textMaskReveal, revealUp, staggerContainer, cardFadeUp, imageScaleReveal } from "../lib/motion";
import { Button } from "../components/ui/Button";

// Mock data for intakes since they might not be fully in mock-data yet
const MOCK_INTAKES = [
  { id: 1, date: "28", month: "SEP", course: "Cyber Security Fundamentals", schedule: "Evening Classes • 12 Weeks", status: "OPEN" },
  { id: 2, date: "14", month: "OCT", course: "Data Science & Analytics", schedule: "Weekend Program • 16 Weeks", status: "CLOSING SOON" },
  { id: 3, date: "02", month: "NOV", course: "Full-Stack Web Development", schedule: "Full-time • 10 Weeks", status: "OPEN" },
  { id: 4, date: "15", month: "NOV", course: "Cloud Architecture (AWS)", schedule: "Evening Classes • 8 Weeks", status: "UPCOMING" },
  { id: 5, date: "05", month: "DEC", course: "UX/UI Design Masterclass", schedule: "Weekend Program • 12 Weeks", status: "UPCOMING" },
];

export function IntakesPage() {
  const [filter, setFilter] = useState("ALL");

  const filteredIntakes = MOCK_INTAKES.filter(intake => {
    if (filter === "ALL") return true;
    if (filter === "OPEN") return intake.status === "OPEN" || intake.status === "CLOSING SOON";
    return intake.status === filter;
  });

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            
            <div className="max-w-xl">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-widest mb-6"
              >
                Upcoming Intakes
              </motion.div>
              
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-8">
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={0} variants={textMaskReveal} initial="hidden" animate="visible" className="block">Your Next</motion.span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={1} variants={textMaskReveal} initial="hidden" animate="visible" className="block">Opportunity</motion.span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={2} variants={textMaskReveal} initial="hidden" animate="visible" className="block text-[var(--color-accent)]">Starts Here.</motion.span>
                </span>
              </h1>
              
              <motion.p
                variants={revealUp}
                initial="hidden"
                animate="visible"
                className="text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-md"
              >
                Find upcoming course intakes, registration periods, and flexible schedules designed for your life.
              </motion.p>
            </div>

            <motion.div
              variants={imageScaleReveal}
              initial="hidden"
              animate="visible"
              className="relative aspect-video rounded-[var(--radius-xl)] overflow-hidden shadow-xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1577415124269-b9140d420bf4?auto=format&fit=crop&q=80&w=1200" 
                alt="Calendar and planning"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Featured Next Intake */}
      <section className="py-12 bg-[var(--color-background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.4 }}
             className="relative bg-[var(--color-primary)] rounded-[var(--radius-xl)] overflow-hidden text-[var(--color-static-white)] shadow-2xl"
          >
             <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
             <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                   <div className="text-sm font-bold text-[var(--color-primary-muted)] uppercase tracking-widest mb-4">Next Major Intake</div>
                   <h3 className="text-3xl sm:text-4xl font-extrabold mb-2">Cyber Security Fundamentals</h3>
                   <p className="text-[var(--color-primary-muted)] text-lg mb-8 max-w-lg">Registration is currently open. Secure your spot before applications close on September 20th.</p>
                   
                   <div className="flex flex-col sm:flex-row gap-4">
                      <Link to="/courses/cyber-security">
                         <Button size="lg" className="rounded-full px-8 bg-[var(--color-static-white)] text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] w-full sm:w-auto">
                            Apply Now
                         </Button>
                      </Link>
                      <Link to="/courses/cyber-security">
                         <Button variant="outline" size="lg" className="rounded-full px-8 border-[var(--color-primary-muted)] text-[var(--color-static-white)] hover:bg-[var(--color-primary)]/20 w-full sm:w-auto">
                            View Course Details
                         </Button>
                      </Link>
                   </div>
                </div>
                
                <div className="bg-[var(--color-static-white)]/10 backdrop-blur-md border border-[var(--color-static-white)]/20 rounded-[var(--radius-lg)] p-8 text-center shrink-0 w-full md:w-auto">
                   <div className="text-6xl font-extrabold mb-1">{MOCK_INTAKES[0].date}</div>
                   <div className="text-xl font-bold tracking-widest uppercase mb-4">{MOCK_INTAKES[0].month}</div>
                   <div className="inline-block px-3 py-1 bg-[var(--color-success)]/20 text-[var(--color-success-soft)] font-bold text-xs uppercase tracking-wider rounded-full border border-[var(--color-success)]/30">
                      Registration Open
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Intake List & Filters */}
      <section className="py-12 lg:py-20 bg-[var(--color-background)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-12">
            {["ALL", "OPEN", "UPCOMING"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? "bg-[var(--color-primary)] text-[var(--color-static-white)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col gap-4"
          >
            {filteredIntakes.length > 0 ? filteredIntakes.map((intake) => (
              <motion.div 
                key={intake.id} 
                variants={cardFadeUp}
                className="group flex flex-col md:flex-row md:items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 md:p-8 hover:border-[var(--color-accent)] hover:shadow-md transition-all gap-6"
              >
                <div className="flex items-center gap-6 md:w-48 shrink-0">
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{intake.date}</div>
                    <div className="text-sm font-bold text-[var(--color-text-muted)] tracking-widest uppercase">{intake.month}</div>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                    {intake.course}
                  </h4>
                  <p className="text-[var(--color-text-secondary)] font-medium">
                    {intake.schedule}
                  </p>
                </div>

                <div className="md:w-48 flex items-center md:justify-end">
                   <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                      intake.status === 'OPEN' ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 
                      intake.status === 'CLOSING SOON' ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' :
                      'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                   }`}>
                     {intake.status}
                   </div>
                </div>

                <div className="md:w-32 flex md:justify-end shrink-0">
                   <Link to="/courses" className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-accent)] transition-colors inline-flex items-center group-hover:underline">
                      Details <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                   </Link>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)]">
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">No active intakes found.</h3>
                <p className="text-[var(--color-text-secondary)]">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)] text-center px-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6">Don't Miss The<br/>Next Intake.</h2>
        <p className="text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto mb-10">Explore our programs and find the course that's right for your career path.</p>
        <Link to="/courses">
           <Button size="lg" className="rounded-full px-10 py-6 text-base">Explore Courses</Button>
        </Link>
      </section>
    </div>
  );
}
