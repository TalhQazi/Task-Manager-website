import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { getAuthState } from "@/lib/auth";
import { getEmployeeAuth } from "@/Employee/lib/auth";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  MessageSquare,
  Hand,
  PhoneOff,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  LayoutGrid,
  VolumeX,
  Send,
  X,
  Shield,
  Clock,
  Info,
  Captions,
  Image as ImageIcon,
  Languages,
  Circle,
  Square,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  compositeVirtualBackground,
  getSelfieSegmenter,
  loadBackgroundImage,
} from "./virtualBackground";

interface ParticipantInfo {
  socketId: string;
  userId: string;
  name: string;
  role: string;
  isHost?: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  handRaised?: boolean;
  isScreenSharing?: boolean;
}

interface ChatMessage {
  id: string;
  senderSocketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const CAPTION_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "ur-PK", label: "Urdu (Pakistan)" },
  { code: "hi-IN", label: "Hindi (India)" },
  { code: "ar-SA", label: "Arabic" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "ja-JP", label: "Japanese" },
];

type BgMode =
  | "none"
  | "blur"
  | "office"
  | "boardroom"
  | "bookshelf"
  | "lobby"
  | "city"
  | "studio";

const BG_OPTIONS: {
  id: BgMode;
  label: string;
  image?: string;
  preview?: string;
}[] = [
  { id: "none", label: "None", preview: "linear-gradient(135deg,#27272a,#18181b)" },
  { id: "blur", label: "Blur", preview: "linear-gradient(135deg,#94a3b8,#475569)" },
  { id: "office", label: "Modern Office", image: "/meeting-bgs/office.jpg" },
  { id: "boardroom", label: "Boardroom", image: "/meeting-bgs/boardroom.jpg" },
  { id: "bookshelf", label: "Bookshelf", image: "/meeting-bgs/bookshelf.jpg" },
  { id: "lobby", label: "Office Lobby", image: "/meeting-bgs/lobby.jpg" },
  { id: "city", label: "City Skyline", image: "/meeting-bgs/city.jpg" },
  { id: "studio", label: "Soft Studio", image: "/meeting-bgs/soft-studio.jpg" },
];

function getMeetingsPathPrefix(pathname: string) {
  if (pathname.startsWith("/employee")) return "/employee/meetings";
  if (pathname.startsWith("/manager") || pathname.startsWith("/manger")) return "/manager/meetings";
  return "/admin/meetings";
}

