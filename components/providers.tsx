"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<"top-right" | "bottom-center">("top-right");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updatePosition = () => {
      setPosition(mediaQuery.matches ? "bottom-center" : "top-right");
    };

    updatePosition();
    mediaQuery.addEventListener("change", updatePosition);

    return () => {
      mediaQuery.removeEventListener("change", updatePosition);
    };
  }, []);

  return (
    <>
      {children}
      <Toaster
        position={position}
        containerStyle={{ zIndex: 70 }}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "16px",
            border: "1px solid rgba(213, 225, 216, 0.95)",
            background: "rgba(255, 255, 255, 0.96)",
            color: "#14281D",
            boxShadow: "0 18px 42px rgba(15, 23, 42, 0.14)",
            padding: "12px 14px",
            maxWidth: "420px",
          },
          success: {
            iconTheme: {
              primary: "#1F8B4C",
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#C2412D",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </>
  );
}
