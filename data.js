// ===== Konstanta =====
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const PRODI = { BD: 'Bisnis Digital', SD: 'Sains Data', INF: 'Informatika' };

// ===== Fungsi bantu =====

// Mengubah jam dari Excel menjadi teks "HH:MM".
// Bisa menerima "07:50", "07.50", atau jam bawaan Excel (angka pecahan).
function ubahJam(nilai) {
  if (typeof nilai === 'number' && nilai < 1) {
    const menit = Math.round(nilai * 1440);
    const jam = String(Math.floor(menit / 60)).padStart(2, '0');
    const sisa = String(menit % 60).padStart(2, '0');
    return jam + ':' + sisa;
  }
  const cocok = /^(\d{1,2})[.:](\d{2})/.exec(String(nilai).trim());
  return cocok ? cocok[1].padStart(2, '0') + ':' + cocok[2] : null;
}

// Menerima "L.2.1" atau "2.1", hasilnya selalu "L.2.1".
function ubahRuang(nilai) {
  let ruang = String(nilai).trim().toUpperCase();
  if (/^\d\.\d$/.test(ruang)) ruang = 'L.' + ruang;
  return /^L\.\d\.\d$/.test(ruang) ? ruang : null;
}

// Menerima "BD" atau "Bisnis Digital", hasilnya selalu kodenya ("BD").
function ubahProdi(nilai) {
  const teks = String(nilai).trim().toUpperCase();
  for (const kode in PRODI) {
    if (teks === kode || teks === PRODI[kode].toUpperCase()) return kode;
  }
  return '';   // kosong = belum diisi
}

// ===== Fungsi utama: membaca jadwal.xlsx =====
async function muatJadwal() {
  const respon = await fetch('jadwal.xlsx?v=' + Date.now());
  if (!respon.ok) {
    throw new Error('jadwal.xlsx tidak ditemukan (kode ' + respon.status + ')');
  }

  const buku = XLSX.read(await respon.arrayBuffer(), { type: 'array' });
  const lembar = buku.Sheets['Jadwal'] || buku.Sheets[buku.SheetNames[0]];
  const baris = XLSX.utils.sheet_to_json(lembar, { defval: '', raw: true });

  const jadwal = [];
  const dilewati = [];   // nomor baris Excel yang isinya tidak valid

  baris.forEach((b, i) => {
    const hari = HARI.findIndex(h => h.toLowerCase() === String(b['Hari']).trim().toLowerCase());
    const ruang = ubahRuang(b['Ruang']);
    const mulai = ubahJam(b['Jam Mulai']);
    const selesai = ubahJam(b['Jam Selesai']);
    const matkul = String(b['Mata Kuliah']).trim();

    // Baris dengan data wajib yang salah atau kosong dilewati
    if (hari < 0 || !ruang || !mulai || !selesai || !matkul || mulai >= selesai) {
      dilewati.push(i + 2);   // +2 karena baris 1 adalah judul kolom
      return;
    }

    jadwal.push({
      hari,                                    // 0 = Senin ... 5 = Sabtu
      ruang,
      mulai,
      selesai,
      matkul,
      dosen: String(b['Dosen']).trim(),
      prodi: ubahProdi(b['Prodi'])
    });
  });

  // Label semester dari sheet "Pengaturan", sel B1 (boleh tidak ada)
  const sel = buku.Sheets['Pengaturan'] && buku.Sheets['Pengaturan'].B1;
  const label = sel ? String(sel.v).trim() : '';

  return { jadwal, dilewati, label };
}