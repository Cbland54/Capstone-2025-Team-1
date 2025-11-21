import { Routes, Route, Link } from "react-router-dom";
import Selector from "./components/Selector";
import Scheduler from "./components/Scheduler";
import Media from "./components/Media";

// widget card images
import selectorImg from "./assets/shoe-finder.svg";
import schedulerImg from "./assets/appointment.svg";
import mediaImg from "./assets/media-library.svg";

function Home() {
  return (
    <div className="grid gap-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-display">FootWorks Widgets</h2>
        <p className="text-[var(--color-muted)]">
          Explore our suite of interactive tools designed to enhance your experience.
        </p>
      </div>

      {/* Responsive grid of clickable image cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* === CARD TEMPLATE === */}
        <Link
          to="/selector"
          className="
            group rounded-2xl border border-[var(--color-border)]
            bg-[var(--color-surface)] p-4 shadow-sm 
            hover:shadow-lg hover:-translate-y-0.5 transition-all
          "
        >
          <div className="overflow-hidden rounded-xl">
            <img
              src={selectorImg}
              alt="Online Shoe Selector"
              className="w-full aspect-video object-contain p-2
                         group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="mt-3">
            <p className="text-sm font-mono text-[var(--color-muted)]">
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Answer a few quick questions to get personalized shoe matches.
            </p>
          </div>
        </Link>

        {/* === SCHEDULER CARD === */}
        <Link
          to="/scheduler"
          className="
            group rounded-2xl border border-[var(--color-border)]
            bg-[var(--color-surface)] p-4 shadow-sm 
            hover:shadow-lg hover:-translate-y-0.5 transition-all
          "
        >
          <div className="overflow-hidden rounded-xl">
            <img
              src={schedulerImg}
              alt="Smart Scheduler"
              className="w-full aspect-video object-contain p-2
                         group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="mt-3">
            <p className="text-sm font-mono text-[var(--color-muted)]">
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Book a fitting appointment based on real-time availability.
            </p>
          </div>
        </Link>

        {/* === MEDIA CARD === */}
        <Link
          to="/media"
          className="
            group rounded-2xl border border-[var(--color-border)]
            bg-[var(--color-surface)] p-4 shadow-sm 
            hover:shadow-lg hover:-translate-y-0.5 transition-all
          "
        >
          <div className="overflow-hidden rounded-xl">
            <img
              src={mediaImg}
              alt="Educational Media"
              className="w-full aspect-video object-contain p-2
                         group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="mt-3">
            <p className="text-sm font-mono text-[var(--color-muted)]">
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Watch FootWorks videos on form, injury prevention, and more.
            </p>
          </div>
        </Link>

      </div>
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
      <main className="mx-auto max-w-6xl px-6 py-10">
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
