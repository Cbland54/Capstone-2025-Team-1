import { NavLink } from "react-router-dom";

export default function WidgetBottomBar() {
  // This component creates the three navigation buttons that sit at the bottom of each widget section.
  // Each button links to one of the main pages: Selector, Scheduler, and Media.
  // The active button inverts the color scheme to stand out, while the inactive buttons stay solid red.

  return (
    <div className="mt-6 border-t border-[var(--color-brand-200)] bg-white/90 backdrop-blur rounded-b-[var(--radius)] p-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Map through each path to generate buttons dynamically */}
        {["selector", "scheduler", "media"].map((path) => (
          <NavLink
            key={path}
            to={`/${path}`}
            // Use NavLink to automatically detect and style the active route
            className={({ isActive }) =>
              [
                "rounded-2xl px-6 py-3 text-sm md:text-base font-medium shadow-sm transition border",
                isActive
                  ? // Active state: flipped style (white background, red text, red border)
                    "bg-white text-[var(--color-brand-600)] border-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)]"
                  : // Inactive state: solid red button with white text
                    "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)]",
              ].join(" ")
            }
            aria-label={`Open ${path}`}
          >
            {/* Capitalize the first letter of the button label */}
            {path.charAt(0).toUpperCase() + path.slice(1)}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
