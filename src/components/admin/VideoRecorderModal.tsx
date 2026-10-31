import React, { useState, useRef, useEffect } from "react";
import { X, Video, Square, RotateCcw, Check, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}

export function VideoRecorderModal({ isOpen, onClose, onSave }: VideoRecorderModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    try {
      cleanup();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera or microphone. Please check permissions.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  // Clean up resources
  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    setRecordedChunks([]);
    setVideoUrl(null);
    setTimer(0);
  };

  // Start recording
  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    setVideoUrl(null);
    setTimer(0);

    // Detect browser-supported mimeType
    let mimeType = "video/webm;codecs=vp8,opus";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      mimeType = "video/webm;codecs=vp9,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    }

    try {
      const options = { mimeType };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        // Collect recorded chunks and create url
        setRecordedChunks((chunks) => {
          const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          return chunks;
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Slice data every 250ms
      setRecording(true);

      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  };

  // Handle Save
  const handleSave = () => {
    if (recordedChunks.length === 0) return;
    const mimeType = mediaRecorderRef.current?.mimeType || "video/webm";
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(recordedChunks, { type: mimeType });
    const file = new File([blob], `video-message-${Date.now()}.${extension}`, {
      type: mimeType,
    });
    onSave(file);
    cleanup();
    onClose();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] bg-[#0c0f17] text-white border-white/10 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-violet-500" />
            Record Video Message
          </DialogTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="my-6 flex flex-col items-center justify-center">
          {/* Video display */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner flex items-center justify-center">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                autoPlay
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // mirror local camera view
              />
            )}

            {/* Recording visual indicator */}
            {recording && (
              <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                REC {formatTime(timer)}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            {videoUrl && (
              <Button
                variant="outline"
                onClick={startCamera}
                className="bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Record Again
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!videoUrl ? (
              recording ? (
                <Button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-5"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5"
                  disabled={!stream}
                >
                  <Radio className="w-4 h-4 mr-2 animate-pulse" />
                  Start Recording
                </Button>
              )
            ) : (
              <Button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Video
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
