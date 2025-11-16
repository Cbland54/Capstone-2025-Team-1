import { Routes, Route } from "react-router-dom";
import Selector from "./components/Selector";
import Scheduler from "./components/Scheduler";
import Media from "./components/Media";

function Home() {
  return (
    <div className="grid gap-2">
      <h2 className="text-xl font-display">FootWorks Widgets</h2>
      <p className="text-[var(--color-muted)]">
        Choose a widget to explore, or go directly to a URL:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <a
            className="text-[var(--color-brand-500)] underline"
            href="/selector"
          >
            /selector
          </a>{" "}
          – Online Shoe Selector
        </li>
        <li>
          <a
            className="text-[var(--color-brand-500)] underline"
            href="/scheduler"
          >
            /scheduler
          </a>{" "}
          – Smart Scheduler
        </li>
        <li>
          <a
            className="text-[var(--color-brand-500)] underline"
            href="/media"
          >
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
