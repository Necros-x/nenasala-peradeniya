import { Navbar } from "@/features/public/components/layout/Navbar";
import { Footer } from "@/features/public/components/layout/Footer";
import { RouteBaseProvider } from "@/lib/router-compat";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteBaseProvider base="">
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </div>
    </RouteBaseProvider>
  );
}
