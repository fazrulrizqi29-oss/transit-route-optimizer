

export const DEFAULT_LOCATIONS = [
  { id: "LOC-A", name: "Terminal A", code: "TRM-A", type: "Terminal Utama", latitude: -6.914744, longitude: 107.609810, penumpangNaik: 2450, penumpangTurun: 1800, x: 120, y: 320, shelterCapacity: 350, peakHours: "06:30 - 08:30 & 16:30 - 18:30" },
  { id: "LOC-B", name: "Pasar B", code: "PSR-B", type: "Pusat Perbelanjaan", latitude: -6.932015, longitude: 107.604022, penumpangNaik: 1850, penumpangTurun: 2100, x: 240, y: 470, shelterCapacity: 250, peakHours: "05:00 - 08:00 & 13:00 - 15:00" },
  { id: "LOC-C", name: "Kampus C", code: "KMP-C", type: "Pendidikan", latitude: -6.892040, longitude: 107.615030, penumpangNaik: 2900, penumpangTurun: 2750, x: 280, y: 160, shelterCapacity: 300, peakHours: "07:00 - 08:30 & 15:30 - 17:30" },
  { id: "LOC-D", name: "Stasiun D", code: "STN-D", type: "Stasiun Transit", latitude: -6.908055, longitude: 107.625012, penumpangNaik: 3400, penumpangTurun: 3100, x: 420, y: 290, shelterCapacity: 400, peakHours: "06:30 - 09:00 & 17:00 - 19:30" },
  { id: "LOC-E", name: "Rumah Sakit E", code: "RSU-E", type: "Rumah Sakit", latitude: -6.931080, longitude: 107.632040, penumpangNaik: 1400, penumpangTurun: 1650, x: 450, y: 470, shelterCapacity: 200, peakHours: "08:00 - 11:00 & 13:00 - 16:00" },
  { id: "LOC-F", name: "Terminal F", code: "TRM-F", type: "Terminal Utama", latitude: -6.912010, longitude: 107.665090, penumpangNaik: 2800, penumpangTurun: 2500, x: 840, y: 270, shelterCapacity: 380, peakHours: "06:00 - 08:30 & 16:30 - 19:00" },
  { id: "LOC-G", name: "Pusat Kota G", code: "PKT-G", type: "Pusat Kota", latitude: -6.901030, longitude: 107.640050, penumpangNaik: 3800, penumpangTurun: 3950, x: 610, y: 190, shelterCapacity: 450, peakHours: "07:30 - 09:30 & 16:30 - 20:00" },
  { id: "LOC-H", name: "Halte H", code: "HLT-H", type: "Halte Bus", latitude: -6.925060, longitude: 107.648070, penumpangNaik: 1650, penumpangTurun: 1550, x: 650, y: 430, shelterCapacity: 180, peakHours: "07:00 - 09:00 & 16:00 - 18:30" }
];

export const DEFAULT_ROADS = [
  { id: "ROAD-01", from: "LOC-A", to: "LOC-C", distanceKm: 3.5, travelTimeMin: 8, fareRp: 4000, bidirectional: true, transitLines: ["TR-01"] },
  { id: "ROAD-02", from: "LOC-A", to: "LOC-B", distanceKm: 2.8, travelTimeMin: 7, fareRp: 3500, bidirectional: true, transitLines: ["TR-02"] },
  { id: "ROAD-03", from: "LOC-A", to: "LOC-D", distanceKm: 4.0, travelTimeMin: 9, fareRp: 4500, bidirectional: false, transitLines: ["TR-01"] },
  { id: "ROAD-04", from: "LOC-C", to: "LOC-D", distanceKm: 3.0, travelTimeMin: 6, fareRp: 3500, bidirectional: true, transitLines: ["TR-03"] },
  { id: "ROAD-05", from: "LOC-C", to: "LOC-G", distanceKm: 4.5, travelTimeMin: 10, fareRp: 5000, bidirectional: false, transitLines: ["TR-03"] },
  { id: "ROAD-06", from: "LOC-B", to: "LOC-E", distanceKm: 3.8, travelTimeMin: 9, fareRp: 4000, bidirectional: true, transitLines: ["TR-02"] },
  { id: "ROAD-07", from: "LOC-D", to: "LOC-E", distanceKm: 3.2, travelTimeMin: 7, fareRp: 3500, bidirectional: true, transitLines: ["TR-02"] },
  { id: "ROAD-08", from: "LOC-D", to: "LOC-G", distanceKm: 2.5, travelTimeMin: 5, fareRp: 3500, bidirectional: true, transitLines: ["TR-01"] },
  { id: "ROAD-09", from: "LOC-E", to: "LOC-H", distanceKm: 3.6, travelTimeMin: 8, fareRp: 4000, bidirectional: true, transitLines: ["TR-02"] },
  { id: "ROAD-10", from: "LOC-G", to: "LOC-H", distanceKm: 2.9, travelTimeMin: 6, fareRp: 3500, bidirectional: true, transitLines: ["TR-03"] },
  { id: "ROAD-11", from: "LOC-G", to: "LOC-F", distanceKm: 3.4, travelTimeMin: 7, fareRp: 4500, bidirectional: true, transitLines: ["TR-01"] },
  { id: "ROAD-12", from: "LOC-H", to: "LOC-F", distanceKm: 3.8, travelTimeMin: 8, fareRp: 4000, bidirectional: false, transitLines: ["TR-02"] }
];

