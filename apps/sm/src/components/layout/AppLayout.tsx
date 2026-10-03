import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen h-screen flex-col overflow-hidden md:flex-row bg-white text-slate-900">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
