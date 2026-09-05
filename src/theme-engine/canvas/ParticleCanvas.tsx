import React, { useEffect, useRef } from "react";
import { ParticleType } from "../types";

interface ParticleCanvasProps {
  particleType: ParticleType;
  particleColors: string[];
  particleSpeed?: number;
  particleCap?: number;
  enabled?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  phase: number;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  particleType,
  particleColors,
  particleSpeed = 1.0,
  particleCap = 30,
  enabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!enabled || particleType === "none" || particleCap <= 0) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Initialize particles
    const colors = particleColors.length > 0 ? particleColors : ["#ff7a1a", "#7b2cff", "#ffffff"];
    const particles: Particle[] = [];

    const createParticle = (randomY = false): Particle => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size =
        particleType === "bats"
          ? 10 + Math.random() * 8
          : 2 + Math.random() * 3.5;

      let vx = (Math.random() - 0.5) * 1.5 * particleSpeed;
      let vy = (Math.random() * 0.8 + 0.4) * particleSpeed;

      if (particleType === "bats") {
        // Bats drift diagonally from right to left or left to right
        vx = (Math.random() * 1.8 + 0.8) * (Math.random() > 0.5 ? 1 : -1) * particleSpeed;
        vy = (Math.sin(Math.random() * Math.PI) - 0.2) * 0.8 * particleSpeed;
      } else if (particleType === "sparks") {
        // Sparks cascade downward with slight drift
        vx = (Math.random() - 0.5) * 1.2 * particleSpeed;
        vy = (Math.random() * 1.6 + 0.8) * particleSpeed;
      } else if (particleType === "snow") {
        // Gentle downward floating snow with slight horizontal sway
        vx = (Math.random() - 0.5) * 0.8 * particleSpeed;
        vy = (Math.random() * 0.7 + 0.5) * particleSpeed;
      }

      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -20,
        vx,
        vy,
        size,
        color,
        alpha: Math.random() * 0.5 + 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        life: 0,
        maxLife: 200 + Math.random() * 200,
        phase: Math.random() * Math.PI * 2,
      };
    };

    for (let i = 0; i < particleCap; i++) {
      particles.push(createParticle(true));
    }
    particlesRef.current = particles;

    let lastTimestamp = performance.now();

    const drawBat = (c: CanvasRenderingContext2D, p: Particle) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.fillStyle = p.color;
      c.globalAlpha = p.alpha;

      // Dynamic wing flap oscillating with phase
      const flap = Math.sin(p.phase) * 0.45;

      c.beginPath();
      // Body
      c.ellipse(0, 0, p.size * 0.4, p.size * 0.6, 0, 0, Math.PI * 2);
      // Left Wing
      c.moveTo(-p.size * 0.3, 0);
      c.quadraticCurveTo(-p.size * 1.1, -p.size * (0.8 + flap), -p.size * 1.6, -p.size * flap);
      c.quadraticCurveTo(-p.size * 1.1, p.size * (0.2 - flap), -p.size * 0.2, p.size * 0.4);
      // Right Wing
      c.moveTo(p.size * 0.3, 0);
      c.quadraticCurveTo(p.size * 1.1, -p.size * (0.8 + flap), p.size * 1.6, -p.size * flap);
      c.quadraticCurveTo(p.size * 1.1, p.size * (0.2 - flap), p.size * 0.2, p.size * 0.4);

      c.fill();
      c.restore();
    };

    const drawSnowflake = (c: CanvasRenderingContext2D, p: Particle) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.strokeStyle = p.color;
      c.lineWidth = 1.2;
      c.globalAlpha = p.alpha;

      // 6-fold crystal snowflake
      for (let arm = 0; arm < 6; arm++) {
        c.rotate(Math.PI / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, p.size);
        c.moveTo(0, p.size * 0.5);
        c.lineTo(p.size * 0.25, p.size * 0.75);
        c.moveTo(0, p.size * 0.5);
        c.lineTo(-p.size * 0.25, p.size * 0.75);
        c.stroke();
      }
      c.restore();
    };

    const drawBlossomPetal = (c: CanvasRenderingContext2D, p: Particle) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.scale(Math.cos(p.phase), 1);
      c.fillStyle = p.color;
      c.globalAlpha = p.alpha;

      c.beginPath();
      c.moveTo(0, -p.size);
      c.quadraticCurveTo(p.size * 0.7, -p.size * 0.5, p.size * 0.5, p.size * 0.5);
      c.quadraticCurveTo(0, p.size * 0.8, -p.size * 0.5, p.size * 0.5);
      c.quadraticCurveTo(-p.size * 0.7, -p.size * 0.5, 0, -p.size);
      c.fill();

      c.restore();
    };

    const drawSpark = (c: CanvasRenderingContext2D, p: Particle) => {
      c.save();
      c.translate(p.x, p.y);
      c.fillStyle = p.color;
      c.globalAlpha = p.alpha * Math.sin((p.life / p.maxLife) * Math.PI);

      c.beginPath();
      c.arc(0, 0, p.size, 0, Math.PI * 2);
      c.fill();

      // Subtle glow cross
      c.strokeStyle = p.color;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(-p.size * 2, 0);
      c.lineTo(p.size * 2, 0);
      c.moveTo(0, -p.size * 2);
      c.lineTo(0, p.size * 2);
      c.stroke();

      c.restore();
    };

    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 16.66; // Normalized to 60 FPS
      lastTimestamp = now;

      ctx.clearRect(0, 0, width, height);

      // Adjust array size if particleCap changed
      while (particles.length < particleCap) {
        particles.push(createParticle(true));
      }
      if (particles.length > particleCap) {
        particles.splice(particleCap);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.life += dt;
        p.phase += 0.08 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;

        // Custom bounce or sway
        if (particleType === "bats") {
          p.vy += Math.sin(p.phase) * 0.04;
          drawBat(ctx, p);
        } else if (particleType === "snow") {
          p.x += Math.sin(p.phase) * 0.5;
          drawSnowflake(ctx, p);
        } else if (particleType === "confetti") {
          p.x += Math.sin(p.phase) * 0.8;
          drawBlossomPetal(ctx, p);
        } else {
          drawSpark(ctx, p);
        }

        // Recycle particle if out of bounds or expired
        if (p.y > height + 40 || p.x < -60 || p.x > width + 60 || p.life >= p.maxLife) {
          particles[i] = createParticle(false);
          if (particleType === "bats") {
            particles[i].x = Math.random() > 0.5 ? -30 : width + 30;
            particles[i].y = Math.random() * (height * 0.7);
            particles[i].vx = (particles[i].x < 0 ? 1 : -1) * (1.2 + Math.random() * 1.5) * particleSpeed;
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [particleType, particleColors, particleSpeed, particleCap, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="holiday-particle-canvas pointer-events-none select-none fixed inset-0 w-full h-full"
      style={{
        zIndex: 70, // Layer 8: Safe particle canvas behind content
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-hidden="true"
    />
  );
};
