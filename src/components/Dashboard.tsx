import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Plane, Navigation, Clock, Calendar, ChevronDown, Activity, Route, CloudLightning, ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import SlideToConfirm from "./SlideToConfirm";
import GoogleMapWindow from "./GoogleMapWindow";

// Options dynamically loaded from dataset

export default function Dashboard() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [departure, setDeparture] = useState('Gujarat');
  const [arrival, setArrival] = useState('Nagaland');
  const [selecting, setSelecting] = useState<'departure' | 'arrival' | null>(null);
  const [trafficStatus, setTrafficStatus] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [distance, setDistance] = useState('2,450 km');
  const [weather, setWeather] = useState<'Clear' | 'Rain' | 'Storm'>('Clear');
  const [riskScore, setRiskScore] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [delayMins, setDelayMins] = useState(0);
  const [rerouted, setRerouted] = useState(false);
  const [dataset, setDataset] = useState<any[]>([]);
  const [estimatedArrival, setEstimatedArrival] = useState<Date>(new Date(Date.now() + 10800000));
  const [sources, setSources] = useState<string[]>(['Loading...']);
  const [destinations, setDestinations] = useState<string[]>(['Loading...']);
  const [routeRisk, setRouteRisk] = useState(0);
  const [delayProb, setDelayProb] = useState(0);
  const [transitProgress, setTransitProgress] = useState(0);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDayName = dayNames[now.getDay()];
  const currentFormattedDate = `${now.getDate()} ${monthNames[now.getMonth()]}`;
  const arrivalFormattedTime = estimatedArrival.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  let timeOfDay = 'Night';
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) timeOfDay = 'Morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';

  useEffect(() => {
    fetch('/dynamic_supply_chain_logistics_dataset.csv')
      .then(res => res.text())
      .then(text => {
        const cleanText = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
        const lines = cleanText.split('\n').filter(Boolean);
        
        const headerMap: Record<string, string> = {
          'source': 'Source', 'destination': 'Destination', 'distance': 'Distance',
          'distance_km': 'Distance', 'distance_in_km': 'Distance',
          'traffic_level': 'Traffic_Level', 'time_of_day': 'Time_of_Day',
          'day_of_week': 'Day_of_Week', 'weather': 'Weather', 'delay_flag': 'Delay_Flag',
          'travel_time_hr': 'Travel_Time_Hours', 'travel_time_hours': 'Travel_Time_Hours',
          'risk_level': 'Risk_Level', 'time_delay': 'Time_Delay',
          'route_risk': 'Route_Risk', 'delay_probability': 'Delay_Probability'
        };
        const headers = lines[0].split(',').map(h => {
           const cleaned = h.trim().toLowerCase();
           return headerMap[cleaned] || cleaned;
        });

        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, idx) => {
            const val = values[idx]?.trim();
            obj[header] = val ? (val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()) : val;
            return obj;
          }, {} as any);
        });
        setDataset(data);
        const uniqueSources = Array.from(new Set(data.map(r => r.Source).filter(Boolean))) as string[];
        const uniqueDestinations = Array.from(new Set(data.map(r => r.Destination).filter(Boolean))) as string[];
        if (uniqueSources.length) setSources(uniqueSources.sort());
        if (uniqueDestinations.length) setDestinations(uniqueDestinations.sort());
        if (uniqueSources.length > 0) setDeparture(uniqueSources[0]);
        if (uniqueDestinations.length > 0) setArrival(uniqueDestinations[Math.min(1, uniqueDestinations.length - 1)]);
      })
      .catch(err => console.error('Error loading AI dataset', err));
  }, []);

  useEffect(() => {
    if (dataset.length === 0) return;

    let applicableRows = dataset.filter(r => 
      (r.Source === departure && r.Destination === arrival) && 
      r.Time_of_Day === timeOfDay
    );
    
    if (applicableRows.length === 0) {
      applicableRows = dataset.filter(r => r.Source === departure && r.Destination === arrival);
    }
    if (applicableRows.length === 0) {
      applicableRows = dataset.filter(r => r.Time_of_Day === timeOfDay);
    }
    if (applicableRows.length === 0) {
      applicableRows = dataset;
    }

    const randomRow = applicableRows[Math.floor(Math.random() * applicableRows.length)];

    setTrafficStatus((randomRow.Traffic_Level as 'Low' | 'Medium' | 'High') || 'Medium');
    setDistance(`${randomRow.Distance || Math.floor(Math.random() * 2500) + 500} km`);
    
    // Map to supported UI weathers
    const rowWeather = randomRow.Weather;
    const mappedWeather = ['Clear', 'Rain', 'Storm'].includes(rowWeather) ? rowWeather : 'Clear';
    setWeather(mappedWeather as 'Clear' | 'Rain' | 'Storm');
    
    setRerouted(false);

    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    let delay = 0;

    if (randomRow.Risk_Level === 'High' || randomRow.Delay_Flag === '1' || randomRow.Delay_Flag === 'Yes' || randomRow.Traffic_Level === 'High' || mappedWeather === 'Storm') {
      risk = 'High';
    } else if (randomRow.Risk_Level === 'Medium' || randomRow.Traffic_Level === 'Medium' || mappedWeather === 'Rain') {
      risk = 'Medium';
    } else {
      risk = 'Low';
    }
    
    setRiskScore(risk);
    setRouteRisk(randomRow.Route_Risk ? parseFloat(randomRow.Route_Risk) : 0);
    setDelayProb(randomRow.Delay_Probability ? parseFloat(randomRow.Delay_Probability) : 0);
    
    if (randomRow.Time_Delay) {
      delay = Math.round(parseFloat(randomRow.Time_Delay));
    } else {
      if (risk === 'High') delay = Math.floor(Math.random() * 120) + 60;
      else if (risk === 'Medium') delay = Math.floor(Math.random() * 45) + 15;
    }
    setDelayMins(delay);

    const travelHoursStr = randomRow.Travel_Time_Hours;
    let travelHours = travelHoursStr ? parseFloat(travelHoursStr) : (randomRow.Distance ? parseFloat(randomRow.Distance) / 50 : 3);
    const travelMs = travelHours * 3600000;
    setEstimatedArrival(new Date(Date.now() + travelMs + delay * 60000));
  }, [departure, arrival, dataset]);

  useEffect(() => {
    if (!isConfirmed) {
      setTransitProgress(0);
      setStartCoords(null);
      return;
    }

    let interval: any;
    let watchId: number;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (!startCoords) {
          setStartCoords([latitude, longitude]);
        } else {
          // Add a tiny bit of progress based on real movement + small simulation
          setTransitProgress(prev => Math.min(99, prev + 0.01));
        }
      });
    }

    // Simulation for demo purposes (so it moves even if stationary)
    interval = setInterval(() => {
      setTransitProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 0.05;
      });
    }, 2000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (interval) clearInterval(interval);
    };
  }, [isConfirmed]);

  const handleReroute = () => {
    setRerouted(true);
    setTrafficStatus('Low');
    setRiskScore('Low');
    setWeather('Clear');
    setRouteRisk(prev => prev * 0.2); // 80% risk reduction
    setDelayProb(prev => prev * 0.1); // 90% probability reduction
    setDelayMins(Math.max(0, delayMins - 45)); 
    
    const currentDist = parseFloat(distance.replace(/[^0-9.]/g, ''));
    const newDist = currentDist * 1.15; // 15% longer alternate route
    setDistance(`${newDist.toFixed(2)} km`);
    
    setEstimatedArrival(prev => new Date(prev.getTime() - 45 * 60000));
  };

  const LocationDropdown = ({ type, current, onSelect }: { type: string, current: string, onSelect: (val: string) => void }) => (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
      className="absolute top-full mt-20 left-1/2 -translate-x-1/2 w-48 z-50 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Liquid glass inner effects */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.15)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none mix-blend-overlay" />

      <div className="w-full max-h-60 overflow-y-auto relative z-10 custom-scrollbar">
        {(type === 'departure' ? sources : destinations).map(loc => (
          <button
            key={loc}
            onClick={(e) => { e.stopPropagation(); onSelect(loc); setSelecting(null); }}
            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/10 ${current === loc ? 'text-[#00f3ff] bg-white/5' : 'text-white/70'}`}
          >
            {loc}
          </button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden overflow-y-auto relative flex flex-col">
      <style>
        {`
          @keyframes border-trace {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: 0; }
          }
          .group:hover .trace-circle {
            animation: border-trace 2s linear infinite;
          }
        `}
      </style>
      {/* Immersive Background (India Map) */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* Real India Map Image */}
        <motion.img 
          src="/india-map-bg.jpg" 
          alt="India Map Background" 
          animate={{ 
            opacity: isConfirmed ? 0 : 0.35, 
            filter: isConfirmed ? 'invert(1) grayscale(100%) blur(20px)' : 'invert(1) grayscale(100%) brightness(180%) blur(0px)',
            scale: isConfirmed ? 2.0 : 1.7,
            x: "2%",
            y: "4%"
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-[120%] object-cover md:object-contain mix-blend-screen "
        />
        
        {/* Subtle Map Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }} 
        />
        
        {/* Glowing Orbs for Map Nodes / Atmosphere */}
        <motion.div 
          className="absolute top-[30%] left-[15%] w-96 h-96 bg-white/5 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[40%] right-[15%] w-[30rem] h-[30rem] bg-orange-500/5 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1, ease: "easeInOut" }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 pt-16 px-8 md:px-16 flex justify-between items-start">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 drop-shadow-[0_5px_15px_rgba(234,179,8,0.4)]"
        >
          Trip Details
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-white/60">Live Tracking</span>
        </motion.div>
      </header>

      {/* Center Route Visualization */}
      <div className="relative z-30 flex-1 flex items-center justify-center w-full max-w-5xl mx-auto px-4 md:px-8 mt-12 md:mt-0">
        <div className="relative w-full h-64 md:h-96 flex items-center justify-center">
          
          <AnimatePresence mode="wait">
            {!isConfirmed ? (
              <motion.div
                key="nodes"
                exit={{ opacity: 0, filter: "blur(20px)", scale: 0.9 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full flex items-center justify-between"
              >
                {/* Connection Arc (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 300">
                  {/* Dashed background path */}
                  <motion.path
                    d="M 100,150 Q 500,-50 900,150"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                    strokeDasharray="8 8"
                  />
                  {/* Glowing animated path */}
                  <motion.path
                    d="M 100,150 Q 500,-50 900,150"
                    fill="transparent"
                    stroke="rgba(255,150,50,0.6)"
                    strokeWidth="3"
                    style={{ filter: "drop-shadow(0 0 10px rgba(255,150,50,0.5))" }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Animated Marker following the path */}
                  <g>
                    <circle r="8" fill="#ff9632" filter="drop-shadow(0 0 10px #ff9632)" />
                    <circle r="4" fill="#ffffff" />
                    <animateMotion 
                      dur="4s" 
                      repeatCount="indefinite" 
                      path="M 100,150 Q 500,-50 900,150" 
                      calcMode="linear"
                    />
                  </g>
                </svg>

                {/* Origin Node */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="relative z-10 -ml-4 md:ml-12"
                >
            <button 
              onClick={() => !isConfirmed && setSelecting(selecting === 'departure' ? null : 'departure')}
              className="group relative flex flex-col items-center cursor-pointer"
              disabled={isConfirmed}
            >
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full bg-black/60 border ${selecting === 'departure' ? 'border-[#00f3ff]' : 'border-white/20'} backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] relative transition-all duration-300 group-hover:scale-105 group-hover:border-[#00f3ff]/50`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent mix-blend-overlay" />
                {/* Liquid glass inner bubble */}
                <div className="absolute inset-2 rounded-full border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.2)]" />
                <Plane className="text-white w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                
                {/* Dynamic Border Trace Glow (Hover Only) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <circle 
                    cx="50%" cy="50%" r="calc(50% - 1px)" 
                    fill="none" 
                    stroke="#e0e0e0" 
                    strokeWidth="2" 
                    pathLength="100"
                    strokeDasharray="10 90"
                    strokeLinecap="round"
                    className="trace-circle"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(224,224,224,0.8)) drop-shadow(0 0 6px rgba(224,224,224,0.4))' }}
                  />
                </svg>
              </div>
              <div className="absolute top-full mt-6 flex flex-col items-center w-max">
                <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1">Departure</p>
                <div className="flex items-center gap-2 text-lg md:text-2xl font-medium tracking-tight group-hover:text-[#00f3ff] transition-colors">
                  {departure} {!isConfirmed && <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${selecting === 'departure' ? 'rotate-180' : ''}`} />}
                </div>
              </div>
            </button>
            <AnimatePresence>
              {selecting === 'departure' && <LocationDropdown type="departure" current={departure} onSelect={setDeparture} />}
            </AnimatePresence>
          </motion.div>

          {/* Destination Node */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="relative z-10 -mr-4 md:mr-12"
          >
            <button 
              onClick={() => !isConfirmed && setSelecting(selecting === 'arrival' ? null : 'arrival')}
              className="group relative flex flex-col items-center cursor-pointer"
              disabled={isConfirmed}
            >
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full bg-black/60 border ${selecting === 'arrival' ? 'border-[#00f3ff]' : 'border-white/20'} backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(255,150,50,0.15)] relative transition-all duration-300 group-hover:scale-105 group-hover:border-[#00f3ff]/50`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/20 to-transparent mix-blend-overlay" />
                <div className="absolute inset-2 rounded-full border border-white/10 shadow-[inset_0_0_15px_rgba(255,150,50,0.3)]" />
                <MapPin className="text-white w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-transform group-hover:scale-110" />
                
                {/* Dynamic Border Trace Glow (Hover Only) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <circle 
                    cx="50%" cy="50%" r="calc(50% - 1px)" 
                    fill="none" 
                    stroke="#e0e0e0" 
                    strokeWidth="2" 
                    pathLength="100"
                    strokeDasharray="10 90"
                    strokeLinecap="round"
                    className="trace-circle"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(224,224,224,0.8)) drop-shadow(0 0 6px rgba(224,224,224,0.4))' }}
                  />
                </svg>
              </div>
              <div className="absolute top-full mt-6 flex flex-col items-center w-max">
                <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1">Arrival</p>
                <div className="flex items-center gap-2 text-lg md:text-2xl font-medium tracking-tight group-hover:text-[#00f3ff] transition-colors">
                  {arrival} {!isConfirmed && <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${selecting === 'arrival' ? 'rotate-180' : ''}`} />}
                </div>
              </div>
            </button>
            <AnimatePresence>
              {selecting === 'arrival' && <LocationDropdown type="arrival" current={arrival} onSelect={setArrival} />}
            </AnimatePresence>
          </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="premium-route"
                initial={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="relative w-full max-w-4xl bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden"
              >
                {/* Electric Border Trace */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  <rect 
                    x="0" y="0" width="100%" height="100%" 
                    rx="32" 
                    fill="none" 
                    stroke="#00f3ff" 
                    strokeWidth="2" 
                    pathLength="100"
                    strokeDasharray="15 85"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,243,255,1)) drop-shadow(0 0 12px rgba(0,243,255,0.8))' }}
                  >
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="4s" repeatCount="indefinite" />
                  </rect>
                </svg>

                <div className="relative z-10 flex flex-col items-center w-full">
                  <div className="flex items-center justify-between w-full mb-12">
                    <div className="flex flex-col items-start">
                      <span className="text-white/50 text-xs uppercase tracking-widest mb-2">Departure</span>
                      <span className="text-3xl md:text-4xl font-medium text-white tracking-tight">{departure}</span>
                    </div>
                    
                    <div className="flex flex-col items-center px-4">
                      <div className="px-4 py-1.5 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] text-xs font-medium animate-pulse flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]" />
                        In Transit
                      </div>
                      <button onClick={() => setIsConfirmed(false)} className="mt-2 text-[10px] uppercase tracking-widest text-[#00f3ff]/70 hover:text-[#00f3ff] transition-colors underline decoration-[#00f3ff]/30 underline-offset-4">
                        New Search
                      </button>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-white/50 text-xs uppercase tracking-widest mb-2">Arrival</span>
                      <span className="text-3xl md:text-4xl font-medium text-white tracking-tight">{arrival}</span>
                    </div>
                  </div>

                  {/* Live Location Tracker Line */}
                  <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-visible mt-4">
                    {/* Progress Fill */}
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00f3ff]/20 to-[#00f3ff] rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${transitProgress}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      style={{ boxShadow: '0 0 15px rgba(0,243,255,0.3)' }}
                    />
                    
                    {/* Glowing Vehicle Marker */}
                    <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-black border-2 border-[#00f3ff] rounded-full shadow-[0_0_25px_rgba(0,243,255,1)] flex items-center justify-center z-10 cursor-pointer hover:scale-110 transition-transform"
                      animate={{ left: `${transitProgress}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      onClick={() => setIsMapVisible(true)}
                    >
                      <div className="w-3 h-3 bg-[#00f3ff] rounded-full animate-ping" />
                      <div className="absolute w-2 h-2 bg-white rounded-full" />
                      
                      {/* Tooltip hint */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[8px] whitespace-nowrap">
                        CLICK TO VIEW MAP
                      </div>
                    </motion.div>

                    {/* Destination Marker */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 bg-white/20 border-2 border-white/50 rounded-full" />
                    {/* Origin Marker */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 bg-[#00f3ff]/50 border-2 border-[#00f3ff] rounded-full" />
                  </div>
                  
                  <div className="w-full flex justify-between mt-4 text-white/40 text-xs font-mono">
                    <span>0 km</span>
                    <span>{distance}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Glass Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-full max-w-5xl mx-auto p-4 md:p-8 mb-4 md:mb-8"
      >
        <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-6 md:p-10 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Liquid highlight on the panel top edge */}
          <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Calendar size={14} />
                <span className="text-[10px] uppercase tracking-widest">Date</span>
              </div>
              <p className="text-xl md:text-2xl font-medium tracking-tight whitespace-nowrap">{currentFormattedDate}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Clock size={14} />
                <span className="text-[10px] uppercase tracking-widest">Est. Arrival</span>
              </div>
              <p className="text-xl md:text-2xl font-medium tracking-tight whitespace-nowrap">{arrivalFormattedTime}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Plane size={14} />
                <span className="text-[10px] uppercase tracking-widest">Carrier</span>
              </div>
              <p className="text-xl md:text-2xl font-medium tracking-tight">AeroLogistics</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Navigation size={14} />
                <span className="text-[10px] uppercase tracking-widest">Distance</span>
              </div>
              <p className="text-xl md:text-2xl font-medium tracking-tight">{distance}</p>
            </div>
          </div>

          {/* Slide to Confirm OR Transit Details */}
          <div className="max-w-2xl mx-auto relative min-h-[120px]">
            <AnimatePresence mode="wait">
              {!isConfirmed ? (
                <motion.div
                  key="slider"
                  initial={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(20px)', scale: 0.9 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full"
                >
                  <SlideToConfirm onConfirm={() => setIsConfirmed(true)} />
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="relative w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,243,255,0.1)]"
                >
                  {/* Dynamic Border Trace Glow */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <rect 
                      x="0" y="0" width="100%" height="100%" 
                      rx="24" 
                      fill="none" 
                      stroke="#00f3ff" 
                      strokeWidth="2" 
                      pathLength="100"
                      strokeDasharray="10 90"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(0,243,255,1)) drop-shadow(0 0 12px rgba(0,243,255,0.8)) drop-shadow(0 0 24px rgba(0,243,255,0.5))' }}
                    >
                      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
                    </rect>
                  </svg>

                  <div className="relative z-10 flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium tracking-tight">Transit Active</h3>
                    <div className="px-3 py-1 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] text-xs font-medium animate-pulse flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]" />
                      Live Tracking
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Distance */}
                    <div className="flex flex-col gap-2 bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-[#00f3ff]" />
                        <span className="text-white/50 text-xs uppercase tracking-wider">Distance</span>
                      </div>
                      <p className="text-xl font-medium">{distance}</p>
                    </div>

                    {/* Traffic */}
                    <div className="flex flex-col gap-2 bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${trafficStatus === 'Low' ? 'text-green-400' : trafficStatus === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`} />
                        <span className="text-white/50 text-xs uppercase tracking-wider">Live Traffic</span>
                      </div>
                      <p className="text-xl font-medium flex items-center gap-2">
                        {trafficStatus}
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${trafficStatus === 'Low' ? 'bg-green-400' : trafficStatus === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${trafficStatus === 'Low' ? 'bg-green-500' : trafficStatus === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        </span>
                      </p>
                    </div>

                    {/* Weather & Delay */}
                    <div className="flex flex-col gap-2 bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2">
                        <CloudLightning className="w-4 h-4 text-blue-400" />
                        <span className="text-white/50 text-xs uppercase tracking-wider">Weather Streams</span>
                      </div>
                      <p className="text-lg font-medium">{weather}</p>
                      {delayMins > 0 ? (
                         <p className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full w-max">+{delayMins} min delay</p>
                      ) : (
                         <p className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full w-max">On Time</p>
                      )}
                    </div>

                    {/* Risk Score Engine */}
                    <div className="flex flex-col gap-2 bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      <div className="flex items-center gap-2 relative z-10">
                        <ShieldAlert className={`w-4 h-4 ${riskScore === 'Low' ? 'text-green-400' : riskScore === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`} />
                        <span className="text-white/50 text-xs uppercase tracking-wider">Risk Engine</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden relative z-10">
                        <motion.div 
                          className={`h-full shadow-[0_0_10px_currentColor] ${riskScore === 'Low' ? 'bg-green-500 text-green-500' : riskScore === 'Medium' ? 'bg-yellow-500 text-yellow-500' : 'bg-red-500 text-red-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: riskScore === 'Low' ? '25%' : riskScore === 'Medium' ? '65%' : '95%' }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-sm mt-1 font-medium relative z-10 flex items-center justify-between">
                        <span>{riskScore} Risk Level</span>
                        <span className="text-[10px] text-white/40 font-mono">Index: {routeRisk.toFixed(2)}</span>
                      </p>
                      {delayProb > 0 && (
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">Delay Prob: {(delayProb * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  </div>

                  {/* Graph Re-Routing Engine */}
                  <AnimatePresence>
                    {(riskScore === 'High'  || riskScore === 'Medium') && !rerouted && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="p-4 md:p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 w-full overflow-hidden relative"
                      >
                         <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]" />
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-orange-400 font-medium mb-1 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> 
                              Sub-optimal Route Detected (High Risk)
                            </h4>
                            <p className="text-sm text-orange-200/70">High traffic predicted for this <strong>{timeOfDay}</strong> ({currentDayName}). AI suggests using Route {['A','B','C'][Math.floor(Math.random()*3)]} or changing transit time.</p>
                          </div>
                          
                          <button 
                            onClick={handleReroute}
                            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2 relative overflow-hidden group"
                          >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Auto Reroute
                          </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-orange-500/20 flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex flex-col">
                            <span className="text-white/40 text-[10px] tracking-widest font-mono">EST TIME SAVED</span>
                            <span className="text-green-400 font-medium text-lg">~{Math.min(delayMins, 45)} mins</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white/40 text-[10px] tracking-widest font-mono">COST REDUCTION</span>
                            <span className="text-green-400 font-medium text-lg flex items-center gap-1">
                               -15% Fuel <span className="text-[10px] border border-green-400/30 px-1 rounded bg-green-400/10">Cost Effective</span>
                            </span>
                          </div>
                        </div>
                        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
                      </motion.div>
                    )}
                    {rerouted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto', marginTop: 16 }}
                        className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-between gap-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 animate-[pulse_2s_infinite]" />
                          <div>
                            <p className="font-medium text-green-300">Route Optimized by AI</p>
                            <p className="text-xs text-green-400/70">Navigating on a faster, cost-effective path.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <GoogleMapWindow 
        isVisible={isMapVisible} 
        onClose={() => setIsMapVisible(false)}
        origin={departure}
        destination={arrival}
        isRerouted={rerouted}
      />
    </div>
  );
}
