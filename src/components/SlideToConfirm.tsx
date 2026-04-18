import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "motion/react";
import { ChevronRight, Check } from "lucide-react";
import ElectricBorder from "./ElectricBorder";

interface SlideToConfirmProps {
  onConfirm?: () => void;
}

export default function SlideToConfirm({ onConfirm }: SlideToConfirmProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  useEffect(() => {
    if (containerRef.current) {
      // Container width minus thumb width (80px) and padding (8px)
      setDragWidth(containerRef.current.offsetWidth - 88); 
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDragWidth(containerRef.current.offsetWidth - 88);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x >= dragWidth * 0.75) {
      setIsConfirmed(true);
      controls.start({ x: dragWidth });
      if (onConfirm) onConfirm();
    } else {
      controls.start({ x: 0 });
    }
  };

  const textOpacity = useTransform(x, [0, dragWidth], [1, 0.2]); // Keep text visible but slightly faded at the end
  const backgroundWidth = useTransform(x, [0, dragWidth], [80, dragWidth + 80]);

  return (
    <ElectricBorder color="#00f3ff" borderRadius={48} chaos={0.05} speed={1.5} className="w-full">
      <div 
        ref={containerRef}
        className="relative h-24 rounded-full bg-black/40 backdrop-blur-md flex items-center px-1 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
      >
        {/* Liquid Glass Background Fill that expands with drag */}
        <motion.div 
          className="absolute left-1 top-1 bottom-1 rounded-full bg-gradient-to-r from-[#00f3ff]/10 to-[#00f3ff]/30 backdrop-blur-sm border border-[#00f3ff]/20"
          style={{ width: backgroundWidth }}
        />

        {/* Text */}
        <motion.div 
          className="absolute w-full text-center pointer-events-none flex items-center justify-center gap-3 z-10"
          style={{ opacity: textOpacity }}
        >
          <span className="text-[#00f3ff]/80 uppercase tracking-[0.3em] text-sm font-medium drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">Slide to confirm transit</span>
          <div className="flex -space-x-2 opacity-80 text-[#00f3ff]">
            <ChevronRight size={18} className="animate-pulse" />
            <ChevronRight size={18} className="animate-pulse delay-75" />
            <ChevronRight size={18} className="animate-pulse delay-150" />
          </div>
        </motion.div>

        {/* Draggable Thumb - Transparent Glass Pebble */}
        <motion.div
          drag={isConfirmed ? false : "x"}
          dragConstraints={{ left: 0, right: dragWidth }}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x }}
          className="relative z-30 w-20 h-20 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing group"
        >
          {/* Glass Pebble Base */}
          <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-[12px] border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.2),inset_0_-5px_15px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 group-hover:bg-white/10 group-active:scale-95 group-active:backdrop-blur-[8px]">
            {/* Top Highlight (Glossy reflection) */}
            <div className="absolute top-[5%] left-[15%] right-[15%] h-[30%] rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-80" />
            
            {/* Bottom edge glow */}
            <div className="absolute bottom-0 left-[10%] right-[10%] h-[20%] rounded-full bg-gradient-to-t from-[#00f3ff]/40 to-transparent opacity-60 blur-sm" />
            
            {/* Inner fluid distortion simulation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 mix-blend-overlay group-hover:rotate-45 transition-transform duration-700" />
          </div>

          {isConfirmed ? (
            <Check className="text-white w-8 h-8 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          ) : (
            <ChevronRight className="text-white/90 w-8 h-8 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:translate-x-1 transition-transform" />
          )}
        </motion.div>
      </div>
    </ElectricBorder>
  );
}
