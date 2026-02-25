import { Outlet } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";

export default function Layout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <Sidebar />

      <main className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto p-6">
        <div className="w-full min-w-0 max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
