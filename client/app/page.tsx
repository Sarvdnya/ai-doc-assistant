import AppLayout from "@/components/layout/AppLayout";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold">PDF Viewer</h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold">AI Chat</h2>
        </div>
      </div>
    </AppLayout>
  );
}