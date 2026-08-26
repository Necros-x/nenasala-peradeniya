"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Course } from "../../types";
import { staggerContainer, cardFadeUp } from "../../lib/motion";

export function FeaturedCoursesSection({ courses }: { courses: Course[] }) {
  return (
    <section className="py-24 bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-3">
              Popular Programs.
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-xl">
              Structured modern sections with balanced spacing, smooth visuals, and clean layouts.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to="/courses"
              className="inline-flex items-center text-[var(--color-accent)] font-semibold hover:opacity-80 transition-opacity"
            >
              View All Courses &rarr;
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {courses.map((course) => (
            <motion.div key={course.id} variants={cardFadeUp}>
              <Link
                to={`/courses/${course.slug}`}
                className="group block h-full bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-3 border border-[var(--color-border)] shadow-sm hover:-translate-y-2 hover:shadow-md transition-all duration-300"
              >
                <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-border)] mb-5">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-text-strong)] to-[var(--color-brand-dark)] text-[var(--color-static-white)] font-extrabold tracking-widest text-2xl">
                      {course.category.substring(0, 3).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="px-3 pb-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-widest mb-3">
                    {course.category}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-accent)] transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-text-muted)]">
                    {course.duration && <span>{course.duration}</span>}
                    {course.duration && course.level && <span>•</span>}
                    {course.level && <span>{course.level}</span>}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
