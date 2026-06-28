import React, { useEffect, useMemo, useState } from "react";
import { FALLBACK_IMAGE_URL } from "./MemeService";
import { toProxiedUrl as toProxiedUrlAdmin } from "@/lib/admin/apiClient";
import { toProxiedUrl as toProxiedUrlEmployee } from "@/Employee/lib/api";
import { getEmployeeAuth } from "@/Employee/lib/auth";

export type MemeModalProps = {
  isOpen: boolean;
  imageUrl: string;
  caption?: string;
  onClose: () => void;
};

/**
 * Get the appropriate toProxiedUrl based on current auth context
 */
function getToProxiedUrl() {
  const empAuth = getEmployeeAuth();
  if (empAuth?.token) {
    return toProxiedUrlEmployee;
  }
  return toProxiedUrlAdmin;
}

export function MemeModal({ isOpen, imageUrl, caption, onClose }: MemeModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const src = useMemo(() => {
    if (imgFailed) return FALLBACK_IMAGE_URL;
    // Apply URL proxy to S3 URLs to avoid CORS issues
    const toProxiedUrl = getToProxiedUrl();
    const proxiedUrl = toProxiedUrl(imageUrl) || imageUrl;
    return proxiedUrl;
  }, [imageUrl, imgFailed]);

  useEffect(() => {
    if (!isOpen) return;
    setImgFailed(false);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Motivational meme"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "min(600px, 90vw)",
          maxHeight: "min(85vh, 820px)",
          borderRadius: 12,
          overflow: "hidden",
          background: "#111",
          boxShadow: "0px 20px 60px rgba(0,0,0,0.5)",
          transform: "scale(1)",
          opacity: 1,
          animation: "memeIn 300ms ease-in forwards",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{`
          @keyframes memeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", background: "#0b0b0f" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.35)",
              color: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>×</span>
          </button>

          <img
            src={src}
            alt={caption ? `Meme: ${caption}` : "Motivational meme"}
            style={{
              width: "100%",
              maxHeight: "calc(85vh - 150px)",
              objectFit: "contain",
              display: "block",
              background: "#0b0b0f",
            }}
            loading="eager"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        </div>

        {(caption || "").trim() ? (
          <div
            style={{
              padding: "12px 16px 0",
              textAlign: "center",
              color: "rgba(255,255,255,0.92)",
              fontSize: 16,
              lineHeight: 1.35,
            }}
          >
            {caption}
          </div>
        ) : null}

        <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}