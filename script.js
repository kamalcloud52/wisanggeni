const API_URL = "https://script.google.com/macros/s/AKfycbzrdqmCriKy7bx9DMKpfseybncuSDqUxjsKgl7g1_Lanb-CN_X0hGyi90n8F7NCCKpXiA/exec";

let localDataProduk = [];
let localRiwayatHarian = [];
let selectedProductData = null;

function tampilkanPopup(pesan, tipe = 'sukses') {
    const popup = document.getElementById('popup-kustom');
    const icon = document.getElementById('popup-icon');
    const pesanEl = document.getElementById('popup-pesan');
    if (tipe === 'sukses') icon.className = 'fa-solid fa-circle-check text-green-500 text-4xl mb-3 block';
    else if (tipe === 'gagal') icon.className = 'fa-solid fa-circle-xmark text-red-500 text-4xl mb-3 block';
    else icon.className = 'fa-solid fa-circle-info text-blue-500 text-4xl mb-3 block';
    pesanEl.textContent = pesan;
    popup.classList.remove('hidden');
}
function tutupPopup() { document.getElementById('popup-kustom').classList.add('hidden'); }

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
    const titles = { 'dashboard': 'Dashboard', 'produk': 'Manajemen Data Stok', 'transaksi': 'Pencatatan Keuangan' };
    document.getElementById('page-title').innerText = titles[tabName];

    ['dashboard', 'produk', 'transaksi'].forEach(t => {
        const btn = document.getElementById('btn-' + t);
        if (t === tabName) btn.className = "w-full flex items-center gap-3 px-4 py-3 bg-teal-600 rounded-lg text-white font-medium transition";
        else btn.className = "w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition";
    });
    ['dashboard', 'produk', 'transaksi'].forEach(t => {
        const mobBtn = document.getElementById('mob-btn-' + t);
        if (t === tabName) mobBtn.className = "flex flex-col items-center text-xs font-medium p-2 rounded-lg transition-colors text-teal-400";
        else mobBtn.className = "flex flex-col items-center text-xs font-medium p-2 rounded-lg transition-colors text-slate-400";
    });

    if (tabName === 'transaksi') {
        resetFormTransaksiSelection();
        ubahFormTransaksi();
    }
    if (tabName === 'dashboard') updateSapaan();
}

async function muatSemuaData() {
    try {
        const respon = await fetch(API_URL);
        const data = await respon.json();
        localDataProduk = data.produk || [];
        renderTabelProduk(localDataProduk);
        renderDashboard(data.ringkasan, data.terlaris, localDataProduk, data.riwayat_harian);
        return true;
    } catch (error) {
        console.error("Koneksi gagal:", error);
        const tbody = document.getElementById('tbody-produk');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 font-medium p-8">Gagal memuat data. Periksa jaringan internet atau URL API.</td></tr>`;
        return false;
    }
}

