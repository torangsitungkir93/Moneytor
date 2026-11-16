# Catatan Perubahan — MoneyTor v1.5.0 dan MoneyTor Listrik v0.4.0

Dokumen ini untuk AI/developer lain yang menerima zip terbaru. Baca ini dulu sebelum mengubah kode.

## 1. Basis dan konteks
- **Zip asli (basis):** MoneyTor v1.4.1, PWA satu file (`index.html` ±100 KB, vanilla JS, tanpa build tool). File lain: `sw.js` (cache `moneytor-v12`), `manifest.json`, 4 ikon.
- **Zip ini:** basis di atas + **MoneyTor Listrik v0.4.0** + perubahan UI MoneyTor lama (bagian 3B, 3C, 3D). Versi aplikasi di UI dinaikkan **v1.4.1 menjadi v1.5.0** (chip di header dan teks di Pengaturan). Cache service worker dinaikkan ke `moneytor-v14`.
- **Aturan utama dari pemilik:** saat switch MoneyTor Listrik **OFF**, tampilan lama harus persis sama seperti zip asli. Semua kode baru diisolasi (lihat bagian 3).

## 2. Fitur MoneyTor Listrik
- Switch ada di Pengaturan lama (kartu paling atas, `#tgLk`). ON = seluruh UI lama disembunyikan dan diganti `#lk`. OFF dilakukan dari tab Atur milik Listrik (`#lkOff`).
- **Input = angka meter kWh kumulatif saat itu** (bukan kWh terpakai). Contoh: input 10547, 10 jam kemudian 10550 → pemakaian 3 kWh. Tanggal-jam otomatis `Date.now()` saat Simpan.
- Input pertama = titik awal (belum ada pemakaian). Angka lebih kecil dari input terakhir → dialog konfirmasi "meter diganti/reset"; jika ya, entri ditandai `r:1` dan selisih ke entri sebelumnya diabaikan.
- **Estimasi tagihan berjalan** = kWh sejak pembayaran terakhir × tarif. Tombol "Sudah bayar" menyimpan snapshot ke `lkPay` lalu estimasi mulai dari nol. Pembayaran bisa dihapus (riwayat → tab Pembayaran) sehingga hitungan kembali ke pembayaran sebelumnya.
- Layar: Beranda (cincin kWh bulan ini, tagihan berjalan, 4 kartu, grafik 14 hari, heat strip jam, 4 input terakhir), Riwayat (tab Meter / Pembayaran), Analisis (7/30 hari: total, rata-rata, tertinggi, terendah, banding periode lalu, per jam, per hari-minggu, temuan otomatis), Atur (switch, tema, tarif, target, data contoh, salin JSON/CSV, hapus data).
- **4 tema** (pilih di Atur): `volt` (gelap kuning, bawaan), `porselen` (terang), `grafit` (monokrom gelap), `zamrud` (zamrud + emas). Tema hanya memengaruhi dashboard Listrik, bukan MoneyTor lama.

## 2B. Saklar (matikan/hidupkan) di MoneyTor Listrik (v0.4.0)
- Pemilik mematikan saklar listrik kamar kost saat keluar. Beranda punya kartu **Saklar** (`#lkPw`) dengan tombol **Matikan** / **Hidupkan** (`#lkSwB`). Tombol membuka sheet yang sama dengan input meter (`lkSheet(true,'off'|'on')`); angka meter **opsional** (bila diisi, ikut tersimpan sebagai input meter pada waktu yang sama). Waktu dicatat otomatis.
- Data: `S.lkPw = [{id, ts, on, u, x?}]`; `on:0` = saklar dimatikan, `on:1` = dihidupkan. `lkOffIv()` mengubahnya menjadi interval mati (saklar yang masih mati berakhir di `Infinity`).
- Perhitungan: listrik di antara dua input meter hanya dialokasikan ke waktu menyala (`lkOnIv`, `lkModel`, `lkAlloc`). Jam mati bernilai 0 kWh. Contoh uji: meter 100 (24 jam lalu) → 104 (sekarang), mati 20 sampai 8 jam lalu → 0 kWh di jam mati, 1,333 kWh di 4 jam menyala sebelum mati, 2,667 kWh di 8 jam menyala sesudahnya.
- Riwayat punya tab **Meter | Saklar | Bayar** (segmen 3 tab; indikator memakai `--n` dan `--ix`). Tab Saklar menampilkan lama mati pada baris "Dihidupkan".
- Analisis punya kartu **Evaluasi saklar** (`lkSwCard`): waktu mati (jam, persen, jumlah keluar), rata-rata watt saat menyala, perkiraan hemat = jam mati × kWh/jam saat menyala × tarif, dan mati terlama.
- Data contoh kini ikut membuat catatan saklar (keluar kerja hari kerja + satu perjalanan 2 hari), semua bertanda `x:1`.
- Sinkron: koleksi baru `users/{uid}/kwpw/{id}` dengan `ts`, `on` (boolean), `d` (teks tanggal-jam), `upd`, `del`; tombstone dan aturan gabung sama dengan `kw`/`kwpay`.

