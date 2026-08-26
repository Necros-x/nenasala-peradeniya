"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses } from "../lib/mock-data";
import { Course } from "../types";
import { CourseCard } from "../components/courses/CourseCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Search, SlidersHorizontal, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { textMaskReveal, revealUp, staggerContainer, cardFadeUp } from "../lib/motion";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    getCourses().then(setCourses);
  }, []);

  const categories = Array.from(new Set(courses.map(c => c.category)));

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? course.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-widest mb-6"
              >
                Our Programs
              </motion.div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-8">
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={0} variants={textMaskReveal} initial="hidden" animate="visible" className="block">Find The Skills</motion.span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={1} variants={textMaskReveal} initial="hidden" animate="visible" className="block">That Move You</motion.span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <motion.span custom={2} variants={textMaskReveal} initial="hidden" animate="visible" className="block text-[var(--color-accent)]">Forward.</motion.span>
                </span>
              </h1>
              
              <motion.p
                variants={revealUp}
                initial="hidden"
                animate="visible"
                className="text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-lg"
              >
                From networking and cybersecurity to AI and modern technology, discover courses designed for practical learning and real-world careers.
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="relative aspect-square lg:aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" 
                alt="Students collaborating"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Course Search & Filtering */}
      <section className="py-6 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Desktop Filter Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
              </div>
              <Input
                type="text"
                placeholder="Search programs..."
                className="pl-9 py-3 rounded-full bg-[var(--color-background)] border-[var(--color-border)] focus:ring-[var(--color-accent)] text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Mobile Filter Toggle */}
            <div className="md:hidden">
              <Button 
                variant="outline" 
                className="w-full rounded-full py-3 flex items-center justify-center gap-2 text-base"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showMobileFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {/* Desktop Categories */}
            <div className="hidden md:flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCategory === null
                    ? "bg-[var(--color-primary)] text-[var(--color-static-white)]"
                    : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === category
                      ? "bg-[var(--color-primary)] text-[var(--color-static-white)]"
                      : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Categories (Collapsible) */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden mt-4 overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-4 pb-2 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                      selectedCategory === null
                        ? "bg-[var(--color-primary)] text-[var(--color-static-white)]"
                        : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    }`}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                        selectedCategory === category
                          ? "bg-[var(--color-primary)] text-[var(--color-static-white)]"
                          : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCourses.length > 0 ? (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
            >
              {/* Optional: We could make the first course take 2 cols if we wanted a featured course, but a balanced grid works well here too. */}
              {filteredCourses.map((course, index) => (
                <motion.div key={course.id} variants={cardFadeUp} className={index === 0 && filteredCourses.length > 3 ? "md:col-span-2 lg:col-span-2" : ""}>
                   <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)]"
            >
              <BookOpen className="mx-auto h-16 w-16 text-[var(--color-text-muted)] mb-6 opacity-50" />
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">No programs found.</h3>
              <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
                Try adjusting your search terms or filters to find the right learning path.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                className="rounded-full px-8 py-6 text-base"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                }}
              >
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-[var(--color-primary)] text-[var(--color-static-white)]">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div>
                  <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                     Not Sure Which<br/>Course Is For You?
                  </h2>
                  <p className="text-xl text-[var(--color-primary-muted)] max-w-md leading-relaxed mb-10">
                     Talk to our academic advisors and we'll help you find the right learning path for your career goals.
                  </p>
                  <Link to="/contact">
                     <Button size="lg" className="rounded-full px-8 py-6 text-base bg-[var(--color-static-white)] text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] border-none">
                        Contact Us Today
                     </Button>
                  </Link>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
