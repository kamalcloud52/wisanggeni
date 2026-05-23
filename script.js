const API_URL = "https://script.google.com/macros/s/AKfycbzrdqmCriKy7bx9DMKpfseybncuSDqUxjsKgl7g1_Lanb-CN_X0hGyi90n8F7NCCKpXiA/exec";

let localDataProduk = [];
let localRiwayatHarian = [];
let selectedProductData = null;

function tampilkanPopup(pesan, tipe = 'sukses') {
    const popup = document.getElementById('popup-kustom');
    const icon = document.getElementById('popup-icon');
    const pesanEl = document.getElementById('popup-pesan');
    if (tipe === 'sukses') icon.className = 'fa-solid fa-circle-check text-green-500 text-4xl mb-3';
    else if (tipe === 'gagal') icon.className = 'fa-solid fa-circle-xmark text-red-500 text-4xl mb-3';
    else icon.className = 'fa-solid fa-circle-info text-blue-500 text-4xl mb-3';
    pesanEl.textContent = pesan;
    popup.classList.remove('hidden');
    popup.style.display = 'flex';
}
function tutupPopup() { 
    const popup = document.getElementById('popup-kustom');
    popup.classList.add('hidden');
    popup.style.display = 'none';
}

function updateSapaan() {
    const jam = new Date().getHours();
    let sapaan = "Selamat Malam";
    if (jam >= 5 && jam < 12) sapaan = "Selamat Pagi";
    else if (jam >= 12 && jam < 15) sapaan = "Selamat Siang";
    else if (jam >= 15 && jam < 18) sapaan = "Selamat Sore";
    const el = document.getElementById('sapaan-text');
    if (el) el.innerText = `${sapaan}, Faza 👋🏻`;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabName).classList.remove('hidden');
    const titles = { dashboard: 'Dashboard', produk: 'Manajemen Data Stok', transaksi: 'Pencatatan Keuangan' };
    document.getElementById('page-title').innerText = titles[tabName];
    if (tabName === 'transaksi') { resetFormTransaksiSelection(); ubahFormTransaksi(); }
    if (tabName === 'dashboard') updateSapaan();
}

async function muatSemuaData() {
    try {
        const respon = await fetch(API_URL);
        const data = await respon.json();
        localDataProduk = data.produk || [];
        renderTabelProduk(localDataProduk);
        renderDashboard(data.ringkasan, data.terlaris, localDataProduk, data.riwayat_harian);
    } catch (error) {
        document.getElementById('tbody-produk').innerHTML = '<tr><td colspan="7" class="text-center text-red-500">Gagal memuat data</td></tr>';
    }
}

