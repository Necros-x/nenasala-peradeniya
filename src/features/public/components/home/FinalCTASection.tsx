"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function FinalCTASection() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--color-background)] px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl rounded-[var(--radius-xl)] bg-[var(--color-primary)] overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-dark)] to-[var(--color-brand-dark)]" />
        {/* Subtle decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 px-6 py-16 sm:py-24 lg:px-16 text-center">
          <motion.h2
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-static-white)] mb-6"
          >
            Your Next Skill<br />Starts Here.
          </motion.h2>
          
          <motion.p
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.3 }}
             className="text-xl text-[var(--color-primary-muted)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Explore industry-focused programs and begin learning through our modern platform.
          </motion.p>
          
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.4 }}
             className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/courses">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-base bg-[var(--color-static-white)] text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] border-none">
                Explore Courses
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-base border-[var(--color-primary-muted)] text-[var(--color-static-white)] hover:bg-[var(--color-primary)]/20">
                Student Login
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
