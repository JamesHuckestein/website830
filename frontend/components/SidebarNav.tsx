import type { NavItem, SectionId } from "@/data/siteData";

type SidebarNavProps = {
  items: NavItem[];
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
};

export function SidebarNav({ items, activeSection, onSelect }: SidebarNavProps) {
  return (
    <nav aria-label="Council navigation" className="w-full md:w-72">
      <ul className="space-y-2">
        {items.map((item) => {
          const isActive = item.id === activeSection;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-md px-4 py-2 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-[#BFA149] text-[#032147]"
                    : "bg-white text-[#032147] hover:bg-[#F6F0DF]"
                }`}
                aria-pressed={isActive}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