## 3. Titik perubahan pada kode lama (semua di `index.html`, plus 1 di `sw.js`)
### 3A. Untuk MoneyTor Listrik
1. Sebelum `</style>`: blok CSS Listrik (diawali komentar `MoneyTor Listrik v0.2`). Semua selector berawalan `#lk`, `.lk-`, `.lkv`, `.lkb`, `html[data-lt]`, `body.lk-on`. Tambahan variabel `--lk-*` di `html`.
2. Di view Pengaturan lama, tepat setelah `<div class="pt">Pengaturan</div>`: satu kartu switch `#tgLk`.
3. Sebelum `<div class="scrim" id="scrim">`: seluruh markup `<div id="lk">` (4 section `#lk-home/#lk-hist/#lk-ana/#lk-set`, nav `.lk-nav`, sheet input `#lkSheet`, scrim `#lkScrim`). Sheet memakai kelas lama `.sheet` dan `.scrim`.
4. Sebelum baris inisialisasi `applyTheme(S.th);sets();home();report();setTimeout(tick,1200);`: blok JS Listrik (diawali `/* ===== MoneyTor Listrik v0.2 ===== */`, diakhiri `lkApply();`).
5. `applyTheme()`: `if(m)m.content=T[4]` → memakai `lkMeta()` bila `S.lkOn`.
6. `tick()` (pengingat catat pengeluaran): `if(!S.rOn)return;` → `if(!S.rOn||S.lkOn)return;`.
7. `sw.js`: `moneytor-v12` → `moneytor-v13`.
8. **Sinkron Firebase** (lihat bagian 9), 5 titik kecil:
   - `SETK` ditambah `'lkT','lkG','lkTh'` (tarif, target, tema ikut sinkron lewat `meta/settings` yang sudah ada).
   - `doSync()`: sebelum loop `commit` ditambah `lkSyncPart(...)` (menarik data listrik dari server dan menambah `W` untuk ditulis); setelah `commit` sukses ditambah `lkSyncDone(st)`; setelah refresh UI ditambah `lkAfterSync()`.
   - `syUI()`: ditambah `lkSy()` agar ikon awan dan info sinkron di dashboard Listrik ikut diperbarui.

### 3B. Perbaikan UI MoneyTor lama (diminta pemilik; berlaku di mode MoneyTor biasa)
1. **Autocomplete catatan:** `<div id="sug">` dipindah ke **bawah** kolom catatan (`#note`). Tampilannya daftar vertikal kecil (kelas `.sgr`, bukan chip `.chip.sg`), maksimal **3** saran (dulu 5), bagian yang cocok diketik ditebalkan. Setelah memilih saran, daftar disembunyikan sampai pengguna mengetik lagi (`sugOff`). CSS `.sug` diganti, fungsi `sugUpd()` dan handler `#sug`/`#note` disesuaikan.
2. **Pencarian (`srchR()`):** saat kolom cari kosong hanya **5 transaksi terbaru** + petunjuk "ketik untuk mencari" (muat tanpa scroll). Saat mengetik, tampil sampai 150 hasil seperti sebelumnya.

