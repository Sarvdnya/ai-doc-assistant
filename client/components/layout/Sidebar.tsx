"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  MessageSquare,
  Folder,
  ChevronLeft,
  ChevronRight,
  Moon,
  User,
} from "lucide-react";
import { useSidebar } from "./AppLayout";

export default function Sidebar() {
  const { expanded, toggle } = useSidebar();
  const [activeItem, setActiveItem] = useState("Documents");

  const menuItems = [
    { icon: FileText, label: "Documents" },
    { icon: Upload, label: "Upload" },
    { icon: MessageSquare, label: "Chats" },
    { icon: Folder, label: "Collections" },
  ];

  return (
    <motion.aside
      animate={{ width: expanded ? 260 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-[var(--sidebar-bg)] backdrop-blur-xl border-r border-[var(--border-color)] flex flex-col flex-shrink-0 overflow-hidden z-50"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
            }}
          >
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <motion.span
            animate={{ opacity: expanded ? 1 : 0 }}
            className="text-[var(--text-primary)] font-semibold text-sm whitespace-nowrap"
          >
            AI Studio
          </motion.span>
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeItem === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "text-[var(--text-primary)] border border-[rgba(var(--color-primary-rgb),0.3)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                }
              `}
              style={
                isActive
                  ? { backgroundColor: `rgba(var(--color-primary-rgb), 0.15)` }
                  : {}
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <motion.span
                animate={{
                  opacity: expanded ? 1 : 0,
                  width: expanded ? "auto" : 0,
                }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[var(--border-color)] space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all duration-200 group">
          <Moon size={20} className="flex-shrink-0" />
          <motion.span
            animate={{
              opacity: expanded ? 1 : 0,
              width: expanded ? "auto" : 0,
            }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            Dark Mode
          </motion.span>
        </button>

        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: "var(--hover-bg)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
            }}
          >
            <User size={16} className="text-white" />
          </div>
          <motion.div
            animate={{ opacity: expanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">
              SARVDNYA
            </p>
            <p className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
              Free Plan
            </p>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
