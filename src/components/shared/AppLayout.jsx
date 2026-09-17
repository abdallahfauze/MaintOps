import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";
import MobileBottomTabs from "./MobileBottomTabs";
import PageTransition from "./PageTransition";

export default function AppLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main
        ref={mainRef}
        className="flex-1 overflow-auto lg:!pt-0 pb-16 lg:pb-0"
        style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <MobileBottomTabs />
    </div>
  );
}