Saat `S.lkOn` true, `body.lk-on` menyembunyikan `#app`, `nav`, `#fx`, `#sheet`, `#srchSheet`, `#catSheet`, `#scrim`, `#scrim2`. Fungsi bantu lama yang dipakai ulang: `$`, `$$`, `pad`, `today`, `dayAdd`, `dLabel`, `rp`, `BLN`, `ask`, `toast`, `save`, `go`, `moveInd`, `THEMES`, `S`.

### 3C. Jenis grafik baru dan palet warna pie (MoneyTor lama, mode biasa)
**Jenis grafik** sebelumnya hanya pengaturan `Batang | Garis | Area` (`S.ct` = `bar|line|area`). Sekarang `Batang | Kumulatif | Heatmap` (`S.ct` = `bar|kum|heat`) dan **dipilih lewat satu tombol switch di Laporan** (`#ctb`, di atas grafik; tiap ketukan berganti Batang → Kumulatif → Heatmap). Pengaturan Jenis grafik di menu Pengaturan **sudah dihapus** (`#cseg` tidak ada lagi). Nilai lama `line`/`area` otomatis dianggap `bar` lewat `CT()`.
- **Kumulatif (`kum`)**: garis total kumulatif vs jalur target (garis putus-putus lurus dari 0 sampai target bulanan, `tgtFor(vy,vm)`) dan garis periode sebelumnya (titik-titik). Mode Bulan: per hari; Minggu: 7 hari (target dibagi jumlah hari bulan itu); Tahun: per bulan (jalur target = penjumlahan target tiap bulan). Garis berhenti di hari/bulan berjalan. Sentuh grafik untuk detail "Lebih/Hemat Rp X dari jalur target".
- **Heatmap (`heat`)**: kalender berwarna (awal minggu Senin) untuk Bulan, 7 kotak untuk Minggu, 12 kotak untuk Tahun. Intensitas relatif terhadap nilai terbesar pada periode itu. Hari/bulan yang belum terjadi diberi garis putus-putus. Sentuh kotak untuk jumlah dan, untuk pengeluaran bulanan, perbandingan dengan jatah harian (target dibagi jumlah hari).
- Keduanya **mengikuti toggle Pengeluaran/Pemasukan** (`rType`) di Laporan (pengeluaran memakai `--out`, pemasukan `--in`; garis target hanya untuk pengeluaran).
- Implementasi: `drawChart()` sekarang mendelegasikan ke `drawAlt()` bila `CT()!='bar'`; `altShow()` mengatur elemen mana yang tampil. Elemen HTML baru: `#mheat`, `#mclg`, `#yheat`, `#yclg`, `#ylg` (legenda lama diberi id). Semua SVG/HTML murni, tanpa library (aplikasi tetap offline).
- **Palet warna pie (`S.pp`)**: pengaturan baru "Warna pie chart" (`#pgrid`) dengan 7 palet: `bawaan` (COL lama, default), `pastel`, `cerah`, `tanah`, `laut`, `senja`, `mono` (turunan warna aksen tema aktif, dihitung dari `--acc`). `shade()` kini membaca `palOf()`; warna "Lainnya" tetap abu-abu. Semua nilai warna berupa hex karena callout donat memakainya di atribut SVG. `pp` ditambahkan ke `SETK` sehingga ikut sinkron.
- Titik patch (semuanya di `index.html`): CSS blok "Grafik baru" sebelum `</style>`; `shade`; `drawChart` (awal fungsi dan baris `ct=...`); `ctUI`; `sets()` (menambah `palUI()`); tombol `#cseg` dan teks keterangannya; blok HTML palet; tambahan `#mheat/#mclg/#yheat/#yclg/#ylg`; `SETK`.

