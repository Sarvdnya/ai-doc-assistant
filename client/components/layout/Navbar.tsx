"use client";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 h-16 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] flex items-center justify-between px-6">
      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search documents..."
          className="w-full pl-9 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--hover-border)] transition-all"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--hover-border)] transition-all">
          <Bell size={18} />
        </button>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
          }}
        >
          <span className="text-white text-xs font-semibold">S</span>
        </div>
      </div>
    </header>
  );
}
