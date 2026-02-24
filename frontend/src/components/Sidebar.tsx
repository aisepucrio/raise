import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-semibold underline" : "opacity-80 hover:opacity-100";

export default function Sidebar() {
  return (
    <aside className="sidebar-divider shrink-0 border-b-2 p-6 md:min-h-dvh md:w-64 md:border-r-2 md:border-b-0">
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide opacity-70">
            Dataminer
          </p>
        </div>

        <nav className="flex flex-wrap gap-4 md:flex-col md:gap-2">
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
      </div>
    </aside>
  );
}