### 3D. Perubahan Laporan dan Pengaturan MoneyTor (v1.5.0)
1. **Switch jenis grafik** `#ctb` di kartu grafik Laporan (lihat 3C). Pengaturan Jenis grafik dihapus.
2. **Kecualikan kategori dari grafik** (`S.xc` = array kunci `"out:Kost"`/`"in:Gaji"`): dipilih di Pengaturan → kartu Grafik → "Kecualikan kategori" (`#xgrid`, chip dicoret = dikecualikan). Berlaku untuk grafik **Batang dan Heatmap** (lewat filter `xf` pada tiga titik penyusun data di `report()`); **Kumulatif tetap menghitung semua** karena dibandingkan dengan target total. Donat dan daftar kategori tidak terpengaruh. Bila ada kategori dikecualikan, grafik menampilkan catatan "Tidak termasuk: …" dengan tautan Ubah (`#xnote`, `#xnoteY`).
3. **Kategori teratas pemasukan dihapus** dari Laporan (kartu `#topIn` dan baris `tp('in')`). Kartu pengeluaran terbanyak tetap.
4. **Tombol melayang naik/turun** (`#fud`, `#fuUp`, `#fuDn`): kapsul kecil di kanan layar, hanya tampil di Laporan (`body.rep-on`, diatur di `go()`), tombol yang tidak berlaku diredupkan (`fudS()`), scroll halus. Bisa di-on/off di Pengaturan → Grafik → "Tombol naik/turun" (`S.fb`, `false` = mati; bawaan aktif).
5. **Urutan Pengaturan**: kartu baru **Grafik** berisi Kecualikan kategori, Tombol naik/turun, dan Warna pie chart; kartu **Tema** dipindah tepat di bawahnya (sebelumnya di bagian bawah Pengaturan).
6. `SETK` ditambah `'pp','xc','fb'` (palet pie, kategori dikecualikan, tombol naik/turun ikut sinkron).
7. `go()` kini juga: mengatur `body.rep-on`, memanggil `xcUI()` saat membuka Pengaturan (agar kategori baru muncul), dan memperbarui status tombol melayang.
8. Versi: `v1.4.1` → `v1.5.0` (2 tempat), cache SW `moneytor-v14`.

## 4. Data tambahan (tersimpan di objek `S` yang sama, localStorage `dompet.v1`)
Disimpan lokal di `S` (localStorage `dompet.v1`) **dan disinkronkan ke Firebase** (bagian 9). Belum masuk backup/restore Excel.

```json
{
  "lkOn": true,
  "lkTh": "volt",
  "lkT": 1444.7,
  "lkG": 120,
  "kwv": 2,
  "kw": [
    { "id": "mw5gsc7w9bne", "ts": 1793999171804, "m": 10547 },
    { "id": "mw5gt5z4vrb1", "ts": 1794035171804, "m": 10550.5 },
    { "id": "mw5hq0aa1xyz", "ts": 1794100000000, "m": 5, "r": 1 },
    { "id": "mw5h0demo001", "ts": 1794110000000, "m": 12041.3, "x": 1 }
  ],
  "lkPw": [
    { "id": "mw8a1w2k9", "ts": 1794030000000, "on": 0, "u": 1794030000000 },
    { "id": "mw8b7w4x1", "ts": 1794065000000, "on": 1, "u": 1794065000000 }
  ],
  "lkPay": [
    { "id": "mw5hjlow0bbt", "ts": 1794000443792, "m": 10587.5, "k": 40.5, "c": 58510, "t": 1444.7 }
  ]
}
```
| Field | Arti |
|---|---|
| `lkOn` | switch MoneyTor Listrik (boolean) |
| `lkTh` | tema: `volt` / `porselen` / `grafit` / `zamrud` |
| `lkT` | tarif Rp per kWh (default 1444.7, bisa diubah) |
| `lkG` | target bulanan kWh (0 = nonaktif) |
| `kwv` | versi skema `kw`; 2 = angka meter |
| `kw[].id` | id unik |
| `kw[].ts` | waktu input, epoch ms (otomatis) |
| `kw[].m` | angka meter kWh (maks 2 desimal) |
| `kw[].r` | opsional: 1 = meter baru/reset (selisih ke entri sebelumnya tidak dihitung) |
| `kw[].x` | opsional: 1 = data contoh (bisa dihapus massal) |
| `lkPay[].ts` | waktu ditandai sudah bayar |
| `lkPay[].m` | angka meter terakhir saat itu |
| `lkPay[].k` | kWh pada siklus yang dibayar |
| `lkPay[].c` | estimasi Rp saat itu (`k` × tarif) |
| `lkPay[].t` | tarif yang dipakai |
| `lkPay[].x` | opsional: 1 = contoh |
| `kw[].u`, `lkPay[].u` | waktu perubahan terakhir (epoch ms), dipakai sinkron |
| `lkPw[].id/ts/on/u/x` | catatan saklar: `on` 0 = dimatikan, 1 = dihidupkan; `u` waktu ubah; `x` contoh |
| `xc` | array kategori yang dikecualikan dari grafik Batang/Heatmap, mis. `["out:Kost"]` |
| `fb` | `false` = tombol melayang naik/turun dimatikan |
| `pp` | id palet warna pie (`bawaan`, `pastel`, `cerah`, `tanah`, `laut`, `senja`, `mono`) |
| `ct` | jenis grafik Laporan: `bar` / `kum` / `heat` |
| `lkSy` | `{last, pushedAt}` penanda sinkron data listrik (lokal) |
| `lkTomb` | catatan penghapusan `{"kw:<id>": ts, "kwpay:<id>": ts}` agar penghapusan ikut tersinkron (lokal) |

