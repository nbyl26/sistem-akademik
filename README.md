# SimakCihuy - Sistem Informasi Akademik

Sistem Informasi Akademik adalah aplikasi web modern untuk manajemen data akademik sekolah. Dibangun dengan teknologi terkini untuk memberikan pengalaman pengguna yang optimal.

## 📋 Tentang Proyek

SimakCihuy adalah platform akademik yang menghubungkan admin, guru, dan siswa dalam satu ekosistem terintegrasi. Sistem ini memudahkan manajemen data akademik mulai dari jadwal pelajaran, nilai siswa, absensi, hingga pengumuman.

## 🎯 Fitur Utama

### Admin
- **Manajemen Akun**: Kelola data pengguna (guru, siswa, admin)
- **Master Data**: Kelola tahun ajaran, kelas, dan mata pelajaran
- **Jadwal Pelajaran**: Buat dan kelola jadwal pembelajaran
- **Pengaturan Penilaian**: Atur persentase komponen nilai (tugas, UTS, UAS, absensi)
- **Rekapitulasi**: Lihat laporan akademik keseluruhan

### Guru
- **Jadwal Mengajar**: Lihat jadwal mengajar yang ditugaskan
- **Input Nilai**: Masukkan nilai siswa untuk berbagai komponen penilaian
- **Absensi**: Catat kehadiran siswa per kelas
- **Pengumuman**: Buat pengumuman untuk siswa
- **Profil**: Kelola data profil guru

### Siswa
- **Jadwal Pelajaran**: Lihat jadwal pembelajaran pribadi
- **Kartu Hasil Studi**: Lihat nilai akhir yang dihitung otomatis berdasarkan pengaturan admin
- **Absensi**: Lihat riwayat kehadiran
- **Profil**: Kelola data profil siswa

## 🛠 Teknologi

- **Frontend**: Next.js 15+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase
- **Database**: Firestore (NoSQL)
- **Authentication**: Firebase Authentication (Cookie-based)
- **UI Components**: Lucide React Icons

## 📦 Struktur Proyek

```
├── app/
│   ├── (auth)/              # Halaman login
│   ├── (protected)/         # Halaman terproteksi (memerlukan autentikasi)
│   │   ├── admin/          # Dashboard admin
│   │   ├── teacher/        # Dashboard guru
│   │   └── student/        # Dashboard siswa
│   ├── api/                # API endpoints
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
├── lib/                    # Utility functions
├── types/                  # TypeScript interfaces
└── firebase/               # Firebase configuration
```

## 🚀 Getting Started

### Prasyarat
- Node.js 18+ dan npm/yarn/pnpm
- Firebase project setup
- Environment variables configured

### Instalasi

1. Clone repository:
```bash
git clone https://github.com/nbyl26/sistem-akademik.git
cd sistem-akademik
```

2. Install dependencies:
```bash
npm install
# atau
yarn install
# atau
pnpm install
```

3. Setup environment variables:
Buat file `.env.local` di root project:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Jalankan development server:
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

5. Buka [http://localhost:3000](http://localhost:3000) di browser

## 🔐 Autentikasi

Sistem menggunakan Firebase Authentication dengan cookie untuk sesi pengguna. Ada 3 role:
- **Admin**: Akses penuh ke semua fitur manajemen
- **Guru**: Akses input nilai dan absensi
- **Siswa**: Akses view nilai dan jadwal

## 📊 Fitur Perhitungan Nilai

Sistem ini menghitung nilai akhir siswa berdasarkan:
- **Persentase Tugas Harian**: Rata-rata nilai tugas harian
- **Persentase UTS**: Nilai ujian tengah semester
- **Persentase UAS**: Nilai ujian akhir semester
- **Persentase Absensi** (opsional): Persentase kehadiran siswa

Admin dapat mengatur persentase setiap komponen, dan siswa akan melihat nilai akhir yang dihitung otomatis.

**Formula**: 
```
Nilai Akhir = (Avg Tugas × Tugas%) + (UTS × UTS%) + (UAS × UAS%) + (Absensi × Absensi%)
```

## 📝 Lisensi

Proyek ini adalah bagian dari tugas akademik Semester 5 - Sistem Informasi.

## 👨‍💻 Developer

Dikembangkan oleh: nbyl26
                   AlifJian

---

Untuk informasi lebih lanjut, kunjungi [dokumentasi Next.js](https://nextjs.org/docs)
