import {
  FileText,
  Upload,
  MessageSquare,
  Folder,
  Settings,
  Moon,
  User,
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
    <aside 
      className="
      w-64 
      h-screen 
      bg-zinc-900 
      text-white 
      p-5 
      border-r 
      border-zinc-800
      flex
      flex-col
      "
    >

      {/* Logo */}

      <div className="mb-8">

        <h1 className="text-2xl font-bold">
          AI Docs
        </h1>

        <p className="text-sm text-zinc-400 mt-1">
          Knowledge Workspace
        </p>

      </div>



      {/* Navigation */}

      <nav className="space-y-2 flex-1">

        {menu.map((item) => (

          <button
            key={item.label}
            className="
            flex 
            items-center 
            gap-3 
            w-full 
            px-4 
            py-3 
            rounded-lg 
            text-zinc-300
            hover:bg-zinc-800
            hover:text-white
            transition
            "
          >

            <item.icon size={20} />

            <span>
              {item.label}
            </span>

          </button>

        ))}


      </nav>



      {/* Bottom Section */}

      <div className="border-t border-zinc-800 pt-4 space-y-3">


        {/* Dark Mode */}

        <button
          className="
          flex
          items-center
          gap-3
          w-full
          px-4
          py-3
          rounded-lg
          text-zinc-300
          hover:bg-zinc-800
          transition
          "
        >

          <Moon size={20}/>

          <span>
            Dark Mode
          </span>

        </button>



        {/* User */}

        <div
          className="
          flex
          items-center
          gap-3
          bg-zinc-800
          rounded-lg
          p-3
          "
        >

          <User size={24}/>


          <div>

            <p className="font-medium">
              SARVDNYA
            </p>


            <p className="text-xs text-zinc-400">
              Free Plan
            </p>

          </div>


        </div>


      </div>


    </aside>
  );
}