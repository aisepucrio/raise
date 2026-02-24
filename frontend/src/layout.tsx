import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";

export default function Layout() {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6">
        <div className="max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
