import { useRef } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PullToRefreshWrapper({ onRefresh, children, className }) {
  const containerRef = useRef(null);
  const { pulling, pullY, refreshing } = usePullToRefresh(onRefresh, containerRef);

  const indicatorVisible = pulling || refreshing;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto h-full relative", className)}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-all pointer-events-none"
        style={{
          height: Math.max(pullY, refreshing ? 44 : 0),
          opacity: indicatorVisible ? 1 : 0,
        }}
      >
        <RefreshCw
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            refreshing && "animate-spin"
          )}
          style={{ transform: refreshing ? undefined : `rotate(${(pullY / 72) * 180}deg)` }}
        />
      </div>

      <div
        style={{
          transform: indicatorVisible ? `translateY(${pulling ? pullY : refreshing ? 44 : 0}px)` : undefined,
          transition: pulling ? undefined : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
