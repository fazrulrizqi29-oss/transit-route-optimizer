

export function calculateHaversineDistance(nodeA, nodeB) {
  if (!nodeA || !nodeB) return 0;
  if (nodeA.latitude !== undefined && nodeB.latitude !== undefined &&
    nodeA.longitude !== undefined && nodeB.longitude !== undefined) {
    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371; // Jari-jari bumi dalam km
    const dLat = toRad(nodeB.latitude - nodeA.latitude);
    const dLon = toRad(nodeB.longitude - nodeA.longitude);
    const lat1 = toRad(nodeA.latitude);
    const lat2 = toRad(nodeB.latitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(3));
  }
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Number((Math.sqrt(dx * dx + dy * dy) * 0.012).toFixed(3));
}

// Graph Adjacency List Builder
export function buildAdjacencyGraph(locations, roads) {
  const locMap = new Map();
  locations.forEach(loc => locMap.set(loc.id, loc));

  const adj = new Map();
  locations.forEach(loc => adj.set(loc.id, []));

  roads.forEach(road => {
    const edgeData = {
      roadId: road.id,
      from: road.from,
      to: road.to,
      distanceKm: Number(road.distanceKm),
      travelTimeMin: Number(road.travelTimeMin),
      fareRp: Number(road.fareRp || 3500),
      bidirectional: road.bidirectional !== false,
      transitLines: road.transitLines || []
    };

    if (adj.has(road.from)) {
      adj.get(road.from).push({ ...edgeData, neighborId: road.to });
    }
    if (road.bidirectional !== false && adj.has(road.to)) {
      adj.get(road.to).push({ ...edgeData, from: road.to, to: road.from, neighborId: road.from });
    }
  });

  return { locMap, adj };
}

// --- ALGORITMA UCS (UNIFORM COST SEARCH) ---
