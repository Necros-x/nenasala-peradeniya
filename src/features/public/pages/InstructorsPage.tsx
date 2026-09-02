"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { textMaskReveal, revealUp, staggerContainer, cardFadeUp, imageScaleReveal } from "../lib/motion";
import { Button } from "../components/ui/Button";
import { ArrowRight } from "lucide-react";
import { Counter } from "../components/ui/Counter";

const MOCK_INSTRUCTORS = [
  { id: 2, name: "David Chen", role: "Senior UX Researcher", exp: "UI/UX Design", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800" },
  { id: 3, name: "Amara Singh", role: "Cloud Architect", exp: "AWS • Azure", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" },
  { id: 4, name: "Marcus Johnson", role: "Security Engineer", exp: "Cyber Security", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800" },
  { id: 5, name: "Elena Rodriguez", role: "Frontend Lead", exp: "React • TypeScript", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800" },
];

export function InstructorsPage() {
  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 bg-[var(--color-surface)] border-b border-[var(--color-border)] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24 items-center">
            
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-widest mb-6"
              >
                Meet Your Lecturers
              </motion.div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-8">
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={0} variants={textMaskReveal} initial="hidden" animate="visible" className="block">Learn From</motion.span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={1} variants={textMaskReveal} initial="hidden" animate="visible" className="block">People Who</motion.span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={2} variants={textMaskReveal} initial="hidden" animate="visible" className="block text-[var(--color-accent)]">Know The Field.</motion.span>
                </span>
              </h1>
              
              <motion.p
                variants={revealUp}
                initial="hidden"
                animate="visible"
                className="text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-md"
              >
                Experienced professionals. Practical knowledge. Real guidance.
              </motion.p>
            </div>

            <motion.div
              variants={imageScaleReveal}
              initial="hidden"
              animate="visible"
              className="relative aspect-[4/5] rounded-[var(--radius-xl)] overflow-hidden shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200" 
                alt="Lecturer in a classroom"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Intro Philosophy */}
      <section className="py-24 bg-[var(--color-background)]">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6 }}
               className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6"
            >
               More Than<br/>Just Lecturers.
            </motion.h2>
            <motion.p
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed"
            >
               Our lecturers combine technical knowledge with practical experience to help students understand how skills are applied beyond the classroom.
            </motion.p>
         </div>
      </section>

      {/* Featured Instructor */}
      <section className="py-12 bg-[var(--color-background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.6 }}
             className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm"
          >
             <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr]">
                <div className="aspect-square md:aspect-auto relative overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1580894732444-8ecbef79c139?auto=format&fit=crop&q=80&w=1000" alt="Sarah Jenkins" className="w-full h-full object-cover" />
                </div>
                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                   <div className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-widest mb-4">Lead Lecturer</div>
                   <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-4">Sarah Jenkins</h3>
                   <div className="flex flex-wrap gap-2 mb-8">
                      <span className="px-3 py-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-full text-sm font-bold text-[var(--color-text-secondary)]">Web Development</span>
                      <span className="px-3 py-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-full text-sm font-bold text-[var(--color-text-secondary)]">Software Engineering</span>
                   </div>
                   <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8">
                      With over 12 years of experience building scalable enterprise applications, Sarah brings real-world architecture patterns directly into her curriculum. She previously served as Lead Developer at TechFlow before dedicating her time to education.
                   </p>
                   <div>
                      <Button variant="outline" className="rounded-full px-8">View Profile</Button>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Instructor Grid */}
      <section className="py-16 lg:py-24 bg-[var(--color-background)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {MOCK_INSTRUCTORS.map((instructor) => (
              <motion.div 
                key={instructor.id} 
                variants={cardFadeUp}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--color-surface-elevated)] border border-[var(--color-border)] mb-6 shadow-sm relative">
                  <img 
                    src={instructor.img} 
                    alt={instructor.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-[var(--color-static-black)]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <span className="text-[var(--color-static-white)] font-semibold flex items-center gap-2">View Profile <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors">{instructor.name}</h4>
                  <p className="text-[var(--color-text-secondary)] font-medium mb-3">{instructor.role}</p>
                  <p className="text-sm font-bold text-[var(--color-text-muted)] tracking-wider uppercase">{instructor.exp}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats & Philosophy */}
      <section className="py-24 bg-[var(--color-surface)] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           
           {/* Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-[var(--color-border)] pb-24 mb-24">
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6 }}
              >
                 <div className="text-6xl sm:text-7xl font-extrabold text-[var(--color-primary)] mb-4"><Counter value={10} suffix="+" /></div>
                 <div className="text-xl font-bold text-[var(--color-text-primary)]">Expert Lecturers</div>
              </motion.div>
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6, delay: 0.1 }}
              >
                 <div className="text-6xl sm:text-7xl font-extrabold text-[var(--color-primary)] mb-4"><Counter value={20} suffix="+" /></div>
                 <div className="text-xl font-bold text-[var(--color-text-primary)]">Professional Certifications</div>
              </motion.div>
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6, delay: 0.2 }}
              >
                 <div className="text-6xl sm:text-7xl font-extrabold text-[var(--color-primary)] mb-4"><Counter value={80} suffix="+" /></div>
                 <div className="text-xl font-bold text-[var(--color-text-primary)]">Years Combined Experience</div>
              </motion.div>
           </div>

           {/* Philosophy Split */}
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-center">
              <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.8 }}
                 className="aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden shadow-lg order-2 lg:order-1"
              >
                 <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200" alt="Lecturer teaching" className="w-full h-full object-cover" />
              </motion.div>
              
              <div className="order-1 lg:order-2">
                 <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-8"
                 >
                    Teaching Beyond<br/>The Textbook.
                 </motion.h2>
                 
                 <motion.ul 
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="space-y-6"
                 >
                    {[
                       "Practical examples drawn from recent industry projects.",
                       "Industry insight on modern tools and methodologies.",
                       "Individual guidance and mentorship throughout the course."
                    ].map((item, i) => (
                       <motion.li key={i} variants={cardFadeUp} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-static-white)] flex items-center justify-center mt-1 shrink-0">
                             <span className="text-xs font-bold">✓</span>
                          </div>
                          <span className="text-lg text-[var(--color-text-secondary)] font-medium leading-relaxed">{item}</span>
                       </motion.li>
                    ))}
                 </motion.ul>
              </div>
           </div>
           
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--color-background)] border-t border-[var(--color-border)] text-center px-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6">Learn Directly From<br/>Industry Professionals.</h2>
        <p className="text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto mb-10">Discover our programs and start learning from the best.</p>
        <Link to="/courses">
           <Button size="lg" className="rounded-full px-10 py-6 text-base bg-[var(--color-primary)] text-[var(--color-static-white)]">Explore Courses</Button>
        </Link>
      </section>
    </div>
  );
}
