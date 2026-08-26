"use client";

import { motion } from "framer-motion";

const items = [
  {
    num: "01",
    title: "Industry Relevant",
    desc: "Practical learning designed around modern skills that employers actively seek in today's digital landscape.",
  },
  {
    num: "02",
    title: "Expert Guidance",
    desc: "Learn directly from experienced professionals who have spent years mastering their craft in the real world.",
  },
  {
    num: "03",
    title: "Flexible Learning",
    desc: "Access premium educational content wherever you are, whenever you need it, on any device.",
  },
  {
    num: "04",
    title: "Track Your Progress",
    desc: "A modern LMS keeps your learning organized, providing clear insights into your educational journey.",
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24">
          {/* Header Column */}
          <div className="flex flex-col">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-6 sticky top-32"
            >
              Why Learn
              <br />
              With Us.
            </motion.h2>
          </div>

          {/* List Column */}
          <div className="flex flex-col">
            {items.map((item, index) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-6 sm:gap-12 py-10 border-b border-[var(--color-border)] last:border-0"
              >
                <div className="text-2xl font-bold text-[var(--color-text-muted)] font-mono">
                  {item.num}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                    {item.title}
                  </h3>
                  <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
