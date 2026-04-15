import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";
import { Sparkles, Star, Zap, Trophy, Target, CheckCircle2 } from "lucide-react";

const AUTO_DISMISS_TIME = 2000; // 2 seconds

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function TaskBlaster() {
  const { state, dismissBlaster, popBlaster } = useTaskBlasterContext();
  const [isPopped, setIsPopped] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([]);

  const { isVisible, task, settings } = state;

  const colors = useMemo(() => {
    switch (task?.priority) {
      case "top":
      case "red":
        return ["#f59e0b", "#f97316", "#ef4444", "#eab308"];
      case "high":
        return ["#a855f7", "#ec4899", "#8b5cf6", "#d946ef"];
      default:
        return ["#10b981", "#14b8a6", "#22c55e", "#34d399"];
    }
  }, [task?.priority]);

  // Play sound effect if enabled
  useEffect(() => {
    if (isVisible && settings.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a celebratory chord
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C major chord
        frequencies.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
          
          oscillator.start(audioContext.currentTime + i * 0.1);
          oscillator.stop(audioContext.currentTime + 0.8);
        });
      } catch {
        // Ignore audio errors
      }
    }
  }, [isVisible, settings.soundEnabled]);

  // Generate confetti particles and floating elements
  useEffect(() => {
    if (!isVisible) return;

    // Generate 50 confetti particles
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600 - 200,
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);

    // Generate floating background elements
    const newFloating: FloatingElement[] = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i + 1000,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 60 + 20,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 1,
    }));
    setFloatingElements(newFloating);

    // Clear after animation
    const timer = setTimeout(() => {
      setParticles([]);
      setFloatingElements([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isVisible, colors]);

  // Auto dismiss
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      if (!isPopped) {
        dismissBlaster();
      }
    }, AUTO_DISMISS_TIME);

    return () => clearTimeout(timer);
  }, [isVisible, isPopped, dismissBlaster]);

  const handleClick = useCallback(() => {
    if (isPopped) return;

    setIsPopped(true);

    // Generate explosion particles
    const explosionParticles: Particle[] = Array.from({ length: 30 }, (_, i) => {
      const angle = (i / 30) * Math.PI * 2;
      const distance = 150 + Math.random() * 200;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotation: Math.random() * 360,
        scale: Math.random() * 1.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: 0,
      };
    });
    setParticles(explosionParticles);

    setTimeout(() => {
      setParticles([]);
      popBlaster();
      setIsPopped(false);
    }, 800);
  }, [isPopped, popBlaster, colors]);

  const handleIgnore = useCallback(() => {
    dismissBlaster();
  }, [dismissBlaster]);

  const getIcon = () => {
    switch (task?.priority) {
      case "top":
      case "red":
        return <Trophy className="w-12 h-12" />;
      case "high":
        return <Zap className="w-12 h-12" />;
      default:
        return <Star className="w-12 h-12" />;
    }
  };

  const getGradient = () => {
    switch (task?.priority) {
      case "top":
      case "red":
        return "from-amber-400 via-orange-500 to-red-500";
      case "high":
        return "from-purple-400 via-pink-500 to-rose-500";
      default:
        return "from-emerald-400 via-teal-500 to-cyan-500";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto overflow-hidden"
          onClick={handleIgnore}
        >
          {/* Animated background gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/60 to-black/40 backdrop-blur-md"
          />

          {/* Animated radial glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.5, 2], 
              opacity: [0.3, 0.2, 0],
            }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-white/20 to-transparent"
          />

          {/* Floating background elements */}
          {floatingElements.map((el) => (
            <motion.div
              key={el.id}
              initial={{ opacity: 0, scale: 0, y: 100 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.8],
                y: [-50, -200, -300],
                x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100],
              }}
              transition={{ 
                duration: el.duration,
                delay: el.delay,
                ease: "easeOut",
              }}
              className="absolute pointer-events-none"
              style={{ left: `${el.x}%`, top: `${el.y}%` }}
            >
              <Star 
                className="text-white/40"
                style={{ width: el.size, height: el.size }}
              />
            </motion.div>
          ))}

          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0, 
                opacity: 1,
                rotate: 0,
              }}
              animate={{ 
                scale: [0, particle.scale, 0],
                x: particle.x,
                y: particle.y + 300,
                opacity: [1, 1, 0],
                rotate: particle.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5,
                delay: particle.delay,
                ease: "easeOut",
              }}
              className="absolute top-1/2 left-1/2 pointer-events-none"
            >
              <div
                className="w-4 h-4 rounded-sm shadow-lg"
                style={{ 
                  backgroundColor: particle.color,
                  boxShadow: `0 0 10px ${particle.color}`,
                }}
              />
            </motion.div>
          ))}

          {/* Main celebration container */}
          <motion.div
            initial={{ scale: 0, y: 200, opacity: 0 }}
            animate={{ 
              scale: isPopped ? [1, 1.5, 0] : 1,
              y: isPopped ? [0, -100] : [0, -30, -50, -30],
              opacity: isPopped ? [1, 1, 0] : 1,
            }}
            exit={{ scale: 0, y: 100, opacity: 0 }}
            transition={{
              scale: { duration: 0.3 },
              y: { 
                duration: isPopped ? 0.5 : 2,
                times: isPopped ? [0, 0.5, 1] : [0, 0.3, 0.6, 1],
                ease: "easeOut",
              },
              opacity: { duration: 0.3 },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="relative cursor-pointer pointer-events-auto"
          >
            {/* Outer glow rings */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute inset-0 -m-8 rounded-full bg-gradient-to-r ${getGradient()} blur-2xl`}
            />
            
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className={`absolute inset-0 -m-12 rounded-full border-4 border-dashed border-white/30`}
            />

            {/* Main circle */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                boxShadow: [
                  "0 0 30px rgba(255,255,255,0.3)",
                  "0 0 60px rgba(255,255,255,0.6)",
                  "0 0 100px rgba(255,255,255,0.4)",
                  "0 0 30px rgba(255,255,255,0.3)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
              className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white shadow-2xl border-4 border-white/50`}
            >
              {isPopped ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sparkles className="w-16 h-16" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  {getIcon()}
                </motion.div>
              )}
            </motion.div>

            {/* Pulse rings */}
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-white/50"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-white/30"
            />
          </motion.div>

          {/* Task info card - larger and centered below */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-md border-2 border-white/50"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className={`w-16 h-16 rounded-full bg-gradient-to-r ${getGradient()} flex items-center justify-center text-white shadow-lg`}
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
              <div className="text-center">
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-bold text-gray-900"
                >
                  Task Completed!
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-base text-gray-600 mt-2 max-w-[280px]"
                >
                  {task?.title}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-gray-400 mt-3"
                >
                  Click the celebration to pop! ✨
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Corner sparkles */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-10 left-10 text-yellow-400"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute top-10 right-10 text-pink-400"
          >
            <Star className="w-8 h-8" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-10 left-10 text-cyan-400"
          >
            <Zap className="w-8 h-8" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-10 right-10 text-purple-400"
          >
            <Trophy className="w-8 h-8" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
