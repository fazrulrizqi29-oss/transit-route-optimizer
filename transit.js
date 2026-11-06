import { calculateHaversineDistance } from './graph.js';

export function findTransitRouteOptions(originId, destinationId, transitRoutes, locations, roads = [], odPassengers = []) {
  const locMap = new Map();
  locations.forEach(l => locMap.set(l.id, l));

  // Helper hitung jarak & waktu tempuh riil berdasarkan jaringan jalan
  const calculateStopsMetrics = (stopIds) => {
    let dist = 0;
    let time = 0;
    for (let i = 0; i < stopIds.length - 1; i++) {
      const fromId = stopIds[i];
      const toId = stopIds[i + 1];
      const road = roads.find(r =>
        (r.from === fromId && r.to === toId) ||
        (r.bidirectional && r.from === toId && r.to === fromId)
      );
      if (road) {
        dist += road.distanceKm;
        time += road.travelTimeMin;
      } else {
        const l1 = locMap.get(fromId);
        const l2 = locMap.get(toId);
        const hDist = calculateHaversineDistance(l1, l2) || 3.0;
        dist += hDist;
        time += Math.round(hDist * 2.2);
      }
    }
    // Waktu henti (dwell time) rata-rata 1 menit per halte perantara
    const dwellTime = Math.max(0, stopIds.length - 2) * 1;
    return {
      distanceKm: Number(dist.toFixed(2)),
      travelTimeMin: Math.round(time + dwellTime)
    };
  };

  // Cari data distribusi penumpang pada pasangan OD ini
  const odRecord = (odPassengers || []).find(p => p.originId === originId && p.destinationId === destinationId);
  const matchedDemandPax = odRecord ? odRecord.penumpangNaik : 0;

  const directRoutes = [];
  const transferRoutes = [];

  // 1. Identifikasi Rute Langsung (Direct, 0 Transfer)
  transitRoutes.forEach(route => {
    const oIdx = route.stops.indexOf(originId);
    const dIdx = route.stops.indexOf(destinationId);
    if (oIdx !== -1 && dIdx !== -1 && oIdx < dIdx) {
      const subStops = route.stops.slice(oIdx, dIdx + 1);
      const metrics = calculateStopsMetrics(subStops);
      directRoutes.push({
        type: "DIRECT",
        route,
        routeName: route.name,
        kodeAngkutan: route.kodeAngkutan || route.code,
        stopsCount: subStops.length,
        stops: subStops,
        distanceKm: metrics.distanceKm,
        estimatedTimeMin: metrics.travelTimeMin,
        fareRp: route.fareRp,
        transferCount: 0,
        fleetCount: route.fleetCount || 10,
        capacity: route.passengerCapacity || 40,
        matchedDemandPax
      });
    }
  });

  // 2. Identifikasi Perpindahan Angkutan (Transit Transfer, 1 Transfer)
  for (let i = 0; i < transitRoutes.length; i++) {
    for (let j = 0; j < transitRoutes.length; j++) {
      if (i === j) continue;
      const r1 = transitRoutes[i];
      const r2 = transitRoutes[j];
      const oIdx = r1.stops.indexOf(originId);
      if (oIdx === -1) continue;

      const commonStops = r1.stops.filter(s => r2.stops.includes(s));
      commonStops.forEach(interchangeId => {
        const intIdx1 = r1.stops.indexOf(interchangeId);
        const intIdx2 = r2.stops.indexOf(interchangeId);
        const dIdx = r2.stops.indexOf(destinationId);

        if (intIdx1 > oIdx && dIdx > intIdx2) {
          const leg1Stops = r1.stops.slice(oIdx, intIdx1 + 1);
          const leg2Stops = r2.stops.slice(intIdx2, dIdx + 1);
          const m1 = calculateStopsMetrics(leg1Stops);
          const m2 = calculateStopsMetrics(leg2Stops);
          const transferWaitTimeMin = 5; // Estimasi waktu tunggu transfer halte
          const totalDist = Number((m1.distanceKm + m2.distanceKm).toFixed(2));
          const totalTime = m1.travelTimeMin + m2.travelTimeMin + transferWaitTimeMin;

          transferRoutes.push({
            type: "TRANSFER",
            r1,
            r2,
            interchangeId,
            interchangeName: locMap.get(interchangeId)?.name || interchangeId,
            leg1Stops,
            leg2Stops,
            stops: [...leg1Stops, ...leg2Stops.slice(1)],
            stopsCount: leg1Stops.length + leg2Stops.length - 1,
            distanceKm: totalDist,
            estimatedTimeMin: totalTime,
            transferWaitTimeMin,
            totalFareRp: (r1.fareRp || 3500) + (r2.fareRp || 3500),
            transferCount: 1,
            matchedDemandPax
          });
        }
      });
    }
  }

  // 3. Tentukan Rekomendasi Rute Terbaik (Best Transit Recommendation)
  // Prioritaskan Rute Langsung karena tanpa perlu ganti angkutan, atau transfer tercepat
  let bestRecommendation = null;
  if (directRoutes.length > 0) {
    bestRecommendation = directRoutes.sort((a, b) => a.estimatedTimeMin - b.estimatedTimeMin)[0];
  } else if (transferRoutes.length > 0) {
    bestRecommendation = transferRoutes.sort((a, b) => a.estimatedTimeMin - b.estimatedTimeMin)[0];
  }

  const hasTransitService = directRoutes.length > 0 || transferRoutes.length > 0;

  return {
    directRoutes,
    transferRoutes,
    hasTransitService,
    bestRecommendation
  };
}

// --- ANALISIS PERMINTAAN TRAYEK ---
export function analyzeRouteDemand(transitRoutes, odPassengers) {
  return transitRoutes.map(route => {
    let matchedPassengers = 0;
    let matchedODCount = 0;

    odPassengers.forEach(od => {
      const oIdx = route.stops.indexOf(od.originId);
      const dIdx = route.stops.indexOf(od.destinationId);
      if (oIdx !== -1 && dIdx !== -1 && oIdx < dIdx) {
        matchedPassengers += (od.penumpangNaik || 0);
        matchedODCount++;
      }
    });

    const dailyCapacity = (route.fleetCount || 10) * (route.passengerCapacity || 40) * 8;
    const loadFactor = dailyCapacity > 0 ? Math.min(100, Math.round((matchedPassengers / dailyCapacity) * 100)) : 0;

    let statusKepadatan = "Optimal";
    let recommendation = "Armada mencukupi dengan waktu tunggu standar.";

    if (loadFactor >= 75) {
      statusKepadatan = "Tinggi / Padat";
      recommendation = "Kepadatan tinggi! Disarankan menambah 2 - 4 armada dan mempercepat headway waktu tunggu.";
    } else if (loadFactor < 40) {
      statusKepadatan = "Rendah / Longgar";
      recommendation = "Utilisasi rendah. Dapat dilakukan penyesuaian jadwal armada.";
    }

    return {
      routeId: route.id,
      routeName: route.name,
      kodeAngkutan: route.kodeAngkutan || route.code,
      fleetCount: route.fleetCount,
      passengerCapacity: route.passengerCapacity,
      dailyCapacity,
      matchedPassengers,
      matchedODCount,
      loadFactor,
      statusKepadatan,
      recommendation
    };
  });
}

// --- COMPARATOR ENGINE (FITUR 11: PERBANDINGAN HASIL UCS DAN GREEDY) ---
