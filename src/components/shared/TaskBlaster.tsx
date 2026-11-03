import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";
import { 
  Sparkles, 
  Star, 
  Zap, 
  Trophy, 
  Target, 
  CheckCircle2, 
  X,
  Award,
  Crown,
  Gem
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_TIME = 3000; // 3 seconds

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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { uiTheme } = useTheme();
  
  const isMetallic = uiTheme.theme === "metallic-elite";
  const reduceMotion = uiTheme.animationSettings?.reduceMotion;

  const { isVisible, task, settings } = state;

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const colors = useMemo(() => {
    if (isMetallic) {
      return ["#ffd27a", "#c89537", "#f59e0b", "#f97316", "#ffffff"];
    }
    switch (task?.priority) {
      case "top":
      case "red":
        return ["#f59e0b", "#f97316", "#ef4444", "#eab308", "#fb923c"];
      case "high":
        return ["#a855f7", "#ec4899", "#8b5cf6", "#d946ef", "#c084fc"];
      default:
        return ["#10b981", "#14b8a6", "#22c55e", "#34d399", "#06b6d4"];
    }
  }, [task?.priority, isMetallic]);

  // Play sound effect if enabled
  useEffect(() => {
    if (isVisible && settings.soundEnabled && !reduceMotion) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
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
  }, [isVisible, settings.soundEnabled, reduceMotion]);

  // Generate confetti particles and floating elements
  useEffect(() => {
    if (!isVisible) return;

    const particleCount = reduceMotion ? 0 : (isMobile ? 30 : isTablet ? 40 : 50);
    const floatingCount = reduceMotion ? 0 : (isMobile ? 10 : isTablet ? 15 : 20);

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * (isMobile ? 400 : 800),
      y: (Math.random() - 0.5) * (isMobile ? 300 : 600) - (isMobile ? 100 : 200),
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);

    const newFloating: FloatingElement[] = Array.from({ length: floatingCount }, (_, i) => ({
      id: Date.now() + i + 1000,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (isMobile ? 40 : 60) + (isMobile ? 15 : 20),
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 1,
    }));
    setFloatingElements(newFloating);

    const timer = setTimeout(() => {
      setParticles([]);
      setFloatingElements([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isVisible, colors, isMobile, isTablet, reduceMotion]);

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

    const explosionCount = reduceMotion ? 0 : (isMobile ? 20 : 30);
    const explosionParticles: Particle[] = Array.from({ length: explosionCount }, (_, i) => {
      const angle = (i / explosionCount) * Math.PI * 2;
      const distance = (isMobile ? 100 : 150) + Math.random() * (isMobile ? 150 : 200);
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
  }, [isPopped, popBlaster, colors, isMobile, reduceMotion]);

  const handleIgnore = useCallback(() => {
    dismissBlaster();
  }, [dismissBlaster]);

  const getIcon = () => {
    if (isMetallic) {
      return (
        <div className="relative flex items-center justify-center">
          <Target className={cn(
            "text-[#ffd27a]",
            isMobile ? "w-20 h-20 animate-spin" : isTablet ? "w-28 h-28 animate-spin" : "w-36 h-36 animate-spin"
          )} style={{ animationDuration: reduceMotion ? "0s" : "20s" }} />
          <Zap className={cn(
            "absolute text-[#ffd27a] w-8 h-8 sm:w-10 sm:h-10",
            !reduceMotion && "animate-bounce"
          )} />
        </div>
      );
    }
    return (
      <Trophy className={isMobile ? "w-16 h-16" : isTablet ? "w-24 h-24" : "w-32 h-32"} />
    );
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

  const circleSize = isMobile ? "w-24 h-24" : isTablet ? "w-32 h-32" : "w-40 h-40";
  const cardWidth = isMobile ? "w-[90%] max-w-[320px]" : "max-w-md";

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
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleIgnore}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </motion.button>

          {/* Animated background gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/60 to-black/40 backdrop-blur-md"
          />

          {/* Animated radial glow */}
          {!reduceMotion && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, isMobile ? 1.3 : 1.5, isMobile ? 1.6 : 2], 
                opacity: [0.3, 0.2, 0],
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-gradient-to-r from-white/20 to-transparent"
            />
          )}

          {/* Floating background elements */}
          {floatingElements.map((el) => (
            <motion.div
              key={el.id}
              initial={{ opacity: 0, scale: 0, y: 100 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.8],
                y: [-50, -150, -250],
                x: [0, Math.random() * 80 - 40, Math.random() * 160 - 80],
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
                y: particle.y + (isMobile ? 200 : 300),
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
                className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-sm shadow-lg`}
                style={{ 
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${isMobile ? 8 : 10}px ${particle.color}`,
                }}
              />
            </motion.div>
          ))}

          {/* Main celebration container */}
          <motion.div
            initial={{ scale: 0, y: 200, opacity: 0 }}
            animate={{ 
              scale: isPopped ? [1, 1.5, 0] : 1,
              y: isPopped ? [0, -100] : [0, -20, -40, -20],
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
            className="relative flex flex-col items-center justify-center cursor-pointer pointer-events-auto"
          >
            {/* Outer glow rings */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: reduceMotion ? 0 : Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                `absolute inset-0 ${isMobile ? '-m-4' : '-m-8'} rounded-full blur-2xl`,
                isMetallic
                  ? "bg-gradient-to-r from-[#ffd27a] to-[#c89537]"
                  : `bg-gradient-to-r ${getGradient()}`
              )}
            />
            
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
                rotate: reduceMotion ? [0, 0] : [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: reduceMotion ? 0 : Infinity,
                ease: "linear",
              }}
              className={cn(
                `absolute inset-0 ${isMobile ? '-m-6' : '-m-12'} rounded-full border-2 sm:border-4 border-dashed`,
                isMetallic ? "border-[#ffd27a]/30" : "border-white/30"
              )}
            />

            {/* Scanning beam for metallic target lock */}
            {isMetallic && !reduceMotion && (
              <motion.div 
                className="absolute left-0 right-0 pointer-events-none z-10"
                style={{
                  background: "linear-gradient(to bottom, transparent, rgba(255, 210, 122, 0.5) 50%, transparent)",
                  height: '10px',
                  width: '100%',
                }}
                animate={{
                  top: ['0%', '100%', '0%']
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}

            {/* Main circle */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={reduceMotion ? {} : {
                boxShadow: [
                  "0 0 20px rgba(255,255,255,0.3)",
                  "0 0 40px rgba(255,255,255,0.6)",
                  "0 0 60px rgba(255,255,255,0.4)",
                  "0 0 20px rgba(255,255,255,0.3)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
              className={cn(
                `relative ${circleSize} rounded-full flex items-center justify-center text-white shadow-2xl border-2 sm:border-4`,
                isMetallic
                  ? "bg-gradient-to-br from-[#2b2c2d] to-[#111315] border-[#ffd27a]/45 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),_0_10px_25px_rgba(0,0,0,0.8)]"
                  : `bg-gradient-to-br ${getGradient()} border-white/50`
              )}
            >
                <motion.div
                  animate={reduceMotion ? {} : { 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  {getIcon()}
                </motion.div>
            </motion.div>

            {/* Pulse rings */}
            {!reduceMotion && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: isMobile ? 2 : 2.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={cn("absolute inset-0 rounded-full border-2", isMetallic ? "border-[#ffd27a]/40" : "border-white/50")}
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: isMobile ? 2.5 : 3, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  className={cn("absolute inset-0 rounded-full border-2", isMetallic ? "border-[#ffd27a]/20" : "border-white/30")}
                />
              </>
            )}
          </motion.div>

          {/* Task info card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={cn(
              `absolute ${isMobile ? 'bottom-16' : 'bottom-1/4'} left-1/2 -translate-x-1/2 ${cardWidth} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl border-2`,
              isMetallic
                ? "bg-gradient-to-br from-[#2b2c2d] via-[#1c1d1f] to-[#111315] border-[#ffd27a]/45 text-white"
                : "bg-white/95 backdrop-blur-md border-white/50"
            )}
          >
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className={cn(
                  `${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full flex items-center justify-center shadow-lg p-1`,
                  isMetallic 
                    ? "bg-[#111315] border border-[#ffd27a]/30 text-[#ffd27a]"
                    : "bg-white text-green-500"
                )}
              >
                <CheckCircle2 className="w-[60%] h-auto" />
              </motion.div>
              <div className="text-center">
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={cn(
                    `${isMobile ? 'text-lg' : 'text-xl'} font-bold`,
                    isMetallic ? "text-[#ffd27a]" : "text-gray-900"
                  )}
                >
                  Task Completed!
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={cn(
                    `${isMobile ? 'text-sm' : 'text-base'} mt-1 sm:mt-2 ${isMobile ? 'max-w-[200px]' : 'max-w-[280px]'} mx-auto`,
                    isMetallic ? "text-[#cfd7dc]" : "text-gray-600"
                  )}
                >
                  {task?.title}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className={cn(
                    `${isMobile ? 'text-xs' : 'text-sm'} mt-2 sm:mt-3`,
                    isMetallic ? "text-[#ffd27a]/60" : "text-gray-400"
                  )}
                >
                  {isMobile ? 'Tap to pop! ✨' : 'Click the celebration to pop! ✨'}
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Corner decorations - responsive */}
          {!reduceMotion && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  `absolute ${isMobile ? 'top-2 left-2' : 'top-6 sm:top-10 left-6 sm:left-10'}`,
                  isMetallic ? "text-[#ffd27a]" : "text-yellow-400"
                )}
              >
                <Sparkles className={isMobile ? "w-5 h-5" : "w-6 h-6 sm:w-8 sm:h-8"} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  `absolute ${isMobile ? 'top-2 right-2' : 'top-6 sm:top-10 right-6 sm:right-10'}`,
                  isMetallic ? "text-[#ffd27a]" : "text-pink-400"
                )}
              >
                <Star className={isMobile ? "w-5 h-5" : "w-6 h-6 sm:w-8 sm:h-8"} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className={cn(
                  `absolute ${isMobile ? 'bottom-2 left-2' : 'bottom-6 sm:bottom-10 left-6 sm:left-10'}`,
                  isMetallic ? "text-[#ffd27a]" : "text-cyan-400"
                )}
              >
                <Zap className={isMobile ? "w-5 h-5" : "w-6 h-6 sm:w-8 sm:h-8"} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className={cn(
                  `absolute ${isMobile ? 'bottom-2 right-2' : 'bottom-6 sm:bottom-10 right-6 sm:right-10'}`,
                  isMetallic ? "text-[#ffd27a]" : "text-purple-400"
                )}
              >
                <Trophy className={isMobile ? "w-5 h-5" : "w-6 h-6 sm:w-8 sm:h-8"} />
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}