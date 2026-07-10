"use client";

import {
  FileText,
  Upload,
  MessageSquare,
  BookOpen,
  Star,
  Settings,
  Moon,
  User
} from "lucide-react";


const menuItems = [
  {
    name: "Documents",
    icon: FileText,
  },
  {
    name: "Upload",
    icon: Upload,
  },
  {
    name: "AI Chat",
    icon: MessageSquare,
  },
  {
    name: "Notebooks",
    icon: BookOpen,
  },
  {
    name: "Favorites",
    icon: Star,
  },
];


export default function Sidebar() {

  return (
    <aside className="h-screen w-64 bg-white border-r p-5 flex flex-col">

      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-xl font-bold">
          AI Workspace
        </h1>
        <p className="text-sm text-gray-500">
          Document Intelligence
        </p>
      </div>


      {/* Menu */}
      <nav className="space-y-2 flex-1">

        {menuItems.map((item)=>{

          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className="
              w-full
              flex
              items-center
              gap-3
              px-3
              py-2
              rounded-lg
              text-gray-700
              hover:bg-gray-100
              transition
              "
            >

              <Icon size={20}/>

              <span>
                {item.name}
              </span>

            </button>
          )

        })}


        <button
        className="
        w-full
        flex
        items-center
        gap-3
        px-3
        py-2
        rounded-lg
        hover:bg-gray-100
        "
        >

          <Settings size={20}/>
          Settings

        </button>


      </nav>


      {/* Bottom Section */}
      <div className="border-t pt-4 space-y-3">


        <button
        className="
        flex
        items-center
        gap-3
        px-3
        py-2
        w-full
        rounded-lg
        hover:bg-gray-100
        "
        >

          <Moon size={20}/>
          Dark Mode

        </button>



        <div
        className="
        flex
        items-center
        gap-3
        p-3
        rounded-lg
        bg-gray-100
        "
        >

          <User size={25}/>

          <div>
            <p className="font-medium">
              Sarvdnya
            </p>

            <p className="text-xs text-gray-500">
              Free Plan
            </p>
          </div>


        </div>


      </div>


    </aside>
  );
}