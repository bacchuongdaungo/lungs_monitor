type AppPageId = "patient" | "home" | "progress";

type Props = {
  currentPage: AppPageId;
  onNavigate: (page: AppPageId) => void;
};

const NAV_ITEMS: readonly { id: AppPageId; label: string; detail: string }[] = [
  { id: "patient", label: "Patient Record", detail: "Medical profile and habits" },
  { id: "home", label: "Home", detail: "Visualization and lung coach" },
  { id: "progress", label: "Progress", detail: "Recovery tracking and goals" },
];

export function AppNav({ currentPage, onNavigate }: Props) {
  return (
    <nav className="app-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`app-nav__item ${currentPage === item.id ? "app-nav__item--active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="app-nav__label">{item.label}</span>
          <span className="app-nav__detail">{item.detail}</span>
        </button>
      ))}
    </nav>
  );
}

export type { AppPageId };