export const DEFAULT_TRANSIT_ROUTES = [
  {
    id: "TR-01",
    name: "Koridor 1 - Poros Utama Terminal A ke Terminal F",
    kodeAngkutan: "BRT-01",
    code: "BRT-01",
    vehicleType: "Bus Rapid Transit (BRT)",
    color: "#0284c7",
    stops: ["LOC-A", "LOC-D", "LOC-G", "LOC-F"],
    fleetCount: 14,
    passengerCapacity: 50,
    operatingHours: "05:00 - 22:30",
    headwayMin: 8,
    fareRp: 4500,
    activeStatus: true,
    description: "Jalur poros barat ke timur menghubungkan Terminal A, Stasiun D, Pusat Kota G, dan Terminal F."
  },
  {
    id: "TR-02",
    name: "Koridor 2 - Jalur Selatan Pasar B & RS E",
    kodeAngkutan: "FDR-02",
    code: "FDR-02",
    vehicleType: "City Feeder Bus",
    color: "#10b981",
    stops: ["LOC-A", "LOC-B", "LOC-E", "LOC-H", "LOC-F"],
    fleetCount: 10,
    passengerCapacity: 35,
    operatingHours: "05:30 - 21:30",
    headwayMin: 12,
    fareRp: 4000,
    activeStatus: true,
    description: "Jalur lingkar selatan melayani mobilitas Pasar B, RS E, Halte H hingga Terminal F."
  },
  {
    id: "TR-03",
    name: "Koridor 3 - Lingkar Kampus C & Pusat Kota G",
    kodeAngkutan: "SHT-03",
    code: "SHT-03",
    vehicleType: "Metro Shuttle Bus",
    color: "#f59e0b",
    stops: ["LOC-C", "LOC-D", "LOC-G", "LOC-H"],
    fleetCount: 8,
    passengerCapacity: 30,
    operatingHours: "06:00 - 21:00",
    headwayMin: 10,
    fareRp: 3500,
    activeStatus: true,
    description: "Shuttle akademik dan bisnis menghubungkan Kampus C, Stasiun D, Pusat Kota G, dan Halte H."
  }
];

export const DEFAULT_OD_PASSENGERS = [
  { id: "OD-01", originId: "LOC-A", destinationId: "LOC-F", penumpangNaik: 850, penumpangTurun: 820, periode: "Pagi (06:30 - 08:30)", tanggal: "2026-11-06" },
  { id: "OD-02", originId: "LOC-A", destinationId: "LOC-D", penumpangNaik: 720, penumpangTurun: 700, periode: "Pagi (06:30 - 08:30)", tanggal: "2026-11-06" },
  { id: "OD-03", originId: "LOC-C", destinationId: "LOC-G", penumpangNaik: 640, penumpangTurun: 610, periode: "Pagi (07:00 - 09:00)", tanggal: "2026-11-06" },
  { id: "OD-04", originId: "LOC-B", destinationId: "LOC-E", penumpangNaik: 510, penumpangTurun: 490, periode: "Pagi (07:30 - 09:30)", tanggal: "2026-11-06" },
  { id: "OD-05", originId: "LOC-D", destinationId: "LOC-G", penumpangNaik: 950, penumpangTurun: 920, periode: "Pagi (06:30 - 09:00)", tanggal: "2026-11-06" },
  { id: "OD-06", originId: "LOC-G", destinationId: "LOC-F", penumpangNaik: 780, penumpangTurun: 750, periode: "Sore (16:30 - 18:30)", tanggal: "2026-11-06" },
  { id: "OD-07", originId: "LOC-G", destinationId: "LOC-A", penumpangNaik: 890, penumpangTurun: 860, periode: "Sore (17:00 - 19:30)", tanggal: "2026-11-06" },
  { id: "OD-08", originId: "LOC-E", destinationId: "LOC-H", penumpangNaik: 420, penumpangTurun: 400, periode: "Siang (12:00 - 14:00)", tanggal: "2026-11-06" },
  { id: "OD-09", originId: "LOC-H", destinationId: "LOC-F", penumpangNaik: 530, penumpangTurun: 510, periode: "Sore (16:00 - 18:30)", tanggal: "2026-11-06" },
  { id: "OD-10", originId: "LOC-B", destinationId: "LOC-F", penumpangNaik: 460, penumpangTurun: 440, periode: "Harian (05:00 - 22:00)", tanggal: "2026-11-06" }
];

export const TEST_SCENARIOS = [
  { id: "SCENARIO-01", title: "Skenario 1: Terminal A ke Terminal F", origin: "LOC-A", destination: "LOC-F", desc: "Poros Barat ke Timur melalui Stasiun D dan Pusat Kota G" },
  { id: "SCENARIO-02", title: "Skenario 2: Kampus C ke Rumah Sakit E", origin: "LOC-C", destination: "LOC-E", desc: "Lintas Utara ke Selatan melalui Stasiun D" },
  { id: "SCENARIO-03", title: "Skenario 3: Pasar B ke Pusat Kota G", origin: "LOC-B", destination: "LOC-G", desc: "Pusat aktivitas belanja menuju pusat bisnis dan perkantoran kota" },
  { id: "SCENARIO-04", title: "Skenario 4: Halte H ke Terminal A", origin: "LOC-H", destination: "LOC-A", desc: "Arah sebaliknya yang menguji penanganan jalan satu arah (one-way)" }
];
