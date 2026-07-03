import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Recover from stale chunk errors after a new deployment. When a lazy-loaded
// module can't be fetched (its hashed filename no longer exists on the server
// and the SPA fallback returns index.html with a text/html MIME type), reload
// once to pick up the latest index.html + asset hashes. Guarded against loops.
window.addEventListener("vite:preloadError", () => {
  const KEY = "chunk-reload-at";
  const last = Number(sessionStorage.getItem(KEY) || "0");
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
