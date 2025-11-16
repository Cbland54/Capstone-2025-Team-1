import { NavLink } from "react-router-dom";

export default function WidgetBottomBar() {
  const links = [
    {
      label: "Shoe Finder",
      to: "/selector",
      ariaLabel: "Open selector",
    },
    {
      label: "Book Appointment",
      to: "/scheduler",
      ariaLabel: "Open scheduler",
    },
    {
      label: "Running Resource Videos",
      to: "/media",
      ariaLabel: "Open media",
    },
  ];

  return (
    <div className="mt-6 border-t border-[var(--color-brand-200)] bg-white/90 backdrop-blur rounded-b-[var(--radius)] p-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {links.map(({ label, to, ariaLabel }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={ariaLabel}
            className={({ isActive }) =>
              [
                "rounded-2xl px-6 py-3 text-sm md:text-base font-medium shadow-sm transition border",
                isActive
                  ? "bg-white text-[var(--color-brand-600)] border-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)]"
                  : "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)]",
              ].join(" ")
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