function renderTabelProduk(arrayData) {
    const tbody = document.getElementById('tbody-produk');
    if (!tbody) return;
    if (arrayData.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada produk</td></tr>'; return; }
    tbody.innerHTML = '';
    arrayData.forEach((item, idx) => {
        const stokBadge = item.stok <= 5 ? `<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">Sisa ${item.stok}</span>` : `<span class="bg-gray-100 px-2 py-0.5 rounded-full text-xs">${item.stok}</span>`;
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="px-4 py-3 text-center">${idx+1}</td>
            <td class="px-4 py-3"><div class="flex items-center gap-3"><img src="${item.gambar}" class="w-10 h-10 object-cover rounded" onerror="this.src='https://placehold.co/40x40?text=📦'"><div><p class="font-bold">${escapeHtml(item.nama_produk)}</p><p class="text-xs text-gray-500">Warna: ${escapeHtml(item.warna)}</p></div></div></td>
            <td class="px-4 py-3"><span class="bg-gray-100 px-2 py-1 rounded text-xs font-mono">${escapeHtml(item.kode)}</span></td>
            <td class="px-4 py-3">${escapeHtml(item.size)}</td>
            <td class="px-4 py-3 font-bold text-teal-600">Rp ${Number(item.harga_jual).toLocaleString()}</td>
            <td class="px-4 py-3 text-xs text-gray-500">Rp ${Number(item.modal).toLocaleString()}</td>
            <td class="px-4 py-3">${stokBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderDashboard(ringkasan, terlaris, produk, riwayatHarian) {
    localRiwayatHarian = riwayatHarian || [];
    if (ringkasan) {
        document.getElementById('dash-pemasukan').innerText = `Rp ${ringkasan.hari_ini.pemasukan.toLocaleString()}`;
        document.getElementById('dash-pengeluaran').innerText = `Rp ${ringkasan.hari_ini.pengeluaran.toLocaleString()}`;
        document.getElementById('dash-terjual').innerHTML = `${ringkasan.hari_ini.stok_terjual} pcs`;
        document.getElementById('dash-pemasukan-bulan').innerText = `Rp ${ringkasan.bulan_ini.pemasukan.toLocaleString()}`;
        document.getElementById('dash-pengeluaran-bulan').innerText = `Rp ${ringkasan.bulan_ini.pengeluaran.toLocaleString()}`;
        document.getElementById('dash-kas').innerText = `Rp ${ringkasan.kas_sekarang.toLocaleString()}`;
    }
    const divTerlaris = document.getElementById('list-terlaris');
    divTerlaris.innerHTML = '';
    if (terlaris && terlaris.length) terlaris.forEach(item => { divTerlaris.innerHTML += `<div class="flex justify-between"><span>${item.nama}</span><span class="bg-orange-100 px-2 rounded">${item.total_jual} terjual</span></div>`; });
    else divTerlaris.innerHTML = '<i>Belum ada penjualan</i>';
    const divMenipis = document.getElementById('list-menipis');
    divMenipis.innerHTML = '';
    const kritis = produk.filter(p => p.stok <= 5);
    if (kritis.length) kritis.forEach(p => { divMenipis.innerHTML += `<div class="flex justify-between"><span>${p.nama_produk}</span><span class="bg-red-100 px-2 rounded">Sisa ${p.stok}</span></div>`; });
    else divMenipis.innerHTML = '<i class="text-green-600">Stok aman</i>';
}

function cariProduk() {
    const keyword = document.getElementById('cari-produk').value.toLowerCase();
    renderTabelProduk(localDataProduk.filter(p => p.nama_produk.toLowerCase().includes(keyword) || p.kode.toLowerCase().includes(keyword)));
}

// ========== MODAL SELECT PRODUK (DIPERBAIKI) ==========
function bukaSelectProduk() {
    const modal = document.getElementById('modal-select-produk');
    if (!modal) return;
    // Pastikan data produk sudah ada
    if (!localDataProduk.length) {
        tampilkanPopup("Data produk belum dimuat, tunggu sebentar", "info");
        muatSemuaData().then(() => bukaSelectProduk());
        return;
    }
    // Isi daftar produk
    renderListSelectProduk(localDataProduk);
    // Tampilkan modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    // Bersihkan input cari
    const inputCari = document.getElementById('cari-select-produk');
    if (inputCari) inputCari.value = '';
}

function tutupSelectProduk() {
    const modal = document.getElementById('modal-select-produk');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function renderListSelectProduk(dataArray) {
    const container = document.getElementById('list-select-produk-container');
    if (!container) return;
    container.innerHTML = '';
    if (!dataArray.length) {
        container.innerHTML = '<div class="text-center text-gray-400 p-4">Tidak ada produk</div>';
        return;
    }
    dataArray.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = () => pilihProduk(p.kode);
        btn.className = 'w-full text-left p-3 bg-white hover:bg-teal-50 rounded-xl flex items-center justify-between border shadow-sm';
        btn.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${p.gambar}" class="w-10 h-10 object-cover rounded" onerror="this.src='https://placehold.co/40x40?text=📦'">
                <div><p class="font-bold">${escapeHtml(p.nama_produk)}</p><p class="text-xs text-gray-500">${p.kode} | Size: ${p.size}</p></div>
            </div>
            <div class="text-right"><span class="text-xs font-bold ${p.stok <= 5 ? 'text-red-600' : 'text-gray-600'}">Stok: ${p.stok}</span><p class="text-teal-600 font-bold">Rp ${Number(p.harga_jual).toLocaleString()}</p></div>
        `;
        container.appendChild(btn);
    });
}

function filterSelectProduk() {
    const keyword = document.getElementById('cari-select-produk').value.toLowerCase();
    const filtered = localDataProduk.filter(p => p.nama_produk.toLowerCase().includes(keyword) || p.kode.toLowerCase().includes(keyword));
    renderListSelectProduk(filtered);
}

function pilihProduk(kode) {
    const produk = localDataProduk.find(p => p.kode === kode);
    if (produk) {
        selectedProductData = produk;
        document.getElementById('trx-produk').value = produk.kode;
        document.getElementById('btn-select-produk').innerHTML = `${produk.nama_produk} (${produk.kode}) <i class="fa-solid fa-chevron-down"></i>`;
        tutupSelectProduk();
        isiHargaOtomatis();
    }
}
// ========== AKHIR PERBAIKAN ==========

function bukaSelectTipe() {
    const modal = document.getElementById('modal-select-tipe');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}
function tutupSelectTipe() {
    const modal = document.getElementById('modal-select-tipe');
    modal.classList.add('hidden');
    modal.style.display = 'none';
}
function pilihTipe(val, label) {
    document.getElementById('trx-tipe').value = val;
    document.getElementById('btn-select-tipe').innerHTML = `${label} <i class="fa-solid fa-chevron-down"></i>`;
    tutupSelectTipe();
    resetFormTransaksiSelection();
    ubahFormTransaksi();
}

function resetFormTransaksiSelection() {
    selectedProductData = null;
    document.getElementById('trx-produk').value = "";
    document.getElementById('btn-select-produk').innerHTML = '-- Pilih Produk -- <i class="fa-solid fa-chevron-down"></i>';
    document.getElementById('harga-satuan-text').textContent = '-';
    document.getElementById('trx-harga-satuan').value = '';
    document.getElementById('trx-harga-jual-baru').value = '';
    document.getElementById('trx-jumlah').value = "";
    document.getElementById('trx-keterangan').value = "";
    document.getElementById('harga-satuan-text').classList.remove('hidden');
    document.getElementById('trx-harga-satuan').classList.add('hidden');
    document.getElementById('box-harga-jual-baru').classList.add('hidden');
}

function ubahFormTransaksi() {
    const tipe = document.getElementById('trx-tipe').value;
    const boxProduk = document.getElementById('box-produk');
    const jumlahInput = document.getElementById('trx-jumlah');
    const spanHarga = document.getElementById('harga-satuan-text');
    const inputHarga = document.getElementById('trx-harga-satuan');
    const boxHargaJual = document.getElementById('box-harga-jual-baru');
    if (tipe === 'Pengeluaran Lain') {
        boxProduk.classList.add('hidden');
        jumlahInput.readOnly = false;
        jumlahInput.className = "w-full p-2 border rounded-lg bg-white";
        document.getElementById('trx-keterangan').placeholder = "Contoh: Beli bensin";
        spanHarga.classList.add('hidden');
        inputHarga.classList.add('hidden');
        boxHargaJual.classList.add('hidden');
    } else if (tipe === 'Penjualan') {
        boxProduk.classList.remove('hidden');
        jumlahInput.readOnly = true;
        jumlahInput.className = "w-full p-2 border rounded-lg bg-gray-100";
        spanHarga.classList.remove('hidden');
        inputHarga.classList.add('hidden');
        boxHargaJual.classList.add('hidden');
        isiHargaOtomatis();
    } else if (tipe === 'Pembelian Stok') {
        boxProduk.classList.remove('hidden');
        jumlahInput.readOnly = true;
        jumlahInput.className = "w-full p-2 border rounded-lg bg-gray-100";
        spanHarga.classList.add('hidden');
        inputHarga.classList.remove('hidden');
        boxHargaJual.classList.remove('hidden');
        if (selectedProductData) {
            inputHarga.value = selectedProductData.modal;
            document.getElementById('trx-harga-jual-baru').value = selectedProductData.harga_jual;
        } else {
            inputHarga.value = '';
        }
        hitungTotal();
    }
}

function isiHargaOtomatis() {
    const tipe = document.getElementById('trx-tipe').value;
    const spanHarga = document.getElementById('harga-satuan-text');
    if (selectedProductData && tipe === 'Penjualan') {
        spanHarga.textContent = `Rp ${Number(selectedProductData.harga_jual).toLocaleString()}`;
    } else {
        spanHarga.textContent = '-';
    }
    hitungTotal();
}

function hitungTotal() {
    const tipe = document.getElementById('trx-tipe').value;
    if (tipe === 'Pengeluaran Lain') return;
    const qty = Number(document.getElementById('trx-qty').value) || 0;
    let hargaSatuan = 0;
    if (tipe === 'Penjualan' && selectedProductData) hargaSatuan = selectedProductData.harga_jual;
    else if (tipe === 'Pembelian Stok') hargaSatuan = Number(document.getElementById('trx-harga-satuan').value) || 0;
    const total = qty * hargaSatuan;
    document.getElementById('trx-jumlah').value = total || '';
    if (selectedProductData) {
        const nama = selectedProductData.nama_produk;
        if (tipe === 'Penjualan') document.getElementById('trx-keterangan').value = `Jual ${nama} ${qty} pcs`;
        else if (tipe === 'Pembelian Stok') document.getElementById('trx-keterangan').value = `Beli ${nama} ${qty} pcs`;
    }
}

async function simpanTransaksi(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.innerText = "Menyimpan..."; btn.disabled = true;
    const tipe = document.getElementById('trx-tipe').value;
    const kodeProduk = document.getElementById('trx-produk').value;
    const qty = tipe !== 'Pengeluaran Lain' ? Number(document.getElementById('trx-qty').value) : 0;
    const jumlah = Number(document.getElementById('trx-jumlah').value);
    const keterangan = document.getElementById('trx-keterangan').value;
    let hargaSatuan = null, hargaJualBaru = null;
    if (tipe === 'Pembelian Stok') {
        hargaSatuan = Number(document.getElementById('trx-harga-satuan').value) || 0;
        const jualBaru = document.getElementById('trx-harga-jual-baru').value.trim();
        if (jualBaru !== '') hargaJualBaru = Number(jualBaru);
    }
    if (tipe !== 'Pengeluaran Lain' && !kodeProduk) {
        tampilkanPopup("Pilih produk dulu", "gagal");
        btn.innerText = "Simpan"; btn.disabled = false;
        return;
    }
    const payload = { action: "addTransaksi", tipe, kode_produk: kodeProduk, qty, jumlah, keterangan, harga_satuan: hargaSatuan, harga_jual_baru: hargaJualBaru };
    try {
        const response = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await response.text();
        if (result.includes("ERROR")) throw new Error(result);
        tampilkanPopup("Transaksi tersimpan!", "sukses");
        document.getElementById('form-transaksi').reset();
        resetFormTransaksiSelection();
        switchTab('dashboard');
        muatSemuaData();
    } catch (error) {
        tampilkanPopup(error.message, "gagal");
    }
    btn.innerText = "Simpan"; btn.disabled = false;
}

async function simpanProduk(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.innerText = "Menyimpan..."; btn.disabled = true;
    const payload = {
        action: "addProduk",
        nama_produk: document.getElementById('prod-nama').value,
        kode: document.getElementById('prod-kode').value,
        gambar: document.getElementById('prod-gambar').value,
        size: document.getElementById('prod-size').value,
        warna: document.getElementById('prod-warna').value,
        modal: document.getElementById('prod-modal').value,
        harga_jual: document.getElementById('prod-jual').value,
        stok: document.getElementById('prod-stok').value
    };
    try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        tampilkanPopup("Produk ditambahkan!", "sukses");
        document.getElementById('form-produk').reset();
        tutupModalProduk();
        muatSemuaData();
    } catch (error) {
        tampilkanPopup("Gagal simpan produk", "gagal");
    }
    btn.innerText = "Simpan"; btn.disabled = false;
}

function bukaModalProduk() { document.getElementById('modal-produk').classList.remove('hidden'); document.getElementById('modal-produk').style.display = 'flex'; }
function tutupModalProduk() { document.getElementById('modal-produk').classList.add('hidden'); document.getElementById('modal-produk').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', () => {
    updateSapaan();
    muatSemuaData();
    switchTab('dashboard');
});
