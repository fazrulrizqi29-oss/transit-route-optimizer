import React, { useState, useRef, useMemo } from 'react';
import { Icons } from './Icons.jsx';

export function GraphCanvas({
  locations,
  roads,
  highlightPathUCS = [],
  highlightPathGreedy = [],
  startNodeId = null,
  goalNodeId = null,
  heuristicGoalNode = null,
  activeStepNode = null,
  onSelectLocation = null,
  onUpdateLocationPosition = null,
  onConnectNodes = null,
  interactive = true,
  height = "520px"
}) {
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredRoad, setHoveredRoad] = useState(null);

  const [isConnectingMode, setIsConnectingMode] = useState(false);
  const [connectStartNodeId, setConnectStartNodeId] = useState(null);

  const locMap = useMemo(() => {
    const m = new Map();
    locations.forEach(l => m.set(l.id, l));
    return m;
  }, [locations]);

  // Tentukan ID titik awal dan titik tujuan efektif
  const effectiveStartId = useMemo(() => {
    if (startNodeId) return startNodeId;
    if (highlightPathUCS.length > 0) return highlightPathUCS[0];
    if (highlightPathGreedy.length > 0) return highlightPathGreedy[0];
    return null;
  }, [startNodeId, highlightPathUCS, highlightPathGreedy]);

  const effectiveGoalId = useMemo(() => {
    if (goalNodeId) return goalNodeId;
    if (heuristicGoalNode?.id) return heuristicGoalNode.id;
    if (highlightPathUCS.length > 0) return highlightPathUCS[highlightPathUCS.length - 1];
    if (highlightPathGreedy.length > 0) return highlightPathGreedy[highlightPathGreedy.length - 1];
    return null;
  }, [goalNodeId, heuristicGoalNode, highlightPathUCS, highlightPathGreedy]);

  const ucsEdgeSet = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < highlightPathUCS.length - 1; i++) {
      set.add(`${highlightPathUCS[i]}->${highlightPathUCS[i + 1]}`);
      set.add(`${highlightPathUCS[i + 1]}->${highlightPathUCS[i]}`);
    }
    return set;
  }, [highlightPathUCS]);

  const greedyEdgeSet = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < highlightPathGreedy.length - 1; i++) {
      set.add(`${highlightPathGreedy[i]}->${highlightPathGreedy[i + 1]}`);
      set.add(`${highlightPathGreedy[i + 1]}->${highlightPathGreedy[i]}`);
    }
    return set;
  }, [highlightPathGreedy]);

  const handleMouseDown = (e) => {
    if (!interactive) return;
    const targetNodeId = e.target.dataset.nodeId;
    if (targetNodeId) {
      if (isConnectingMode) {
        handleNodeConnectClick(targetNodeId);
        return;
      }
      setDraggingNodeId(targetNodeId);
      return;
    }
    setIsDraggingPan(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeConnectClick = (nodeId) => {
    if (!connectStartNodeId) {
      setConnectStartNodeId(nodeId);
    } else {
      if (connectStartNodeId === nodeId) {
        setConnectStartNodeId(null);
        return;
      }
      if (onConnectNodes) {
        onConnectNodes(connectStartNodeId, nodeId);
      }
      setConnectStartNodeId(null);
      setIsConnectingMode(false);
    }
  };

  const handleMouseMove = (e) => {
    if (draggingNodeId && onUpdateLocationPosition) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      onUpdateLocationPosition(draggingNodeId, Math.round(rawX), Math.round(rawY));
      return;
    }
    if (isDraggingPan) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPan(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e) => {
    if (!interactive) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.min(2.5, Math.max(0.4, z * factor)));
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl select-none" style={{ height }}>
      {interactive && (
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <button
            onClick={() => {
              setIsConnectingMode(!isConnectingMode);
              setConnectStartNodeId(null);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-lg transition ${isConnectingMode
              ? "bg-rose-600 border-rose-500 text-white animate-pulse"
              : "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-cyan-400"
              }`}
          >
            <Icons.Link />
            <span>{isConnectingMode ? "Batalkan Hubung" : "Hubungkan Jalan via Graf"}</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg text-xs">
            <span className="text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="p-1 hover:bg-slate-700 rounded text-slate-200">+</button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} className="p-1 hover:bg-slate-700 rounded text-slate-200">-</button>
            <button onClick={() => { setPan({ x: 20, y: 20 }); setZoom(1); }} className="p-1 hover:bg-slate-700 rounded text-cyan-400">Reset</button>
          </div>
        </div>
      )}

      {isConnectingMode && (
        <div className="absolute top-4 left-4 z-20 bg-rose-950/90 border border-rose-500/50 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-rose-200 shadow-2xl animate-bounce">
          {connectStartNodeId ? (
            <span>📍 Asal: <strong>{locMap.get(connectStartNodeId)?.name}</strong>. Sekarang <strong>klik simpul TUJUAN</strong>.</span>
          ) : (
            <span>👆 <strong>Klik simpul ASAL</strong> yang ingin dihubungkan.</span>
          )}
        </div>
      )}

      {/* Legend Overlay (Fitur 10) */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-xl font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/50"></span>
          <span className="text-emerald-400 font-bold">Titik Awal (Start)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/50"></span>
          <span className="text-rose-400 font-bold">Titik Tujuan (Goal)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1.5 rounded bg-[#0284c7] shadow-[0_0_8px_#00f2fe]"></span>
          <span className="text-cyan-300 font-bold">Rute UCS (Biru)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1.5 rounded bg-[#ea580c] shadow-[0_0_8px_#f97316]"></span>
          <span className="text-orange-400 font-bold">Rute Greedy (Oranye)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-0.5 border-t border-dashed border-amber-400"></span>
          <span className="text-amber-300 text-[10px]">Heuristik Haversine</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <marker id="arrow-road" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <pattern id="smallGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeDasharray="2,2" />
          </pattern>
          <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#smallGrid)" />

          {/* Garis Vektor Heuristik Garis Putus-Putus Kuning Langsung ke Goal */}
          {heuristicGoalNode && activeStepNode && (
            <line
              x1={activeStepNode.x}
              y1={activeStepNode.y}
              x2={heuristicGoalNode.x}
              y2={heuristicGoalNode.y}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              opacity="0.8"
            />
          )}

          {/* Roads with Weights */}
          {roads.map(road => {
            const n1 = locMap.get(road.from);
            const n2 = locMap.get(road.to);
            if (!n1 || !n2) return null;

            const isOneWay = road.bidirectional === false;
            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;

            return (
              <g key={road.id} className="transition-all duration-300">
                <line
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke={isOneWay ? "#0284c7" : "#475569"}
                  strokeWidth={isOneWay ? 2.5 : 2}
                  markerEnd={isOneWay ? "url(#arrow-road)" : undefined}
                  strokeLinecap="round"
                />

                <g
                  transform={`translate(${midX}, ${midY})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredRoad(road)}
                  onMouseLeave={() => setHoveredRoad(null)}
                >
                  <rect
                    x="-38"
                    y="-11"
                    width="76"
                    height="22"
                    rx="7"
                    fill="#0f172a"
                    stroke={isOneWay ? "#0284c7" : "#334155"}
                    strokeWidth="1.2"
                    className="opacity-95 hover:stroke-cyan-400"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fill="#e2e8f0"
                    className="font-mono font-semibold pointer-events-none"
                  >
                    {road.distanceKm}km | {road.travelTimeMin}m
                  </text>
                </g>
              </g>
            );
          })}

          {/* UCS Route Highlight */}
          {highlightPathUCS.length > 1 && highlightPathUCS.map((nodeId, idx) => {
            if (idx === highlightPathUCS.length - 1) return null;
            const n1 = locMap.get(nodeId);
            const n2 = locMap.get(highlightPathUCS[idx + 1]);
            if (!n1 || !n2) return null;
            return (
              <line
                key={`ucs-hl-${idx}`}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="#00f2fe"
                strokeWidth="5"
                strokeLinecap="round"
                className="animate-dash-ucs"
                filter="url(#glow-cyan)"
              />
            );
          })}

          {/* Greedy Route Highlight */}
          {highlightPathGreedy.length > 1 && highlightPathGreedy.map((nodeId, idx) => {
            if (idx === highlightPathGreedy.length - 1) return null;
            const n1 = locMap.get(nodeId);
            const n2 = locMap.get(highlightPathGreedy[idx + 1]);
            if (!n1 || !n2) return null;
            return (
              <line
                key={`greedy-hl-${idx}`}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="#f97316"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-dash-greedy"
                filter="url(#glow-orange)"
              />
            );
          })}

          {/* Nodes (Fitur 10: Lokasi Ditampilkan Sebagai Node Dengan Nama & Ikon Awal/Tujuan) */}
          {locations.map(loc => {
            const isUCSPath = highlightPathUCS.includes(loc.id);
            const isGreedyPath = highlightPathGreedy.includes(loc.id);
            const isActiveStep = activeStepNode && activeStepNode.id === loc.id;
            const isConnectingStart = connectStartNodeId === loc.id;
            const isStart = effectiveStartId === loc.id;
            const isGoal = effectiveGoalId === loc.id;

            let borderColor = "#475569";
            let radius = 20;

            if (loc.type === "Terminal Utama") borderColor = "#38bdf8";
            else if (loc.type === "Stasiun Transit") borderColor = "#a855f7";
            else if (loc.type === "Rumah Sakit") borderColor = "#ef4444";
            else if (loc.type === "Pendidikan") borderColor = "#f59e0b";
            else if (loc.type === "Pusat Perbelanjaan") borderColor = "#ec4899";
            else if (loc.type === "Pusat Kota") borderColor = "#10b981";

            if (isUCSPath && isGreedyPath) borderColor = "#c084fc";
            else if (isUCSPath) borderColor = "#00f2fe";
            else if (isGreedyPath) borderColor = "#f97316";

            if (isActiveStep) {
              borderColor = isGreedyPath ? "#f97316" : "#00f2fe";
              radius = 23;
            }

            if (isStart) borderColor = "#10b981";
            if (isGoal) borderColor = "#f43f5e";

            return (
              <g
                key={loc.id}
                transform={`translate(${loc.x}, ${loc.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(loc)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (isConnectingMode) {
                    handleNodeConnectClick(loc.id);
                  } else if (onSelectLocation) {
                    onSelectLocation(loc);
                  }
                }}
              >
                {/* Active / Start / Goal Pulse Ring */}
                {(isActiveStep || isStart || isGoal || isConnectingStart) && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke={isStart ? "#10b981" : isGoal ? "#f43f5e" : isActiveStep ? (isGreedyPath ? "#f97316" : "#00f2fe") : "#f43f5e"}
                    strokeWidth="2.5"
                    className="pulse-ring"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r={radius}
                  fill="#0f172a"
                  stroke={borderColor}
                  strokeWidth={isActiveStep || isStart || isGoal ? 4 : 2.8}
                  data-node-id={loc.id}
                  className="transition-all duration-200 hover:scale-110"
                />

                {/* Node Code */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="#f8fafc"
                  fontWeight="bold"
                  className="pointer-events-none font-mono"
                >
                  {loc.code}
                </text>

                {/* Tampilkan Nama Lokasi */}
                <text
                  y={radius + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#cbd5e1"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {loc.name}
                </text>

                {/* Ikon Titik Awal (START) - Fitur 10 */}
                {isStart && (
                  <g transform={`translate(0, ${-radius - 18})`} filter="url(#glow-green)">
                    <rect x="-34" y="-11" width="68" height="20" rx="6" fill="#059669" stroke="#34d399" strokeWidth="1.5" />
                    <path d="M -24 -4 L -24 5 M -24 -4 L -16 -1 L -24 2" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="#34d399" />
                    <text x="5" y="1" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="bold" fill="#ffffff" className="font-mono">
                      START
                    </text>
                    <polygon points="-4,9 4,9 0,14" fill="#059669" />
                  </g>
                )}

                {/* Ikon Titik Tujuan (GOAL) - Fitur 10 */}
                {isGoal && (
                  <g transform={`translate(0, ${-radius - 18})`} filter="url(#glow-red)">
                    <rect x="-32" y="-11" width="64" height="20" rx="6" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" />
                    <circle cx="-19" cy="0" r="4.5" stroke="#ffffff" strokeWidth="1.2" fill="none" />
                    <circle cx="-19" cy="0" r="2" fill="#ffffff" />
                    <text x="5" y="1" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="bold" fill="#ffffff" className="font-mono">
                      GOAL
                    </text>
                    <polygon points="-4,9 4,9 0,14" fill="#dc2626" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover Cards */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl max-w-xs text-xs pointer-events-none">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-100 text-sm">{hoveredNode.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-400 font-mono">{hoveredNode.id}</span>
          </div>
          <p className="text-slate-400 text-[11px] mb-2">{hoveredNode.type}</p>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Koordinat (Lat, Lng):</span>
              <span className="font-mono text-cyan-400">{hoveredNode.latitude?.toFixed(4)}, {hoveredNode.longitude?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penumpang Naik:</span>
              <span className="font-mono text-emerald-400 font-bold">{hoveredNode.penumpangNaik?.toLocaleString()} pax</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penumpang Turun:</span>
              <span className="font-mono text-rose-400 font-bold">{hoveredNode.penumpangTurun?.toLocaleString()} pax</span>
            </div>
          </div>
        </div>
      )}

      {hoveredRoad && (
        <div className="absolute top-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-2xl max-w-xs text-xs pointer-events-none">
          <div className="font-bold text-slate-200 mb-1 flex items-center justify-between">
            <span>Hubungan Jalan {hoveredRoad.id}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${hoveredRoad.bidirectional ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/20 text-cyan-300"}`}>
              {hoveredRoad.bidirectional ? "Dua Arah (⇄)" : "Satu Arah (→)"}
            </span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div>Dari: <span className="text-cyan-400 font-medium">{locMap.get(hoveredRoad.from)?.name}</span></div>
            <div>Ke: <span className="text-cyan-400 font-medium">{locMap.get(hoveredRoad.to)?.name}</span></div>
            <div>Jarak: <span className="font-mono text-emerald-400 font-bold">{hoveredRoad.distanceKm} km</span></div>
            <div>Waktu Tempuh: <span className="font-mono text-amber-400 font-bold">{hoveredRoad.travelTimeMin} menit</span></div>
            <div>Biaya Tarif: <span className="font-mono text-indigo-400 font-bold">Rp {hoveredRoad.fareRp?.toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN APP COMPONENT ---
