import { Routes, Route, NavLink } from "react-router-dom";
import Selector from "./components/Selector";
import Scheduler from "./components/Scheduler";
import Media from "./components/Media";

// Reusable nav pill using Tailwind + your utilities
const LinkItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "inline-flex items-center mr-2 px-3 py-2 rounded-[var(--radius-md)] no-underline border transition",
        "border-[var(--color-border)]",
        isActive
          ? "bg-[var(--color-brand-600)] text-white"
          : "text-[var(--color-text)] hover:bg-[color-mix(in_srgb,white_6%,transparent)]",
      ].join(" ")
    }
  >
    {children}
  </NavLink>
);

function Home() {
  return (
    <div className="grid gap-2">
      <h2 className="text-xl font-display">FootWorks Widgets</h2>
      <p className="text-[var(--color-muted)]">
        Choose a module from the nav above, or visit:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <a className="text-[var(--color-brand-500)] underline" href="/selector">
            /selector
          </a>{" "}
          – Online Shoe Selector
        </li>
        <li>
          <a className="text-[var(--color-brand-500)] underline" href="/scheduler">
            /scheduler
          </a>{" "}
          – Smart Scheduler
        </li>
        <li>
          <a className="text-[var(--color-brand-500)] underline" href="/media">
            /media
          </a>{" "}
          – Educational Media
        </li>
      </ul>
    </div>
  );
}

function NotFound() {
  return (
    <h2 className="text-xl font-display text-[var(--color-danger)]">
      404 – Page Not Found
    </h2>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_85%,transparent)]">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-2xl font-display">Capstone 2025 Team 1 – FootWorks Widgets</h1>
          {/* Top navigation */}
          <nav className="mt-3">
            <LinkItem to="/">Home</LinkItem>
            <LinkItem to="/selector">Selector</LinkItem>
            <LinkItem to="/scheduler">Scheduler</LinkItem>
            <LinkItem to="/media">Media</LinkItem>
          </nav>
        </div>
      </header>

      {/* Routes */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/selector" element={<Selector />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/media" element={<Media />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
