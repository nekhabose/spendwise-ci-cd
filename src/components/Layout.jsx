import { NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Categories", to: "/categories" },
  { label: "Summary", to: "/summary" },
  { label: "About", to: "/about" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">SpendWise Collective</p>
          <h1>Community Finance Studio</h1>
        </div>

        <nav aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "is-active" : ""}`
              }
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

    </div>
  );
}
