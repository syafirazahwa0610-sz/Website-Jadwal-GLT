// ===== Data yang sedang dipakai halaman =====
const state = {
  hari: 0,        // 0 = Senin ... 5 = Sabtu
  ruang: '',      // contoh: 'L.2.1'
  cari: '',
  jadwal: []
};

// ===== Hari ini dan urutan chip =====
function hariIni() {
  const g = new Date().getDay();      // 0 = Minggu, 1 = Senin, ... 6 = Sabtu
  return g === 0 ? 0 : g - 1;         // Minggu dianggap Senin (tidak ada jadwal Minggu)
}

// Dimulai dari hari ini, lalu berputar. Contoh hari Selasa:
// Selasa, Rabu, Kamis, Jumat, Sabtu, Senin
function urutanHari() {
  const awal = hariIni();
  return [0, 1, 2, 3, 4, 5].map(i => (awal + i) % 6);
}

// ===== Membuat chip =====
function buatChipHari() {
  const wadah = document.getElementById('hari');
  wadah.innerHTML = '';
  urutanHari().forEach(idx => {
    const tombol = document.createElement('button');
    tombol.className = 'chip';
    tombol.textContent = HARI[idx];
    tombol.dataset.hari = idx;
    tombol.onclick = () => { state.hari = idx; tampilkan(); };
    wadah.appendChild(tombol);
  });
}

function buatChipLab() {
  // Daftar ruang diambil dari jadwal, tanpa duplikat, diurutkan
  const daftarRuang = [...new Set(state.jadwal.map(s => s.ruang))].sort();
  if (!daftarRuang.includes(state.ruang)) state.ruang = daftarRuang[0] || '';

  const wadah = document.getElementById('lab');
  wadah.innerHTML = '';
  daftarRuang.forEach(ruang => {
    const tombol = document.createElement('button');
    tombol.className = 'chip kecil';
    tombol.textContent = ruang.slice(2);          // 'L.2.1' tampil '2.1'
    tombol.dataset.ruang = ruang;
    tombol.onclick = () => { state.ruang = ruang; tampilkan(); };
    wadah.appendChild(tombol);
  });
}

// ===== Kartu jadwal =====

// "07:50" -> "07.50" (sesuai tulisan di desain)
function jamTeks(jam) {
  return jam.replace(':', '.');
}

// "07:50" -> 470 (menit sejak tengah malam, untuk membandingkan jam)
function menit(jam) {
  const [j, m] = jam.split(':');
  return Number(j) * 60 + Number(m);
}

// Membuat satu elemen HTML dengan kelas dan teks.
// Memakai textContent, jadi isi Excel tidak akan dibaca sebagai kode HTML.
function el(tag, kelas, teks) {
  const e = document.createElement(tag);
  if (kelas) e.className = kelas;
  if (teks !== undefined) e.textContent = teks;
  return e;
}

function buatKartu(sesi, sedangBerlangsung, tampilLab) {
  const kartu = el('div', 'kartu' + (sedangBerlangsung ? ' sekarang' : ''));

  const baris1 = el('div', 'baris1');
    baris1.appendChild(el('span', '',
        HARI[sesi.hari] + ', ' + jamTeks(sesi.mulai) + ' - ' + jamTeks(sesi.selesai) +
        (tampilLab ? ' · Lab ' + sesi.ruang.slice(2) : '')));
  baris1.appendChild(el('span', '', PRODI[sesi.prodi] || '-'));

  kartu.appendChild(baris1);
  kartu.appendChild(el('div', 'matkul', sesi.matkul));
  kartu.appendChild(el('div', 'dosen', sesi.dosen || 'Dosen belum terisi'));
  return kartu;
}

