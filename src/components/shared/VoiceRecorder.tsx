import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/admin/ui/button";

interface VoiceRecorderProps {
  onSendVoiceNote: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSendVoiceNote, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Generate dummy visual frequencies for waveform
      const fakeWaveform = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20);
      setWaveform(fakeWaveform);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      await onSendVoiceNote(audioBlob, recordingTime, waveform);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 shadow-xl w-full">
      {isRecording ? (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-red-400">Rec {formatTime(recordingTime)}</span>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePlayback}
          className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
      )}

      {/* Waveform Visualization */}
      <div className="flex-1 flex items-center gap-1 h-6 overflow-hidden px-2">
        {waveform.map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isRecording ? "bg-red-400 animate-pulse" : "bg-blue-400"
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        {isRecording ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={stopRecording}
            className="h-9 w-9 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-9 w-9 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {!isRecording && audioBlob && (
          <Button
            type="button"
            onClick={handleSend}
            disabled={uploading}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Voice Note
          </Button>
        )}
      </div>
    </div>
  );
}
