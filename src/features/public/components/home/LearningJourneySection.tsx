"use client";

import { motion } from "framer-motion";

const steps = [
  { title: "Explore", desc: "Choose the course that fits your goal." },
  { title: "Enroll", desc: "Join an available intake." },
  { title: "Learn", desc: "Attend classes and follow your lessons." },
  { title: "Practice", desc: "Use materials, recordings and activities." },
  { title: "Complete", desc: "Finish the required assessments." },
  { title: "Get Certified", desc: "Receive your credential when eligible." },
];

export function LearningJourneySection() {
  return (
    <section className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]"
          >
            Your Learning Journey
          </motion.h2>
        </div>

        <div className="relative">
          {/* Desktop connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-[var(--color-border)] -translate-y-1/2 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               whileInView={{ width: "100%" }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
               className="h-full bg-[var(--color-accent)]"
             />
          </div>

          <div className="flex flex-col lg:flex-row justify-between relative z-10 gap-8 lg:gap-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
                className="flex lg:flex-col items-center lg:items-center text-left lg:text-center group"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] border-2 border-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-text-secondary)] mb-0 lg:mb-4 group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] group-hover:scale-110 transition-all duration-300 z-10">
                  {i + 1}
                </div>
                <div className="ml-6 lg:ml-0">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] hidden sm:block">
                    {step.desc}
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
