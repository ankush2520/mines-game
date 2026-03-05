import React from "react";
import GridCreator from "./components/GridCreator";

/**
 * MinesApp - Pure React component for the Mines game UI
 * No Next.js dependencies (no next/navigation, next/link, next/image)
 */
export default function MinesApp() {
  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0B1020" }}
    >
      <GridCreator rows={5} cols={5} />
    </div>
  );
}
