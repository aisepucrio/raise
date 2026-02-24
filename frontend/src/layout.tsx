import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-semibold underline" : "opacity-80 hover:opacity-100";

export default function Layout() {
  return (
    <div className="min-h-dvh p-6">
      <header className="mb-6 space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide opacity-70">
            Dataminer
          </p>
        </div>

        <nav className="flex flex-wrap gap-4">
          <NavLink to="/" end className={linkClass}>
            Overview
          </NavLink>
          <NavLink to="/collect" className={linkClass}>
            Collect
          </NavLink>
          <NavLink to="/jobs" className={linkClass}>
            Jobs
          </NavLink>
          <NavLink to="/preview" className={linkClass}>
            Preview
          </NavLink>
        </nav>
      </header>

      <main className="max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
