import { runUCS } from './ucs.js';
import { runGreedyBestFirst } from './greedy.js';

export function compareAlgorithms(locations, roads, startId, goalId, criterion = "distance", transitRoutes = []) {
  const ucs = runUCS(locations, roads, startId, goalId, criterion, transitRoutes);
  const greedy = runGreedyBestFirst(locations, roads, startId, goalId, transitRoutes);

  if (!ucs.success || !greedy.success) {
    return { success: false, error: ucs.error || greedy.error, ucs, greedy };
  }

  const distanceDiffKm = Number((greedy.totalDistanceKm - ucs.totalDistanceKm).toFixed(2));
  const timeDiffMin = Number((greedy.totalTravelTimeMin - ucs.totalTravelTimeMin).toFixed(1));
  const isSameRoute = JSON.stringify(ucs.path) === JSON.stringify(greedy.path);
  const isGreedyOptimal = distanceDiffKm <= 0.05 && timeDiffMin <= 0.2;

  // Evaluasi Otomatis Kesimpulan Parameter
  let shortestDistanceWinner = "Keduanya Sama (Seri)";
  if (ucs.totalDistanceKm < greedy.totalDistanceKm) {
    shortestDistanceWinner = `UCS lebih hemat ${Math.abs(distanceDiffKm)} km (${ucs.totalDistanceKm} km vs ${greedy.totalDistanceKm} km)`;
  } else if (greedy.totalDistanceKm < ucs.totalDistanceKm) {
    shortestDistanceWinner = `Greedy (${greedy.totalDistanceKm} km vs ${ucs.totalDistanceKm} km)`;
  }

  let shortestTimeWinner = "Keduanya Sama (Seri)";
  if (ucs.totalTravelTimeMin < greedy.totalTravelTimeMin) {
    shortestTimeWinner = `UCS lebih cepat ${Math.abs(timeDiffMin)} menit (${ucs.totalTravelTimeMin} mnt vs ${greedy.totalTravelTimeMin} mnt)`;
  } else if (greedy.totalTravelTimeMin < ucs.totalTravelTimeMin) {
    shortestTimeWinner = `Greedy (${greedy.totalTravelTimeMin} mnt vs ${ucs.totalTravelTimeMin} mnt)`;
  }

  let fewerNodesWinner = "Keduanya Sama";
  if (greedy.nodesVisitedCount < ucs.nodesVisitedCount) {
    fewerNodesWinner = `Greedy mengeksplorasi ${greedy.nodesVisitedCount} simpul vs UCS ${ucs.nodesVisitedCount} simpul`;
  } else if (ucs.nodesVisitedCount < greedy.nodesVisitedCount) {
    fewerNodesWinner = `UCS mengeksplorasi ${ucs.nodesVisitedCount} simpul vs Greedy ${greedy.nodesVisitedCount} simpul`;
  }

  let verdictBadge = isSameRoute ? "Rute Identik & Optimal" : (isGreedyOptimal ? "Keduanya Sangat Baik" : "UCS Unggul (Optimal)");
  let explanation = isSameRoute
    ? "Kedua algoritma menghasilkan lintasan rute yang sama persis. Greedy Best-First langsung menuju tujuan secara optimal."
    : `UCS menemukan rute lebih efisien (${Math.abs(distanceDiffKm)} km lebih pendek dan ${Math.abs(timeDiffMin)} menit lebih hemat). Greedy terpengaruh oleh daya tarik garis lurus Haversine sehingga berisiko memilih jalan searah atau ruas jalan dengan penalti waktu lebih tinggi.`;

  const greedyWarning = "PENTING: Jangan menganggap Greedy selalu menghasilkan rute optimal. Algoritma Greedy Best-First Search hanya mengevaluasi fungsi heuristik lokal h(n) (jarak garis lurus rumus Haversine) tanpa memperhitungkan biaya kumulatif g(n) yang telah dilalui. Pada jaringan jalan perkotaan riil dengan jalan satu arah, belokan lambat, atau ruas macet, Greedy dapat terjebak pada solusi suboptimal.";

  return {
    success: true,
    startId,
    goalId,
    criterion,
    ucs,
    greedy,
    comparison: {
      isSameRoute,
      isGreedyOptimal,
      distanceDiffKm,
      timeDiffMin,
      nodesVisitedDiff: greedy.nodesVisitedCount - ucs.nodesVisitedCount,
      executionTimeDiffMs: Number((greedy.executionTimeMs - ucs.executionTimeMs).toFixed(3)),
      verdictBadge,
      explanation,
      shortestDistanceWinner,
      shortestTimeWinner,
      fewerNodesWinner,
      greedyWarning
    }
  };
}

// --- SVG ICONS SET ---
