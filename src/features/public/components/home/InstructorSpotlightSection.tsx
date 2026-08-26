"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function InstructorSpotlightSection() {
  return (
    <section className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden shadow-sm order-2 lg:order-1"
          >
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200"
              alt="Instructor leading a session"
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          <div className="flex flex-col order-1 lg:order-2">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-6"
            >
              Meet Your Mentors
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-lg leading-relaxed"
            >
              Learn directly from experienced professionals who bring real-world industry expertise directly into the classroom.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6 mb-10 border-l-2 border-[var(--color-border)] pl-6"
            >
               <div>
                  <h4 className="text-lg font-bold text-[var(--color-text-primary)]">Sarah Jenkins</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">Lead Developer, TechFlow • Web Development</p>
               </div>
               <div>
                  <h4 className="text-lg font-bold text-[var(--color-text-primary)]">David Chen</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">Senior UX Researcher • UI/UX Design</p>
               </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to="/instructors">
                <Button variant="outline" className="rounded-full px-8 py-6 text-base">
                  Meet The Team
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
