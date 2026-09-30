/**
 * Client-side utility to resize and compress images using HTML5 Canvas.
 * This prevents payload limit issues on the backend (e.g. 500KB limit for memes).
 */
export async function resizeImageIfNeeded(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<File> {
  // If the file is not an image or it is a SVG/GIF, return as is
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Check if resizing is necessary
        if (width <= maxWidth && height <= maxHeight && file.size <= 300 * 1024) {
          // No resizing/compression needed
          resolve(file);
          return;
        }

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw onto canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output type. We use image/jpeg for strong compression.
        // Transparent pngs are kept as image/png but compressed by resizing.
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create a new File from the blob
            const extension = outputType === "image/png" ? ".png" : ".jpg";
            let newName = file.name;
            if (!newName.toLowerCase().endsWith(extension)) {
              // Strip old extension and add new one
              const dotIndex = newName.lastIndexOf(".");
              if (dotIndex !== -1) {
                newName = newName.substring(0, dotIndex);
              }
              newName += extension;
            }

            const resizedFile = new File([blob], newName, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // Fallback on load error
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file); // Fallback on read error
    };

    reader.readAsDataURL(file);
  });
}
