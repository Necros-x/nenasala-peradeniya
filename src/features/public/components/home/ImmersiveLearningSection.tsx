"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function ImmersiveLearningSection() {
  return (
    <section className="relative py-32 lg:py-48 overflow-hidden bg-[var(--color-brand-dark)]">
      {/* Background Image with Parallax-like effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        viewport={{ once: true }}
        className="absolute inset-0 z-0"
      >
        <img
          src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=2000"
          alt="Immersive Learning"
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-dark)]/90 via-[var(--color-brand-dark)]/60 to-transparent" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex text-xs font-bold tracking-widest text-[var(--color-secondary)] mb-6 uppercase px-4 py-1.5 rounded-full bg-[var(--color-brand-dark)]/55 backdrop-blur-sm border border-[var(--color-primary-muted)]/20"
          >
            Premium Learning Experience
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-static-white)] leading-tight mb-6"
          >
            Education That
            <br />
            <span className="text-[var(--color-secondary)]">Feels</span> Inspiring.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-[var(--color-on-brand)]/75 mb-10 max-w-xl leading-relaxed"
          >
            Clean aesthetics combined with modern layouts, strong typography, and smooth premium website composition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to="/courses">
              <Button size="lg" className="rounded-full px-8 py-6 text-base bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-static-white)] border-none">
                Explore Courses
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
