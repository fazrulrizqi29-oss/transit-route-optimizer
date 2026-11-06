import { calculateHaversineDistance, buildAdjacencyGraph } from './graph.js';

export function runGreedyBestFirst(locations, roads, startId, goalId, transitRoutes = []) {
  const startTime = performance.now();
  const { locMap, adj } = buildAdjacencyGraph(locations, roads);

  if (!locMap.has(startId) || !locMap.has(goalId)) {
    return { success: false, error: "Simpul asal atau tujuan tidak valid.", algorithm: "Greedy" };
  }

  const goalNode = locMap.get(goalId);
  const startNode = locMap.get(startId);

  if (startId === goalId) {
    return {
      success: true,
      algorithm: "Greedy Best-First Search",
      path: [startId],
      pathNodes: [startNode],
      edgesUsed: [],
      totalDistanceKm: 0,
      totalTravelTimeMin: 0,
      totalFareRp: 0,
      initialHeuristic: 0,
      nodesVisitedCount: 1,
      executionTimeMs: 0.05,
      isOptimal: true,
      usedTransitLines: [],
      traversalSteps: []
    };
  }

  const pq = [];
  const visitedSet = new Set();
  const traversalSteps = [];

  // 1, 2 & 3. Hitung nilai heuristic awal dengan rumus Haversine dan masukkan ke Priority Queue
  const initialH = calculateHaversineDistance(startNode, goalNode);
  pq.push({
    nodeId: startId,
    h: initialH,
    path: [startId],
    edges: [],
    accumulatedDistance: 0,
    accumulatedTime: 0,
    accumulatedFare: 0,
    heuristicHistory: [{ nodeId: startId, name: startNode.name, h: initialH }]
  });

  traversalSteps.push({
    stepNumber: 1,
    action: "INIT",
    currentNodeId: startId,
    currentNodeName: startNode.name,
    heuristicValue: initialH,
    pathSoFar: [startId],
    visitedNodes: [],
    frontier: [{ nodeId: startId, nodeName: startNode.name, h: initialH, path: [startId] }],
    description: `Langkah 1-3: Menghitung heuristik Haversine simpul awal [${startNode.name}] ke tujuan [${goalNode.name}]: h(n) = ${initialH} km. Dimasukkan ke Priority Queue.`
  });

  let goalEntry = null;
  let stepCounter = 1;

  while (pq.length > 0) {
    // 4. Pilih node dengan nilai heuristic h(n) terkecil
    pq.sort((a, b) => a.h - b.h);
    const current = pq.shift();
    const currentH = current.h;
    const currentNodeId = current.nodeId;
    const currentNode = locMap.get(currentNodeId);

    stepCounter++;

    if (visitedSet.has(currentNodeId)) continue;
    visitedSet.add(currentNodeId);

    traversalSteps.push({
      stepNumber: stepCounter,
      action: "EVALUATE_NODE",
      currentNodeId,
      currentNodeName: currentNode.name,
      heuristicValue: Number(currentH.toFixed(2)),
      pathSoFar: [...current.path],
      visitedNodes: Array.from(visitedSet),
      frontier: pq.map(e => ({ nodeId: e.nodeId, nodeName: locMap.get(e.nodeId)?.name, h: Number(e.h.toFixed(2)), path: [...e.path] })),
      description: `Langkah 4: Memilih simpul [${currentNode.name}] dari antrean dengan estimasi jarak Haversine terkecil: h(n) = ${currentH.toFixed(2)} km.`
    });

    // 6. Periksa apakah tujuan tercapai
    if (currentNodeId === goalId) {
      goalEntry = current;
      traversalSteps.push({
        stepNumber: stepCounter + 1,
        action: "GOAL_REACHED",
        currentNodeId,
        currentNodeName: currentNode.name,
        heuristicValue: 0,
        pathSoFar: [...current.path],
        visitedNodes: Array.from(visitedSet),
        frontier: [],
        description: `Langkah 6: Simpul tujuan [${goalNode.name}] berhasil dicapai secara Greedy dengan nilai h(goal) = 0!`
      });
      break;
    }

    // 5. Periksa node tetangga yang tersedia
    const neighbors = adj.get(currentNodeId) || [];
    const evaluatedNeighbors = [];

    for (const edge of neighbors) {
      const neighborId = edge.neighborId;
      const neighborNode = locMap.get(neighborId);

      if (!visitedSet.has(neighborId)) {
        // Hitung nilai heuristic tetangga ke tujuan menggunakan Haversine
        const hVal = calculateHaversineDistance(neighborNode, goalNode);
        pq.push({
          nodeId: neighborId,
          h: hVal,
          path: [...current.path, neighborId],
          edges: [...current.edges, edge],
          accumulatedDistance: current.accumulatedDistance + edge.distanceKm,
          accumulatedTime: current.accumulatedTime + edge.travelTimeMin,
          accumulatedFare: current.accumulatedFare + edge.fareRp,
          heuristicHistory: [...current.heuristicHistory, { nodeId: neighborId, name: neighborNode.name, h: hVal }]
        });

        evaluatedNeighbors.push({
          neighborId,
          neighborName: neighborNode.name,
          hValue: hVal
        });
      }
    }

    if (evaluatedNeighbors.length > 0) {
      traversalSteps.push({
        stepNumber: ++stepCounter,
        action: "ENQUEUE_NEIGHBORS",
        currentNodeId,
        evaluatedNeighbors,
        visitedNodes: Array.from(visitedSet),
        frontier: pq.map(e => ({ nodeId: e.nodeId, nodeName: locMap.get(e.nodeId)?.name, h: Number(e.h.toFixed(2)), path: [...e.path] })),
        description: `Langkah 5: Memeriksa tetangga [${evaluatedNeighbors.map(n => `${n.neighborName}: h=${n.hValue}km`).join(', ')}]. Dimasukkan ke Priority Queue Greedy.`
      });
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  if (!goalEntry) {
    return {
      success: false,
      algorithm: "Greedy",
      error: `Tidak ada rute dari ${startNode.name} ke ${goalNode.name}.`,
      visitedCount: visitedSet.size,
      executionTimeMs,
      traversalSteps
    };
  }

  const usedTransitLineIds = new Set();
  goalEntry.edges.forEach(e => {
    (e.transitLines || []).forEach(lId => usedTransitLineIds.add(lId));
  });
  const usedTransitLines = transitRoutes.filter(r => usedTransitLineIds.has(r.id) || usedTransitLineIds.has(r.code) || usedTransitLineIds.has(r.kodeAngkutan));

  return {
    success: true,
    algorithm: "Greedy Best-First Search",
    path: goalEntry.path,
    pathNodes: goalEntry.path.map(id => locMap.get(id)),
    edgesUsed: goalEntry.edges,
    totalDistanceKm: Number(goalEntry.accumulatedDistance.toFixed(2)),
    totalTravelTimeMin: Number(goalEntry.accumulatedTime.toFixed(1)),
    totalFareRp: goalEntry.accumulatedFare,
    initialHeuristic: initialH,
    nodesVisitedCount: visitedSet.size,
    usedTransitLines,
    executionTimeMs,
    heuristicHistory: goalEntry.heuristicHistory,
    traversalSteps
  };
}

// --- IDENTIFIKASI TRAYEK LANGSUNG & SISTEM REKOMENDASI RUTE ANGKUTAN UMUM (FITUR 13) ---
