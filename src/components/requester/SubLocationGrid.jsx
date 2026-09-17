import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Standard locations for all stores
const standardLocations = [
  { value: "sales_area", label: "SALES AREA", subOptions: null },
  { value: "storage", label: "STORAGE", subOptions: null },
  { value: "office", label: "OFFICE", subOptions: null },
  { value: "toilet", label: "TOILET", subOptions: null },
  { value: "external", label: "EXTERNAL", subOptions: null },
  { value: "other", label: "OTHER", subOptions: null },
  { value: "accommodation", label: "ACCOMMODATION", subOptions: ["Room", "Toilet", "Kitchen", "Other"] },
];

// DW01-specific locations
const dw01Locations = [
  { value: "storage", label: "STORAGE", subOptions: ["Freezer Room", "Chiller Room", "Confectionary Chamber", "Dry Area", "Fixed Asset"] },
  { value: "other", label: "OTHER", subOptions: ["Dispatch", "Receiving", "Office", "Toilet", "External"] },
];

export default function SubLocationGrid({ selected, onSelect, storeCode }) {
  const [parentSelected, setParentSelected] = useState("");
  const [subSelected, setSubSelected] = useState("");

  const isDW01 = storeCode === "DW01";
  const locations = isDW01 ? dw01Locations : standardLocations;

  useEffect(() => {
    setParentSelected("");
    setSubSelected("");
    onSelect("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCode]);

  const handleParentSelect = (loc) => {
    setParentSelected(loc.value);
    setSubSelected("");
    if (!loc.subOptions) {
      onSelect(loc.label);
    } else {
      onSelect("");
    }
  };

  const handleSubSelect = (parent, sub) => {
    setSubSelected(sub);
    onSelect(`${parent.label} - ${sub}`);
  };

  const selectedLoc = locations.find(l => l.value === parentSelected);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
        {locations.map((loc) => (
          <button
            key={loc.value}
            onClick={() => handleParentSelect(loc)}
            className={cn(
              "border-2 p-4 text-left transition-all font-display font-bold text-sm tracking-tight",
              parentSelected === loc.value
                ? "border-amber bg-amber/5 text-foreground"
                : "border-border hover:border-foreground text-foreground"
            )}
          >
            {loc.label}
            {loc.subOptions && (
              <span className="block font-mono font-normal text-xs text-muted-foreground mt-0.5">
                Select sub-area ›
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedLoc?.subOptions && (
        <div>
          <div className="font-mono text-xs text-muted-foreground mb-2">
            SELECT {selectedLoc.label} AREA *
          </div>
          <div className="flex flex-wrap gap-0">
            {selectedLoc.subOptions.map((sub) => (
              <button
                key={sub}
                onClick={() => handleSubSelect(selectedLoc, sub)}
                className={cn(
                  "border-2 px-4 py-2.5 font-mono text-xs tracking-wider transition-all",
                  subSelected === sub
                    ? "border-amber bg-amber/10 text-foreground"
                    : "border-border hover:border-foreground text-muted-foreground hover:text-foreground"
                )}
              >
                {sub.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
