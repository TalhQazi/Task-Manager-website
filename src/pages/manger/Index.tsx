import { motion } from "framer-motion";
import { Sparkles, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/manger/ui/button";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.8,
    },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      delay: 0.3,
      duration: 0.8,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      delay: 0.6,
    },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const iconVariants = {
  hidden: { rotate: -180, opacity: 0 },
  visible: {
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: 0.4,
    },
  },
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
};

const sparkleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: [0, 1.2, 1],
    opacity: [0, 1, 0.8],
    transition: {
      delay: i * 0.2 + 0.5,
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 1,
    },
  }),
};

const Index = () => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
        />
        
        {/* Floating sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={sparkleVariants}
            initial="hidden"
            animate="visible"
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            <Sparkles className="w-4 h-4 text-primary/30" />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        {/* Icon */}
        <motion.div
          variants={iconVariants}
          animate={["visible", "float"]}
          className="mb-6 inline-block"
        >
          <div className="p-4 rounded-2xl bg-primary/10 text-primary">
            <Rocket className="w-12 h-12" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={titleVariants}
          className="mb-4 text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
        >
          Welcome to Your
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="block text-primary"
          >
            Blank App
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={subtitleVariants}
          className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Start building your amazing project here!
        </motion.p>

        {/* Button */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="inline-block"
        >
          <Button
            size="lg"
            className="gap-2 text-lg px-8 py-6 rounded-full group"
            onClick={() => {
              // Add your navigation or action here
              console.log("Get started clicked!");
            }}
          >
            <span>Get Started</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </Button>
        </motion.div>

        {/* Decorative text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-8 text-sm text-muted-foreground/60"
        >
          ✨ Ready to create something amazing
        </motion.p>
      </div>

      {/* Bottom gradient line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 1, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
      />
    </motion.div>
  );
};

export default Index;