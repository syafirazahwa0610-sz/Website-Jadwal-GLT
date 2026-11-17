# Jadwal Lab GLT

Web statis (tanpa server khusus dan tanpa database). Jadwal dibaca dari `jadwal.xlsx` di folder yang sama.

## Isi folder
- `index.html` : seluruh tampilan dan logika (HTML, CSS, JavaScript dalam satu file)
- `jadwal.xlsx` : sumber data jadwal (sheet `Jadwal`, label semester di sheet `Pengaturan` sel B1)

## Menjalankan di komputer sendiri
Browser memblokir pembacaan file lokal bila `index.html` dibuka dengan klik ganda, jadi jalankan server sederhana:

    cd glt-jadwal
    python3 -m http.server 8000

Lalu buka http://localhost:8000

## Memasang agar bisa dibuka mahasiswa
Unggah seluruh isi folder ke hosting statis, misalnya server kampus, GitHub Pages, atau Netlify (seret dan lepas folder). Setelah itu buat QR code dari alamat webnya dan tempel di pintu lab atau lobi GLT.

## Memperbarui jadwal setiap semester
1. Isi sheet `Jadwal` di `jadwal.xlsx` dengan kolom: Hari, Ruang, Jam Mulai, Jam Selesai, Mata Kuliah, Dosen, Prodi (Catatan boleh dikosongkan).
2. Ubah label semester di sheet `Pengaturan`, sel B1.
3. Ganti file `jadwal.xlsx` di hosting dengan versi baru. Selesai.

Aturan isian: Hari = Senin sampai Sabtu. Ruang = `L.2.1` (atau `2.1`). Jam = `07:50` atau `07.50`. Prodi = BD, SD, atau INF. Baris dengan hari, ruang, jam, atau mata kuliah yang tidak valid dilewati; daftar barisnya tampil di console browser (F12).

## Catatan
- Jika `jadwal.xlsx` gagal dibaca, web memakai salinan jadwal yang tertanam di `index.html` (data awal semester ini).
- Perpustakaan SheetJS dimuat dari cdnjs, jadi perangkat perlu terhubung ke internet.
- `jadwal.xlsx` bisa diunduh siapa saja yang tahu alamatnya. Jangan isi data pribadi di dalamnya.
- Web tidak mencakup jam pengganti dan jam kosong.
