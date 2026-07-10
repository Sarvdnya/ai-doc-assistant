import {
  FileText,
  Upload,
  MessageSquare,
  Folder,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const menu = [
    { icon: FileText, label: "Documents" },
    { icon: Upload, label: "Upload" },
    { icon: MessageSquare, label: "Chats" },
    { icon: Folder, label: "Collections" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-64 h-screen bg-zinc-900 text-white p-5 border-r border-zinc-800">
      <h1 className="text-2xl font-bold mb-8">
        AI Docs
      </h1>

      <nav className="space-y-2">
        {menu.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-zinc-800 transition"
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}