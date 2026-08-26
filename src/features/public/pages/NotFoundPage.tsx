"use client";

import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-24 text-center">
      <h2 className="text-5xl font-bold text-[var(--color-primary)] mb-4">404</h2>
      <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Page Not Found</h3>
      <p className="text-[var(--color-text-secondary)] mb-8">Sorry, we couldn't find the page you're looking for.</p>
      <div className="flex gap-4">
        <Link to="/">
          <Button>Return Home</Button>
        </Link>
        <Link to="/courses">
          <Button variant="outline">Explore Courses</Button>
        </Link>
      </div>
    </div>
  );
}
