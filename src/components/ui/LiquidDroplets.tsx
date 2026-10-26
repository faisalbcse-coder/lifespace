"use client";

import React, { useEffect, useRef } from "react";

interface DropletData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number; // radius
  squash: number;
  squashVelocity: number;
  impactAngle: number;
  opacity: number;
}

interface LiquidDropletsProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  count?: number;
  variant?: "dark" | "daylight" | "colorless" | "neumorph";
}

export function LiquidDroplets({
  targetRef,
  count = 6,
  variant = "neumorph",
}: LiquidDropletsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropletElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dropletsRef = useRef<DropletData[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Helper to spawn a very small droplet directed slowly towards the login card
    const createDroplet = (fromRandomLocation = false): DropletData => {
      // Very small dew drop size: 4px to 7.5px radius (8px to 15px diameter)
      const r = 4 + Math.random() * 3.5;
      const targetRect = targetRef.current?.getBoundingClientRect();
      const targetX = targetRect ? targetRect.left + targetRect.width / 2 : width / 2;
      const targetY = targetRect ? targetRect.top + targetRect.height / 2 : height / 2;

      let x: number;
      let y: number;

      if (fromRandomLocation) {
        // Initial placement around the screen
        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
          x = Math.random() * width;
          y = -15 - r;
        } else if (side === 1) {
          x = width + 15 + r;
          y = Math.random() * height;
        } else if (side === 2) {
          x = Math.random() * width;
          y = height + 15 + r;
        } else {
          x = -15 - r;
          y = Math.random() * height;
        }
      } else {
        // Spawn just outside edges
        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
          x = Math.random() * width;
          y = -20;
        } else if (side === 1) {
          x = width + 20;
          y = Math.random() * height;
        } else if (side === 2) {
          x = Math.random() * width;
          y = height + 20;
        } else {
          x = -20;
          y = Math.random() * height;
        }
      }

      // Very slow and serene water drift speed: 0.28 to 0.52 px/frame
      const dx = targetX - x;
      const dy = targetY - y;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
      const speed = 0.28 + Math.random() * 0.24;

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r,
        squash: 1.0,
        squashVelocity: 0,
        impactAngle: 0,
        opacity: 0.65 + Math.random() * 0.25,
      };
    };

    // Initialize 5-6 small droplets scattered nicely
    const initialDroplets: DropletData[] = [];
    for (let i = 0; i < count; i++) {
      const d = createDroplet(true);
      const progress = 0.2 + (i / count) * 0.6;
      const targetRect = targetRef.current?.getBoundingClientRect();
      const targetX = targetRect ? targetRect.left + targetRect.width / 2 : width / 2;
      const targetY = targetRect ? targetRect.top + targetRect.height / 2 : height / 2;

      d.x = d.x + (targetX - d.x) * progress;
      d.y = d.y + (targetY - d.y) * progress;
      initialDroplets.push(d);
    }
    dropletsRef.current = initialDroplets;

    let animationId: number;

    const tick = () => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const cardRect = targetRef.current?.getBoundingClientRect();

      dropletsRef.current.forEach((d, index) => {
        // Move droplet slowly
        d.x += d.vx;
        d.y += d.vy;

        // Very gentle viscoelastic spring recovery
        const springStrength = 0.16;
        const damping = 0.85;
        const squashForce = (1.0 - d.squash) * springStrength;
        d.squashVelocity = (d.squashVelocity + squashForce) * damping;
        d.squash += d.squashVelocity;

        // Check collision with the Login Card
        if (cardRect) {
          const clampedX = Math.max(cardRect.left, Math.min(d.x, cardRect.right));
          const clampedY = Math.max(cardRect.top, Math.min(d.y, cardRect.bottom));

          const distDx = d.x - clampedX;
          const distDy = d.y - clampedY;
          const dist = Math.sqrt(distDx * distDx + distDy * distDy);

          // Droplet touched the card edge
          if (dist < d.r) {
            let nx = distDx / (dist || 1);
            let ny = distDy / (dist || 1);

            if (dist === 0) {
              const toLeft = d.x - cardRect.left;
              const toRight = cardRect.right - d.x;
              const toTop = d.y - cardRect.top;
              const toBottom = cardRect.bottom - d.y;
              const minVal = Math.min(toLeft, toRight, toTop, toBottom);
              if (minVal === toLeft) {
                nx = -1;
                ny = 0;
              } else if (minVal === toRight) {
                nx = 1;
                ny = 0;
              } else if (minVal === toTop) {
                nx = 0;
                ny = -1;
              } else {
                nx = 0;
                ny = 1;
              }
            }

            const dot = d.vx * nx + d.vy * ny;

            // Only deflect if heading towards the card
            if (dot < 0) {
              // Smooth deflection without harsh effects
              const currentSpeed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
              const maintainSpeed = Math.min(Math.max(currentSpeed, 0.3), 0.55);

              // Reflected vector
              let rx = d.vx - 2 * dot * nx;
              let ry = d.vy - 2 * dot * ny;
              const rLen = Math.sqrt(rx * rx + ry * ry) || 1;
              rx /= rLen;
              ry /= rLen;

              // Subtle organic curvature deviation
              const deviationAngle = (Math.random() - 0.5) * 0.25;
              const finalAngle = Math.atan2(ry, rx) + deviationAngle;

              d.vx = Math.cos(finalAngle) * maintainSpeed;
              d.vy = Math.sin(finalAngle) * maintainSpeed;

              // Gently place droplet just along the perimeter
              d.x = clampedX + nx * (d.r + 1.5);
              d.y = clampedY + ny * (d.r + 1.5);

              // Extremely subtle squash (barely noticeable, very organic)
              d.impactAngle = Math.atan2(ny, nx);
              d.squash = 0.88;
              d.squashVelocity = -0.03;
            }
          }
        }

        // Out of bounds check (offscreen by 50px)
        const margin = 50;
        if (
          d.x < -margin ||
          d.x > currentWidth + margin ||
          d.y < -margin ||
          d.y > currentHeight + margin
        ) {
          Object.assign(d, createDroplet(false));
        }

        // Apply position to DOM element
        const el = dropletElsRef.current[index];
        if (el) {
          const diameter = d.r * 2;
          const squashX = d.squash;
          const squashY = 2 - d.squash;

          el.style.width = `${diameter}px`;
          el.style.height = `${diameter}px`;
          el.style.transform = `translate3d(${d.x - d.r}px, ${d.y - d.r}px, 0px) rotate(${d.impactAngle}rad) scale(${squashX}, ${squashY}) rotate(${-d.impactAngle}rad)`;
          el.style.opacity = `${d.opacity}`;
        }
      });

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [targetRef, count]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-10"
      aria-hidden="true"
    >
      {/* ───────────── Only 5-6 Tiny Soft Floating Dewdrops ───────────── */}
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            dropletElsRef.current[index] = el;
          }}
          className={`absolute ${
            variant === "neumorph"
              ? "water-droplet-neumorph"
              : variant === "colorless"
              ? "water-droplet-colorless"
              : variant === "daylight"
              ? "water-droplet-daylight"
              : "water-droplet"
          } will-change-transform`}
          style={{
            top: 0,
            left: 0,
            transform: "translate3d(-100px, -100px, 0)",
          }}
        />
      ))}
    </div>
  );
}
