"use client";

import { useState, useEffect } from "react";
import { getFeaturedCourses } from "../lib/mock-data";
import { Course } from "../types";
import { HeroSection } from "../components/home/HeroSection";
import { IntroSection } from "../components/home/IntroSection";
import { FeaturedCoursesSection } from "../components/home/FeaturedCoursesSection";
import { ImmersiveLearningSection } from "../components/home/ImmersiveLearningSection";
import { WhyChooseUsSection } from "../components/home/WhyChooseUsSection";
import { LearningJourneySection } from "../components/home/LearningJourneySection";
import { InstructorSpotlightSection } from "../components/home/InstructorSpotlightSection";
import { UpcomingIntakesSection } from "../components/home/UpcomingIntakesSection";
import { TestimonialsSection } from "../components/home/TestimonialsSection";
import { FinalCTASection } from "../components/home/FinalCTASection";

export function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);

  useEffect(() => {
    getFeaturedCourses().then(setFeaturedCourses);
  }, []);

  return (
    <div className="flex flex-col w-full bg-[var(--color-background)]">
      <HeroSection />
      <IntroSection />
      <FeaturedCoursesSection courses={featuredCourses} />
      <ImmersiveLearningSection />
      <WhyChooseUsSection />
      <LearningJourneySection />
      <InstructorSpotlightSection />
      <UpcomingIntakesSection />
      <TestimonialsSection />
      <FinalCTASection />
    </div>
  );
}