Migrasi: bila `kwv` belum ada (data dari v0.1 yang kolomnya `k` = kWh terpakai), data contoh dibuang dan sisanya dijumlahkan berurutan menjadi angka meter, lalu `kwv=2`.

## 5. Algoritma inti (`lkModel`, `lkAlloc`, `lkCycle`)
1. Urutkan `kw` menurut `ts`. Tiap pasangan berurutan `(a,b)` jadi segmen `{f:a.ts, t:b.ts, k:b.m-a.m}`; dilewati jika `b.r`, `k<0`, atau `b.ts<=a.ts`.
2. Pemakaian tiap segmen **dibagi rata hanya sepanjang waktu saklar MENYALA** (jam saat saklar mati, lihat `lkPw`, dikeluarkan dari segmen; bila seluruh segmen jatuh pada jam mati, dipakai pembagian rata biasa sebagai cadangan) ke bucket per jam (`H[jamMulaiEpoch]`), lalu dijumlah ke total per hari (`g['YYYY-MM-DD']`). Semua grafik, rata-rata, proyeksi, dan pola jam berasal dari `H` dan `g`.
3. `lkAlloc(M,a,b)` = jumlah kWh segmen yang beririsan dengan waktu `[a,b]` (proporsional).
4. `lkCycle`: titik mulai = `ts` pembayaran terakhir (atau input pertama bila belum pernah bayar); kWh siklus = `lkAlloc(M, mulai, ∞)`; estimasi = kWh × `lkT`. Proyeksi 30 hari = (kWh/hari sejak mulai) × 30, baru tampil setelah ±6 jam data.
5. "Hari ini" hanya sampai jam input terakhir, karena pemakaian baru diketahui saat angka meter dimasukkan.

## 6. Sistem tema
- Variabel `--lk-bg, --lk-card, --lk-ink, --lk-mute, --lk-line, --lk-acc, --lk-ah, --lk-a2, --lk-on, --lk-cy, --lk-cy2, --lk-ok, --lk-warn, --lk-out, --lk-h1, --lk-h2, --lk-ring, --lk-heat, --lk-soft, --lk-dash, --lk-nav, --lk-shd, --lk-gl, --lk-g1, --lk-g2, --lk-grid` didefinisikan di `html` (volt) dan ditimpa oleh `html[data-lt="porselen|grafit|zamrud"]`.
- `#lk` memetakannya ke nama pendek (`--bg --card --ink --mute --line --acc --ah --a2 --onacc ...`) sehingga kelas lama (`.set`, `.tg`, `.btn2`, `input.nm`) otomatis ikut tema.
- Atribut `data-lt` dipasang oleh `lkTheme()`. **Jangan menulis warna hex di komponen** (kecuali daftar `LKTH` untuk pratinjau); pakai variabel.
- Menambah tema: tambahkan blok `html[data-lt="nama"]{...}` dan satu baris di array `LKTH` (id, nama, deskripsi, bg, card, line, acc, cy).

