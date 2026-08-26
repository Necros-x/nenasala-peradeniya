"use client";

import { motion } from "framer-motion";

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--color-surface)] border-t border-[var(--color-border)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-24 items-center">
          
          <div className="flex flex-col">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-12"
            >
              Student<br/>Results.
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-8 lg:p-10 bg-[var(--color-surface-muted)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-sm"
            >
              <div className="text-4xl text-[var(--color-accent)] opacity-20 font-serif absolute top-6 left-6">"</div>
              <p className="text-xl lg:text-2xl text-[var(--color-text-primary)] leading-relaxed relative z-10 font-medium mb-8">
                The structured curriculum and expert mentorship completely transformed my understanding of full-stack development. I landed my first tech role within two months of completing the program.
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" alt="Student profile" className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h4 className="font-bold text-[var(--color-text-primary)]">Elena Rodriguez</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">Full-Stack Graduate, 2023</p>
                 </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full aspect-square md:aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden shadow-md"
          >
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200"
              alt="Students collaborating"
              className="w-full h-full object-cover"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
