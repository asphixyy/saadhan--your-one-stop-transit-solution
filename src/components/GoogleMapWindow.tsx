import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Maximize2, Navigation2, Fuel } from "lucide-react";
import ElectricBorder from "./ElectricBorder";

interface GoogleMapWindowProps {
  isVisible: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
  isRerouted: boolean;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Delhi': [28.6139, 77.2090],
  'Sonipat': [28.9931, 77.0178],
  'Ghaziabad': [28.6692, 77.4538],
  'Faridabad': [28.4089, 77.3178],
  'Meerut': [28.9845, 77.7064],
  'Gurgaon': [28.4595, 77.0266],
  'Noida': [28.5355, 77.3910],
};

export default function GoogleMapWindow({ isVisible, onClose, origin, destination, isRerouted }: GoogleMapWindowProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    if (isVisible && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isVisible]);

  const originCoords = CITY_COORDS[origin] || [28.61, 77.22];
  const destCoords = CITY_COORDS[destination] || [28.7, 77.4];

  // Logic to show a more optimized route if rerouted
  const routeColor = isRerouted ? "#22c55e" : "#00f3ff";
  const routePath = isRerouted 
    ? `M 100,250 Q 250,150 400,250` // Optimized flatter route
    : `M 100,250 Q 250,50 400,250`; // Original curved route

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={onClose} />
          
          <ElectricBorder color={routeColor} className="relative z-10 w-full max-w-5xl h-[70vh] pointer-events-auto" borderRadius={32}>
            <div className="w-full h-full bg-[#0a0a0a] rounded-[2rem] overflow-hidden flex flex-col relative">
              {/* Header */}
              <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Navigation2 className="text-[#00f3ff] w-5 h-5 fill-[#00f3ff]/20" />
                    Live Route Trajectory
                  </h3>
                  <p className="text-white/40 text-xs uppercase tracking-widest mt-1">
                    {origin} to {destination} {isRerouted && "• Optimized Path Active"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {isRerouted && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-medium animate-pulse">
                      <Fuel size={12} />
                      -15% FUEL SAVED
                    </div>
                  )}
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Map Content */}
              <div className="flex-1 relative bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#050505_100%)] overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                {/* Simulated Google Map Elements */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500">
                  {/* The Route */}
                  <motion.path
                    d={routePath}
                    stroke={routeColor}
                    strokeWidth="4"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    style={{ filter: `drop-shadow(0 0 8px ${routeColor}80)` }}
                  />
                  
                  {/* Origin Pulse */}
                  <circle cx="100" cy="250" r="6" fill="#00f3ff">
                    <animate attributeName="r" from="6" to="12" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="100" cy="250" r="4" fill="#fff" />

                  {/* Destination Pulse */}
                  <circle cx="400" cy="250" r="6" fill="#f97316">
                    <animate attributeName="r" from="6" to="12" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="400" cy="250" r="4" fill="#fff" />

                  {/* Moving Vehicle / User Location */}
                  <motion.g
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: isRerouted ? "45%" : "30%" }}
                    transition={{ duration: 3, ease: "easeOut" }}
                  >
                    <circle r="8" fill={routeColor} style={{ filter: `drop-shadow(0 0 10px ${routeColor})` }} />
                    <circle r="3" fill="#fff" />
                    <animateMotion dur="20s" repeatCount="indefinite" path={routePath} />
                  </motion.g>
                </svg>

                {/* Legend / Overlay */}
                <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#00f3ff]" />
                    <span className="text-xs text-white/60">Standard Route</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-white/60">Optimized Path</span>
                  </div>
                </div>

                {/* Animated Coordinates */}
                <div className="absolute top-6 left-6 font-mono text-[10px] text-white/30 flex flex-col gap-1">
                  <div>LAT: {userLocation?.[0].toFixed(6) || "INITIALIZING..."}</div>
                  <div>LNG: {userLocation?.[1].toFixed(6) || "INITIALIZING..."}</div>
                </div>
              </div>

              {/* Liquid Glass Overlay Effect */}
              <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]" />
            </div>
          </ElectricBorder>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
