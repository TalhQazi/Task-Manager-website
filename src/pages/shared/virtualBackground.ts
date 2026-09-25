/**
 * Virtual background helpers for MeetingRoom.
 * Uses MediaPipe Selfie Segmentation so the chosen scene fills the full frame
 * and the person is composited on top (Zoom-style).
 */

type SelfieSegmentationLike = {
  setOptions: (opts: { modelSelection: number; selfieMode?: boolean }) => void;
  onResults: (cb: (results: SegmentationResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
};

type SegmentationResults = {
  image: CanvasImageSource;
  segmentationMask: CanvasImageSource;
};

declare global {
  interface Window {
    SelfieSegmentation?: new (config: {
      locateFile: (file: string) => string;
    }) => SelfieSegmentationLike;
  }
}

const MEDIAPIPE_VERSION = "0.1.1675465747";
const MEDIAPIPE_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@${MEDIAPIPE_VERSION}`;

let scriptPromise: Promise<void> | null = null;
let segmenterPromise: Promise<SelfieSegmentationLike> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureMediaPipeLoaded(): Promise<void> {
  if (window.SelfieSegmentation) return;
  if (!scriptPromise) {
    scriptPromise = loadScript(`${MEDIAPIPE_BASE}/selfie_segmentation.js`).catch((err) => {
      scriptPromise = null;
      throw err;
    });
  }
  await scriptPromise;
}

export async function getSelfieSegmenter(): Promise<SelfieSegmentationLike> {
  await ensureMediaPipeLoaded();
  if (!window.SelfieSegmentation) {
    throw new Error("SelfieSegmentation unavailable");
  }
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const segmenter = new window.SelfieSegmentation!({
        locateFile: (file) => `${MEDIAPIPE_BASE}/${file}`,
      });
      segmenter.setOptions({ modelSelection: 1, selfieMode: false });
      return segmenter;
    })().catch((err) => {
      segmenterPromise = null;
      throw err;
    });
  }
  return segmenterPromise;
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/**
 * Full-frame virtual background:
 * 1) Draw scene across the entire canvas (never CSS-mirrored — keeps images upright)
 * 2) Cut out the person via segmentation mask and draw them on top (mirrored for selfie feel)
 */
export function compositeVirtualBackground(
  ctx: CanvasRenderingContext2D,
  personCanvas: HTMLCanvasElement,
  personCtx: CanvasRenderingContext2D,
  results: SegmentationResults,
  w: number,
  h: number,
  bgImage: HTMLImageElement | null,
  blurBackground: boolean
) {
  // Build mirrored person-only layer (matches normal local camera preview)
  personCanvas.width = w;
  personCanvas.height = h;
  personCtx.clearRect(0, 0, w, h);
  personCtx.save();
  personCtx.translate(w, 0);
  personCtx.scale(-1, 1);
  personCtx.globalCompositeOperation = "source-over";
  personCtx.drawImage(results.image, 0, 0, w, h);
  personCtx.globalCompositeOperation = "destination-in";
  personCtx.drawImage(results.segmentationMask, 0, 0, w, h);
  personCtx.restore();
  personCtx.globalCompositeOperation = "source-over";

  // Full-frame background first — keep scene orientation correct (not mirrored)
  ctx.clearRect(0, 0, w, h);
  if (blurBackground) {
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.filter = "blur(16px) brightness(0.95) saturate(1.05)";
    ctx.drawImage(results.image, 0, 0, w, h);
    ctx.filter = "none";
    ctx.restore();
  } else if (bgImage) {
    drawCoverImage(ctx, bgImage, w, h);
  } else {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, w, h);
  }

  // Person on top of upright background
  ctx.drawImage(personCanvas, 0, 0);
}

export function loadBackgroundImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load background: ${src}`));
    img.src = src;
  });
}
