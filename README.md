# Transit Route Optimizer

Aplikasi web pencarian dan optimasi rute angkutan umum berbasis graph dengan algoritma **UCS** dan **Greedy Best-First**.
Bisa diinstal sebagai aplikasi (PWA) dan berjalan offline setelah dibuka sekali.

## Menjalankan
```bash
npm install
npm run dev        # mode pengembangan (http://localhost:5173)
npm run build      # build produksi ke folder dist/
npm run preview    # coba hasil build (bisa diinstal dari browser)
npm test           # tes algoritma
```
Butuh Node.js 18+.

## Struktur
```
src/
  algorithms/   graph.js, ucs.js, greedy.js, transit.js (trayek & transfer, analisis penumpang), comparator.js
  components/   GraphCanvas.jsx (kanvas graph interaktif), Icons.jsx
  data/         defaultData.js (lokasi, jalan, trayek, penumpang)
  App.jsx       antarmuka, CRUD, validasi
tests/          algorithms.test.mjs
```
Data tersimpan di localStorage; tombol "Reset ke Data Default" mengembalikan dataset awal.

## Deploy ke GitHub Pages
1. Buat repo baru di GitHub, lalu push proyek ini ke branch `main`.
2. Di repo: **Settings → Pages → Source: GitHub Actions**.
3. Setelah workflow **Deploy ke GitHub Pages** selesai (tab Actions), aplikasi aktif di `https://<username>.github.io/<nama-repo>/`.
