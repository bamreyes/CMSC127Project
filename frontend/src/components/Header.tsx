import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

const Header = () => {
  const tabs = [
    { id: "drivers", label: "Drivers", path: "/drivers" },
    { id: "vehicles", label: "Vehicles", path: "/vehicles" },
    {
      id: "registrations",
      label: "Registrations",
      path: "/registrations",
    },
    {
      id: "violations",
      label: "Violations",
      path: "/violations",
    },
    { id: "reports", label: "Reports", path: "/reports" },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="px-8 py-5 flex items-center justify-between">
        <NavLink
          to="/"
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-xl bg-slate-50 border border-slate-150">
            <img
              src={logo}
              alt="LTO Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight">
              LTO Database Management System
            </h1>
            <p className="text-sm font-semibold text-blue-800">
              Department of Transportation
            </p>
          </div>
        </NavLink>

        <nav className="group flex items-center bg-slate-50/50 p-1 rounded-xl border border-slate-100 transition-all duration-300">
          {tabs.map((tab) => {
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center rounded-lg text-sm font-bold outline-none whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                    isActive
                      ? "bg-white text-blue-600 border border-slate-200 ring-1 ring-slate-50 px-4 py-2.5 max-w-[200px] mx-0.5 opacity-100"
                      : "border border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/50 px-0 py-2.5 max-w-0 mx-0 opacity-0 group-hover:max-w-[200px] group-hover:px-4 group-hover:mx-0.5 group-hover:opacity-100",
                  )
                }
              >
                {tab.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
