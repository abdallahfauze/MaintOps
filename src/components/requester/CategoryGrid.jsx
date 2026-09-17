import { cn } from "@/lib/utils";
import { Building2, Zap, Thermometer, Droplets, Wrench, Fuel, ShieldAlert } from "lucide-react";

export const categories = [
  { value: "civil", label: "CIVIL", icon: Building2, desc: "Paint, flooring, doors, ceiling" },
  { value: "electrical", label: "ELECTRICAL", icon: Zap, desc: "Power, lights, air curtain" },
  { value: "cooling", label: "COOLING", icon: Thermometer, desc: "Chiller, freezer, AC units" },
  { value: "plumbing", label: "PLUMBING", icon: Droplets, desc: "Water supply, drainage, fixtures" },
  { value: "equipment", label: "EQUIPMENT", icon: Wrench, desc: "Forklift, ovens, mixers" },
  { value: "generator", label: "GENERATOR", icon: Fuel, desc: "Startup, fuel, ATS" },
  { value: "firefighting", label: "FIREFIGHTING", icon: ShieldAlert, desc: "Sprinklers, extinguishers, alarms" },
];

export default function CategoryGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
      {categories.map(({ value, label, icon: Icon, desc }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className={cn(
            "border-2 p-5 text-left transition-all group",
            selected === value
              ? "border-amber bg-amber/5"
              : "border-border hover:border-foreground"
          )}
        >
          <Icon className={cn(
            "w-7 h-7 mb-2 transition-colors",
            selected === value ? "text-amber" : "text-muted-foreground group-hover:text-foreground"
          )} />
          <div className="font-display font-bold text-sm tracking-tight">{label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </button>
      ))}
    </div>
  );
}
