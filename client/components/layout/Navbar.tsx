export default function Navbar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8">
      <input
        type="text"
        placeholder="Search documents..."
        className="w-80 border rounded-lg px-4 py-2"
      />

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-300"></div>
      </div>
    </header>
  );
}