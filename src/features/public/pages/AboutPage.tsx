"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { textMaskReveal, revealUp, staggerContainer, cardFadeUp, imageScaleReveal } from "../lib/motion";
import { Button } from "../components/ui/Button";
import { Counter } from "../components/ui/Counter";

export function AboutPage() {
  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 bg-[var(--color-surface)] border-b border-[var(--color-border)] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-widest mb-6"
           >
             About Us
           </motion.div>
           
           <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-8 mx-auto max-w-4xl">
             <span className="block overflow-hidden pb-2">
               <motion.span custom={0} variants={textMaskReveal} initial="hidden" animate="visible" className="block">Built Around</motion.span>
             </span>
             <span className="block overflow-hidden pb-2">
               <motion.span custom={1} variants={textMaskReveal} initial="hidden" animate="visible" className="block text-[var(--color-accent)]">Better Learning.</motion.span>
             </span>
           </h1>
           
           <motion.p
             variants={revealUp}
             initial="hidden"
             animate="visible"
             className="text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto mb-16"
           >
             We believe modern education should be practical, accessible, and designed for the exact world students are entering.
           </motion.p>
           
           <motion.div
             variants={imageScaleReveal}
             initial="hidden"
             animate="visible"
             className="relative aspect-video lg:aspect-[21/9] rounded-[var(--radius-xl)] overflow-hidden shadow-2xl mx-auto"
           >
             <img 
               src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2000" 
               alt="Campus collaboration"
               className="w-full h-full object-cover"
             />
           </motion.div>
        </div>
      </section>

      {/* Intro Story */}
      <section className="py-24 lg:py-32 bg-[var(--color-background)]">
         <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6 }}
               className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-8"
            >
               Education Has Changed.<br/>
               <span className="text-[var(--color-accent)]">The Way We Teach Should Too.</span>
            </motion.h2>
            <motion.p
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="text-xl text-[var(--color-text-secondary)] leading-relaxed"
            >
               Nenasala was founded on a simple premise: traditional education often leaves a gap between theoretical knowledge and practical application. We aim to bridge that gap by bringing industry tools, experienced professionals, and project-based learning into every single program we offer.
            </motion.p>
         </div>
      </section>

      {/* Split Editorial Story */}
      <section className="py-12 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center py-12">
              <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.8 }}
                 className="aspect-[4/5] rounded-[var(--radius-xl)] overflow-hidden shadow-lg"
              >
                 <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000" alt="Students in discussion" className="w-full h-full object-cover" />
              </motion.div>
              <div>
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-widest mb-4"
                 >
                   Our Story
                 </motion.div>
                 <motion.h3 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: 0.1 }}
                   className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-8"
                 >
                   It Started With<br/>A Simple Question.
                 </motion.h3>
                 <motion.div 
                   variants={staggerContainer}
                   initial="hidden"
                   whileInView="visible"
                   viewport={{ once: true }}
                   className="space-y-6 text-lg text-[var(--color-text-secondary)] leading-relaxed"
                 >
                    <motion.p variants={cardFadeUp}>
                       How do we prepare students not just to pass exams, but to actually succeed in modern workplaces?
                    </motion.p>
                    <motion.p variants={cardFadeUp}>
                       We realized that the best learning happens when students are challenged to solve real problems using the same tools they will use in their careers. 
                    </motion.p>
                    <motion.p variants={cardFadeUp}>
                       Today, we continue to evolve our curriculum alongside industry standards, ensuring that our graduates are always ready for what's next.
                    </motion.p>
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* Mission / Vision Typographic */}
      <section className="py-24 bg-[var(--color-primary)] text-[var(--color-static-white)]">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
               
               <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
               >
                  <div className="text-sm font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-4 border-b border-[var(--color-primary)]/35 pb-4">01 — Mission</div>
                  <h3 className="text-3xl sm:text-4xl font-bold leading-tight mt-8 mb-6">
                     To provide accessible, high-quality technical education that empowers individuals to build successful careers.
                  </h3>
               </motion.div>
               
               <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
               >
                  <div className="text-sm font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-4 border-b border-[var(--color-primary)]/35 pb-4">02 — Vision</div>
                  <h3 className="text-3xl sm:text-4xl font-bold leading-tight mt-8 mb-6">
                     To become the leading institution for practical, industry-aligned skills training in the region.
                  </h3>
               </motion.div>

            </div>
         </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[var(--color-background)]">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] mb-16 text-center"
            >
               What We Believe In
            </motion.h2>

            <motion.div 
               variants={staggerContainer}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 max-w-5xl mx-auto"
            >
               {[
                  { num: "01", title: "Practical Learning", desc: "Education should prepare students for real situations, not just theory." },
                  { num: "02", title: "Continuous Growth", desc: "Skills evolve, and our curriculum must evolve with them." },
                  { num: "03", title: "Student Focus", desc: "Every decision we make is centered around student outcomes and success." },
                  { num: "04", title: "Quality Excellence", desc: "We maintain the highest standards in our teaching, materials, and support." }
               ].map((value) => (
                  <motion.div key={value.num} variants={cardFadeUp} className="flex gap-6">
                     <div className="text-3xl font-bold text-[var(--color-border)]">{value.num}</div>
                     <div>
                        <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">{value.title}</h4>
                        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">{value.desc}</p>
                     </div>
                  </motion.div>
               ))}
            </motion.div>
         </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {[
                 { val: 1000, suffix: "+", label: "Students Taught" },
                 { val: 20, suffix: "+", label: "Active Programs" },
                 { val: 15, suffix: "+", label: "Expert Instructors" },
                 { val: 10, suffix: "+", label: "Years Excellence" }
              ].map((stat, i) => (
                 <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                 >
                    <div className="text-4xl sm:text-5xl font-extrabold text-[var(--color-primary)] mb-2">
                       <Counter value={stat.val} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{stat.label}</div>
                 </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Digital LMS Story */}
      <section className="py-24 bg-[var(--color-background)]">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
               <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-10 md:p-16 flex flex-col justify-center">
                     <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-6"
                     >
                        Learning Doesn't<br/>End In The Classroom.
                     </motion.h2>
                     <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8"
                     >
                        Our modern digital learning platform allows students to continue their journey anywhere. Track your progress, access course materials, submit assignments, and review recorded sessions through our unified Student Portal.
                     </motion.p>
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                     >
                        <Link to="/login">
                           <Button className="rounded-full px-8 py-6 text-base bg-[var(--color-accent)] text-[var(--color-static-white)] hover:bg-[var(--color-accent)]/90">
                              Explore Student Portal
                           </Button>
                        </Link>
                     </motion.div>
                  </div>
                  <div className="bg-[var(--color-surface-elevated)] min-h-[300px] relative overflow-hidden flex items-center justify-center p-12">
                     {/* Decorative UI representation */}
                     <div className="w-full max-w-md bg-[var(--color-static-white)] rounded-lg shadow-2xl border border-[var(--color-border)] overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="h-8 bg-[var(--color-surface-muted)] border-b flex items-center px-4 gap-2">
                           <div className="w-3 h-3 rounded-full bg-[var(--color-error)]"></div>
                           <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]"></div>
                           <div className="w-3 h-3 rounded-full bg-[var(--color-success)]"></div>
                        </div>
                        <div className="p-6 space-y-4">
                           <div className="h-4 bg-[var(--color-border)] rounded w-1/3"></div>
                           <div className="h-24 bg-[var(--color-primary-soft)] rounded border border-[var(--color-primary-muted)]"></div>
                           <div className="flex gap-4">
                              <div className="h-16 bg-[var(--color-surface-muted)] rounded w-1/2"></div>
                              <div className="h-16 bg-[var(--color-surface-muted)] rounded w-1/2"></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)] text-center px-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6">Ready To Start<br/>Your Next Chapter?</h2>
        <p className="text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto mb-10">Join thousands of students who have advanced their careers with us.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
           <Link to="/courses">
              <Button size="lg" className="rounded-full px-10 py-6 text-base bg-[var(--color-primary)] text-[var(--color-static-white)] w-full sm:w-auto">Explore Courses</Button>
           </Link>
           <Link to="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-10 py-6 text-base w-full sm:w-auto">Contact Us</Button>
           </Link>
        </div>
      </section>
    </div>
  );
}