function tampilkanDaftar() {
  const wadah = document.getElementById('daftar');
  wadah.innerHTML = '';

  // Sesi untuk hari dan lab yang dipilih, diurutkan dari jam paling pagi
  const sesi = state.jadwal
    .filter(s => s.hari === state.hari && s.ruang === state.ruang)
    .sort((a, b) => a.mulai.localeCompare(b.mulai));

  if (sesi.length === 0) {
    wadah.appendChild(el('div', 'kosong', 'Tidak Ada Jadwal Tercantum'));
    return;
  }

  // Penanda "sedang berlangsung" hanya berlaku bila hari yang dilihat = hari ini
  const sekarang = new Date();
  const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
  const lihatHariIni = state.hari === hariIni();

  sesi.forEach(s => {
    const berlangsung = lihatHariIni &&
      menit(s.mulai) <= menitSekarang && menitSekarang < menit(s.selesai);
    wadah.appendChild(buatKartu(s, berlangsung));
  });
}

// ===== Pencarian =====

// Cocok dengan jam. "10.20" = sesi yang sedang berjalan pada 10:20.
// "13" = sesi yang bersinggungan dengan pukul 13.00 - 13.59.
function jamCocok(s, kata) {
  const k = kata.replace('.', ':');
  if (/^\d{1,2}:\d{2}$/.test(k)) {
    const t = menit(k.padStart(5, '0'));
    return menit(s.mulai) <= t && t < menit(s.selesai);
  }
  if (/^\d{1,2}$/.test(kata)) {
    const j = Number(kata) * 60;
    return menit(s.mulai) < j + 60 && menit(s.selesai) > j;
  }
  return false;
}

// Satu kata kunci dicocokkan ke semua kolom
function cocok(s, kata) {
  // "bd", "sd", "inf" hanya dicocokkan ke prodi, supaya tidak
  // ikut menemukan nama dosen yang kebetulan memuat huruf itu
  if (PRODI[kata.toUpperCase()]) return s.prodi === kata.toUpperCase();

  return HARI[s.hari].toLowerCase().includes(kata) ||
    jamCocok(s, kata) ||
    s.dosen.toLowerCase().includes(kata) ||
    s.matkul.toLowerCase().includes(kata) ||
    (PRODI[s.prodi] || '').toLowerCase().includes(kata) ||
    s.ruang.slice(2) === kata;        // "2.1" -> Lab 2.1
}

function tampilkanHasil(kata) {
  const wadah = document.getElementById('daftar');
  wadah.innerHTML = '';

  // Beberapa kata dipisah spasi, semuanya harus cocok. Contoh: "kamis soleh"
  const daftarKata = kata.split(/\s+/);
  const urut = urutanHari();            // hasil diurutkan mulai dari hari ini
  const hasil = state.jadwal
    .filter(s => daftarKata.every(k => cocok(s, k)))
    .sort((a, b) => urut.indexOf(a.hari) - urut.indexOf(b.hari) ||
                    a.mulai.localeCompare(b.mulai));

  wadah.appendChild(el('div', 'jumlah', hasil.length + ' jadwal ditemukan'));
  if (hasil.length === 0) {
    wadah.appendChild(el('div', 'kosong', 'Tidak ada hasil'));
    return;
  }
  hasil.forEach(s => wadah.appendChild(buatKartu(s, false, true)));
}

// ===== Menampilkan pilihan yang aktif =====
function tampilkan() {
  const kata = state.cari.trim().toLowerCase();

  // Saat mencari, chip hari dan lab disembunyikan
  document.getElementById('hari').hidden = !!kata;
  document.getElementById('lab').hidden = !!kata;

  if (kata) {
    tampilkanHasil(kata);
    return;
  }

  document.querySelectorAll('#hari .chip').forEach(c => {
    c.classList.toggle('aktif', Number(c.dataset.hari) === state.hari);
  });
  document.querySelectorAll('#lab .chip').forEach(c => {
    c.classList.toggle('aktif', c.dataset.ruang === state.ruang);
  });
  tampilkanDaftar();
}

document.getElementById('cari').addEventListener('input', e => {
  state.cari = e.target.value;
  tampilkan();
});

// ===== Mulai =====
muatJadwal()
  .then(data => {
    state.jadwal = data.jadwal;
    state.hari = hariIni();
    if (data.label) document.getElementById('label').textContent = data.label;
    buatChipHari();
    buatChipLab();
    tampilkan();
  })
  .catch(err => {
    document.getElementById('daftar').textContent = 'Gagal memuat jadwal: ' + err.message;
  });