## 7. Cara menguji
Buka `index.html`, aktifkan switch di Pengaturan, Atur → "Isi contoh". Yang sudah dicek di browser headless (ukuran HP): tanpa error JS; selisih meter 10547→10550 = 3 kWh dan Rp 4.334 dengan tarif bawaan; konfirmasi meter lebih kecil; "Sudah bayar" membuat estimasi Rp 0 lalu naik lagi dari input berikutnya; 4 tema; mematikan switch mengembalikan tampilan lama.

## 8. Keterbatasan dan ide lanjutan
- Data listrik belum masuk backup/restore Excel (sinkron Firebase sudah ada).
- Pembayaran belum punya nominal aktual (hanya estimasi); belum ada biaya tetap/PPJ/pajak, dan belum ada tarif bertingkat.
- Grafik Kumulatif/Heatmap belum punya mode Hari (grafik memang disembunyikan di mode Hari).
- Daftar kecualikan kategori berlaku global untuk Batang dan Heatmap (belum per periode) dan tidak memengaruhi donat serta ringkasan.
- Saklar: bila saklar dimatikan tanpa angka meter dan dihidupkan lagi tanpa angka meter, alokasi jam mati hanya mengandalkan input meter sebelum/sesudahnya; mengisi angka meter saat menekan Matikan/Hidupkan membuat evaluasi lebih akurat.
- Entri meter belum bisa diedit (hanya hapus lalu input ulang).
- Font Space Grotesk dan JetBrains Mono dimuat lazy dari Google Fonts hanya saat mode Listrik ON; offline memakai font cadangan.
- Dialog konfirmasi (`ask`) dan toast tetap memakai tema MoneyTor lama.

## 9. Sinkron Firebase data listrik
- Memakai mekanisme yang sama dengan transaksi: REST Firestore, login email/password yang sudah ada, dipanggil dari `doSync()`. Setiap input meter, pembayaran, penghapusan, atau hapus-semua langsung memicu `doSync()` (`lkPush`) bila sudah masuk akun; selain itu mengikuti jadwal sinkron lama.
- **Koleksi baru** (di bawah `users/{uid}/`):
  - `kw/{id}`: `ts` (epoch ms), `m` (angka meter), `r` (boolean meter baru), `d` (teks tanggal-jam lokal `YYYY-MM-DD HH:mm:ss`, agar mudah dibaca di konsol Firebase), `upd` (epoch ms), `del` (boolean).
  - `kwpay/{id}`: `ts`, `m`, `k` (kWh), `c` (Rp), `t` (tarif), `d`, `upd`, `del`.
  - Penghapusan = dokumen tombstone `{upd, del:true}` (pola yang sama dengan `tx`).
- Pengaturan `lkT`, `lkG`, `lkTh` ikut lewat `meta/settings`. `lkOn` sengaja **tidak** disinkron (pilihan per perangkat).
- Data contoh (`x:1`) **tidak pernah** dikirim ke Firebase.
- Gabungan data: terbaru menang per dokumen berdasarkan `upd` / `u`. Login pertama di perangkat baru menarik semua data (`S.sync.fresh` mereset `S.lkSy`).
- Kegagalan sinkron data listrik **tidak menggagalkan** sinkron transaksi: error ditangkap di `lkSyncPart` dan ditampilkan di Atur dan di ikon awan dashboard Listrik (`lkSyErr`).
- **Aturan Firestore:** bila Rules membatasi per koleksi, tambahkan `kw` dan `kwpay`. Contoh yang mencakup semuanya:
```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
- Koleksi ketiga `kwpw` (catatan saklar) memakai pola yang sama; `lkSyncPart` memprosesnya dalam loop `[['kw','kw'],['kwpay','lkPay'],['kwpw','lkPw']]`.
- Pengujian: dua perangkat simulasi dengan Firestore palsu; input, bayar, tarik di perangkat kedua, hapus lalu propagasi, dan data contoh tidak terkirim semuanya lolos. Belum diuji terhadap Firebase asli.
