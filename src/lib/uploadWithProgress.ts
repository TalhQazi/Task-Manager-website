/**
 * Reusable utility for uploading files with live upload progress tracking via XMLHttpRequest.
 * Unlike fetch(), XMLHttpRequest exposes xhr.upload.onprogress to calculate exact percentage,
 * transfer speed (MB/s), and estimated time remaining.
 */

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percent: number;
  speedMBps: number;
  etaSeconds: number;
  status: "idle" | "uploading" | "processing" | "done" | "error" | "aborted";
}

export interface UploadOptions {
  url: string;
  method?: string;
  token?: string | null;
  formData: FormData;
  onProgress?: (info: UploadProgressInfo) => void;
  signal?: AbortSignal;
}

export function uploadWithProgress<T = any>({
  url,
  method = "POST",
  token,
  formData,
  onProgress,
  signal,
}: UploadOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        onProgress?.({
          loaded: 0,
          total: 0,
          percent: 0,
          speedMBps: 0,
          etaSeconds: 0,
          status: "aborted",
        });
        reject(new Error("Upload cancelled by user."));
      });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;

        // Calculate speed in MB/s smoothed over intervals
        let speedMBps = 0;
        if (timeDiff > 0.3) {
          const loadedDiff = (event.loaded - lastLoaded) / (1024 * 1024);
          speedMBps = Math.max(0, loadedDiff / timeDiff);
          lastLoaded = event.loaded;
          lastTime = now;
        }

        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        const remainingBytes = event.total - event.loaded;
        const totalElapsed = (now - startTime) / 1000;
        const avgSpeed = (event.loaded / (1024 * 1024)) / Math.max(0.1, totalElapsed);
        const etaSeconds = avgSpeed > 0 ? Math.round((remainingBytes / (1024 * 1024)) / avgSpeed) : 0;

        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent,
          speedMBps: Number(speedMBps.toFixed(2)),
          etaSeconds,
          status: "uploading",
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({
          loaded: 1,
          total: 1,
          percent: 100,
          speedMBps: 0,
          etaSeconds: 0,
          status: "done",
        });

        try {
          const resJson = JSON.parse(xhr.responseText);
          resolve(resJson);
        } catch {
          resolve(xhr.responseText as unknown as T);
        }
      } else {
        let errorMsg = `Upload failed (${xhr.status})`;
        if (xhr.status === 413) {
          errorMsg = "File size exceeds server upload limit (413 Request Entity Too Large). Nginx on the server needs 'client_max_body_size 1024M;' configured and reloaded.";
        }
        try {
          const errJson = JSON.parse(xhr.responseText);
          errorMsg = errJson?.error?.message || errJson?.message || errorMsg;
        } catch {
          // ignore
        }
        onProgress?.({
          loaded: 0,
          total: 0,
          percent: 0,
          speedMBps: 0,
          etaSeconds: 0,
          status: "error",
        });
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      onProgress?.({
        loaded: 0,
        total: 0,
        percent: 0,
        speedMBps: 0,
        etaSeconds: 0,
        status: "error",
      });
      reject(new Error("Network error during file upload. Check your connection."));
    };

    xhr.open(method, url, true);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Inform progress of start
    onProgress?.({
      loaded: 0,
      total: 100,
      percent: 0,
      speedMBps: 0,
      etaSeconds: 0,
      status: "uploading",
    });

    xhr.send(formData);
  });
}

