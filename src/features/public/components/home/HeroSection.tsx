"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { textMaskReveal, revealUp, imageScaleReveal } from "../../lib/motion";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-background)] pt-32 pb-16 lg:pt-40 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
          {/* Content Column */}
          <div className="flex flex-col relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center self-start px-3 py-1 mb-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-sm font-semibold tracking-wide"
            >
              Practical Learning for Digital Careers
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-primary)] leading-[1.1] mb-6">
              <div className="overflow-hidden pb-2">
                <motion.span
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  variants={textMaskReveal}
                  className="block text-[var(--color-accent)]"
                >
                  Learn Smarter.
                </motion.span>
              </div>
              <div className="overflow-hidden pb-2">
                <motion.span
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  variants={textMaskReveal}
                  className="block"
                >
                  Build Skills.
                </motion.span>
              </div>
              <div className="overflow-hidden pb-2">
                <motion.span
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  variants={textMaskReveal}
                  className="block"
                >
                  Create Your Future.
                </motion.span>
              </div>
            </h1>

            <motion.p
              variants={revealUp}
              initial="hidden"
              animate="visible"
              className="text-lg sm:text-xl text-[var(--color-text-secondary)] mb-10 max-w-lg leading-relaxed"
            >
              Build practical technology and creative skills through guided courses, structured lessons and hands-on learning at Nenasala Peradeniya.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/courses">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-base">
                  Explore Courses
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full px-8 py-6 text-base shadow-sm">
                  About Nenasala
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Visual Column */}
          <div className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px] mt-8 lg:mt-0">
            {/* Main Image */}
            <motion.div
              variants={imageScaleReveal}
              initial="hidden"
              animate="visible"
              className="absolute top-0 right-0 w-4/5 h-[85%] rounded-[var(--radius-xl)] overflow-hidden shadow-2xl z-0 border-8 border-[var(--color-surface)]"
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"
                alt="Students collaborating"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Layered Image / Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotate: 2, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-10 left-0 w-3/5 md:w-1/2 aspect-square rounded-[var(--radius-xl)] overflow-hidden shadow-xl z-10 border-8 border-[var(--color-surface)] bg-[var(--color-surface)]"
            >
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800"
                alt="Focused student"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-static-black)]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-[var(--color-static-white)]">
                <div className="flex gap-6">
                  <div>
                    <div className="text-xl font-extrabold tracking-tight">Hands-on</div>
                    <div className="text-sm font-medium opacity-80">Learn by doing</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold tracking-tight">Guided</div>
                    <div className="text-sm font-medium opacity-80">Stay on track</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