export default function MeetingRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { socket } = useSocket();

  const [meetingData, setMeetingData] = useState<any>(null);
  const [participants, setParticipants] = useState<Map<string, ParticipantInfo>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Media state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Active speaker detection
  const [speakingSockets, setSpeakingSockets] = useState<Set<string>>(new Set());

  // UI state
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>("none");
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState("en-US");
  const [showCaptionLangMenu, setShowCaptionLangMenu] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [roomRecordingActive, setRoomRecordingActive] = useState(false);

  // Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const rawCameraStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgPersonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgRafRef = useRef<number | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const bgActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const joinedRoomRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingCleanupRef = useRef<(() => void) | null>(null);
  const recordingSecondsRef = useRef(0);
  const remoteVideoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Determine current user
  const currentUser = useMemo(() => {
    const adminAuth = getAuthState();
    if (adminAuth?.token && adminAuth.user) {
      return {
        id: String(adminAuth.user.id || adminAuth.user.sub || "admin"),
        name: adminAuth.user.name || "Admin",
        email: adminAuth.user.username || "",
        role: adminAuth.user.role || "admin",
      };
    }
    const empAuth = getEmployeeAuth();
    if (empAuth?.token) {
      return {
        id: empAuth.username || "employee",
        name: empAuth.name || empAuth.username || "Employee",
        email: empAuth.username || "",
        role: empAuth.role || "employee",
      };
    }
    return {
      id: `guest-${Math.random().toString(36).substring(2, 7)}`,
      name: "Team Member",
      email: "",
      role: "employee",
    };
  }, []);

  const isHost = Boolean(
    meetingData?.hostId === currentUser.id ||
      ["super-admin", "admin", "manager"].includes(currentUser.role)
  );

  // Fetch meeting metadata
  useEffect(() => {
    if (!code) return;
    let isMounted = true;
    apiFetch<{ item: any }>(`/api/meetings/code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (isMounted && res?.item) {
          setMeetingData(res.item);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch meeting metadata, continuing as instant room:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [code]);

  // Elapsed meeting timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper: attach/replace local A/V tracks on an existing peer connection
  const syncLocalTracksToPeer = useCallback(async (pc: RTCPeerConnection) => {
    if (!localStreamRef.current) return;
    const senders = pc.getSenders();
    for (const track of localStreamRef.current.getTracks()) {
      const existing = senders.find((s) => s.track?.kind === track.kind);
      if (existing) {
        await existing.replaceTrack(track);
      } else {
        pc.addTrack(track, localStreamRef.current);
      }
    }
  }, []);

  const renegotiatePeer = useCallback(
    async (targetSocketId: string, pc: RTCPeerConnection) => {
      if (!socket) return;
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        socket.emit("meeting:signal", {
          toSocketId: targetSocketId,
          signalData: pc.localDescription,
          type: "offer",
        });
      } catch (err) {
        console.error("Error renegotiating WebRTC:", err);
      }
    },
    [socket]
  );

  // Helper: setup WebRTC PeerConnection with a remote socket
  const createPeerConnection = useCallback(
    (targetSocketId: string, isInitiator: boolean) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId)!;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(targetSocketId, pc);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("meeting:signal", {
            toSocketId: targetSocketId,
            signalData: event.candidate,
            type: "ice-candidate",
          });
        }
      };

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(targetSocketId, stream);
            return next;
          });
        }
      };

      // If initiator, create and send Offer
      if (isInitiator) {
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socket) {
              socket.emit("meeting:signal", {
                toSocketId: targetSocketId,
                signalData: pc.localDescription,
                type: "offer",
              });
            }
          })
          .catch((err) => console.error("Error creating WebRTC offer:", err));
      }

      return pc;
    },
    [socket]
  );

  // Stop virtual background processing loop
  const stopBgProcessor = useCallback(() => {
    bgActiveRef.current = false;
    if (bgRafRef.current != null) {
      cancelAnimationFrame(bgRafRef.current);
      bgRafRef.current = null;
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.srcObject = null;
      bgVideoRef.current = null;
    }
  }, []);

  // Apply camera stream (raw or virtual-bg processed) to local preview + peers
  const applyOutgoingStream = useCallback(
    async (stream: MediaStream) => {
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peers = Array.from(peerConnectionsRef.current.entries());
      for (const [socketId, pc] of peers) {
        await syncLocalTracksToPeer(pc);
        await renegotiatePeer(socketId, pc);
      }
    },
    [renegotiatePeer, syncLocalTracksToPeer]
  );

  const startBgProcessor = useCallback(
    async (mode: BgMode) => {
      stopBgProcessor();
      const raw = rawCameraStreamRef.current;
      if (!raw || mode === "none") {
        if (raw) await applyOutgoingStream(raw);
        return;
      }

      const videoTrack = raw.getVideoTracks()[0];
      if (!videoTrack) {
        await applyOutgoingStream(raw);
        return;
      }

      const option = BG_OPTIONS.find((o) => o.id === mode);
      let bgImage: HTMLImageElement | null = null;

      if (option?.image) {
        const cached = bgImageCacheRef.current.get(option.image);
        if (cached?.complete) {
          bgImage = cached;
        } else {
          try {
            bgImage = await loadBackgroundImage(option.image);
            bgImageCacheRef.current.set(option.image, bgImage);
          } catch (err) {
            console.warn("Background image load failed:", err);
            toast({
              title: "Background unavailable",
              description: "Could not load this scene. Try Blur instead.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      let segmenter: Awaited<ReturnType<typeof getSelfieSegmenter>>;
      try {
        segmenter = await getSelfieSegmenter();
      } catch (err) {
        console.warn("Selfie segmentation unavailable:", err);
        toast({
          title: "Background engine loading failed",
          description: "Check your network connection and try again.",
          variant: "destructive",
        });
        return;
      }

      const canvas = bgCanvasRef.current || document.createElement("canvas");
      bgCanvasRef.current = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        await applyOutgoingStream(raw);
        return;
      }

      const personCanvas = bgPersonCanvasRef.current || document.createElement("canvas");
      bgPersonCanvasRef.current = personCanvas;
      const personCtx = personCanvas.getContext("2d", { willReadFrequently: true });
      if (!personCtx) {
        await applyOutgoingStream(raw);
        return;
      }

      const hiddenVideo = document.createElement("video");
      hiddenVideo.playsInline = true;
      hiddenVideo.muted = true;
      hiddenVideo.srcObject = new MediaStream([videoTrack]);
      bgVideoRef.current = hiddenVideo;
      await hiddenVideo.play().catch(() => {});

      // Wait for first frame dimensions
      await new Promise<void>((resolve) => {
        if (hiddenVideo.videoWidth > 0) {
          resolve();
          return;
        }
        const onMeta = () => {
          hiddenVideo.removeEventListener("loadeddata", onMeta);
          resolve();
        };
        hiddenVideo.addEventListener("loadeddata", onMeta);
        setTimeout(resolve, 800);
      });

      bgActiveRef.current = true;
      let busy = false;

      segmenter.onResults((results) => {
        if (!bgActiveRef.current) return;
        const w = canvas.width || hiddenVideo.videoWidth || 640;
        const h = canvas.height || hiddenVideo.videoHeight || 480;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        compositeVirtualBackground(
          ctx,
          personCanvas,
          personCtx,
          results,
          w,
          h,
          bgImage,
          mode === "blur"
        );
      });

      const tick = async () => {
        if (!bgActiveRef.current || !bgVideoRef.current) return;
        const v = bgVideoRef.current;
        const w = v.videoWidth || 640;
        const h = v.videoHeight || 480;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        if (!busy && v.readyState >= 2) {
          busy = true;
          try {
            await segmenter.send({ image: v });
          } catch (err) {
            console.warn("Segmentation frame failed:", err);
          } finally {
            busy = false;
          }
        }

        bgRafRef.current = requestAnimationFrame(() => {
          void tick();
        });
      };

      void tick();

      const processedTrack = canvas.captureStream(24).getVideoTracks()[0];
      const audioTracks = raw.getAudioTracks();
      const outgoing = new MediaStream([processedTrack, ...audioTracks]);
      await applyOutgoingStream(outgoing);

      toast({
        title: mode === "blur" ? "Background blur on" : "Virtual background on",
        description: "Scene fills the full video behind you.",
      });
    },
    [applyOutgoingStream, stopBgProcessor, toast]
  );

  // Initialize camera and microphone BEFORE joining the room
  useEffect(() => {
    let active = true;

    async function initMedia() {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (err: any) {
        console.warn("A/V getUserMedia failed, trying audio-only:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          if (active) {
            setIsVideoEnabled(false);
            setCameraError("Camera unavailable. Microphone is active — you can still join with audio and chat.");
          }
        } catch (audioErr: any) {
          console.warn("Audio-only getUserMedia also failed:", audioErr);
          if (active) {
            setIsAudioEnabled(false);
            setIsVideoEnabled(false);
            setCameraError("Camera or Microphone permission was not granted. You can still participate using text chat.");
            setMediaReady(true);
          }
          return;
        }
      }

      if (!active) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setMediaReady(true);
        return;
      }

      rawCameraStreamRef.current = stream;
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup audio analyzer for local voice detection
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;

            if (avg > 25) {
              setSpeakingSockets((prev) => new Set(prev).add("local"));
            } else {
              setSpeakingSockets((prev) => {
                if (prev.has("local")) {
                  const next = new Set(prev);
                  next.delete("local");
                  return next;
                }
                return prev;
              });
            }
            requestAnimationFrame(checkAudio);
          };
          requestAnimationFrame(checkAudio);
        }
      } catch (audioErr) {
        console.warn("Audio analyser initialization notice:", audioErr);
      }

      setMediaReady(true);
    }

    initMedia();

    return () => {
      active = false;
      stopBgProcessor();
      if (rawCameraStreamRef.current) {
        rawCameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localStreamRef.current && localStreamRef.current !== rawCameraStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          if (t.readyState === "live") t.stop();
        });
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [stopBgProcessor]);

  // Socket.io room lifecycle & WebRTC signaling — wait until media is ready
  useEffect(() => {
    if (!socket || !code || !mediaReady) return;
    if (joinedRoomRef.current) return;
    joinedRoomRef.current = true;

    // Join room
    socket.emit("meeting:join", {
      roomCode: code,
      userId: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      isHost,
    });

    // Existing participants received on join
    const handleExisting = ({ participants: existingList }: any) => {
      const map = new Map<string, ParticipantInfo>();
      existingList.forEach((p: ParticipantInfo) => {
        map.set(p.socketId, p);
        // Create offer to existing participant (local tracks already available)
        createPeerConnection(p.socketId, true);
      });
      setParticipants(map);
    };

    // New participant joined
    const handleUserJoined = (newcomer: ParticipantInfo) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(newcomer.socketId, newcomer);
        return next;
      });
      toast({
        title: "Participant Joined",
        description: `${newcomer.name} entered the meeting`,
      });
    };

    // WebRTC signal received (Offer, Answer, ICE Candidate)
    const handleSignal = async ({ fromSocketId, signalData, type }: any) => {
      let pc = peerConnectionsRef.current.get(fromSocketId);
      if (!pc) {
        pc = createPeerConnection(fromSocketId, false);
      }

      try {
        if (type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          // Ensure our tracks are on this PC before answering
          await syncLocalTracksToPeer(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("meeting:signal", {
            toSocketId: fromSocketId,
            signalData: answer,
            type: "answer",
          });
        } else if (type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        } else if (type === "ice-candidate") {
          if (signalData) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData));
          }
        }
      } catch (err) {
        console.error("Error processing WebRTC signal:", err);
      }
    };

    // Remote media state changed
    const handleMediaChanged = ({ socketId, audioEnabled, videoEnabled, isScreenSharing }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) {
          next.set(socketId, { ...p, audioEnabled, videoEnabled, isScreenSharing });
        }
        return next;
      });
    };

    // Remote hand raised
    const handleHandChanged = ({ socketId, name, handRaised }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) {
          next.set(socketId, { ...p, handRaised });
        }
        return next;
      });
      if (handRaised) {
        toast({
          title: "Hand Raised ✋",
          description: `${name} raised their hand`,
        });
      }
    };

    // Chat message received
    const handleChatBroadcast = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (activeTab !== "chat") {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    // Host force muted local user
    const handleForceMute = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
        setIsAudioEnabled(false);
        socket.emit("meeting:toggle-media", { roomCode: code, audioEnabled: false });
        toast({
          title: "Muted by Host",
          description: "The host has muted your microphone.",
        });
      }
    };

    // User was kicked by host
    const handleKicked = () => {
      alert("You have been removed from this meeting by the host.");
      handleLeaveMeeting();
    };

    // Meeting ended by host
    const handleMeetingEnded = ({ message }: any) => {
      alert(message || "The meeting has ended.");
      handleLeaveMeeting();
    };

    // Remote participant left
    const handleUserLeft = ({ socketId, name }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
      const pc = peerConnectionsRef.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(socketId);
      }
      if (name) {
        toast({
          title: "Participant Left",
          description: `${name} left the room`,
        });
      }
    };

    socket.on("meeting:existing-participants", handleExisting);
    socket.on("meeting:user-joined", handleUserJoined);
    socket.on("meeting:signal", handleSignal);
    socket.on("meeting:media-state-changed", handleMediaChanged);
    socket.on("meeting:hand-state-changed", handleHandChanged);
    socket.on("meeting:chat-broadcast", handleChatBroadcast);
    socket.on("meeting:force-mute", handleForceMute);
    socket.on("meeting:kicked", handleKicked);
    socket.on("meeting:ended", handleMeetingEnded);
    socket.on("meeting:user-left", handleUserLeft);

    const handleRemoteRecording = ({ recording, byName }: any) => {
      setRoomRecordingActive(Boolean(recording));
      if (recording) {
        toast({
          title: "Recording in progress",
          description: `${byName || "Someone"} started recording this meeting.`,
        });
      }
    };
    socket.on("meeting:recording-state", handleRemoteRecording);

    return () => {
      joinedRoomRef.current = false;
      socket.emit("meeting:leave", { roomCode: code });
      socket.off("meeting:existing-participants", handleExisting);
      socket.off("meeting:user-joined", handleUserJoined);
      socket.off("meeting:signal", handleSignal);
      socket.off("meeting:media-state-changed", handleMediaChanged);
      socket.off("meeting:hand-state-changed", handleHandChanged);
      socket.off("meeting:chat-broadcast", handleChatBroadcast);
      socket.off("meeting:force-mute", handleForceMute);
      socket.off("meeting:kicked", handleKicked);
      socket.off("meeting:ended", handleMeetingEnded);
      socket.off("meeting:user-left", handleUserLeft);
      socket.off("meeting:recording-state", handleRemoteRecording);

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- join once per room after media ready
  }, [socket, code, mediaReady, createPeerConnection, syncLocalTracksToPeer]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  // Toggle Microphone
  const toggleAudio = () => {
    const nextState = !isAudioEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextState;
    });
    rawCameraStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextState;
    });
    setIsAudioEnabled(nextState);
    if (socket && code) {
      socket.emit("meeting:toggle-media", {
        roomCode: code,
        audioEnabled: nextState,
      });
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    const nextState = !isVideoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextState;
    });
    rawCameraStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextState;
    });
    setIsVideoEnabled(nextState);
    if (socket && code) {
      socket.emit("meeting:toggle-media", {
        roomCode: code,
        videoEnabled: nextState,
      });
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      // Revert peer connections back to camera track
      const cameraTrack =
        localStreamRef.current?.getVideoTracks()[0] ||
        rawCameraStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(cameraTrack);
        });
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      if (bgMode !== "none") {
        startBgProcessor(bgMode).catch(() => {});
      }
      setIsScreenSharing(false);
      if (socket && code) {
        socket.emit("meeting:toggle-media", { roomCode: code, isScreenSharing: false });
      }
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // Replace track in peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);
        if (socket && code) {
          socket.emit("meeting:toggle-media", { roomCode: code, isScreenSharing: true });
        }
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socket && code) {
      socket.emit("meeting:raise-hand", {
        roomCode: code,
        handRaised: nextState,
      });
    }
  };

  // Send Chat Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !socket || !code) return;
    socket.emit("meeting:chat-message", {
      roomCode: code,
      text: chatInput.trim(),
    });
    setChatInput("");
  };

  // Host Action: Mute All
  const handleMuteAll = () => {
    if (!socket || !code || !isHost) return;
    socket.emit("meeting:host-action", { roomCode: code, action: "mute-all" });
    toast({ title: "Mute All Sent", description: "Requested all participants to mute." });
  };

  // Host Action: Kick Participant
  const handleKickParticipant = (targetSocketId: string) => {
    if (!socket || !code || !isHost) return;
    if (window.confirm("Are you sure you want to remove this participant?")) {
      socket.emit("meeting:host-action", { roomCode: code, action: "kick-user", targetSocketId });
    }
  };

  // Host Action: End Meeting for All
  const handleEndMeetingForAll = () => {
    if (!socket || !code || !isHost) return;
    if (window.confirm("End this meeting for all participants?")) {
      socket.emit("meeting:host-action", { roomCode: code, action: "end-meeting" });
      handleLeaveMeeting();
    }
  };

  const formatRecordingTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const buildMeetingCaptureStream = useCallback(async () => {
    const width = 1280;
    const height = 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable for recording");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    const connectAudio = (stream: MediaStream | null | undefined) => {
      if (!stream?.getAudioTracks().length) return;
      try {
        const src = audioCtx.createMediaStreamSource(stream);
        src.connect(dest);
      } catch {
        /* ignore duplicate / ended tracks */
      }
    };

    connectAudio(localStreamRef.current);
    remoteStreams.forEach((stream) => connectAudio(stream));

    let raf = 0;
    const paint = () => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      const remoteParticipants = Array.from(participants.values());
      const tiles: { el: HTMLVideoElement | null; label: string }[] = [
        { el: localVideoRef.current, label: `${currentUser.name} (You)` },
      ];
      remoteParticipants.forEach((p) => {
        tiles.push({
          el: remoteVideoElsRef.current.get(p.socketId) || null,
          label: p.name,
        });
      });

      const count = Math.max(1, tiles.length);
      const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
      const rows = Math.ceil(count / cols);
      const tileW = width / cols;
      const tileH = height / rows;

      tiles.forEach((tile, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = col * tileW;
        const y = row * tileH;
        const el = tile.el;

        if (el && el.readyState >= 2 && el.videoWidth > 0) {
          const scale = Math.max(tileW / el.videoWidth, tileH / el.videoHeight);
          const dw = el.videoWidth * scale;
          const dh = el.videoHeight * scale;
          const dx = x + (tileW - dw) / 2;
          const dy = y + (tileH - dh) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, tileW, tileH);
          ctx.clip();
          ctx.drawImage(el, dx, dy, dw, dh);
          ctx.restore();
        } else {
          ctx.fillStyle = "#171717";
          ctx.fillRect(x, y, tileW, tileH);
          ctx.fillStyle = "#a3a3a3";
          ctx.font = "28px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(tile.label.slice(0, 2).toUpperCase(), x + tileW / 2, y + tileH / 2);
        }

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x + 8, y + tileH - 36, Math.min(tileW - 16, 220), 24);
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(tile.label, x + 14, y + tileH - 19);
      });

      raf = requestAnimationFrame(paint);
    };
    paint();

    const videoStream = canvas.captureStream(20);
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const stop = () => {
      cancelAnimationFrame(raf);
      videoStream.getTracks().forEach((t) => t.stop());
      audioCtx.close().catch(() => {});
    };

    return { stream: combined, stop };
  }, [currentUser.name, participants, remoteStreams]);

  const uploadRecordingBlob = async (blob: Blob, durationSeconds: number) => {
    if (!code) return;
    setIsUploadingRecording(true);
    try {
      const form = new FormData();
      const fileName = `meeting-${code}-${Date.now()}.webm`;
      const mime = blob.type && blob.type.startsWith("video/") ? blob.type : "video/webm";
      const file = new File([blob], fileName, { type: mime });
      form.append("recording", file);
      form.append("durationSeconds", String(durationSeconds));

      await apiFetch(`/api/meetings/code/${encodeURIComponent(code)}/recording`, {
        method: "POST",
        body: form,
      });

      toast({
        title: "Recording saved",
        description: "You can play or download it from the Meetings page.",
      });
    } catch (err: any) {
      console.error("Recording upload failed:", err);
      // Fallback: local download so the recording is not lost
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-${code}-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Upload failed — downloaded locally",
        description: err?.message || "Could not save recording to the server.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingRecording(false);
    }
  };

  const stopMeetingRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingCleanupRef.current?.();
    recordingCleanupRef.current = null;
    mediaRecorderRef.current = null;

    const duration = recordingSecondsRef.current;
    setIsRecording(false);
    setRoomRecordingActive(false);
    if (socket && code) {
      socket.emit("meeting:recording-state", { roomCode: code, recording: false });
    }

    const chunks = recordingChunksRef.current;
    recordingChunksRef.current = [];
    if (!chunks.length) return;

    const blob = new Blob(chunks, { type: chunks[0]?.type || "video/webm" });
    await uploadRecordingBlob(blob, duration);
  }, [code, socket]);

  const startMeetingRecording = async () => {
    if (isRecording || isUploadingRecording) return;
    try {
      const { stream, stop } = await buildMeetingCaptureStream();
      recordingCleanupRef.current = stop;
      recordingChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.start(1000);
      setIsRecording(true);
      setRoomRecordingActive(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);

      if (socket && code) {
        socket.emit("meeting:recording-state", { roomCode: code, recording: true });
      }

      toast({
        title: "Recording started",
        description: "The meeting layout and audio are being recorded.",
      });
    } catch (err: any) {
      recordingCleanupRef.current?.();
      recordingCleanupRef.current = null;
      toast({
        title: "Could not start recording",
        description: err?.message || "Recording is not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const toggleMeetingRecording = () => {
    if (isRecording) {
      void stopMeetingRecording();
    } else {
      void startMeetingRecording();
    }
  };

  // Leave Meeting
  const handleLeaveMeeting = async () => {
    if (isRecording) {
      try {
        await stopMeetingRecording();
      } catch {
        /* continue leaving */
      }
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (rawCameraStreamRef.current) {
      rawCameraStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    stopBgProcessor();
    navigate(getMeetingsPathPrefix(location.pathname));
  };

  const handleSelectBackground = async (mode: BgMode) => {
    setBgMode(mode);
    setShowBgMenu(false);
    if (isScreenSharing) return;
    try {
      await startBgProcessor(mode);
    } catch (err) {
      console.warn("Background change failed:", err);
      toast({
        title: "Background unavailable",
        description: "Could not apply virtual background on this device.",
        variant: "destructive",
      });
    }
  };

  const stopCaptions = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setCaptionText("");
  };

  const startCaptions = (lang: string) => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast({
        title: "Captions not supported",
        description: "Live captions require Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      setCaptionsEnabled(false);
      return;
    }

    stopCaptions();
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      setCaptionText((finalText || interim).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone blocked",
          description: "Allow microphone access to use captions.",
          variant: "destructive",
        });
        setCaptionsEnabled(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart while captions remain enabled
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          /* ignore */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn("Caption start failed:", err);
    }
  };

  const toggleCaptions = () => {
    if (captionsEnabled) {
      stopCaptions();
      setCaptionsEnabled(false);
      setShowCaptionLangMenu(false);
    } else {
      setCaptionsEnabled(true);
      startCaptions(captionLanguage);
    }
  };

  const handleCaptionLanguageChange = (lang: string) => {
    setCaptionLanguage(lang);
    setShowCaptionLangMenu(false);
    if (captionsEnabled) {
      startCaptions(lang);
    }
  };

  // Copy meeting link
  const copyMeetingLink = async () => {
    const url = `${window.location.origin}/join/meeting/${code}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({ title: "Link Copied", description: "Meeting link copied to clipboard!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const participantList = Array.from(participants.values());
  const totalInRoom = participantList.length + 1;

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">
              {meetingData?.title || `Room: ${code}`}
            </h1>
          </div>
          <Badge variant="outline" className="border-neutral-700 bg-neutral-800/80 text-xs text-neutral-300 font-mono hidden sm:inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-neutral-400" />
            {formatTimer(elapsedSeconds)}
          </Badge>
          {isHost && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] hidden md:inline-flex items-center gap-1">
              <Shield className="w-3 h-3" /> Host
            </Badge>
          )}
          {(isRecording || roomRecordingActive) && (
            <Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 animate-pulse inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              REC {isRecording ? formatRecordingTimer(recordingSeconds) : ""}
            </Badge>
          )}
          {isUploadingRecording && (
            <Badge className="bg-indigo-600/30 text-indigo-200 border-indigo-500/40 text-[10px] inline-flex items-center gap-1">
              <Upload className="w-3 h-3 animate-pulse" /> Saving…
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Room Code & Copy */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyMeetingLink}
            className="h-8 border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-200 text-xs gap-1.5"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-mono">{code}</span>
          </Button>

          {/* Grid / Speaker View toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setViewMode((v) => (v === "grid" ? "speaker" : "grid"))}
            title={viewMode === "grid" ? "Switch to Speaker View" : "Switch to Grid View"}
            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>

          {/* Fullscreen toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Stage */}
        <main className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-auto bg-black/40 relative">
          {cameraError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {!mediaReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 text-sm text-neutral-300">
              Enabling camera & microphone...
            </div>
          )}

          {captionsEnabled && captionText && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-3xl w-[90%] pointer-events-none">
              <div className="bg-black/75 backdrop-blur-md text-white text-sm sm:text-base px-4 py-2.5 rounded-xl text-center border border-white/10 shadow-lg">
                {captionText}
              </div>
            </div>
          )}

          {/* Grid Mode View */}
          <div
            className={`w-full h-full grid gap-2 sm:gap-3 items-center justify-center ${
              totalInRoom === 1
                ? "grid-cols-1 max-w-4xl max-h-[85vh]"
                : totalInRoom === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
                : totalInRoom <= 4
                ? "grid-cols-2 max-w-5xl"
                : totalInRoom <= 6
                ? "grid-cols-2 md:grid-cols-3 max-w-6xl"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl"
            }`}
          >
            {/* Local Video Tile */}
            <div
              className={`relative bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border-2 transition-all duration-200 aspect-video w-full h-full max-h-[75vh] ${
                speakingSockets.has("local")
                  ? "border-emerald-500 shadow-emerald-500/20"
                  : "border-neutral-800"
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  // Mirror only raw camera. Virtual-BG canvas already handles orientation
                  // so CSS flip would invert the person + scene.
                  isScreenSharing || bgMode !== "none" ? "" : "-scale-x-100"
                } ${!isVideoEnabled && !isScreenSharing ? "hidden" : "block"}`}
              />

              {!isVideoEnabled && !isScreenSharing && (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl sm:text-2xl font-bold uppercase shadow-lg shadow-indigo-500/30">
                    {currentUser.name.slice(0, 2)}
                  </div>
                  <span className="text-xs text-neutral-400">Camera is off</span>
                </div>
              )}

              {/* Bottom Tile Info Badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium border border-white/10">
                <span>{currentUser.name} (You)</span>
                {isHost && <span className="text-[10px] text-amber-400 font-semibold">• Host</span>}
                {!isAudioEnabled ? (
                  <MicOff className="w-3 h-3 text-rose-400 ml-0.5" />
                ) : (
                  <Mic className="w-3 h-3 text-emerald-400 ml-0.5" />
                )}
              </div>

              {/* Hand raised indicator */}
              {isHandRaised && (
                <div className="absolute top-2 right-2 bg-amber-500/90 text-black px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
                  ✋ Hand Raised
                </div>
              )}
            </div>

            {/* Remote Participants Video Tiles */}
            {participantList.map((p) => {
              const stream = remoteStreams.get(p.socketId);
              const isSpeaking = speakingSockets.has(p.socketId);

              return (
                <RemoteVideoTile
                  key={p.socketId}
                  participant={p}
                  stream={stream}
                  isSpeaking={isSpeaking}
                  isHostUser={isHost}
                  onKick={() => handleKickParticipant(p.socketId)}
                  onVideoEl={(el) => {
                    if (el) remoteVideoElsRef.current.set(p.socketId, el);
                    else remoteVideoElsRef.current.delete(p.socketId);
                  }}
                />
              );
            })}
          </div>
        </main>

        {/* Side Panel: Participants or Chat */}
        {activeTab && (
          <aside className="w-80 sm:w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full z-20 shrink-0 animate-in slide-in-from-right duration-200">
            {/* Panel Header */}
            <div className="h-12 border-b border-neutral-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeTab === "participants" ? (
                  <>
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-semibold">Participants ({totalInRoom})</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-semibold">In-Meeting Chat</span>
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab(null)}
                className="h-7 w-7 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Panel Body: Participants */}
            {activeTab === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isHost && (
                  <div className="mb-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMuteAll}
                      className="w-full text-xs border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 gap-1.5"
                    >
                      <VolumeX className="w-3.5 h-3.5" /> Mute All
                    </Button>
                  </div>
                )}

                {/* Self entry */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                      {currentUser.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-medium flex items-center gap-1.5">
                        {currentUser.name} <span className="text-[10px] text-neutral-400">(You)</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 capitalize">{currentUser.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    {isAudioEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                    {isVideoEnabled ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-neutral-500" />}
                  </div>
                </div>

                {/* Remote Participants */}
                {participantList.map((p) => (
                  <div
                    key={p.socketId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/30 border border-neutral-800 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold uppercase">
                        {p.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-medium flex items-center gap-1.5">
                          {p.name}
                          {p.isHost && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-mono">Host</span>}
                        </div>
                        <div className="text-[10px] text-neutral-400 capitalize">{p.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.handRaised && <span title="Hand Raised">✋</span>}
                      {p.audioEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                      {p.videoEnabled ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-neutral-500" />}
                      {isHost && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleKickParticipant(p.socketId)}
                          title="Remove from meeting"
                          className="h-6 w-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Panel Body: Chat */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-2">
                      <MessageSquare className="w-8 h-8 text-neutral-600" />
                      <p>No messages yet.</p>
                      <p className="text-[10px] text-neutral-600">Messages sent here are visible to everyone in the meeting.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === currentUser.id || m.senderSocketId === socket?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-0.5">
                            <span className="font-medium text-neutral-300">{isMe ? "You" : m.senderName}</span>
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div
                            className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                              isMe
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/50"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-800 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-neutral-800 border-neutral-700 text-xs h-9 text-white placeholder:text-neutral-500"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3 bg-indigo-600 hover:bg-indigo-500">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Zoom-style Control Toolbar */}
      <footer className="h-20 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 flex items-center justify-between px-3 sm:px-6 z-40 shrink-0 relative">
        {/* Left: Audio & Video Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mic button */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl transition-all ${
              isAudioEnabled
                ? "text-neutral-200 hover:bg-neutral-800"
                : "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-1">{isAudioEnabled ? "Mute" : "Unmute"}</span>
          </button>

          {/* Camera button */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl transition-all ${
              isVideoEnabled
                ? "text-neutral-200 hover:bg-neutral-800"
                : "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
            }`}
          >
            {isVideoEnabled ? <Video className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-1">Camera</span>
          </button>

          {/* Background */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowBgMenu((v) => !v);
                setShowCaptionLangMenu(false);
              }}
              className={`flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl transition-all ${
                bgMode !== "none"
                  ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                  : "text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">BG</span>
            </button>
            {showBgMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-2.5 z-50">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 px-1 pb-2">
                  Virtual background
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BG_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectBackground(opt.id)}
                      className={`group relative overflow-hidden rounded-lg border text-left transition ${
                        bgMode === opt.id
                          ? "border-indigo-400 ring-1 ring-indigo-400/50"
                          : "border-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      <div
                        className="h-14 w-full bg-cover bg-center"
                        style={{
                          backgroundImage: opt.image
                            ? `url(${opt.image})`
                            : opt.preview || undefined,
                          backgroundColor: "#27272a",
                        }}
                      />
                      <div className="px-2 py-1.5 bg-neutral-900/95">
                        <span
                          className={`text-[10px] font-medium ${
                            bgMode === opt.id ? "text-indigo-300" : "text-neutral-300"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Collaboration Controls (Screen Share, Participants, Chat, Hand, Captions) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-16 sm:h-16 rounded-xl transition-all ${
              isScreenSharing
                ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <ScreenShare className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1 hidden sm:inline">{isScreenSharing ? "Sharing" : "Share"}</span>
          </button>

          {/* Participants */}
          <button
            type="button"
            onClick={() => setActiveTab((t) => (t === "participants" ? null : "participants"))}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-16 sm:h-16 rounded-xl relative transition-all ${
              activeTab === "participants"
                ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                : "text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1 hidden sm:inline">People</span>
            <span className="absolute top-1.5 right-1.5 sm:right-2.5 bg-neutral-700 text-white text-[9px] font-mono px-1 rounded-full">
              {totalInRoom}
            </span>
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={() => {
              setActiveTab((t) => (t === "chat" ? null : "chat"));
              setUnreadChatCount(0);
            }}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-16 sm:h-16 rounded-xl relative transition-all ${
              activeTab === "chat"
                ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                : "text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1 hidden sm:inline">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 sm:right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={toggleHandRaise}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-16 sm:h-16 rounded-xl transition-all ${
              isHandRaised
                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <Hand className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1 hidden sm:inline">{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
          </button>

          {/* Record */}
          <button
            type="button"
            onClick={toggleMeetingRecording}
            disabled={isUploadingRecording}
            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-16 sm:h-16 rounded-xl transition-all ${
              isRecording
                ? "text-rose-400 bg-rose-500/15 hover:bg-rose-500/25"
                : "text-neutral-200 hover:bg-neutral-800"
            } disabled:opacity-50`}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5 text-rose-500 fill-rose-500" />}
            <span className="text-[10px] font-medium mt-1 hidden sm:inline">
              {isUploadingRecording ? "Saving" : isRecording ? "Stop" : "Record"}
            </span>
          </button>

          {/* Captions */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={toggleCaptions}
              className={`flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl transition-all ${
                captionsEnabled
                  ? "text-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
                  : "text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              <Captions className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1 hidden sm:inline">Caption</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCaptionLangMenu((v) => !v);
                setShowBgMenu(false);
              }}
              title="Caption language"
              className="hidden sm:flex flex-col items-center justify-center w-8 h-14 sm:h-16 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <Languages className="w-4 h-4" />
            </button>
            {showCaptionLangMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-52 max-h-64 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-2 z-50">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 px-2 pb-1.5">Caption language</div>
                {CAPTION_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleCaptionLanguageChange(lang.code)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs text-left transition ${
                      captionLanguage === lang.code
                        ? "bg-sky-600/30 text-sky-200"
                        : "hover:bg-neutral-800 text-neutral-200"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: End / Leave Button */}
        <div className="flex items-center gap-2 pr-1">
          {isHost ? (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="destructive"
                onClick={handleEndMeetingForAll}
                className="h-10 px-3 sm:px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="hidden sm:inline">End for All</span>
                <span className="sm:hidden">End</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLeaveMeeting}
                className="h-10 border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs hidden md:inline-flex"
              >
                Leave
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={handleLeaveMeeting}
              className="h-10 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 gap-1.5 shadow-lg shadow-rose-600/30"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave</span>
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

// Remote Participant Video Tile Sub-component
function RemoteVideoTile({
  participant,
  stream,
  isSpeaking,
  isHostUser,
  onKick,
  onVideoEl,
}: {
  participant: ParticipantInfo;
  stream?: MediaStream;
  isSpeaking: boolean;
  isHostUser: boolean;
  onKick: () => void;
  onVideoEl?: (el: HTMLVideoElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    onVideoEl?.(videoRef.current);
    return () => onVideoEl?.(null);
  }, [onVideoEl, stream]);

  const hasVideo = participant.videoEnabled !== false && Boolean(stream && stream.getVideoTracks().length > 0);

  return (
    <div
      className={`relative bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border-2 transition-all duration-200 aspect-video w-full h-full max-h-[75vh] ${
        isSpeaking ? "border-emerald-500 shadow-emerald-500/20" : "border-neutral-800"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${participant.isScreenSharing ? "" : "-scale-x-100"} ${
          hasVideo ? "block" : "hidden"
        }`}
      />

      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-600 flex items-center justify-center text-xl sm:text-2xl font-bold uppercase shadow-lg">
            {participant.name.slice(0, 2)}
          </div>
          <span className="text-xs text-neutral-400">Camera is off</span>
        </div>
      )}

      {/* Bottom Name & Mic status badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium border border-white/10">
        <span>{participant.name}</span>
        {participant.isHost && <span className="text-[10px] text-amber-400 font-semibold">• Host</span>}
        {!participant.audioEnabled ? (
          <MicOff className="w-3 h-3 text-rose-400 ml-0.5" />
        ) : (
          <Mic className="w-3 h-3 text-emerald-400 ml-0.5" />
        )}
      </div>

      {/* Hand Raised badge */}
      {participant.handRaised && (
        <div className="absolute top-2 right-2 bg-amber-500/90 text-black px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
          ✋ Hand Raised
        </div>
      )}
    </div>
  );
}
