"use client";

import { useEffect } from "react";

// Extend window interface for VConsole
declare global {
  interface Window {
    vConsole?: unknown;
  }
}

const VConsole = () => {
  useEffect(() => {
    // Only load VConsole in development or when explicitly enabled
    const shouldLoadVConsole =
      process.env.NODE_ENV === "development" ||
      (typeof window !== "undefined" &&
        window.location.search.includes("vconsole=true"));

    // Check if it's a mobile device
    const isMobile =
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (shouldLoadVConsole && isMobile) {
      // Dynamically import VConsole to avoid SSR issues
      import("vconsole")
        .then((VConsoleModule) => {
          const VConsole = VConsoleModule.default;

          // Check if VConsole is already initialized
          if (!window.vConsole) {
            const vConsole = new VConsole({
              theme: "dark",
              defaultPlugins: ["system", "network", "element", "storage"],
              disableLogScrolling: false,
            });

            // Store reference to prevent multiple instances
            window.vConsole = vConsole;

            console.log("📱 VConsole initialized for mobile debugging");
          }
        })
        .catch((error) => {
          console.error("Failed to load VConsole:", error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
};

export default VConsole;
