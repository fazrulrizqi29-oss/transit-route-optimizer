import { buildAdjacencyGraph } from './graph.js';

export function runUCS(locations, roads, startId, goalId, criterion = "distance", transitRoutes = []) {
  const startTime = performance.now();
  const { locMap, adj } = buildAdjacencyGraph(locations, roads);

  if (!locMap.has(startId) || !locMap.has(goalId)) {
    return { success: false, error: "Simpul asal atau tujuan tidak valid.", algorithm: "UCS" };
  }

  const startNode = locMap.get(startId);
  const goalNode = locMap.get(goalId);

  if (startId === goalId) {
    return {
      success: true,
      algorithm: "Uniform Cost Search (UCS)",
      criterion,
      path: [startId],
      pathNodes: [startNode],
      edgesUsed: [],
      totalCost: 0,
      totalDistanceKm: 0,
      totalTravelTimeMin: 0,
      totalFareRp: 0,
      nodesVisitedCount: 1,
      executionTimeMs: 0.05,
      isOptimal: true,
      usedTransitLines: [],
      traversalSteps: []
    };
  }

  const pq = [];
  const costSoFar = new Map();
  const visitedSet = new Set();
  const traversalSteps = [];

  // 1 & 2. Masukkan node awal ke Priority Queue dengan biaya 0
  costSoFar.set(startId, 0);
  pq.push({
    nodeId: startId,
    cost: 0,
    path: [startId],
    edges: [],
    accumulatedDistance: 0,
    accumulatedTime: 0,
    accumulatedFare: 0
  });

  traversalSteps.push({
    stepNumber: 1,
    action: "INIT",
    currentNodeId: startId,
    currentNodeName: startNode.name,
    currentCost: 0,
    pathSoFar: [startId],
    visitedNodes: [],
    frontier: [{ nodeId: startId, nodeName: startNode.name, cost: 0, path: [startId] }],
    description: `Langkah 1 & 2: Inisialisasi simpul awal [${startNode.name}] dimasukkan ke Priority Queue dengan biaya g(${startNode.code}) = 0.`
  });

  let goalEntry = null;
  let stepCounter = 1;

  while (pq.length > 0) {
    // 3. Pilih node dengan biaya kumulatif g(n) terkecil
    pq.sort((a, b) => a.cost - b.cost);
    const current = pq.shift();
    const currentCost = current.cost;
    const currentNodeId = current.nodeId;
    const currentNode = locMap.get(currentNodeId);

    stepCounter++;

    if (visitedSet.has(currentNodeId)) continue;
    visitedSet.add(currentNodeId);

    traversalSteps.push({
      stepNumber: stepCounter,
      action: "DEQUEUE",
      currentNodeId,
      currentNodeName: currentNode.name,
      currentCost: Number(currentCost.toFixed(2)),
      pathSoFar: [...current.path],
      visitedNodes: Array.from(visitedSet),
      frontier: pq.map(e => ({ nodeId: e.nodeId, nodeName: locMap.get(e.nodeId)?.name, cost: Number(e.cost.toFixed(2)), path: [...e.path] })),
      description: `Langkah 3: Mengeluarkan simpul [${currentNode.name}] dari Priority Queue dengan biaya kumulatif g(n) = ${currentCost.toFixed(2)} ${criterion === 'time' ? 'menit' : 'km'}.`
    });

    // 7. Periksa apakah node tujuan berhasil ditemukan
    if (currentNodeId === goalId) {
      goalEntry = current;
      traversalSteps.push({
        stepNumber: stepCounter + 1,
        action: "GOAL_REACHED",
        currentNodeId,
        currentNodeName: currentNode.name,
        currentCost: Number(currentCost.toFixed(2)),
        pathSoFar: [...current.path],
        visitedNodes: Array.from(visitedSet),
        frontier: [],
        description: `Langkah 7: Simpul tujuan [${goalNode.name}] berhasil dicapai! Solusi optimal UCS terkonfirmasi.`
      });
      break;
    }

    // 4. Periksa seluruh node tetangga
    const neighbors = adj.get(currentNodeId) || [];
    for (const edge of neighbors) {
      const neighborId = edge.neighborId;
      const neighborNode = locMap.get(neighborId);

      // 5. Hitung biaya perjalanan kumulatif
      let stepCost = edge.distanceKm;
      if (criterion === "time") stepCost = edge.travelTimeMin;
      else if (criterion === "fare") stepCost = edge.fareRp;

      const newCost = currentCost + stepCost;
      const previousBest = costSoFar.has(neighborId) ? costSoFar.get(neighborId) : Infinity;

      // 6. Perbarui biaya jika ditemukan jalur yang lebih murah
      if (newCost < previousBest) {
        costSoFar.set(neighborId, newCost);
        pq.push({
          nodeId: neighborId,
          cost: newCost,
          path: [...current.path, neighborId],
          edges: [...current.edges, edge],
          accumulatedDistance: current.accumulatedDistance + edge.distanceKm,
          accumulatedTime: current.accumulatedTime + edge.travelTimeMin,
          accumulatedFare: current.accumulatedFare + edge.fareRp
        });

        traversalSteps.push({
          stepNumber: ++stepCounter,
          action: "ENQUEUE_NEIGHBOR",
          currentNodeId,
          neighborId,
          neighborName: neighborNode.name,
          stepCost: Number(stepCost.toFixed(2)),
          newCumulativeCost: Number(newCost.toFixed(2)),
          visitedNodes: Array.from(visitedSet),
          frontier: pq.map(e => ({ nodeId: e.nodeId, nodeName: locMap.get(e.nodeId)?.name, cost: Number(e.cost.toFixed(2)), path: [...e.path] })),
          description: `Langkah 4-6: Evaluasi tetangga [${neighborNode.name}]. Jalur baru lebih murah: g = ${newCost.toFixed(2)} ${criterion === 'time' ? 'menit' : 'km'}. Masuk Priority Queue.`
        });
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  if (!goalEntry) {
    return {
      success: false,
      algorithm: "UCS",
      error: `Tidak ada rute yang menghubungkan ${startNode.name} ke ${goalNode.name}.`,
      visitedCount: visitedSet.size,
      executionTimeMs,
      traversalSteps
    };
  }

  // Identifikasi Trayek yang dapat digunakan
  const usedTransitLineIds = new Set();
  goalEntry.edges.forEach(e => {
    (e.transitLines || []).forEach(lId => usedTransitLineIds.add(lId));
  });
  const usedTransitLines = transitRoutes.filter(r => usedTransitLineIds.has(r.id) || usedTransitLineIds.has(r.code) || usedTransitLineIds.has(r.kodeAngkutan));

  return {
    success: true,
    algorithm: "Uniform Cost Search (UCS)",
    criterion,
    path: goalEntry.path,
    pathNodes: goalEntry.path.map(id => locMap.get(id)),
    edgesUsed: goalEntry.edges,
    totalCost: Number(costSoFar.get(goalId).toFixed(2)),
    totalDistanceKm: Number(goalEntry.accumulatedDistance.toFixed(2)),
    totalTravelTimeMin: Number(goalEntry.accumulatedTime.toFixed(1)),
    totalFareRp: goalEntry.accumulatedFare,
    nodesVisitedCount: visitedSet.size,
    usedTransitLines,
    executionTimeMs,
    isOptimal: true,
    traversalSteps
  };
}

// --- ALGORITMA GREEDY BEST-FIRST SEARCH ---
