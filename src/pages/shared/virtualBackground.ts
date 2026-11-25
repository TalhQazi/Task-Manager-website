/**
 * Virtual background helpers for MeetingRoom.
 * Uses MediaPipe Selfie Segmentation so the chosen scene fills the full frame
 * and the person is composited on top (Zoom-style).
 */

type SelfieSegmentationLike = {
  setOptions: (opts: { modelSelection: number; selfieMode?: boolean }) => void;
  initialize?: () => Promise<void>;
  onResults: (cb: (results: SegmentationResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  reset?: () => void;
  close?: () => void;
};

export type SegmentationResults = {
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
      // Script tag exists but SelfieSegmentation may not be ready yet
      if (window.SelfieSegmentation) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      // Already loaded but global missing — fall through to inject again below
      if ((existing as HTMLScriptElement).dataset.loaded === "1") {
        if (window.SelfieSegmentation) resolve();
        else reject(new Error("SelfieSegmentation global missing after script load"));
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
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
  // Give UMD bundle a tick to attach the global
  if (!window.SelfieSegmentation) {
    await new Promise((r) => setTimeout(r, 50));
  }
}

export async function getSelfieSegmenter(): Promise<SelfieSegmentationLike> {
  await ensureMediaPipeLoaded();
  if (!window.SelfieSegmentation) {
    throw new Error("SelfieSegmentation unavailable — CDN blocked or offline");
  }
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const segmenter = new window.SelfieSegmentation!({
        locateFile: (file) => `${MEDIAPIPE_BASE}/${file}`,
      });
      segmenter.setOptions({ modelSelection: 1, selfieMode: true });
      if (typeof segmenter.initialize === "function") {
        await segmenter.initialize();
      }
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
 * Draw a strong blur of `source` into `ctx`.
 * Uses downscale → blur → upscale because canvas filter blur is unreliable / weak at full res.
 */
function drawBlurredFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  w: number,
  h: number,
  mirror: boolean
) {
  const shrink = document.createElement("canvas");
  const scale = 0.35;
  shrink.width = Math.max(2, Math.floor(w * scale));
  shrink.height = Math.max(2, Math.floor(h * scale));
  const sctx = shrink.getContext("2d");
  if (!sctx) {
    ctx.save();
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = "blur(20px)";
    ctx.drawImage(source, 0, 0, w, h);
    ctx.filter = "none";
    ctx.restore();
    return;
  }

  sctx.save();
  if (mirror) {
    sctx.translate(shrink.width, 0);
    sctx.scale(-1, 1);
  }
  sctx.drawImage(source, 0, 0, shrink.width, shrink.height);
  sctx.restore();

  // Blur pass on small canvas
  const blurPass = document.createElement("canvas");
  blurPass.width = shrink.width;
  blurPass.height = shrink.height;
  const bctx = blurPass.getContext("2d");
  if (bctx) {
    bctx.filter = "blur(8px)";
    bctx.drawImage(shrink, 0, 0);
    bctx.filter = "none";
    ctx.drawImage(blurPass, 0, 0, w, h);
  } else {
    ctx.drawImage(shrink, 0, 0, w, h);
  }
}

/**
 * Full-frame virtual background:
 * 1) Draw scene across the entire canvas
 * 2) Cut out the person via segmentation mask and draw them on top
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
  // Build person-only layer (mirrored for selfie feel)
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

  ctx.clearRect(0, 0, w, h);
  if (blurBackground) {
    drawBlurredFrame(ctx, results.image, w, h, true);
  } else if (bgImage) {
    drawCoverImage(ctx, bgImage, w, h);
  } else {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(personCanvas, 0, 0);
}

/**
 * Fallback when MediaPipe is unavailable: soft-blur the whole camera frame.
 * Better than a silent no-op when CDN/WASM fails.
 */
export function compositeSimpleBlur(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);
  drawBlurredFrame(ctx, video, w, h, true);
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
