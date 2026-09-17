import { cn } from "@/lib/utils";

export const subCategories = {
  civil: ["Paint", "Flooring", "Ceiling", "Doors", "Shelving", "Ramp", "Platform", "Handicap Sign", "Glass", "Curtains", "Other"],
  electrical: ["Power Failure", "Air Curtain", "Lights", "Fly Killers", "Exhaust", "SEC Meter", "Other"],
  cooling: ["Chiller", "Freezer", "Cooler", "Split AC", "Window AC", "Package Unit", "Refrigeration Unit", "Ducted Split", "Other"],
  plumbing: ["Water Supply", "Drainage", "Fixtures", "Pump / Motor", "Water Heater", "Other"],
  equipment: ["Forklift", "Hand Jack", "Turkish Oven", "Electric Oven", "Dough Mixer", "Dock Leveler", "Other"],
  generator: ["Start Up Failure", "Oil / Fuel / Coolant", "ATS"],
  firefighting: ["Sprinkler", "Fire Hose Cabinet", "Fire Extinguisher", "Smoke Detector", "Control Panel", "Emergency Door", "Exit Sign"],
};

export const coolingIssues = [
  { value: "ice_build_up", label: "Ice Build Up" },
  { value: "water_leak", label: "Water Leak" },
  { value: "temperature", label: "Temperature" },
  { value: "electrical", label: "Electrical" },
];

export default function SubCategoryGrid({ category, selected, onSelect }) {
  const options = subCategories[category] || [];

  return (
    <div className="flex flex-wrap gap-0">
      {options.map((sub) => (
        <button
          key={sub}
          onClick={() => onSelect(sub)}
          className={cn(
            "border-2 px-4 py-2.5 font-mono text-xs tracking-wider transition-all",
            selected === sub
              ? "border-amber bg-amber/10 text-foreground"
              : "border-border hover:border-foreground text-muted-foreground hover:text-foreground"
          )}
        >
          {sub.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
