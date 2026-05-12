import React from "react";

export function MemeOverlay({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(2px)",
      }}
    />
  );
}

