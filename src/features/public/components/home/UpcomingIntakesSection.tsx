"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const intakes = [
  { course: "Full-Stack Web Development", date: "28 September", status: "OPEN" },
  { course: "Data Science Fundamentals", date: "15 October", status: "FILLING FAST" },
  { course: "UI/UX Design Masterclass", date: "02 November", status: "OPEN" },
];

export function UpcomingIntakesSection() {
  return (
    <section className="py-24 bg-[var(--color-background)] border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-3">
              Upcoming Intakes.
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-xl">
              Secure your spot in our upcoming expert-led sessions.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to="/intakes"
              className="inline-flex items-center text-[var(--color-accent)] font-semibold hover:opacity-80 transition-opacity"
            >
              View Full Calendar &rarr;
            </Link>
          </motion.div>
        </div>

        <div className="flex flex-col gap-4">
          {intakes.map((intake, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors gap-6"
            >
              <div className="flex-1">
                <div className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Course
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                  {intake.course}
                </h3>
              </div>
              
              <div className="md:w-48">
                 <div className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Next Intake
                </div>
                <div className="text-lg font-semibold text-[var(--color-text-secondary)]">
                  {intake.date}
                </div>
              </div>

              <div className="md:w-48">
                 <div className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Registration
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${intake.status === 'OPEN' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'}`}>
                  {intake.status}
                </div>
              </div>
              
              <div className="md:w-32 flex justify-end">
                 <Link to={`/courses`} className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] font-semibold transition-colors">
                    Enroll &rarr;
                 </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
