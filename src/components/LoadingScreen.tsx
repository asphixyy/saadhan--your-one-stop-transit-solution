import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import ShinyText from "./ShinyText";

export default function LoadingScreen() {
  const fullTitle = "Saadhan";
  const fullSubtitle = "your one stop transit solution";
  
  const [titleText, setTitleText] = useState("");
  const [subtitleText, setSubtitleText] = useState("");
  const [phase, setPhase] = useState<"typingTitle" | "typingSubtitle" | "done">("typingTitle");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (phase === "typingTitle") {
      if (titleText.length < fullTitle.length) {
        timeout = setTimeout(() => {
          setTitleText(fullTitle.slice(0, titleText.length + 1));
        }, 80);
      } else {
        setPhase("typingSubtitle");
      }
    } else if (phase === "typingSubtitle") {
      if (subtitleText.length < fullSubtitle.length) {
        timeout = setTimeout(() => {
          setSubtitleText(fullSubtitle.slice(0, subtitleText.length + 1));
        }, 20);
      } else {
        setPhase("done");
      }
    }
    
    return () => clearTimeout(timeout);
  }, [titleText, subtitleText, phase]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Liquid background effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-[100px]"
        animate={{
          x: ["-50%", "-40%", "-60%", "-50%"],
          y: ["-50%", "-60%", "-40%", "-50%"],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Text Container - Positioned above center */}
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-4 z-10 flex flex-col items-center justify-center">
        <h1 className="text-7xl md:text-9xl font-bold text-white tracking-tighter mb-4 relative min-h-[1.2em] flex items-center justify-center drop-shadow-2xl">
          <span className="relative z-10 flex items-center">
            <ShinyText text={titleText} color="#555555" shineColor="#ffffff" speed={1} spread={90} />
            {phase === "typingTitle" && <span className="animate-pulse opacity-50 ml-1">|</span>}
          </span>
        </h1>
        
        <p className="text-white/60 text-lg md:text-xl font-light tracking-widest uppercase min-h-[1.5em]">
          {subtitleText}
          {(phase === "typingSubtitle") && <span className="animate-pulse opacity-50">|</span>}
        </p>
      </div>

      {/* Liquid Glass Progress Bar - Dead center of the screen */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-[2px] bg-white/10 rounded-full overflow-hidden z-10">
        <motion.div
          className="absolute inset-0 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
