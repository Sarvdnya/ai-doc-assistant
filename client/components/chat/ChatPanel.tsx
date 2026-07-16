"use client";

import { useRef, useState } from "react";
import { askQuestion } from "@/src/services/chat.service";
import type { Source } from "@/src/services/chat.service";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

let messageIdCounter = 0;

function nextId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");

    const userMessage: Message = {
      id: nextId(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    setTimeout(scrollToBottom, 50);

    try {
      const data = await askQuestion(question);

      const assistantMessage: Message = {
        id: nextId(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: nextId(),
        role: "assistant",
        content: "Something went wrong.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleSend();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col text-black">
      <h2 className="text-xl font-semibold mb-4">AI Chat</h2>

      <div className="flex-1 border rounded-lg p-4 bg-gray-50 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-8">
            Ask questions about your document...
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] whitespace-pre-wrap shadow-sm">
                  {msg.content}
                </div>
              </div>
            )}

            {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
              <div className="mt-1.5 ml-2">
                <p className="text-xs text-gray-400 font-medium mb-1">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((src, i) => (
                    <span
                      key={i}
                      className="text-xs text-gray-500 bg-gray-100 rounded-md px-2 py-0.5 truncate max-w-[200px]"
                      title={`${src.filename} — Page ${src.pageNumber}`}
                    >
                      📄 {src.filename} — Page {src.pageNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <span className="text-gray-400 text-sm">Typing</span>
              <span className="inline-flex ml-1">
                <span className="animate-bounce mx-[1px] size-1.5 bg-gray-400 rounded-full [animation-delay:0ms]" />
                <span className="animate-bounce mx-[1px] size-1.5 bg-gray-400 rounded-full [animation-delay:150ms]" />
                <span className="animate-bounce mx-[1px] size-1.5 bg-gray-400 rounded-full [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          disabled={loading}
          className="flex-1 border rounded-lg px-4 py-2 text-black placeholder-gray-400 disabled:opacity-50"
        />

        <button
          onClick={() => void handleSend()}
          disabled={loading || !input.trim()}
          className="bg-gray-800 text-white px-5 rounded-lg py-2 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
