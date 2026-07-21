"use client";
import { useState, createContext, useContext, useEffect } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface SidebarContextType {
  expanded: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: false,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setExpanded(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <ThemeProvider>
      <SidebarContext.Provider
        value={{ expanded, toggle: () => setExpanded((e) => !e) }}
      >
        <div className="flex h-screen overflow-hidden bg-[var(--bg-background)]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </ThemeProvider>
  );
}
