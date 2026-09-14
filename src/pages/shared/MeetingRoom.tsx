import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { getAuthState } from "@/lib/auth";
import { getEmployeeAuth } from "@/Employee/lib/auth";
import { apiFetch, getApiBaseUrl } from "@/lib/admin/apiClient";
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
  UserCheck,
  Volume2,
  VolumeX,
  Send,
  X,
  Shield,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

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

export default function MeetingRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

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

  // Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

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
      ["super-admin", "admin"].includes(currentUser.role)
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

  // Initialize camera and microphone
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

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

              if (avg > 25 && isAudioEnabled) {
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
      } catch (err: any) {
        console.warn("Camera/mic permission denied or unavailable:", err);
        setCameraError("Camera or Microphone permission was not granted. You can still participate using text chat.");
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Socket.io room lifecycle & WebRTC signaling listeners
  useEffect(() => {
    if (!socket || !code) return;

    // Join room
    socket.emit("meeting:join", {
      roomCode: code,
      userId: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      isHost,
    });

    // Existing participants received on join
    const handleExisting = ({ participants: existingList, self }: any) => {
      const map = new Map<string, ParticipantInfo>();
      existingList.forEach((p: ParticipantInfo) => {
        map.set(p.socketId, p);
        // Create offer to existing participant
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

    return () => {
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

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [socket, code, currentUser, isHost, createPeerConnection, toast]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  // Toggle Microphone
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const nextState = !isAudioEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => {
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
    if (!localStreamRef.current) return;
    const nextState = !isVideoEnabled;
    localStreamRef.current.getVideoTracks().forEach((track) => {
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
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(cameraTrack);
        });
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
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

  // Leave Meeting
  const handleLeaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    const pathPrefix = location.pathname.startsWith("/employee")
      ? "/employee/meetings"
      : location.pathname.startsWith("/manger")
      ? "/manger/meetings"
      : "/admin/meetings";
    navigate(pathPrefix);
  };

  // Copy meeting link
  const copyMeetingLink = async () => {
    const url = window.location.href;
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
        <main className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-auto bg-black/40">
          {cameraError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
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
                  isScreenSharing ? "" : "-scale-x-100"
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
      <footer className="h-20 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 flex items-center justify-between px-3 sm:px-6 z-30 shrink-0">
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

          {/* Video button */}
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
            <span className="text-[10px] font-medium mt-1">{isVideoEnabled ? "Stop Video" : "Start Video"}</span>
          </button>
        </div>

        {/* Center: Collaboration Controls (Screen Share, Participants, Chat, Hand) */}
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
        </div>

        {/* Right: End / Leave Button */}
        <div className="flex items-center gap-2">
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
}: {
  participant: ParticipantInfo;
  stream?: MediaStream;
  isSpeaking: boolean;
  isHostUser: boolean;
  onKick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
