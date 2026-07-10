export default function ChatPanel() {
  return (
    <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col text-black">

      <h2 className="text-xl font-semibold mb-4">
        AI Chat
      </h2>


      <div className="flex-1 border rounded-lg p-4 bg-gray-50">
        <p className="text-gray-500">
          Ask questions about your document...
        </p>
      </div>


      <div className="mt-4 flex gap-2">

        <input
          type="text"
          placeholder="Ask something..."
          className="flex-1 border rounded-lg px-4 py-2 text-black placeholder-gray-400"
        />

        <button className="bg-gray-800 text-white px-5 rounded-lg py-2 hover:bg-gray-600">
          Send
        </button>

      </div>

    </div>
  );
}