function renderTabelProduk(arrayData) {
    const tbody = document.getElementById('tbody-produk');
    if (!tbody) return;
    
    if(arrayData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400 italic">Belum ada data barang.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    arrayData.forEach((item, index) => {
        let stokBadge = '';
        if (item.stok <= 5) {
            stokBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Sisa ${item.stok}</span>`;
        } else {
            stokBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">${item.stok}</span>`;
        }
        
        const hargaJualFormatted = `Rp ${Number(item.harga_jual).toLocaleString('id-ID')}`;
        const modalFormatted = `Rp ${Number(item.modal).toLocaleString('id-ID')}`;
        const namaProduk = item.nama_produk || '-';
        const warnaProduk = item.warna || '-';
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition duration-150";
        
        const tdNo = document.createElement('td');
        tdNo.className = "px-4 py-4 text-sm text-gray-500 text-center";
        tdNo.textContent = index + 1;
        tr.appendChild(tdNo);
        
        const tdProduk = document.createElement('td');
        tdProduk.className = "px-4 py-4";
        tdProduk.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${item.gambar}" class="w-12 h-12 object-cover rounded-lg bg-gray-100 shadow-sm flex-shrink-0" onerror="this.src='https://placehold.co/48x48?text=📦'">
                <div>
                    <p class="font-bold text-gray-800 text-sm">${escapeHtml(namaProduk)}</p>
                    <p class="text-xs text-gray-500 mt-0.5">Warna: ${escapeHtml(warnaProduk)}</p>
                </div>
            </div>
        `;
        tr.appendChild(tdProduk);
        
        const tdKode = document.createElement('td');
        tdKode.className = "px-4 py-4";
        tdKode.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">${escapeHtml(item.kode)}</span>`;
        tr.appendChild(tdKode);
        
        const tdSize = document.createElement('td');
        tdSize.className = "px-4 py-4 text-sm text-gray-600";
        tdSize.textContent = item.size || '-';
        tr.appendChild(tdSize);
        
        const tdHargaJual = document.createElement('td');
        tdHargaJual.className = "px-4 py-4 text-sm font-bold text-teal-600";
        tdHargaJual.textContent = hargaJualFormatted;
        tr.appendChild(tdHargaJual);
        
        const tdModal = document.createElement('td');
        tdModal.className = "px-4 py-4 text-xs text-gray-500";
        tdModal.textContent = modalFormatted;
        tr.appendChild(tdModal);
        
        const tdStok = document.createElement('td');
        tdStok.className = "px-4 py-4";
        tdStok.innerHTML = stokBadge;
        tr.appendChild(tdStok);
        
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

    if(ringkasan) {
        document.getElementById('dash-pemasukan').innerText = `Rp ${Number(ringkasan.hari_ini.pemasukan).toLocaleString('id-ID')}`;
        document.getElementById('dash-pengeluaran').innerText = `Rp ${Number(ringkasan.hari_ini.pengeluaran).toLocaleString('id-ID')}`;
        document.getElementById('dash-terjual').innerHTML = `${ringkasan.hari_ini.stok_terjual} <span class="text-xs font-normal text-gray-500">pcs</span>`;
        document.getElementById('dash-pemasukan-bulan').innerText = `Rp ${Number(ringkasan.bulan_ini.pemasukan).toLocaleString('id-ID')}`;
        document.getElementById('dash-pengeluaran-bulan').innerText = `Rp ${Number(ringkasan.bulan_ini.pengeluaran).toLocaleString('id-ID')}`;
        document.getElementById('dash-kas').innerText = `Rp ${Number(ringkasan.kas_sekarang).toLocaleString('id-ID')}`;
    }
    
    const divTerlaris = document.getElementById('list-terlaris');
    divTerlaris.innerHTML = '';
    if(terlaris && terlaris.length > 0) {
        terlaris.forEach(item => {
            divTerlaris.insertAdjacentHTML('beforeend', `
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-2 md:gap-3">
                        <div class="w-7 h-7 bg-teal-50 text-teal-600 rounded flex items-center justify-center font-bold text-xs"><i class="fa-solid fa-star"></i></div>
                        <div><p class="font-semibold text-gray-800 text-sm">${escapeHtml(item.nama)}</p><p class="text-xs text-gray-400">Kode: ${escapeHtml(item.kode)}</p></div>
                    </div>
                    <span class="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">${item.total_jual} Terjual</span>
                </div>
            `);
        });
    } else { divTerlaris.innerHTML = '<p class="text-gray-400 italic text-sm">Belum ada penjualan bulan ini.</p>'; }

    const divMenipis = document.getElementById('list-menipis');
    divMenipis.innerHTML = '';
    const produkKritis = produk.filter(p => Number(p.stok) <= 5);
    if(produkKritis.length > 0) {
        produkKritis.forEach(item => {
            divMenipis.insertAdjacentHTML('beforeend', `
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-2 md:gap-3">
                        <img src="${item.gambar}" class="w-7 h-7 object-cover rounded" onerror="this.src='https://placehold.co/40x40?text=📦'">
                        <div><p class="font-semibold text-gray-800 text-sm">${escapeHtml(item.nama_produk)}</p><p class="text-xs text-gray-400">Size: ${escapeHtml(item.size)} | Warna: ${escapeHtml(item.warna)}</p></div>
                    </div>
                    <span class="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-200">Sisa ${item.stok}</span>
                </div>
            `);
        });
    } else { divMenipis.innerHTML = '<p class="text-green-600 font-medium text-xs"><i class="fa-solid fa-circle-check"></i> Aman! Semua stok di atas 5 pcs.</p>'; }
}

function cariProduk() {
    const keyword = document.getElementById('cari-produk').value.toLowerCase();
    const hasilFilter = localDataProduk.filter(p => 
        p.nama_produk.toLowerCase().includes(keyword) || 
        p.kode.toLowerCase().includes(keyword)
    );
    renderTabelProduk(hasilFilter);
}

function bukaModalRiwayat(tipe) {
    const modal = document.getElementById('modal-riwayat-harian');
    const box = document.getElementById('box-riwayat-content');
    const header = document.getElementById('header-riwayat');
    const title = document.getElementById('title-riwayat');
    const container = document.getElementById('list-riwayat-body');
    
    container.innerHTML = '';
    
    if (tipe === 'masuk') {
        header.className = "px-5 py-4 border-b flex justify-between items-center bg-teal-600 text-white flex-shrink-0";
        title.innerHTML = '<i class="fa-solid fa-arrow-down-long text-teal-200 mr-2"></i> Jurnal Omset Bulan Ini';
    } else {
        header.className = "px-5 py-4 border-b flex justify-between items-center bg-red-600 text-white flex-shrink-0";
        title.innerHTML = '<i class="fa-solid fa-arrow-up-long text-red-200 mr-2"></i> Jurnal Beban Bulan Ini';
    }
    
    const riwayatValid = localRiwayatHarian.filter(r => tipe === 'masuk' ? r.pemasukan > 0 : r.pengeluaran > 0);
    
    if (riwayatValid.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed">
                <i class="fa-solid fa-calendar-xmark text-2xl mb-2 text-gray-300"></i>
                <p class="text-xs italic">Belum ada rekam riwayat kas aktif di bulan ini.</p>
            </div>`;
    } else {
        riwayatValid.forEach(r => {
            const opsiDate = { day: 'numeric', month: 'long', year: 'numeric' };
            const tglCantik = new Date(r.tanggal).toLocaleDateString('id-ID', opsiDate);
            
            const nilaiRupiah = tipe === 'masuk' ? r.pemasukan : r.pengeluaran;
            const badgeWarna = tipe === 'masuk' ? 'text-teal-700 bg-teal-50 border-teal-100' : 'text-red-700 bg-red-50 border-red-100';
            const iconPoin = tipe === 'masuk' ? 'fa-circle-arrow-down text-teal-500' : 'fa-circle-arrow-up text-red-500';

            container.insertAdjacentHTML('beforeend', `
                <div class="w-full p-3.5 bg-white rounded-xl flex items-center justify-between border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-2.5">
                        <i class="fa-solid ${iconPoin} text-base flex-shrink-0"></i>
                        <span class="font-bold text-gray-800 text-xs sm:text-sm tracking-wide">${tglCantik}</span>
                    </div>
                    <span class="font-mono font-black text-xs sm:text-sm px-3 py-1 rounded-lg border ${badgeWarna}">
                        Rp ${Number(nilaiRupiah).toLocaleString('id-ID')}
                    </span>
                </div>
            `);
        });
    }

    modal.classList.remove('hidden');
    setTimeout(() => box.classList.add('modal-active'), 10);
}

function tutupModalRiwayat() {
    const modal = document.getElementById('modal-riwayat-harian');
    const box = document.getElementById('box-riwayat-content');
    box.classList.remove('modal-active');
    setTimeout(() => modal.classList.add('hidden'), 150);
}

// === PERBAIKAN MODAL SELECT TIPE & PRODUK ===
function bukaSelectTipe() {
    const modal = document.getElementById('modal-select-tipe');
    const box = document.getElementById('box-tipe-content');
    if (!modal || !box) return;
    modal.classList.remove('hidden');
    setTimeout(() => box.classList.add('modal-active'), 10);
}
function tutupSelectTipe() {
    const modal = document.getElementById('modal-select-tipe');
    const box = document.getElementById('box-tipe-content');
    if (!modal || !box) return;
    box.classList.remove('modal-active');
    setTimeout(() => modal.classList.add('hidden'), 150);
}
function pilihTipe(val, label) {
    document.getElementById('trx-tipe').value = val;
    document.getElementById('text-select-tipe').innerText = label;
    tutupSelectTipe();
    resetFormTransaksiSelection();
    ubahFormTransaksi();
}

// PERBAIKAN UTAMA: bukaSelectProduk dengan pengecekan data
function bukaSelectProduk() {
    const modal = document.getElementById('modal-select-produk');
    const box = document.getElementById('box-produk-content');
    if (!modal || !box) {
        console.error("Elemen modal tidak ditemukan");
        return;
    }
    
    // Pastikan data produk sudah termuat
    if (!localDataProduk || localDataProduk.length === 0) {
        tampilkanPopup("Data produk sedang dimuat, silakan tunggu...", "info");
        muatSemuaData().then(() => {
            bukaSelectProduk(); // coba lagi setelah data siap
        });
        return;
    }
    
    // Reset input cari
    const inputCari = document.getElementById('cari-select-produk');
    if (inputCari) inputCari.value = '';
    
    // Render daftar produk
    renderListSelectProduk(localDataProduk);
    
    // Tampilkan modal dengan animasi
    modal.classList.remove('hidden');
    setTimeout(() => {
        box.classList.add('modal-active');
        if (inputCari) inputCari.focus();
    }, 30);
}

function tutupSelectProduk() {
    const modal = document.getElementById('modal-select-produk');
    const box = document.getElementById('box-produk-content');
    if (!modal || !box) return;
    box.classList.remove('modal-active');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function renderListSelectProduk(dataArray) {
    const container = document.getElementById('list-select-produk-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (!dataArray || dataArray.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed">
                <i class="fa-solid fa-box-open text-3xl mb-2 text-gray-300"></i>
                <p class="text-sm italic">Produk tidak ada dalam sistem.</p>
            </div>`;
        return;
    }
    
    try {
        dataArray.forEach(p => {
            // Escape kode untuk onclick
            const kodeAman = p.kode.replace(/'/g, "\\'");
            const itemBtn = `
                <button type="button" onclick="pilihProduk('${kodeAman}')" class="w-full text-left p-3 bg-white hover:bg-teal-50/50 rounded-xl flex items-center justify-between border border-gray-200/70 hover:border-teal-200 transition group shadow-sm">
                    <div class="flex items-center gap-3">
                        <img src="${p.gambar || ''}" class="w-11 h-11 object-cover rounded-lg bg-gray-100 shadow-sm flex-shrink-0" onerror="this.src='https://placehold.co/40x40?text=📦'">
                        <div class="overflow-hidden">
                            <p class="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition truncate">${escapeHtml(p.nama_produk)}</p>
                            <p class="text-xs text-gray-400 mt-0.5 font-medium">Kode: <span class="font-mono text-gray-600 bg-gray-100 px-1 rounded font-semibold">${escapeHtml(p.kode)}</span> | Size: ${escapeHtml(p.size)}</p>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0 pl-2">
                        <span class="text-[11px] font-bold ${p.stok <= 5 ? 'text-red-700 bg-red-50 border-red-100' : 'text-slate-600 bg-slate-100 border-slate-200'} px-2 py-0.5 rounded-full border">Stok: ${p.stok}</span>
                        <p class="text-xs font-bold text-teal-600 mt-1.5">Rp ${Number(p.harga_jual).toLocaleString('id-ID')}</p>
                    </div>
                </button>
            `;
            container.insertAdjacentHTML('beforeend', itemBtn);
        });
    } catch (err) {
        console.error("Error rendering list produk:", err);
        container.innerHTML = '<div class="text-center text-red-500 p-4">Gagal menampilkan produk</div>';
    }
}

function filterSelectProduk() {
    const keyword = document.getElementById('cari-select-produk').value.toLowerCase();
    const filtered = localDataProduk.filter(p => 
        p.nama_produk.toLowerCase().includes(keyword) || 
        p.kode.toLowerCase().includes(keyword)
    );
    renderListSelectProduk(filtered);
}

function pilihProduk(kode) {
    const produk = localDataProduk.find(p => p.kode === kode);
    if (produk) {
        selectedProductData = produk;
        document.getElementById('trx-produk').value = produk.kode;
        document.getElementById('text-select-produk').innerText = `${produk.nama_produk} (${produk.kode})`;
        document.getElementById('text-select-produk').className = "text-gray-900 font-semibold";
        tutupSelectProduk();
        isiHargaOtomatis();
    }
}

function resetFormTransaksiSelection() {
    selectedProductData = null;
    document.getElementById('trx-produk').value = "";
    document.getElementById('text-select-produk').innerText = "-- Pilih Produk --";
    document.getElementById('text-select-produk').className = "text-gray-400 font-medium";
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
        jumlahInput.placeholder = "Masukkan nilai rupiah pengeluaran";
        jumlahInput.className = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium";
        document.getElementById('trx-keterangan').placeholder = "Contoh: Beli bensin toko, plastik packing";
        spanHarga.classList.add('hidden');
        inputHarga.classList.add('hidden');
        boxHargaJual.classList.add('hidden');
    } else if (tipe === 'Penjualan') {
        boxProduk.classList.remove('hidden');
        jumlahInput.readOnly = true;
        jumlahInput.placeholder = "Dihitung otomatis berdasarkan Qty";
        jumlahInput.className = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-gray-100 font-medium";
        spanHarga.classList.remove('hidden');
        inputHarga.classList.add('hidden');
        boxHargaJual.classList.add('hidden');
        isiHargaOtomatis();
    } else if (tipe === 'Pembelian Stok') {
        boxProduk.classList.remove('hidden');
        jumlahInput.readOnly = true;
        jumlahInput.placeholder = "Dihitung otomatis";
        jumlahInput.className = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-gray-100 font-medium";
        spanHarga.classList.add('hidden');
        inputHarga.classList.remove('hidden');
        boxHargaJual.classList.remove('hidden');
        if (selectedProductData) {
            inputHarga.value = Number(selectedProductData.modal);
            document.getElementById('trx-harga-jual-baru').value = Number(selectedProductData.harga_jual);
        } else {
            inputHarga.value = '';
            document.getElementById('trx-harga-jual-baru').value = '';
        }
        hitungTotal();
    }
}

function isiHargaOtomatis() {
    const tipe = document.getElementById('trx-tipe').value;
    const spanHarga = document.getElementById('harga-satuan-text');
    if (selectedProductData) {
        if (tipe === 'Penjualan') {
            spanHarga.textContent = `Rp ${Number(selectedProductData.harga_jual).toLocaleString('id-ID')}`;
        }
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

    if (tipe === 'Penjualan' && selectedProductData) {
        hargaSatuan = Number(selectedProductData.harga_jual);
    } else if (tipe === 'Pembelian Stok') {
        hargaSatuan = Number(document.getElementById('trx-harga-satuan').value) || 0;
    }
    
    const total = qty * hargaSatuan;
    document.getElementById('trx-jumlah').value = total > 0 ? total : "";
    
    const nama = selectedProductData ? selectedProductData.nama_produk : '';
    if (selectedProductData) {
        if (tipe === 'Penjualan') {
            document.getElementById('trx-keterangan').value = `Jual ${nama} sebanyak ${qty} pcs`;
        } else if (tipe === 'Pembelian Stok') {
            document.getElementById('trx-keterangan').value = `Kulakan ulang ${nama} sebanyak ${qty} pcs`;
        }
    }
}

async function simpanTransaksi(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-trx');
    btn.innerText = "Menyimpan ke Sheets..."; btn.disabled = true;

    const tipe = document.getElementById('trx-tipe').value;
    const kodeProduk = document.getElementById('trx-produk').value;
    const qty = tipe !== 'Pengeluaran Lain' ? Number(document.getElementById('trx-qty').value) : 0;
    const jumlah = Number(document.getElementById('trx-jumlah').value);
    const keterangan = document.getElementById('trx-keterangan').value;
    
    let hargaSatuan = null;
    let hargaJualBaru = null;
    if (tipe === 'Pembelian Stok') {
        hargaSatuan = Number(document.getElementById('trx-harga-satuan').value) || 0;
        const jualBaru = document.getElementById('trx-harga-jual-baru').value.trim();
        if (jualBaru !== '') {
            hargaJualBaru = Number(jualBaru);
        }
    }

    if (tipe !== 'Pengeluaran Lain' && !kodeProduk) {
        tampilkanPopup("Pilih produk terlebih dahulu dari daftar pencarian.", "gagal");
        btn.innerText = "Simpan Catatan Keuangan"; btn.disabled = false;
        return;
    }

    const payload = {
        action: "addTransaksi",
        tipe: tipe,
        kode_produk: kodeProduk,
        qty: qty,
        jumlah: jumlah,
        keterangan: keterangan,
        harga_satuan: hargaSatuan,
        harga_jual_baru: hargaJualBaru
    };

    try {
        const response = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await response.text();
        if (result.includes("ERROR")) {
            throw new Error(result);
        }
        tampilkanPopup("Transaksi baru berhasil diverifikasi & dicatat!", "sukses");
        document.getElementById('form-transaksi').reset();
        resetFormTransaksiSelection();
        switchTab('dashboard');
        muatSemuaData();
    } catch (error) {
        tampilkanPopup(error.message || "Gagal menyimpan data transaksi kas.", "gagal");
    }
    btn.innerText = "Simpan Catatan Keuangan"; btn.disabled = false;
}

async function simpanProduk(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-prod');
    btn.innerText = "Mengunggah data..."; btn.disabled = true;

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
        tampilkanPopup("Registrasi barang baru sukses!", "sukses");
        document.getElementById('form-produk').reset();
        tutupModalProduk();
        muatSemuaData();
    } catch (error) {
        tampilkanPopup("Gagal memasukkan data produk.", "gagal");
    }
    btn.innerText = "Simpan ke Sheets"; btn.disabled = false;
}

function bukaModalProduk() {
    const modal = document.getElementById('modal-produk');
    const box = document.getElementById('box-form-produk-content');
    modal.classList.remove('hidden');
    setTimeout(() => box.classList.add('modal-active'), 10);
}
function tutupModalProduk() {
    const modal = document.getElementById('modal-produk');
    const box = document.getElementById('box-form-produk-content');
    box.classList.remove('modal-active');
    setTimeout(() => modal.classList.add('hidden'), 150);
}

document.addEventListener('DOMContentLoaded', () => {
    updateSapaan();
    muatSemuaData();
    switchTab('dashboard');
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log('✅ Service Worker terdaftar', reg))
    .catch(err => console.log('❌ Service Worker gagal', err));
}
