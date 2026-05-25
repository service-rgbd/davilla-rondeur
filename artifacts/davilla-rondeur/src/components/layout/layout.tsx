import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 relative z-0">{children}</main>
      <Footer />
    </div>
  );
}
