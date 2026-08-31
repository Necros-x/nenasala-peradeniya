import { Navbar } from "@/features/public/components/layout/Navbar";
import { Footer } from "@/features/public/components/layout/Footer";
import { RouteBaseProvider } from "@/lib/router-compat";
import { PageTransition } from "@/components/motion/PageTransition";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteBaseProvider base="">
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <main className="flex flex-grow flex-col">
          <PageTransition className="flex flex-1 flex-col">{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </RouteBaseProvider>
  );
}
