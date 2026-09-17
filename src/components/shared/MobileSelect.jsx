/**
 * MobileSelect — On mobile renders a bottom-sheet drawer picker.
 * On desktop falls back to the standard shadcn Select.
 */
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function useIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < 1024;
}

export default function MobileSelect({
  value, onValueChange, placeholder = "Select...", options = [],
  triggerClassName = "", title = "Select an option",
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn("border-2 font-mono text-xs", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 items-center justify-between gap-2 border-2 border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm transition-colors hover:border-foreground",
          triggerClassName
        )}
      >
        <span className={cn(!selectedOption && "text-muted-foreground")}>
          {displayLabel}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-safe">
          <DrawerHeader>
            <DrawerTitle className="font-mono text-xs tracking-[0.2em]">
              {title.toUpperCase()}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[60vh] px-2 pb-6">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 text-sm font-mono border-b border-border last:border-0 transition-colors",
                    isSelected
                      ? "text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
