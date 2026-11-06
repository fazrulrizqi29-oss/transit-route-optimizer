import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_LOCATIONS, DEFAULT_ROADS, DEFAULT_TRANSIT_ROUTES, DEFAULT_OD_PASSENGERS } from './data/defaultData.js';
import { calculateHaversineDistance } from './algorithms/graph.js';
import { runUCS } from './algorithms/ucs.js';
import { runGreedyBestFirst } from './algorithms/greedy.js';
import { findTransitRouteOptions, analyzeRouteDemand } from './algorithms/transit.js';
import { compareAlgorithms } from './algorithms/comparator.js';
import { Icons } from './components/Icons.jsx';
import { GraphCanvas } from './components/GraphCanvas.jsx';

export default function App() {
  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem("TRANSIT_OPTIMIZER_LOCATIONS");
    return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
  });

  const [roads, setRoads] = useState(() => {
    const saved = localStorage.getItem("TRANSIT_OPTIMIZER_ROADS");
    return saved ? JSON.parse(saved) : DEFAULT_ROADS;
  });

  const [transitRoutes, setTransitRoutes] = useState(() => {
    const saved = localStorage.getItem("TRANSIT_OPTIMIZER_ROUTES");
    return saved ? JSON.parse(saved) : DEFAULT_TRANSIT_ROUTES;
  });

  const [odPassengers, setOdPassengers] = useState(() => {
    const saved = localStorage.getItem("TRANSIT_OPTIMIZER_OD_PASSENGERS");
    return saved ? JSON.parse(saved) : DEFAULT_OD_PASSENGERS;
  });

  useEffect(() => {
    localStorage.setItem("TRANSIT_OPTIMIZER_LOCATIONS", JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem("TRANSIT_OPTIMIZER_ROADS", JSON.stringify(roads));
  }, [roads]);

  useEffect(() => {
    localStorage.setItem("TRANSIT_OPTIMIZER_ROUTES", JSON.stringify(transitRoutes));
  }, [transitRoutes]);

  useEffect(() => {
    localStorage.setItem("TRANSIT_OPTIMIZER_OD_PASSENGERS", JSON.stringify(odPassengers));
  }, [odPassengers]);

  const [activeTab, setActiveTab] = useState("dashboard");

  // Search parameters
  const [selectedOrigin, setSelectedOrigin] = useState("LOC-A");
  const [selectedDestination, setSelectedDestination] = useState("LOC-F");
  const [ucsCriterion, setUcsCriterion] = useState("distance"); // 'distance' atau 'time'

  // Step-by-Step Traversal Playback States
  const [ucsPlaybackStep, setUcsPlaybackStep] = useState(0);
  const [isUcsPlaying, setIsUcsPlaying] = useState(false);
  const [ucsSpeed, setUcsSpeed] = useState(800);

  const [greedyPlaybackStep, setGreedyPlaybackStep] = useState(0);
  const [isGreedyPlaying, setIsGreedyPlaying] = useState(false);
  const [greedySpeed, setGreedySpeed] = useState(800);

  // Route Finder Parameters for Tab 4
  const [routeFinderOrigin, setRouteFinderOrigin] = useState("LOC-B");
  const [routeFinderDestination, setRouteFinderDestination] = useState("LOC-F");

  // Passenger Filter for Tab 5
  const [selectedPeriodeFilter, setSelectedPeriodeFilter] = useState("Semua");

  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationFormData, setLocationFormData] = useState({
    id: "",
    name: "",
    code: "",
    type: "Halte Bus",
    latitude: -6.9100,
    longitude: 107.6200,
    penumpangNaik: 1500,
    penumpangTurun: 1400,
    x: 400,
    y: 300
  });

  const [isRoadModalOpen, setIsRoadModalOpen] = useState(false);
  const [editingRoad, setEditingRoad] = useState(null);
  const [roadFormData, setRoadFormData] = useState({
    id: "",
    from: "LOC-A",
    to: "LOC-D",
    distanceKm: 3.5,
    travelTimeMin: 8,
    fareRp: 4000,
    bidirectional: true
  });

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeFormData, setRouteFormData] = useState({
    id: "",
    name: "",
    kodeAngkutan: "",
    stops: ["LOC-A", "LOC-D", "LOC-F"],
    fleetCount: 10,
    passengerCapacity: 40,
    fareRp: 4000,
    color: "#0284c7"
  });

  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [passengerFormData, setPassengerFormData] = useState({
    id: "",
    originId: "LOC-A",
    destinationId: "LOC-F",
    penumpangNaik: 500,
    penumpangTurun: 480,
    periode: "Pagi (06:30 - 08:30)",
    tanggal: "2026-11-06"
  });

  // Search results
  const [ucsResult, setUcsResult] = useState(() => runUCS(DEFAULT_LOCATIONS, DEFAULT_ROADS, "LOC-A", "LOC-F", "distance", DEFAULT_TRANSIT_ROUTES));
  const [greedyResult, setGreedyResult] = useState(() => runGreedyBestFirst(DEFAULT_LOCATIONS, DEFAULT_ROADS, "LOC-A", "LOC-F", DEFAULT_TRANSIT_ROUTES));
  const [comparisonResult, setComparisonResult] = useState(() => compareAlgorithms(DEFAULT_LOCATIONS, DEFAULT_ROADS, "LOC-A", "LOC-F", "distance", DEFAULT_TRANSIT_ROUTES));

  // Timer Animation for UCS Step Playback
  useEffect(() => {
    let timer = null;
    if (isUcsPlaying && ucsResult?.traversalSteps) {
      timer = setInterval(() => {
        setUcsPlaybackStep(step => {
          if (step < ucsResult.traversalSteps.length - 1) return step + 1;
          setIsUcsPlaying(false);
          return step;
        });
      }, ucsSpeed);
    }
    return () => clearInterval(timer);
  }, [isUcsPlaying, ucsResult, ucsSpeed]);

  // Timer Animation for Greedy Step Playback
  useEffect(() => {
    let timer = null;
    if (isGreedyPlaying && greedyResult?.traversalSteps) {
      timer = setInterval(() => {
        setGreedyPlaybackStep(step => {
          if (step < greedyResult.traversalSteps.length - 1) return step + 1;
          setIsGreedyPlaying(false);
          return step;
        });
      }, greedySpeed);
    }
    return () => clearInterval(timer);
  }, [isGreedyPlaying, greedyResult, greedySpeed]);

  const handleRunUCS = () => {
    const res = runUCS(locations, roads, selectedOrigin, selectedDestination, ucsCriterion, transitRoutes);
    setUcsResult(res);
    setUcsPlaybackStep(0);
    setIsUcsPlaying(false);
  };

  const handleRunGreedy = () => {
    const res = runGreedyBestFirst(locations, roads, selectedOrigin, selectedDestination, transitRoutes);
    setGreedyResult(res);
    setGreedyPlaybackStep(0);
    setIsGreedyPlaying(false);
  };

  const handleRunComparison = (orig = selectedOrigin, dest = selectedDestination, crit = ucsCriterion) => {
    setSelectedOrigin(orig);
    setSelectedDestination(dest);
    const comp = compareAlgorithms(locations, roads, orig, dest, crit, transitRoutes);
    setComparisonResult(comp);
    setUcsResult(comp.ucs);
    setGreedyResult(comp.greedy);
  };

  const handleVisualConnectNodes = (fromNodeId, toNodeId) => {
    const fromNode = locations.find(l => l.id === fromNodeId);
    const toNode = locations.find(l => l.id === toNodeId);
    const estDist = Number(calculateHaversineDistance(fromNode, toNode) || 3.0);
    const estTime = Math.round(estDist * 2.2);

    setEditingRoad(null);
    setRoadFormData({
      id: `ROAD-${String(roads.length + 1).padStart(2, '0')}`,
      from: fromNodeId,
      to: toNodeId,
      distanceKm: estDist > 0 ? estDist : 3.0,
      travelTimeMin: estTime > 0 ? estTime : 7,
      fareRp: 3500,
      bidirectional: true
    });
    setIsRoadModalOpen(true);
  };

  const handleUpdateLocationPosition = (nodeId, newX, newY) => {
    setLocations(prev => prev.map(loc => loc.id === nodeId ? { ...loc, x: newX, y: newY } : loc));
  };

  // Location Form
  // ---------- VALIDASI & CRUD ----------
  const isNum = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));
  const fail = (msg) => { alert("⚠ " + msg); return false; };

  const deriveRoadLines = (from, to, routes) =>
    routes.filter(r => (r.stops || []).some((sid, k, arr) =>
      k < arr.length - 1 && ((sid === from && arr[k + 1] === to) || (sid === to && arr[k + 1] === from))
    )).map(r => r.id);

  const deleteLocationCascade = (locId) => {
    setLocations(prev => prev.filter(l => l.id !== locId));
    setRoads(prev => prev.filter(r => r.from !== locId && r.to !== locId));
    setTransitRoutes(prev => prev
      .map(tr => ({ ...tr, stops: (tr.stops || []).filter(sid => sid !== locId) }))
      .filter(tr => tr.stops.length >= 2));
    setOdPassengers(prev => prev.filter(o => o.originId !== locId && o.destinationId !== locId));
  };

  const deleteRouteCascade = (routeId) => {
    setTransitRoutes(prev => prev.filter(tr => tr.id !== routeId));
    setRoads(prev => prev.map(r => ({ ...r, transitLines: (r.transitLines || []).filter(id => id !== routeId) })));
  };

  const handleSaveLocation = (e) => {
    e.preventDefault();
    const f = locationFormData;
    const name = String(f.name || "").trim();
    const code = String(f.code || "").trim();
    if (!name) return fail("Nama lokasi wajib diisi.");
    if (!isNum(f.latitude) || Number(f.latitude) < -90 || Number(f.latitude) > 90) return fail("Latitude harus angka antara -90 dan 90.");
    if (!isNum(f.longitude) || Number(f.longitude) < -180 || Number(f.longitude) > 180) return fail("Longitude harus angka antara -180 dan 180.");
    if (!isNum(f.penumpangNaik) || Number(f.penumpangNaik) < 0) return fail("Penumpang naik harus angka ≥ 0.");
    if (!isNum(f.penumpangTurun) || Number(f.penumpangTurun) < 0) return fail("Penumpang turun harus angka ≥ 0.");
    const others = locations.filter(l => l.id !== editingLocation?.id);
    if (others.some(l => String(l.name).toLowerCase() === name.toLowerCase())) return fail("Nama lokasi sudah digunakan.");
    if (code && others.some(l => String(l.code).toLowerCase() === code.toLowerCase())) return fail("Kode lokasi sudah digunakan.");
    const base = {
      name, code: code || (editingLocation?.code ?? ""), type: f.type,
      latitude: Number(f.latitude), longitude: Number(f.longitude),
      penumpangNaik: Math.round(Number(f.penumpangNaik)), penumpangTurun: Math.round(Number(f.penumpangTurun))
    };
    if (editingLocation) {
      setLocations(prev => prev.map(l => l.id === editingLocation.id ? { ...l, ...base } : l));
    } else {
      let newId = String(f.id || "").trim();
      if (newId && locations.some(l => l.id === newId)) return fail("ID lokasi sudah ada.");
      if (!newId) {
        let n = locations.length;
        do { newId = `LOC-${n < 26 ? String.fromCharCode(65 + n) : n + 1}`; n++; } while (locations.some(l => l.id === newId));
      }
      setLocations([...locations, {
        ...f, ...base, id: newId, code: base.code || newId.replace("LOC-", "LK-"),
        x: isNum(f.x) ? Number(f.x) : 400, y: isNum(f.y) ? Number(f.y) : 300
      }]);
    }
    setIsLocationModalOpen(false);
  };

  // Road Form
  const handleSaveRoad = (e) => {
    e.preventDefault();
    const f = roadFormData;
    if (!f.from || !f.to) return fail("Simpul asal dan tujuan wajib dipilih.");
    if (f.from === f.to) return fail("Simpul asal dan tujuan tidak boleh sama!");
    if (!isNum(f.distanceKm) || Number(f.distanceKm) <= 0) return fail("Jarak harus angka > 0 km.");
    if (!isNum(f.travelTimeMin) || Number(f.travelTimeMin) <= 0) return fail("Waktu tempuh harus angka > 0 menit.");
    if (!isNum(f.fareRp) || Number(f.fareRp) < 0) return fail("Tarif harus angka ≥ 0.");
    const dup = roads.some(r => r.id !== editingRoad?.id &&
      ((r.from === f.from && r.to === f.to) || (r.bidirectional !== false && f.bidirectional && r.from === f.to && r.to === f.from)));
    if (dup) return fail("Hubungan jalan antara kedua simpul ini sudah ada.");
    const data = {
      from: f.from, to: f.to, distanceKm: Number(f.distanceKm), travelTimeMin: Number(f.travelTimeMin),
      fareRp: Math.round(Number(f.fareRp)), bidirectional: !!f.bidirectional
    };
    const derived = deriveRoadLines(data.from, data.to, transitRoutes);
    if (editingRoad) {
      const same = editingRoad.from === data.from && editingRoad.to === data.to;
      const lines = Array.from(new Set([...(same ? (editingRoad.transitLines || []) : []), ...derived]));
      setRoads(prev => prev.map(r => r.id === editingRoad.id ? { ...r, ...data, transitLines: lines } : r));
    } else {
      let newId = String(f.id || "").trim();
      if (newId && roads.some(r => r.id === newId)) return fail("ID jalan sudah ada.");
      if (!newId) {
        let n = roads.length + 1;
        do { newId = `ROAD-${String(n).padStart(2, '0')}`; n++; } while (roads.some(r => r.id === newId));
      }
      setRoads([...roads, { ...data, id: newId, transitLines: derived }]);
    }
    setIsRoadModalOpen(false);
  };

  // Route Form
  const handleSaveRoute = (e) => {
    e.preventDefault();
    const f = routeFormData;
    const name = String(f.name || "").trim();
    const kode = String(f.kodeAngkutan || "").trim();
    const stops = f.stops || [];
    if (!name) return fail("Nama trayek wajib diisi.");
    if (!kode) return fail("Kode angkutan wajib diisi.");
    if (transitRoutes.some(t => t.id !== editingRoute?.id && String(t.kodeAngkutan).toLowerCase() === kode.toLowerCase())) return fail("Kode angkutan sudah digunakan.");
    if (stops.length < 2) return fail("Trayek minimal memiliki 2 pemberhentian.");
    if (stops.some(sid => !locations.some(l => l.id === sid))) return fail("Ada pemberhentian yang tidak ada di data lokasi.");
    if (stops.some((sid, k) => k > 0 && sid === stops[k - 1])) return fail("Pemberhentian berurutan tidak boleh sama.");
    if (!isNum(f.fleetCount) || Number(f.fleetCount) < 1) return fail("Jumlah armada minimal 1.");
    if (!isNum(f.passengerCapacity) || Number(f.passengerCapacity) < 1) return fail("Kapasitas penumpang minimal 1.");
    if (!isNum(f.fareRp) || Number(f.fareRp) < 0) return fail("Tarif harus angka ≥ 0.");
    const data = {
      name, kodeAngkutan: kode, stops, color: f.color || "#38bdf8",
      fleetCount: Math.round(Number(f.fleetCount)), passengerCapacity: Math.round(Number(f.passengerCapacity)),
      fareRp: Math.round(Number(f.fareRp))
    };
    if (editingRoute) {
      setTransitRoutes(prev => prev.map(tr => tr.id === editingRoute.id ? { ...tr, ...data } : tr));
    } else {
      let n = transitRoutes.length + 1, newId;
      do { newId = `TR-${String(n).padStart(2, '0')}`; n++; } while (transitRoutes.some(t => t.id === newId));
      setTransitRoutes([...transitRoutes, { ...data, id: newId }]);
    }
    setIsRouteModalOpen(false);
  };

  // Passenger OD Form
  const handleSavePassengerOD = (e) => {
    e.preventDefault();
    const f = passengerFormData;
    if (!f.originId || !f.destinationId) return fail("Lokasi asal dan tujuan wajib dipilih.");
    if (f.originId === f.destinationId) return fail("Lokasi asal dan tujuan tidak boleh sama!");
    if (!isNum(f.penumpangNaik) || Number(f.penumpangNaik) < 0 || !Number.isInteger(Number(f.penumpangNaik))) return fail("Penumpang naik harus bilangan bulat ≥ 0.");
    if (!isNum(f.penumpangTurun) || Number(f.penumpangTurun) < 0 || !Number.isInteger(Number(f.penumpangTurun))) return fail("Penumpang turun harus bilangan bulat ≥ 0.");
    if (!f.periode) return fail("Periode wajib dipilih.");
    const data = {
      originId: f.originId, destinationId: f.destinationId,
      penumpangNaik: Number(f.penumpangNaik), penumpangTurun: Number(f.penumpangTurun),
      periode: f.periode, tanggal: f.tanggal || new Date().toISOString().slice(0, 10)
    };
    if (editingPassenger) {
      setOdPassengers(prev => prev.map(o => o.id === editingPassenger.id ? { ...o, ...data } : o));
    } else {
      let n = odPassengers.length + 1, newId;
      do { newId = `OD-${String(n).padStart(2, '0')}`; n++; } while (odPassengers.some(o => o.id === newId));
      setOdPassengers([{ ...data, id: newId }, ...odPassengers]);
    }
    setIsPassengerModalOpen(false);
  };

  const resetAllDataToDefault = () => {
    if (confirm("Reset seluruh data ke dataset default?")) {
      setLocations(DEFAULT_LOCATIONS);
      setRoads(DEFAULT_ROADS);
      setTransitRoutes(DEFAULT_TRANSIT_ROUTES);
      setOdPassengers(DEFAULT_OD_PASSENGERS);
      localStorage.clear();
      handleRunComparison("LOC-A", "LOC-F", "distance");
    }
  };

  const transitRouteOptions = useMemo(() => {
    return findTransitRouteOptions(routeFinderOrigin, routeFinderDestination, transitRoutes, locations, roads, odPassengers);
  }, [routeFinderOrigin, routeFinderDestination, transitRoutes, locations, roads, odPassengers]);

  const routeDemandAnalysis = useMemo(() => {
    return analyzeRouteDemand(transitRoutes, odPassengers);
  }, [transitRoutes, odPassengers]);

  const totalPenumpangNaik = useMemo(() => locations.reduce((s, l) => s + (l.penumpangNaik || 0), 0), [locations]);
  const totalPenumpangTurun = useMemo(() => locations.reduce((s, l) => s + (l.penumpangTurun || 0), 0), [locations]);

  // Analisis Distribusi Penumpang & Kinerja Trayek (Fitur 12)
  const passengerAnalytics = useMemo(() => {
    const locationsWithActivity = locations.map(loc => {
      const naik = loc.penumpangNaik || 0;
      const turun = loc.penumpangTurun || 0;
      const totalActivity = naik + turun;
      const netFlow = naik - turun;
      let statusMobilitas = "Seimbang";
      if (netFlow > 200) statusMobilitas = "Pusat Bangkitan";
      else if (netFlow < -200) statusMobilitas = "Pusat Tarikan";
      return {
        ...loc,
        totalActivity,
        netFlow,
        statusMobilitas
      };
    }).sort((a, b) => b.totalActivity - a.totalActivity);

    const highestActivityLocation = locationsWithActivity[0] || null;

    const sortedDemandRoutes = [...routeDemandAnalysis].sort((a, b) => b.matchedPassengers - a.matchedPassengers);
    const highestDemandRoute = sortedDemandRoutes[0] || null;
    const lowestDemandRoute = sortedDemandRoutes[sortedDemandRoutes.length - 1] || null;

    const maxBarValue = Math.max(1, ...locations.map(l => Math.max(l.penumpangNaik || 0, l.penumpangTurun || 0)));

    return {
      locationsWithActivity,
      highestActivityLocation,
      highestDemandRoute,
      lowestDemandRoute,
      maxBarValue
    };
  }, [locations, routeDemandAnalysis]);

  const filteredODPassengers = useMemo(() => {
    if (selectedPeriodeFilter === "Semua") return odPassengers;
    return odPassengers.filter(p => p.periode.toLowerCase().includes(selectedPeriodeFilter.toLowerCase()));
  }, [odPassengers, selectedPeriodeFilter]);

  // Current Traversal Step Helpers
  const currentUcsStep = useMemo(() => {
    if (!ucsResult?.traversalSteps || ucsResult.traversalSteps.length === 0) return null;
    return ucsResult.traversalSteps[ucsPlaybackStep] || ucsResult.traversalSteps[0];
  }, [ucsResult, ucsPlaybackStep]);

  const currentGreedyStep = useMemo(() => {
    if (!greedyResult?.traversalSteps || greedyResult.traversalSteps.length === 0) return null;
    return greedyResult.traversalSteps[greedyPlaybackStep] || greedyResult.traversalSteps[0];
  }, [greedyResult, greedyPlaybackStep]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 z-30 select-none">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icons.Compass />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-100 tracking-wider">TRANSIT OPTIMIZER</h1>
              <span className="text-[10px] text-cyan-400 font-mono font-medium">UCS & GREEDY GRAPH</span>
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {[
              { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard },
              { id: "locations", label: "Data Lokasi", icon: Icons.MapPin, badge: locations.length },
              { id: "roads", label: "Jaringan Jalan", icon: Icons.Road, badge: roads.length },
              { id: "routes", label: "Data Trayek", icon: Icons.Bus, badge: transitRoutes.length },
              { id: "passengers", label: "Data Penumpang", icon: Icons.Users, badge: odPassengers.length },
              { id: "ucs", label: "Pencarian UCS", icon: Icons.Compass, color: "text-cyan-400" },
              { id: "greedy", label: "Pencarian Greedy", icon: Icons.Target, color: "text-orange-400" },
              { id: "comparison", label: "Perbandingan Algoritma", icon: Icons.Compare, special: true },
              { id: "reports", label: "Laporan", icon: Icons.Report }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${isActive
                    ? item.special
                      ? "bg-gradient-to-r from-cyan-600/30 to-orange-600/30 text-white border border-cyan-500/40 shadow-lg"
                      : "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? (item.color || "text-cyan-400") : "text-slate-500"}>
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-800 text-slate-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={resetAllDataToDefault}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
          >
            <Icons.Reset />
            <span>Reset ke Data Default</span>
          </button>
        </div>
      </aside>

          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Modul</span>
              <span className="text-slate-600">/</span>
              <span className="text-sm font-semibold text-slate-100 capitalize">
                {activeTab === "ucs" ? "Implementasi Algoritma Uniform Cost Search (UCS)" :
                  activeTab === "greedy" ? "Implementasi Algoritma Greedy Best-First Search" :
                    activeTab === "comparison" ? "Perbandingan Algoritma UCS vs Greedy" :
                      activeTab}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <span className="text-slate-400">UCS: </span>
                <span className="text-cyan-400 font-bold">Optimal Least-Cost</span>
              </div>
              <div className="bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <span className="text-slate-400">Greedy: </span>
                <span className="text-orange-400 font-bold">Min Haversine h(n)</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
            {/* TAB 1: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
                      <Icons.Sparkles />
                      <span>Sistem Optimasi Rute Angkutan Umum Berbasis Graph</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-100">TRANSIT ROUTE OPTIMIZER</h2>
                    <p className="text-xs text-slate-400">
                      Pencarian dan optimasi rute angkutan umum perkotaan menggunakan algoritma <strong>Uniform Cost Search (UCS)</strong> dan <strong>Greedy Best-First Search</strong> dengan visualisasi graf interaktif dan simulasi step-by-step.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setActiveTab("ucs")}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition"
                    >
                      Pencarian UCS
                    </button>
                    <button
                      onClick={() => setActiveTab("greedy")}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition"
                    >
                      Pencarian Greedy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/20 shadow-lg space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Total Lokasi</span>
                    <div className="text-2xl font-bold font-mono text-cyan-400">{locations.length}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Simpul (Node)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/20 shadow-lg space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Jaringan Jalan</span>
                    <div className="text-2xl font-bold font-mono text-indigo-400">{roads.length}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Sisi (Edge)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-lg space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Trayek Transit</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400">{transitRoutes.length}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Koridor Bus</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-lg space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Pemberhentian</span>
                    <div className="text-2xl font-bold font-mono text-amber-400">{locations.length}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Halte / Shelter</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/20 shadow-lg space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Penumpang Naik</span>
                    <div className="text-xl font-bold font-mono text-emerald-400">{totalPenumpangNaik.toLocaleString()}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Pax / Hari</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/20 shadow-lg space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Total Armada</span>
                    <div className="text-2xl font-bold font-mono text-purple-400">{transitRoutes.reduce((s, r) => s + (r.fleetCount || 0), 0)}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Unit Bus</span>
                  </div>
                </div>

                <GraphCanvas
                  locations={locations}
                  roads={roads}
                  highlightPathUCS={ucsResult?.path || []}
                  highlightPathGreedy={greedyResult?.path || []}
                  startNodeId={selectedOrigin}
                  goalNodeId={selectedDestination}
                  onUpdateLocationPosition={handleUpdateLocationPosition}
                  onConnectNodes={handleVisualConnectNodes}
                  height="460px"
                />
              </div>
            )}

            {/* TAB 2: DATA LOKASI */}
            {activeTab === "locations" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Manajemen Data Lokasi (Node)</h2>
                    <p className="text-xs text-slate-400">Daftar lokasi halte dan stasiun transit dengan koordinat latitude, longitude, dan volume penumpang.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLocation(null);
                      const nextChar = String.fromCharCode(65 + locations.length);
                      setLocationFormData({
                        id: `LOC-${nextChar}`,
                        name: `Halte ${nextChar}`,
                        code: `HLT-${nextChar}`,
                        type: "Halte Bus",
                        latitude: -6.9200,
                        longitude: 107.6300,
                        penumpangNaik: 1200,
                        penumpangTurun: 1100,
                        x: 400,
                        y: 300
                      });
                      setIsLocationModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition"
                  >
                    <Icons.Plus />
                    <span>Tambah Lokasi Baru</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Nama Lokasi</th>
                          <th className="py-3 px-4">Latitude</th>
                          <th className="py-3 px-4">Longitude</th>
                          <th className="py-3 px-4">Penumpang Naik</th>
                          <th className="py-3 px-4">Penumpang Turun</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {locations.map(loc => (
                          <tr key={loc.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{loc.id}</td>
                            <td className="py-3 px-4 text-slate-200 font-semibold">{loc.name}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{loc.latitude?.toFixed(6)}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{loc.longitude?.toFixed(6)}</td>
                            <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{loc.penumpangNaik?.toLocaleString()} pax</td>
                            <td className="py-3 px-4 font-mono text-rose-400 font-bold">{loc.penumpangTurun?.toLocaleString()} pax</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                                {loc.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingLocation(loc);
                                  setLocationFormData({ ...loc });
                                  setIsLocationModalOpen(true);
                                }}
                                className="text-cyan-400 hover:text-cyan-300 font-semibold"
                              >
                                Ubah
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus lokasi ${loc.name}?`)) {
                                    deleteLocationCascade(loc.id);
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-300 font-semibold"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: JARINGAN JALAN */}
            {activeTab === "roads" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Manajemen Jaringan Jalan (Sistem Graph)</h2>
                    <p className="text-xs text-slate-400">Konfigurasi jarak jalan (km), waktu tempuh (menit), biaya tarif, dan arah (satu arah vs dua arah).</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoad(null);
                      setRoadFormData({
                        id: `ROAD-${String(roads.length + 1).padStart(2, '0')}`,
                        from: locations[0]?.id || "LOC-A",
                        to: locations[1]?.id || "LOC-B",
                        distanceKm: 3.5,
                        travelTimeMin: 8,
                        fareRp: 4000,
                        bidirectional: true
                      });
                      setIsRoadModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                  >
                    <Icons.Plus />
                    <span>Tambah Hubungan Jalan</span>
                  </button>
                </div>

                <GraphCanvas
                  locations={locations}
                  roads={roads}
                  startNodeId={selectedOrigin}
                  goalNodeId={selectedDestination}
                  onUpdateLocationPosition={handleUpdateLocationPosition}
                  onConnectNodes={handleVisualConnectNodes}
                  height="440px"
                />

                <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">ID Sisi</th>
                          <th className="py-3 px-4">Simpul Asal</th>
                          <th className="py-3 px-4">Simpul Tujuan</th>
                          <th className="py-3 px-4">Jarak (km)</th>
                          <th className="py-3 px-4">Waktu (menit)</th>
                          <th className="py-3 px-4">Biaya Tarif</th>
                          <th className="py-3 px-4">Tipe Arah</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {roads.map(road => {
                          const nFrom = locations.find(l => l.id === road.from);
                          const nTo = locations.find(l => l.id === road.to);
                          return (
                            <tr key={road.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{road.id}</td>
                              <td className="py-3 px-4 text-slate-200">{nFrom ? nFrom.name : road.from}</td>
                              <td className="py-3 px-4 text-slate-200">{nTo ? nTo.name : road.to}</td>
                              <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{road.distanceKm} km</td>
                              <td className="py-3 px-4 font-mono text-amber-400 font-bold">{road.travelTimeMin} mnt</td>
                              <td className="py-3 px-4 font-mono text-cyan-400 font-bold">Rp {road.fareRp?.toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${road.bidirectional
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  }`}>
                                  {road.bidirectional ? "Dua Arah (⇄)" : "Satu Arah (→)"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingRoad(road);
                                    setRoadFormData({ ...road });
                                    setIsRoadModalOpen(true);
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                                >
                                  Ubah
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus hubungan jalan ${road.id}?`)) {
                                      setRoads(roads.filter(r => r.id !== road.id));
                                    }
                                  }}
                                  className="text-rose-400 hover:text-rose-300 font-semibold"
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DATA TRAYEK */}
            {activeTab === "routes" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <Icons.Bus />
                      <span>Manajemen Data Trayek & Perpindahan Angkutan</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Kelola trayek angkutan umum: ID, Nama, Kode Angkutan, Urutan Pemberhentian, Jumlah Armada, dan Kapasitas Penumpang.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoute(null);
                      setRouteFormData({
                        id: `TR-${String(transitRoutes.length + 1).padStart(2, '0')}`,
                        name: `Trayek ${transitRoutes.length + 1}`,
                        kodeAngkutan: `ANG-${transitRoutes.length + 1}`,
                        stops: ["LOC-A", "LOC-D", "LOC-F"],
                        fleetCount: 10,
                        passengerCapacity: 40,
                        fareRp: 4000,
                        color: "#38bdf8"
                      });
                      setIsRouteModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
                  >
                    <Icons.Plus />
                    <span>Tambah Trayek Baru</span>
                  </button>
                </div>

                {/* IDENTIFIKASI TRAYEK & PERPINDAHAN TRAYEK */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                        <Icons.Transfer />
                        <span>Identifikasi Trayek & Perpindahan Angkutan (Transit Transfer Finder)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Sistem otomatis mengidentifikasi trayek langsung atau transit transfer jika penumpang harus berganti angkutan.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Lokasi Asal:</label>
                      <select
                        value={routeFinderOrigin}
                        onChange={(e) => setRouteFinderOrigin(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Lokasi Tujuan:</label>
                      <select
                        value={routeFinderDestination}
                        onChange={(e) => setRouteFinderDestination(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* HASIL IDENTIFIKASI & SISTEM REKOMENDASI RUTE ANGKUTAN UMUM (FITUR 13) */}
                  <div className="space-y-4 pt-2">
                    {/* 1. REKOMENDASI UTAMA ANGKUTAN UMUM (BEST TRANSIT RECOMMENDATION) */}
                    {transitRouteOptions.bestRecommendation && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/40 border border-emerald-500/50 shadow-xl space-y-3 font-mono text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                              REKOMENDASI TERBAIK
                            </span>
                            <span className="font-bold text-slate-100 text-sm">
                              {transitRouteOptions.bestRecommendation.type === "DIRECT"
                                ? `Rute Langsung: ${transitRouteOptions.bestRecommendation.routeName}`
                                : `Rute Transit (1x Transfer): ${transitRouteOptions.bestRecommendation.r1.kodeAngkutan} ➔ ${transitRouteOptions.bestRecommendation.r2.kodeAngkutan}`}
                            </span>
                          </div>
                          <span className="text-[11px] text-cyan-300 font-bold">
                            {transitRouteOptions.bestRecommendation.transferCount === 0 ? "0 Perpindahan (Direct)" : "1x Perpindahan Halte"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Jarak Rute Bus:</span>
                            <span className="font-bold text-cyan-400 text-sm">{transitRouteOptions.bestRecommendation.distanceKm} km</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Estimasi Waktu:</span>
                            <span className="font-bold text-emerald-400 text-sm">{transitRouteOptions.bestRecommendation.estimatedTimeMin} menit</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Tarif Perjalanan:</span>
                            <span className="font-bold text-amber-400 text-sm">
                              Rp {(transitRouteOptions.bestRecommendation.fareRp || transitRouteOptions.bestRecommendation.totalFareRp)?.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Permintaan Penumpang:</span>
                            <span className="font-bold text-indigo-400 text-sm">
                              {transitRouteOptions.bestRecommendation.matchedDemandPax > 0
                                ? `${transitRouteOptions.bestRecommendation.matchedDemandPax} pax`
                                : 'Tersedia'}
                            </span>
                          </div>
                        </div>

                        {/* Urutan Halte Pemberhentian yang Dilalui */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] text-slate-400 font-bold">Urutan Halte Pemberhentian:</span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {transitRouteOptions.bestRecommendation.stops.map((stopId, idx) => (
                              <span key={idx} className="inline-flex items-center space-x-1">
                                <span className={`px-2 py-0.5 rounded-md border font-semibold ${stopId === routeFinderOrigin
                                    ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                                    : (stopId === routeFinderDestination
                                      ? "bg-rose-950 text-rose-300 border-rose-600"
                                      : (stopId === transitRouteOptions.bestRecommendation.interchangeId
                                        ? "bg-amber-950 text-amber-300 border-amber-600 font-bold"
                                        : "bg-slate-800 text-slate-300 border-slate-700"))
                                  }`}>
                                  {locations.find(l => l.id === stopId)?.name || stopId}
                                  {stopId === transitRouteOptions.bestRecommendation.interchangeId && " (Halte Transit)"}
                                </span>
                                {idx < transitRouteOptions.bestRecommendation.stops.length - 1 && (
                                  <span className="text-cyan-500 font-bold">➔</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. DAFTAR PILIHAN RUTE LANGSUNG (0 TRANSFER) */}
                    {transitRouteOptions.directRoutes.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                          Semua Trayek Langsung ({transitRouteOptions.directRoutes.length} Trayek Tersedia):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {transitRouteOptions.directRoutes.map((dir, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/40 space-y-1.5 font-mono text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-100">{dir.route.name}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                                  {dir.route.kodeAngkutan}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Jarak: <strong className="text-cyan-400">{dir.distanceKm} km</strong></span>
                                <span>Waktu: <strong className="text-emerald-400">{dir.estimatedTimeMin} mnt</strong></span>
                                <span>Tarif: <strong className="text-amber-400">Rp {dir.fareRp.toLocaleString()}</strong></span>
                              </div>
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                                {dir.stops.map(s => locations.find(l => l.id === s)?.name || s).join(" → ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. DAFTAR PILIHAN PERPINDAHAN TRAYEK (TRANSIT TRANSFER) */}
                    {transitRouteOptions.transferRoutes.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] text-amber-400 font-semibold font-mono">
                          Opsi Perpindahan Angkutan ({transitRouteOptions.transferRoutes.length} Alternatif):
                        </span>
                        <div className="space-y-2">
                          {transitRouteOptions.transferRoutes.map((trf, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-amber-500/30 text-xs font-mono space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-200">
                                  Naik <strong>{trf.r1.kodeAngkutan} ({trf.r1.name})</strong> → Transit di <strong className="text-amber-300 font-bold">{trf.interchangeName}</strong> → Ganti ke <strong>{trf.r2.kodeAngkutan} ({trf.r2.name})</strong>
                                </span>
                                <span className="text-emerald-400 font-bold">Rp {trf.totalFareRp.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                                <span>Total Jarak: <strong className="text-cyan-400">{trf.distanceKm} km</strong></span>
                                <span>Total Waktu: <strong className="text-emerald-400">{trf.estimatedTimeMin} mnt</strong> (termasuk transfer {trf.transferWaitTimeMin} mnt)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. PERINGATAN BILA RUTE ANGKUTAN UMUM BELUM TERSEDIA (KETENTUAN FITUR 13) */}
                    {!transitRouteOptions.hasTransitService && (
                      <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-3">
                        <div className="flex items-center space-x-2 font-bold text-rose-400 text-sm">
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>RUTE ANGKUTAN UMUM BELUM TERSEDIA</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Saat ini <strong>belum ada trayek angkutan umum</strong> (baik rute langsung maupun rute transit perpindahan angkutan) yang melayani rute perjalanan dari <strong className="text-rose-300">{locations.find(l => l.id === routeFinderOrigin)?.name}</strong> menuju <strong className="text-rose-300">{locations.find(l => l.id === routeFinderDestination)?.name}</strong>.
                        </p>
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] text-slate-400 space-y-1 font-mono">
                          <div className="text-amber-300 font-bold">💡 Analisis & Rekomendasi Sistem Transportasi:</div>
                          <div>• Jaringan jalan fisik mungkin tersedia dan dapat dijangkau oleh kendaraan pribadi, namun koridor ini belum dioperasikan oleh rute angkutan umum resmi.</div>
                          <div>• Disarankan menggunakan moda penghubung / jalan kaki ke simpul transit terdekat seperti <strong>Stasiun D</strong> atau <strong>Terminal A</strong>.</div>
                          <div>• Menjadi masukan bagi dinas perhubungan untuk pembukaan koridor angkutan pengumpan (*feeder*) baru pada segmen ini.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Kartu Trayek */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {transitRoutes.map(tr => (
                    <div key={tr.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tr.color }}></span>
                          <span className="font-bold text-slate-100 text-sm">{tr.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-400 font-mono font-bold border border-slate-700">
                          {tr.kodeAngkutan || tr.code}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                        <div className="flex justify-between">
                          <span>ID Trayek:</span>
                          <span className="text-slate-200 font-bold">{tr.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jumlah Armada:</span>
                          <span className="text-amber-400 font-bold">{tr.fleetCount || 10} Unit</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kapasitas Armada:</span>
                          <span className="text-emerald-400 font-bold">{tr.passengerCapacity || 40} Penumpang / Unit</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tarif Dasar:</span>
                          <span className="text-emerald-400 font-bold">Rp {tr.fareRp?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <span className="text-[11px] text-slate-400 font-semibold block">Urutan Pemberhentian ({tr.stops.length} Lokasi):</span>
                        <div className="flex flex-wrap gap-1">
                          {tr.stops.map((stopId, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700/60">
                              {idx + 1}. {locations.find(l => l.id === stopId)?.name || stopId}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3 text-xs">
                        <button
                          onClick={() => {
                            setEditingRoute(tr);
                            setRouteFormData({ ...tr, kodeAngkutan: tr.kodeAngkutan || tr.code || "", stops: [...tr.stops] });
                            setIsRouteModalOpen(true);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus trayek ${tr.name}?`)) deleteRouteCascade(tr.id);
                          }}
                          className="text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DATA PENUMPANG (FITUR 12: ANALISIS DISTRIBUSI PENUMPANG) */}
            {activeTab === "passengers" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header & Aksi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <Icons.Users />
                      <span>Analisis Distribusi Penumpang & Evaluasi Beban Trayek</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Visualisasi grafik komparasi penumpang naik/turun, matriks distribusi asal-tujuan (OD), pemetaan trayek terpadat & terendah, serta rekomendasi kebijakan angkutan umum.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPassenger(null);
                      setPassengerFormData({
                        id: `OD-${String(odPassengers.length + 1).padStart(2, '0')}`,
                        originId: locations[0]?.id || "LOC-A",
                        destinationId: locations[locations.length - 1]?.id || "LOC-F",
                        penumpangNaik: 600,
                        penumpangTurun: 580,
                        periode: "Pagi (06:30 - 08:30)",
                        tanggal: "2026-11-06"
                      });
                      setIsPassengerModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition"
                  >
                    <Icons.Plus />
                    <span>Tambah Data Penumpang</span>
                  </button>
                </div>

                {/* 4 HIGHLIGHT METRIC CARDS (FITUR 12: TRAYEK TERTINGGI, TERENDAH, AKTIVITAS TERTINGGI) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Trayek Permintaan Tertinggi */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/40 border border-rose-500/30 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider font-mono">
                        Trayek Permintaan Tertinggi
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {passengerAnalytics.highestDemandRoute?.kodeAngkutan}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-100">
                      {passengerAnalytics.highestDemandRoute?.routeName}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                      <span>Permintaan: <strong className="text-rose-400">{passengerAnalytics.highestDemandRoute?.matchedPassengers?.toLocaleString()} pax</strong></span>
                      <span className="text-amber-400 font-bold">LF: {passengerAnalytics.highestDemandRoute?.loadFactor}%</span>
                    </div>
                  </div>

                  {/* 2. Trayek Permintaan Terendah */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/30 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                        Trayek Permintaan Terendah
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {passengerAnalytics.lowestDemandRoute?.kodeAngkutan}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-100">
                      {passengerAnalytics.lowestDemandRoute?.routeName}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                      <span>Permintaan: <strong className="text-amber-400">{passengerAnalytics.lowestDemandRoute?.matchedPassengers?.toLocaleString()} pax</strong></span>
                      <span className="text-cyan-400 font-bold">LF: {passengerAnalytics.lowestDemandRoute?.loadFactor}%</span>
                    </div>
                  </div>

                  {/* 3. Lokasi Aktivitas Tertinggi */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-mono">
                        Lokasi Aktivitas Tertinggi
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {passengerAnalytics.highestActivityLocation?.code}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-100">
                      {passengerAnalytics.highestActivityLocation?.name}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                      <span>Total Mobilitas: <strong className="text-cyan-400">{passengerAnalytics.highestActivityLocation?.totalActivity?.toLocaleString()} pax</strong></span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {Math.round(((passengerAnalytics.highestActivityLocation?.totalActivity || 0) / (totalPenumpangNaik + totalPenumpangTurun || 1)) * 100)}% Kota
                      </span>
                    </div>
                  </div>

                  {/* 4. Total Mobilitas Kota */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono">
                        Total Pergerakan Kota
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {locations.length} Lokasi
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-indigo-400">
                      {(totalPenumpangNaik + totalPenumpangTurun).toLocaleString()} <span className="text-xs text-slate-400 font-normal">pax/hari</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                      <span className="text-emerald-400">Naik: {totalPenumpangNaik.toLocaleString()}</span>
                      <span className="text-rose-400">Turun: {totalPenumpangTurun.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* GRAFIK 1: GRAFIK BATANG KOMPARASI PENUMPANG NAIK VS TURUN SETIAP LOKASI (FITUR 12) */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                        <Icons.Dashboard />
                        <span>Grafik Distribusi Penumpang Naik vs Turun Setiap Lokasi</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Perbandingan volume penumpang yang memulai perjalanan (naik) versus mengakhiri perjalanan (turun) pada masing-masing simpul lokasi halte.
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                        <span className="text-emerald-400 font-semibold">Penumpang Naik</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                        <span className="text-rose-400 font-semibold">Penumpang Turun</span>
                      </div>
                    </div>
                  </div>

                  {/* Kanvas Grafik Batang SVG Interaktif */}
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[680px] h-64 relative bg-slate-950/60 rounded-2xl border border-slate-800 p-4">
                      <svg className="w-full h-full" viewBox="0 0 700 220" preserveAspectRatio="none">
                        {/* Garis Grid Horizontal */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                          const y = 180 - pct * 150;
                          const val = Math.round(passengerAnalytics.maxBarValue * pct);
                          return (
                            <g key={idx}>
                              <line x1="50" y1={y} x2="680" y2={y} stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />
                              <text x="42" y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" className="font-mono">{val}</text>
                            </g>
                          );
                        })}

                        {/* Batang Komparasi Naik vs Turun untuk 8 Lokasi */}
                        {locations.map((loc, idx) => {
                          const groupWidth = 600 / locations.length;
                          const groupX = 65 + idx * groupWidth;
                          const barWidth = 18;

                          const hNaik = ((loc.penumpangNaik || 0) / passengerAnalytics.maxBarValue) * 150;
                          const yNaik = 180 - hNaik;

                          const hTurun = ((loc.penumpangTurun || 0) / passengerAnalytics.maxBarValue) * 150;
                          const yTurun = 180 - hTurun;

                          return (
                            <g key={loc.id} className="cursor-pointer group">
                              {/* Batang Naik (Emerald) */}
                              <rect
                                x={groupX - barWidth - 1}
                                y={yNaik}
                                width={barWidth}
                                height={Math.max(2, hNaik)}
                                rx="4"
                                fill="#10b981"
                                className="transition-all duration-300 hover:fill-emerald-400 opacity-90 hover:opacity-100"
                              />
                              <text
                                x={groupX - barWidth / 2 - 1}
                                y={yNaik - 4}
                                textAnchor="middle"
                                fontSize="8"
                                fill="#a7f3d0"
                                className="font-mono font-bold"
                              >
                                {loc.penumpangNaik}
                              </text>

                              {/* Batang Turun (Rose) */}
                              <rect
                                x={groupX + 2}
                                y={yTurun}
                                width={barWidth}
                                height={Math.max(2, hTurun)}
                                rx="4"
                                fill="#f43f5e"
                                className="transition-all duration-300 hover:fill-rose-400 opacity-90 hover:opacity-100"
                              />
                              <text
                                x={groupX + 2 + barWidth / 2}
                                y={yTurun - 4}
                                textAnchor="middle"
                                fontSize="8"
                                fill="#fecdd3"
                                className="font-mono font-bold"
                              >
                                {loc.penumpangTurun}
                              </text>

                              {/* Label Sumbu X (Nama / Kode Lokasi) */}
                              <text
                                x={groupX}
                                y="198"
                                textAnchor="middle"
                                fontSize="10"
                                fill="#cbd5e1"
                                className="font-bold"
                              >
                                {loc.code}
                              </text>
                              <text
                                x={groupX}
                                y="212"
                                textAnchor="middle"
                                fontSize="8"
                                fill="#94a3b8"
                              >
                                {loc.name.length > 10 ? loc.name.slice(0, 10) + '…' : loc.name}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* GRAFIK 2 & ANALISIS TRAYEK: GRAFIK BEBAN PERMINTAAN VS KAPASITAS ARMADA */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        Grafik Beban Permintaan vs Kapasitas Harian Armada Trayek
                      </h3>
                      <p className="text-xs text-slate-400">
                        Evaluasi Load Factor (Rasio Keterisian) untuk mengidentifikasi trayek padat vs trayek longgar.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {routeDemandAnalysis.map(dem => {
                      const tr = transitRoutes.find(r => r.id === dem.routeId);
                      const isHigh = dem.loadFactor >= 75;
                      const isLow = dem.loadFactor < 40;
                      const barColor = isHigh ? "bg-rose-500" : (isLow ? "bg-amber-500" : "bg-cyan-500");

                      return (
                        <div key={dem.routeId} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 font-mono text-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tr?.color || "#0284c7" }}></span>
                              <span className="font-bold text-slate-100">{dem.routeName}</span>
                            </div>
                            <span className="text-cyan-400 font-bold">{dem.kodeAngkutan}</span>
                          </div>

                          {/* Bar Progress Beban */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Load Factor:</span>
                              <span className={`font-bold ${isHigh ? "text-rose-400" : (isLow ? "text-amber-400" : "text-cyan-400")}`}>
                                {dem.loadFactor}% ({dem.statusKepadatan})
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                              <div
                                className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                                style={{ width: `${Math.min(100, dem.loadFactor)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-1 text-slate-300 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Permintaan Penumpang:</span>
                              <span className="font-bold text-slate-100">{dem.matchedPassengers.toLocaleString()} pax</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Kapasitas Armada:</span>
                              <span className="font-bold text-emerald-400">{dem.dailyCapacity.toLocaleString()} pax</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Jumlah Armada:</span>
                              <span className="text-amber-400 font-bold">{tr?.fleetCount || 10} bus</span>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/60 leading-relaxed">
                            {dem.recommendation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TABEL 1: DATA LENGKAP PENUMPANG NAIK DAN TURUN PER LOKASI */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-100">
                    Tabel Data Jumlah Penumpang Naik & Turun Setiap Lokasi
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-800/90 text-slate-300 text-[10px] uppercase">
                        <tr>
                          <th className="py-3 px-4">ID Lokasi</th>
                          <th className="py-3 px-4">Nama Lokasi</th>
                          <th className="py-3 px-4">Kategori Halte</th>
                          <th className="py-3 px-4 text-emerald-400 font-bold">Penumpang Naik</th>
                          <th className="py-3 px-4 text-rose-400 font-bold">Penumpang Turun</th>
                          <th className="py-3 px-4 text-cyan-400 font-bold">Total Aktivitas</th>
                          <th className="py-3 px-4">Net Flow (Naik - Turun)</th>
                          <th className="py-3 px-4">Karakteristik Mobilitas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {passengerAnalytics.locationsWithActivity.map(loc => (
                          <tr key={loc.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-4 font-bold text-cyan-400">{loc.id}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-100">{loc.name} ({loc.code})</td>
                            <td className="py-2.5 px-4 text-slate-400">{loc.type}</td>
                            <td className="py-2.5 px-4 text-emerald-400 font-bold">{loc.penumpangNaik?.toLocaleString()} pax</td>
                            <td className="py-2.5 px-4 text-rose-400 font-bold">{loc.penumpangTurun?.toLocaleString()} pax</td>
                            <td className="py-2.5 px-4 text-cyan-300 font-bold">{loc.totalActivity?.toLocaleString()} pax</td>
                            <td className="py-2.5 px-4 font-bold">
                              <span className={loc.netFlow > 0 ? "text-emerald-400" : (loc.netFlow < 0 ? "text-rose-400" : "text-slate-400")}>
                                {loc.netFlow > 0 ? `+${loc.netFlow}` : loc.netFlow} pax
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loc.statusMobilitas === "Pusat Bangkitan"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : (loc.statusMobilitas === "Pusat Tarikan"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-slate-700/50 text-slate-300")
                                }`}>
                                {loc.statusMobilitas}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABEL 2: OD MATRIX HEATMAP */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100">
                      Matriks Distribusi Perjalanan Asal - Tujuan (OD Matrix Heatmap)
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Intensitas Perjalanan: Merah = Padat (&gt;800 pax), Kuning = Sedang (&gt;500 pax), Cyan = Aktif
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-center text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-800/80 text-slate-300">
                          <th className="py-2.5 px-3 text-left font-bold text-cyan-400">Asal \ Tujuan</th>
                          {locations.map(l => (
                            <th key={l.id} className="py-2.5 px-3 font-semibold">{l.code}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {locations.map(rLoc => (
                          <tr key={rLoc.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 text-left font-semibold text-slate-200 bg-slate-800/40">
                              {rLoc.name} ({rLoc.code})
                            </td>
                            {locations.map(cLoc => {
                              if (rLoc.id === cLoc.id) {
                                return <td key={cLoc.id} className="py-2.5 px-3 text-slate-600 bg-slate-900/60">-</td>;
                              }
                              const match = odPassengers.find(p => p.originId === rLoc.id && p.destinationId === cLoc.id);
                              const val = match ? match.penumpangNaik : 0;
                              let cellBg = "text-slate-500";
                              if (val > 800) cellBg = "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30";
                              else if (val > 500) cellBg = "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30";
                              else if (val > 0) cellBg = "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30";

                              return (
                                <td key={cLoc.id} className={`py-2.5 px-3 rounded-lg ${cellBg}`}>
                                  {val > 0 ? `${val} pax` : '0'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* REKOMENDASI TRAYEK SESUAI KEBUTUHAN PENUMPANG (FITUR 12) */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Icons.Sparkles />
                    <span>Rekomendasi Kebijakan Trayek Berdasarkan Kebutuhan Riil Penumpang:</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    {/* Rekomendasi 1 */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-rose-500/30 space-y-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 inline-block">
                        Intervensi Jam Puncak
                      </span>
                      <div className="font-bold text-slate-200">
                        Penambahan Armada Koridor Padat ({passengerAnalytics.highestDemandRoute?.kodeAngkutan})
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        Trayek <strong>{passengerAnalytics.highestDemandRoute?.routeName}</strong> mencatat permintaan tertinggi ({passengerAnalytics.highestDemandRoute?.matchedPassengers?.toLocaleString()} pax) dengan Load Factor mencapai {passengerAnalytics.highestDemandRoute?.loadFactor}%. Disarankan menambah <strong>2 - 4 armada bus</strong> pada jam sibuk pagi (06:30 - 08:30) untuk memangkas antrean penumpang.
                      </p>
                    </div>

                    {/* Rekomendasi 2 */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-500/30 space-y-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 inline-block">
                        Optimalisasi Efisiensi
                      </span>
                      <div className="font-bold text-slate-200">
                        Rerouting / Feeder Koridor Sepi ({passengerAnalytics.lowestDemandRoute?.kodeAngkutan})
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        Trayek <strong>{passengerAnalytics.lowestDemandRoute?.routeName}</strong> memiliki tingkat keterisian terendah ({passengerAnalytics.lowestDemandRoute?.loadFactor}%). Disarankan memperluas rute pemberhentian melewati simpul bangkitan seperti <strong>{passengerAnalytics.highestActivityLocation?.name}</strong> atau mengalihkan sebagian armada besar ke armada mikro/feeder.
                      </p>
                    </div>

                    {/* Rekomendasi 3 */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-500/30 space-y-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 inline-block">
                        Infrastruktur Transit
                      </span>
                      <div className="font-bold text-slate-200">
                        Perluasan Fasilitas di {passengerAnalytics.highestActivityLocation?.name}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        Sebagai simpul dengan aktivitas penumpang terbesar ({passengerAnalytics.highestActivityLocation?.totalActivity?.toLocaleString()} pax), lokasi ini menjadi pusat transit vital. Direkomendasikan menambah jalur pemberhentian khusus (*dedicated bay*), layar jadwal real-time, dan integrasi tiket transfer antarmoda.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">Catatan Distribusi Penumpang Asal-Tujuan (OD)</h3>
                    <select
                      value={selectedPeriodeFilter}
                      onChange={(e) => setSelectedPeriodeFilter(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                    >
                      {["Semua", "Pagi", "Siang", "Sore", "Harian"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
                          <th className="py-2 px-3">ID</th>
                          <th className="py-2 px-3">Asal</th>
                          <th className="py-2 px-3">Tujuan</th>
                          <th className="py-2 px-3">Naik</th>
                          <th className="py-2 px-3">Turun</th>
                          <th className="py-2 px-3">Periode</th>
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredODPassengers.map(o => (
                          <tr key={o.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono text-indigo-400 font-bold">{o.id}</td>
                            <td className="py-2 px-3 text-slate-200">{locations.find(l => l.id === o.originId)?.name || o.originId}</td>
                            <td className="py-2 px-3 text-slate-200">{locations.find(l => l.id === o.destinationId)?.name || o.destinationId}</td>
                            <td className="py-2 px-3 font-mono text-emerald-400">{o.penumpangNaik}</td>
                            <td className="py-2 px-3 font-mono text-rose-400">{o.penumpangTurun}</td>
                            <td className="py-2 px-3 text-slate-300">{o.periode}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{o.tanggal}</td>
                            <td className="py-2 px-3 text-right space-x-3">
                              <button
                                onClick={() => {
                                  setEditingPassenger(o);
                                  setPassengerFormData({ ...o });
                                  setIsPassengerModalOpen(true);
                                }}
                                className="text-cyan-400 hover:text-cyan-300 font-semibold"
                              >
                                Ubah
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus data penumpang ${o.id}?`)) setOdPassengers(prev => prev.filter(x => x.id !== o.id));
                                }}
                                className="text-rose-400 hover:text-rose-300 font-semibold"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredODPassengers.length === 0 && (
                          <tr><td colSpan="8" className="py-4 px-3 text-center text-slate-500">Belum ada data penumpang.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PENCARIAN UCS (FITUR 8: IMPLEMENTASI ALGORITMA UCS) */}
            {activeTab === "ucs" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Parameter Input Box */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-cyan-300 flex items-center space-x-2">
                        <Icons.Compass />
                        <span>Pencarian Rute Menggunakan Algoritma Uniform Cost Search (UCS)</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Mencari rute perjalanan berdasarkan total biaya kumulatif g(n) terendah. Menjamin solusi least-cost path optimal global.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                        Optimalitas: 100% Terjamin
                      </span>
                    </div>
                  </div>

                  {/* Inputs: Lokasi Asal, Lokasi Tujuan, Bobot Pencarian */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">1. Lokasi Asal:</label>
                      <select
                        value={selectedOrigin}
                        onChange={(e) => setSelectedOrigin(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">2. Lokasi Tujuan:</label>
                      <select
                        value={selectedDestination}
                        onChange={(e) => setSelectedDestination(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">3. Bobot Pencarian:</label>
                      <select
                        value={ucsCriterion}
                        onChange={(e) => setUcsCriterion(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="distance">Jarak Kumulatif (km)</option>
                        <option value="time">Waktu Tempuh (menit)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleRunUCS}
                        className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center justify-center space-x-2"
                      >
                        <Icons.Compass />
                        <span>Jalankan Algoritma UCS</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visualisasi Kanvas Graf Dinamis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">Visualisasi Lintasan Rute Optimal UCS (Cyan)</span>
                    <span className="text-slate-400 font-mono">
                      Node Aktif Langkah {ucsPlaybackStep + 1}: <strong className="text-cyan-400">{currentUcsStep?.currentNodeName}</strong>
                    </span>
                  </div>
                  <GraphCanvas
                    locations={locations}
                    roads={roads}
                    highlightPathUCS={currentUcsStep ? currentUcsStep.pathSoFar : (ucsResult?.path || [])}
                    activeStepNode={currentUcsStep ? locations.find(l => l.id === currentUcsStep.currentNodeId) : null}
                    startNodeId={selectedOrigin}
                    goalNodeId={selectedDestination}
                    onUpdateLocationPosition={handleUpdateLocationPosition}
                    height="460px"
                  />
                </div>

                {/* KONTROL SIMULASI STEP-BY-STEP TRAVERSAL UCS */}
                {ucsResult?.traversalSteps && ucsResult.traversalSteps.length > 0 && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-200">Simulasi Traversal UCS Bertahap:</span>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                          Langkah {ucsPlaybackStep + 1} / {ucsResult.traversalSteps.length}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        {/* Speed selector */}
                        <div className="flex items-center space-x-1 mr-2 text-slate-400">
                          <span>Kecepatan:</span>
                          <select
                            value={ucsSpeed}
                            onChange={(e) => setUcsSpeed(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                          >
                            <option value={1200}>0.5x (Lambat)</option>
                            <option value={800}>1.0x (Normal)</option>
                            <option value={400}>2.0x (Cepat)</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setIsUcsPlaying(!isUcsPlaying)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center space-x-1 transition"
                        >
                          {isUcsPlaying ? <Icons.Pause /> : <Icons.Play />}
                          <span>{isUcsPlaying ? "Pause" : "Play"}</span>
                        </button>
                        <button
                          onClick={() => setUcsPlaybackStep(s => Math.max(0, s - 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setUcsPlaybackStep(s => Math.min(ucsResult.traversalSteps.length - 1, s + 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => { setUcsPlaybackStep(0); setIsUcsPlaying(false); }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                          title="Reset Langkah"
                        >
                          <Icons.Reset />
                        </button>
                      </div>
                    </div>

                    {/* Log Deskripsi Langkah */}
                    {currentUcsStep && (
                      <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-xs text-slate-200">
                        {currentUcsStep.description}
                      </div>
                    )}

                    {/* TABEL PRIORITY QUEUE (FRONTIER) REAL-TIME PADA LANGKAH INI */}
                    {currentUcsStep?.frontier && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          Keadaan Priority Queue (Frontier) Saat Langkah Ini ({currentUcsStep.frontier.length} Antrean):
                        </span>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-800/80 text-slate-400 text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Prioritas</th>
                                <th className="py-2 px-3">ID Simpul</th>
                                <th className="py-2 px-3">Nama Lokasi</th>
                                <th className="py-2 px-3">Biaya Kumulatif g(n)</th>
                                <th className="py-2 px-3">Lintasan Sejauh Ini</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {currentUcsStep.frontier.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-800/40">
                                  <td className="py-1.5 px-3 text-cyan-400 font-bold">#{i + 1}</td>
                                  <td className="py-1.5 px-3 text-slate-300">{item.nodeId}</td>
                                  <td className="py-1.5 px-3 text-slate-200 font-semibold">{item.nodeName}</td>
                                  <td className="py-1.5 px-3 text-emerald-400 font-bold">{item.cost} {ucsCriterion === 'time' ? 'menit' : 'km'}</td>
                                  <td className="py-1.5 px-3 text-slate-400">{item.pathNames || item.path?.join(' → ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PANEL OUTPUT LENGKAP HASIL UCS */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Icons.Sparkles />
                    <span>Output Lengkap Hasil Pencarian Rute UCS:</span>
                  </h3>

                  {/* 6 Metric Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Total Jarak:</span>
                      <div className="text-base font-bold text-cyan-400">{ucsResult?.totalDistanceKm} km</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Total Waktu:</span>
                      <div className="text-base font-bold text-emerald-400">{ucsResult?.totalTravelTimeMin} menit</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Total Biaya:</span>
                      <div className="text-base font-bold text-amber-400">Rp {ucsResult?.totalFareRp?.toLocaleString()}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Node Dikunjungi:</span>
                      <div className="text-base font-bold text-indigo-400">{ucsResult?.nodesVisitedCount} simpul</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Bobot Kumulatif:</span>
                      <div className="text-base font-bold text-slate-200">{ucsResult?.totalCost} {ucsCriterion === 'time' ? 'm' : 'km'}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Status Solusi:</span>
                      <div className="text-xs font-bold text-cyan-300">OPTIMAL GLOBAL</div>
                    </div>
                  </div>

                  {/* Urutan Lokasi yang Dilewati */}
                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Urutan Lokasi yang Dilewati:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(ucsResult?.pathNodes || []).map((node, idx) => (
                        <div key={node.id} className="flex items-center space-x-2">
                          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-slate-100 text-xs font-mono font-semibold flex items-center space-x-1.5">
                            <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{node.name}</span>
                            <span className="text-slate-400 text-[10px]">({node.code})</span>
                          </span>
                          {idx < (ucsResult?.pathNodes?.length || 0) - 1 && (
                            <span className="text-cyan-400 font-bold font-mono">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trayek yang Dapat Digunakan */}
                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Trayek Angkutan Umum yang Dapat Digunakan:</span>
                    {(ucsResult?.usedTransitLines || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(ucsResult?.usedTransitLines || []).map(tr => (
                          <div key={tr.id} className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tr.color }}></span>
                              <div>
                                <div className="font-bold text-slate-200">{tr.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">Kode: {tr.kodeAngkutan} | Armada: {tr.fleetCount} unit</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                              Rp {tr.fareRp?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs text-slate-300 font-mono">
                        <span className="text-amber-400 font-semibold">ℹ️ Info Layanan Angkutan:</span> Rute jalan ini belum memiliki trayek angkutan umum yang melayani secara langsung. Penumpang dapat menggunakan moda pengumpan (*feeder*) atau berjalan kaki ke halte transit terdekat.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: PENCARIAN GREEDY (FITUR 9: IMPLEMENTASI ALGORITMA GREEDY BEST-FIRST SEARCH) */}
            {activeTab === "greedy" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Parameter Input Box */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-orange-500/30 shadow-2xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-orange-400 flex items-center space-x-2">
                        <Icons.Target />
                        <span>Pencarian Rute Menggunakan Algoritma Greedy Best-First Search</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Mencari rute berdasarkan nilai heuristic h(n) terkecil menuju tujuan menggunakan estimasi jarak garis lurus rumus <strong>Haversine</strong> dari koordinat Latitude dan Longitude.
                      </p>
                    </div>
                  </div>

                  {/* Rumus Haversine Explanation Banner */}
                  <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-xs font-mono text-orange-200 space-y-1">
                    <div className="font-bold text-orange-300">Formula Heuristik Haversine:</div>
                    <p className="text-[11px] text-slate-300">
                      d = 2R · arcsin(√(sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2))) dengan R = 6.371 km.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">1. Lokasi Asal:</label>
                      <select
                        value={selectedOrigin}
                        onChange={(e) => setSelectedOrigin(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">2. Lokasi Tujuan:</label>
                      <select
                        value={selectedDestination}
                        onChange={(e) => setSelectedDestination(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleRunGreedy}
                        className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition flex items-center justify-center space-x-2"
                      >
                        <Icons.Target />
                        <span>Jalankan Algoritma Greedy</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visualisasi Kanvas Graf Dinamis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">Visualisasi Rute Greedy (Oranye) & Vektor Heuristik Garis Putus-Putus Kuning Langsung ke Goal</span>
                    <span className="text-slate-400 font-mono">
                      Estimasi Haversine ke Goal: <strong className="text-amber-400">{currentGreedyStep?.heuristicValue || 0} km</strong>
                    </span>
                  </div>
                  <GraphCanvas
                    locations={locations}
                    roads={roads}
                    highlightPathGreedy={currentGreedyStep ? currentGreedyStep.pathSoFar : (greedyResult?.path || [])}
                    heuristicGoalNode={locations.find(l => l.id === selectedDestination)}
                    activeStepNode={currentGreedyStep ? locations.find(l => l.id === currentGreedyStep.currentNodeId) : null}
                    startNodeId={selectedOrigin}
                    goalNodeId={selectedDestination}
                    onUpdateLocationPosition={handleUpdateLocationPosition}
                    height="460px"
                  />
                </div>

                {/* KONTROL SIMULASI STEP-BY-STEP TRAVERSAL GREEDY */}
                {greedyResult?.traversalSteps && greedyResult.traversalSteps.length > 0 && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-200">Simulasi Traversal Greedy Bertahap:</span>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800">
                          Langkah {greedyPlaybackStep + 1} / {greedyResult.traversalSteps.length}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <div className="flex items-center space-x-1 mr-2 text-slate-400">
                          <span>Kecepatan:</span>
                          <select
                            value={greedySpeed}
                            onChange={(e) => setGreedySpeed(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                          >
                            <option value={1200}>0.5x (Lambat)</option>
                            <option value={800}>1.0x (Normal)</option>
                            <option value={400}>2.0x (Cepat)</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setIsGreedyPlaying(!isGreedyPlaying)}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center space-x-1 transition"
                        >
                          {isGreedyPlaying ? <Icons.Pause /> : <Icons.Play />}
                          <span>{isGreedyPlaying ? "Pause" : "Play"}</span>
                        </button>
                        <button
                          onClick={() => setGreedyPlaybackStep(s => Math.max(0, s - 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setGreedyPlaybackStep(s => Math.min(greedyResult.traversalSteps.length - 1, s + 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => { setGreedyPlaybackStep(0); setIsGreedyPlaying(false); }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                          title="Reset Langkah"
                        >
                          <Icons.Reset />
                        </button>
                      </div>
                    </div>

                    {currentGreedyStep && (
                      <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-xs text-slate-200">
                        {currentGreedyStep.description}
                      </div>
                    )}

                    {/* TABEL PRIORITY QUEUE HEURISTIK REAL-TIME PADA LANGKAH INI */}
                    {currentGreedyStep?.frontier && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          Keadaan Priority Queue Heuristik (Frontier) Saat Langkah Ini ({currentGreedyStep.frontier.length} Antrean):
                        </span>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-800/80 text-slate-400 text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Prioritas</th>
                                <th className="py-2 px-3">ID Simpul</th>
                                <th className="py-2 px-3">Nama Lokasi</th>
                                <th className="py-2 px-3">Jarak Haversine h(n) ke Goal</th>
                                <th className="py-2 px-3">Lintasan Sejauh Ini</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {currentGreedyStep.frontier.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-800/40">
                                  <td className="py-1.5 px-3 text-orange-400 font-bold">#{i + 1}</td>
                                  <td className="py-1.5 px-3 text-slate-300">{item.nodeId}</td>
                                  <td className="py-1.5 px-3 text-slate-200 font-semibold">{item.nodeName}</td>
                                  <td className="py-1.5 px-3 text-amber-400 font-bold">{item.h} km</td>
                                  <td className="py-1.5 px-3 text-slate-400">{item.pathNames || item.path?.join(' → ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PANEL OUTPUT LENGKAP HASIL GREEDY */}
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Icons.Sparkles />
                    <span>Output Lengkap Hasil Pencarian Rute Greedy Best-First Search:</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Total Jarak Aktual:</span>
                      <div className="text-base font-bold text-orange-400">{greedyResult?.totalDistanceKm} km</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Estimasi Waktu:</span>
                      <div className="text-base font-bold text-emerald-400">{greedyResult?.totalTravelTimeMin} menit</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Total Biaya:</span>
                      <div className="text-base font-bold text-amber-400">Rp {greedyResult?.totalFareRp?.toLocaleString()}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Node Dikunjungi:</span>
                      <div className="text-base font-bold text-indigo-400">{greedyResult?.nodesVisitedCount} simpul</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Heuristik Awal:</span>
                      <div className="text-base font-bold text-amber-400">{greedyResult?.initialHeuristic} km</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-slate-400 block mb-1">Sifat Solusi:</span>
                      <div className="text-xs font-bold text-orange-300">LOKAL HEURISTIK</div>
                    </div>
                  </div>

                  {/* Urutan Lokasi */}
                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Urutan Lokasi yang Ditemukan (Rute Greedy):</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(greedyResult?.pathNodes || []).map((node, idx) => (
                        <div key={node.id} className="flex items-center space-x-2">
                          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-orange-500/50 text-slate-100 text-xs font-mono font-semibold flex items-center space-x-1.5">
                            <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{node.name}</span>
                            <span className="text-slate-400 text-[10px]">({node.code})</span>
                          </span>
                          {idx < (greedyResult?.pathNodes?.length || 0) - 1 && (
                            <span className="text-orange-400 font-bold font-mono">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trayek yang Dapat Digunakan */}
                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Trayek Angkutan Umum yang Dapat Digunakan:</span>
                    {(greedyResult?.usedTransitLines || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(greedyResult?.usedTransitLines || []).map(tr => (
                          <div key={tr.id} className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tr.color }}></span>
                              <div>
                                <div className="font-bold text-slate-200">{tr.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">Kode: {tr.kodeAngkutan} | Armada: {tr.fleetCount} unit</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                              Rp {tr.fareRp?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs text-slate-300 font-mono">
                        <span className="text-amber-400 font-semibold">ℹ️ Info Layanan Angkutan:</span> Rute jalan ini belum memiliki trayek angkutan umum yang melayani secara langsung. Penumpang dapat menggunakan moda pengumpan (*feeder*) atau berjalan kaki ke halte transit terdekat.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: PERBANDINGAN ALGORITMA */}
            {activeTab === "comparison" && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                        <Icons.Compare />
                        <span>Perbandingan Head-to-Head: UCS vs Greedy Best-First Search</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Bandingkan rute, jarak, waktu tempuh, biaya, dan optimalitas solusi dari simpul asal ke simpul tujuan.
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${comparisonResult?.comparison?.isSameRoute
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}>
                      {comparisonResult?.comparison?.verdictBadge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Simpul Asal:</label>
                      <select
                        value={selectedOrigin}
                        onChange={(e) => handleRunComparison(e.target.value, selectedDestination)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Simpul Tujuan:</label>
                      <select
                        value={selectedDestination}
                        onChange={(e) => handleRunComparison(selectedOrigin, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                        ))}
                      </select>
                    </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleRunComparison()}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-orange-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
                    >
                      <Icons.Sparkles />
                      <span>Bandingkan Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Visualisasi Kanvas Graph Komparasi Bersama */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">
                  Overlay Visualisasi Rute: <span className="text-cyan-400">UCS (Biru Cyan)</span> vs <span className="text-orange-400">Greedy (Oranye)</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Asal: <strong className="text-emerald-400">{locations.find(l => l.id === selectedOrigin)?.name}</strong> ➔ Tujuan: <strong className="text-rose-400">{locations.find(l => l.id === selectedDestination)?.name}</strong>
                </span>
              </div>
              <GraphCanvas
                locations={locations}
                roads={roads}
                highlightPathUCS={comparisonResult?.ucs?.path || []}
                highlightPathGreedy={comparisonResult?.greedy?.path || []}
                startNodeId={selectedOrigin}
                goalNodeId={selectedDestination}
                onUpdateLocationPosition={handleUpdateLocationPosition}
                height="460px"
              />
            </div>

            {/* TABEL PERBANDINGAN HASIL UCS DAN GREEDY (FITUR 11: SESUAI KETENTUAN TABEL SPESIFIK) */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Icons.Compare />
                  <span>Tabel Perbandingan Parameter: UCS vs Greedy</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Evaluasi Multi-Kriteria
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-inner">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-800/90 text-slate-300 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 w-1/4">Parameter</th>
                      <th className="py-3.5 px-4 w-3/8 text-cyan-300 font-bold border-l border-slate-800 bg-cyan-950/20">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                          <span>Uniform Cost Search (UCS)</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 w-3/8 text-orange-400 font-bold border-l border-slate-800 bg-orange-950/20">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400"></span>
                          <span>Greedy Best-First Search</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {/* Parameter: Rute */}
                    <tr className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-300">Rute</td>
                      <td className="py-3.5 px-4 text-cyan-300 font-medium border-l border-slate-800 bg-cyan-950/10">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(comparisonResult?.ucs?.pathNodes || []).map((node, i) => (
                            <span key={node.id} className="inline-flex items-center">
                              <span className="px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-200 text-[11px] border border-cyan-700/50">
                                {node.name}
                              </span>
                              {i < (comparisonResult?.ucs?.pathNodes?.length || 0) - 1 && (
                                <span className="mx-1 text-cyan-500 font-bold">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-orange-300 font-medium border-l border-slate-800 bg-orange-950/10">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(comparisonResult?.greedy?.pathNodes || []).map((node, i) => (
                            <span key={node.id} className="inline-flex items-center">
                              <span className="px-2 py-0.5 rounded bg-orange-900/50 text-orange-200 text-[11px] border border-orange-700/50">
                                {node.name}
                              </span>
                              {i < (comparisonResult?.greedy?.pathNodes?.length || 0) - 1 && (
                                <span className="mx-1 text-orange-500 font-bold">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Parameter: Total jarak */}
                    <tr className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-300">Total jarak</td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-cyan-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400 text-sm">{comparisonResult?.ucs?.totalDistanceKm} km</span>
                          {comparisonResult?.ucs?.totalDistanceKm <= comparisonResult?.greedy?.totalDistanceKm && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              {comparisonResult?.ucs?.totalDistanceKm === comparisonResult?.greedy?.totalDistanceKm ? "Seri / Sama" : "Paling Pendek"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-orange-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-orange-400 text-sm">{comparisonResult?.greedy?.totalDistanceKm} km</span>
                          {comparisonResult?.greedy?.totalDistanceKm < comparisonResult?.ucs?.totalDistanceKm && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Paling Pendek
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Parameter: Waktu tempuh */}
                    <tr className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-300">Waktu tempuh</td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-cyan-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 text-sm">{comparisonResult?.ucs?.totalTravelTimeMin} menit</span>
                          {comparisonResult?.ucs?.totalTravelTimeMin <= comparisonResult?.greedy?.totalTravelTimeMin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              {comparisonResult?.ucs?.totalTravelTimeMin === comparisonResult?.greedy?.totalTravelTimeMin ? "Seri / Sama" : "Paling Singkat"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-orange-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 text-sm">{comparisonResult?.greedy?.totalTravelTimeMin} menit</span>
                          {comparisonResult?.greedy?.totalTravelTimeMin < comparisonResult?.ucs?.totalTravelTimeMin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Paling Singkat
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Parameter: Node dikunjungi */}
                    <tr className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-300">Node dikunjungi</td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-cyan-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-400">{comparisonResult?.ucs?.nodesVisitedCount} simpul</span>
                          {comparisonResult?.ucs?.nodesVisitedCount <= comparisonResult?.greedy?.nodesVisitedCount && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                              {comparisonResult?.ucs?.nodesVisitedCount === comparisonResult?.greedy?.nodesVisitedCount ? "Sama" : "Lebih Sedikit"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-orange-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-400">{comparisonResult?.greedy?.nodesVisitedCount} simpul</span>
                          {comparisonResult?.greedy?.nodesVisitedCount < comparisonResult?.ucs?.nodesVisitedCount && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                              Lebih Sedikit
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Parameter: Total biaya */}
                    <tr className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-300">Total biaya</td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-cyan-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400">Rp {comparisonResult?.ucs?.totalFareRp?.toLocaleString()}</span>
                          {comparisonResult?.ucs?.totalFareRp <= comparisonResult?.greedy?.totalFareRp && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              {comparisonResult?.ucs?.totalFareRp === comparisonResult?.greedy?.totalFareRp ? "Sama" : "Paling Hemat"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-100 font-bold border-l border-slate-800 bg-orange-950/10">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400">Rp {comparisonResult?.greedy?.totalFareRp?.toLocaleString()}</span>
                          {comparisonResult?.greedy?.totalFareRp < comparisonResult?.ucs?.totalFareRp && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              Paling Hemat
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* KESIMPULAN OTOMATIS (FITUR 11: 4 KESIMPULAN OTOMATIS LENGKAP) */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Icons.Sparkles />
                <span>Kesimpulan Otomatis Komparasi Algoritma:</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Rute dengan jarak paling pendek */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      1. Rute Jarak Paling Pendek
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                      {comparisonResult?.comparison?.shortestDistanceWinner?.includes("UCS") ? "UCS Unggul" : (comparisonResult?.comparison?.shortestDistanceWinner?.includes("Greedy") ? "Greedy Unggul" : "Seri")}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {comparisonResult?.comparison?.shortestDistanceWinner}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    UCS mengevaluasi jarak kumulatif g(n) secara menyeluruh sehingga lintasan yang dihasilkan selalu menjamin panjang kilometer fisik terpendek.
                  </p>
                </div>

                {/* 2. Rute dengan waktu paling singkat */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      2. Rute Waktu Paling Singkat
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      {comparisonResult?.comparison?.shortestTimeWinner?.includes("UCS") ? "UCS Lebih Cepat" : (comparisonResult?.comparison?.shortestTimeWinner?.includes("Greedy") ? "Greedy Lebih Cepat" : "Seri")}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {comparisonResult?.comparison?.shortestTimeWinner}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Waktu tempuh dipengaruhi oleh kondisi kecepatan jalan dan arah satu arah. Jalur dengan jarak pendek belum tentu memiliki waktu tersingkat jika macet.
                  </p>
                </div>

                {/* 3. Algoritma dengan jumlah node yang dikunjungi lebih sedikit */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      3. Jumlah Node Dikunjungi Lebih Sedikit
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                      {comparisonResult?.comparison?.fewerNodesWinner?.includes("Greedy") ? "Greedy Lebih Cepat Selesai" : "UCS Seimbang"}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {comparisonResult?.comparison?.fewerNodesWinner}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Greedy Best-First dipandu heuristik garis lurus langsung menuju sasaran sehingga sering kali mengeksplorasi lebih sedikit simpul dibanding UCS.
                  </p>
                </div>

                {/* 4. Perbedaan hasil pencarian kedua algoritma */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      4. Perbedaan Hasil Pencarian
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${comparisonResult?.comparison?.isSameRoute ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {comparisonResult?.comparison?.isSameRoute ? "Lintasan Identik" : "Lintasan Berbeda"}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    {comparisonResult?.comparison?.explanation}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Perbedaan rute terjadi saat heuristik Haversine menarik Greedy ke simpul yang dekat secara geografis namun terhalang sistem jalan searah atau penalti waktu.
                  </p>
                </div>
              </div>

              {/* CATATAN PENTING: JANGAN MENGANGGAP GREEDY SELALU MENGHASILKAN RUTE OPTIMAL */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-300 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>CATATAN TEORITIS: JANGAN MENGANGGAP GREEDY SELALU MENGHASILKAN RUTE OPTIMAL!</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Algoritma <strong>Greedy Best-First Search</strong> bersifat <em>locally optimal / myopic</em> (rabun terhadap biaya kumulatif perjalanan). Pada setiap langkah, Greedy hanya memilih simpul tetangga yang nilai estimasi jarak garis lurusnya (rumus Haversine) paling dekat ke titik tujuan, tanpa memperhitungkan biaya riil yang telah dihabiskan ($g(n)$).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
                    <strong className="text-cyan-300 block mb-0.5">Kelebihan Uniform Cost Search (UCS):</strong>
                    UCS selalu mengevaluasi akumulasi biaya $g(n)$ dengan goal test saat dequeue, sehingga memiliki <strong>bukti matematis 100% optimal global</strong> (menemukan least-cost path sebenarnya).
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
                    <strong className="text-orange-300 block mb-0.5">Kelemahan Greedy Best-First:</strong>
                    Bisa terjebak ke jalan satu arah yang salah arah atau jalan buntu yang tampak dekat di peta tapi membutuhkan putaran jauh, sehingga menghasilkan rute yang jauh lebih panjang atau mahal.
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* TAB 9: LAPORAN */}
          {activeTab === "reports" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex justify-between items-center no-print">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Laporan Eksekutif Optimasi Rute Angkutan Umum</h2>
                  <p className="text-xs text-slate-400">Ringkasan analisis perbandingan algoritma UCS vs Greedy, efisiensi trayek, dan matriks mobilitas.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <Icons.Printer />
                  <span>Cetak / Cetak PDF</span>
                </button>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 print:bg-white print:text-black">
                <div className="border-b border-slate-800 pb-4">
                  <h1 className="text-xl font-extrabold text-slate-100">TRANSIT ROUTE OPTIMIZER REPORT</h1>
                  <p className="text-xs text-slate-400">Sistem Pencarian dan Optimasi Rute Angkutan Umum Berbasis Graph Menggunakan Algoritma UCS dan Greedy</p>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-slate-400 block mb-1">Total Simpul:</span>
                    <div className="text-lg font-bold text-cyan-400">{locations.length} Lokasi</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-slate-400 block mb-1">Total Sisi Jalan:</span>
                    <div className="text-lg font-bold text-indigo-400">{roads.length} Segmen</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-slate-400 block mb-1">Total Trayek:</span>
                    <div className="text-lg font-bold text-emerald-400">{transitRoutes.length} Koridor</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-slate-400 block mb-1">Total Penumpang:</span>
                    <div className="text-lg font-bold text-amber-400">{(totalPenumpangNaik + totalPenumpangTurun).toLocaleString()} pax</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingLocation ? "Ubah Data Lokasi" : "Tambah Lokasi Baru"}
              </h3>
              <button onClick={() => setIsLocationModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">ID Lokasi:</label>
                  <input
                    type="text"
                    value={locationFormData.id}
                    disabled={!!editingLocation}
                    onChange={(e) => setLocationFormData({ ...locationFormData, id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nama Lokasi:</label>
                  <input
                    type="text"
                    value={locationFormData.name}
                    onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Latitude:</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={locationFormData.latitude}
                    onChange={(e) => setLocationFormData({ ...locationFormData, latitude: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Longitude:</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={locationFormData.longitude}
                    onChange={(e) => setLocationFormData({ ...locationFormData, longitude: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Penumpang Naik:</label>
                  <input
                    type="number"
                    value={locationFormData.penumpangNaik}
                    onChange={(e) => setLocationFormData({ ...locationFormData, penumpangNaik: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Penumpang Turun:</label>
                  <input
                    type="number"
                    value={locationFormData.penumpangTurun}
                    onChange={(e) => setLocationFormData({ ...locationFormData, penumpangTurun: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Simpan Lokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingRoad ? `Ubah Sisi Jalan (${editingRoad.id})` : "Tambah Hubungan Jalan Baru"}
              </h3>
              <button onClick={() => setIsRoadModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSaveRoad} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Simpul Asal:</label>
                  <select
                    value={roadFormData.from}
                    onChange={(e) => setRoadFormData({ ...roadFormData, from: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Simpul Tujuan:</label>
                  <select
                    value={roadFormData.to}
                    onChange={(e) => setRoadFormData({ ...roadFormData, to: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Jarak (km):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={roadFormData.distanceKm}
                    onChange={(e) => setRoadFormData({ ...roadFormData, distanceKm: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Waktu (mnt):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={roadFormData.travelTimeMin}
                    onChange={(e) => setRoadFormData({ ...roadFormData, travelTimeMin: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Biaya (Rp):</label>
                  <input
                    type="number"
                    step="500"
                    value={roadFormData.fareRp}
                    onChange={(e) => setRoadFormData({ ...roadFormData, fareRp: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipe Arah:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer ${roadFormData.bidirectional ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}>
                    <input
                      type="radio"
                      name="bidirectional"
                      checked={roadFormData.bidirectional === true}
                      onChange={() => setRoadFormData({ ...roadFormData, bidirectional: true })}
                      className="hidden"
                    />
                    <span className="font-bold">⇄ Dua Arah</span>
                  </label>
                  <label className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer ${roadFormData.bidirectional === false ? "bg-cyan-600/20 border-cyan-500 text-cyan-300" : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}>
                    <input
                      type="radio"
                      name="bidirectional"
                      checked={roadFormData.bidirectional === false}
                      onChange={() => setRoadFormData({ ...roadFormData, bidirectional: false })}
                      className="hidden"
                    />
                    <span className="font-bold">→ Satu Arah</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Simpan Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingRoute ? `Ubah Trayek (${editingRoute.id})` : "Tambah Trayek Baru"}
              </h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSaveRoute} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Trayek:</label>
                  <input type="text" value={routeFormData.name} onChange={(e) => setRouteFormData({ ...routeFormData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200" required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kode Angkutan:</label>
                  <input type="text" value={routeFormData.kodeAngkutan} onChange={(e) => setRouteFormData({ ...routeFormData, kodeAngkutan: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Jumlah Armada:</label>
                  <input type="number" min="1" value={routeFormData.fleetCount} onChange={(e) => setRouteFormData({ ...routeFormData, fleetCount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono" required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kapasitas / Unit:</label>
                  <input type="number" min="1" value={routeFormData.passengerCapacity} onChange={(e) => setRouteFormData({ ...routeFormData, passengerCapacity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono" required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tarif (Rp):</label>
                  <input type="number" min="0" value={routeFormData.fareRp} onChange={(e) => setRouteFormData({ ...routeFormData, fareRp: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono" required />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Warna:</label>
                <input type="color" value={routeFormData.color || "#38bdf8"} onChange={(e) => setRouteFormData({ ...routeFormData, color: e.target.value })}
                  className="h-8 w-16 bg-slate-800 border border-slate-700 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pemberhentian (klik lokasi untuk menambah di urutan akhir / menghapus):</label>
                <div className="flex flex-wrap gap-1.5">
                  {locations.map(l => {
                    const on = (routeFormData.stops || []).includes(l.id);
                    return (
                      <button type="button" key={l.id}
                        onClick={() => setRouteFormData({
                          ...routeFormData,
                          stops: on ? routeFormData.stops.filter(x => x !== l.id) : [...(routeFormData.stops || []), l.id]
                        })}
                        className={`px-2 py-1 rounded-md border text-[11px] ${on ? "bg-cyan-600/30 border-cyan-500/50 text-cyan-200" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                        {l.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-[11px] text-slate-300 font-mono">
                  Urutan: {(routeFormData.stops || []).map(id => locations.find(l => l.id === id)?.name || id).join(" ➔ ") || "-"}
                </div>
                {(routeFormData.stops || []).length > 0 && (
                  <button type="button" onClick={() => setRouteFormData({ ...routeFormData, stops: [] })} className="mt-1 text-[11px] text-rose-400 hover:text-rose-300">
                    Kosongkan urutan
                  </button>
                )}
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Simpan Trayek</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPassengerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">{editingPassenger ? `Ubah Data Penumpang (${editingPassenger.id})` : "Tambah Data Distribusi Penumpang (OD)"}</h3>
              <button onClick={() => setIsPassengerModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSavePassengerOD} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Lokasi Asal (Origin):</label>
                  <select
                    value={passengerFormData.originId}
                    onChange={(e) => setPassengerFormData({ ...passengerFormData, originId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Lokasi Tujuan (Destination):</label>
                  <select
                    value={passengerFormData.destinationId}
                    onChange={(e) => setPassengerFormData({ ...passengerFormData, destinationId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Jumlah Penumpang Naik:</label>
                  <input
                    type="number"
                    min="1"
                    value={passengerFormData.penumpangNaik}
                    onChange={(e) => setPassengerFormData({ ...passengerFormData, penumpangNaik: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Jumlah Penumpang Turun:</label>
                  <input
                    type="number"
                    min="1"
                    value={passengerFormData.penumpangTurun}
                    onChange={(e) => setPassengerFormData({ ...passengerFormData, penumpangTurun: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Periode Pengamatan:</label>
                <select
                  value={passengerFormData.periode}
                  onChange={(e) => setPassengerFormData({ ...passengerFormData, periode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="Pagi (06:30 - 08:30)">Pagi (06:30 - 08:30)</option>
                  <option value="Siang (12:00 - 14:00)">Siang (12:00 - 14:00)</option>
                  <option value="Sore (16:30 - 18:30)">Sore (16:30 - 18:30)</option>
                  <option value="Harian (05:00 - 22:00)">Harian (05:00 - 22:00)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPassengerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
