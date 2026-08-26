"use client";

import { motion } from "framer-motion";

export function IntroSection() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--color-surface)] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square rounded-[var(--radius-xl)] overflow-hidden shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1571260899304-42507011bb6b?auto=format&fit=crop&q=80&w=1200"
              alt="Modern campus"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Content Column */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex text-sm font-semibold tracking-wide text-[var(--color-accent)] mb-6 uppercase"
            >
              Modern Education
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-8"
            >
              Built For The
              <br />
              Next Generation.
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: "60px" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-1 bg-[var(--color-accent)] rounded-full mb-8"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg text-[var(--color-text-secondary)] mb-12 max-w-lg leading-relaxed"
            >
              Designed with smooth visual flow, modern spacing, minimal layouts, and
              premium educational branding that feels completely different from
              ordinary coaching websites.
            </motion.p>

            <div className="grid grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-4xl font-extrabold text-[var(--color-primary)] mb-2">120+</div>
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">Expert Mentors</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-4xl font-extrabold text-[var(--color-primary)] mb-2">35+</div>
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">Advanced Programs</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
