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
    const el = document.getElementById('txt-sapaan'); // Menyesuaikan id dari index.html baru
    if (el) el.innerText = sapaan;
}

function switchTab(tabName) {
    // Sembunyikan semua tab content utama
    const tabIds = ['dashboard', 'transaksi', 'produk', 'jurnal'];
    tabIds.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.classList.add('hidden');
    });

    // Tampilkan tab yang dipilih
    const activeTab = document.getElementById('tab-' + tabName);
    if (activeTab) activeTab.classList.remove('hidden');

    const titles = { 
        'dashboard': 'Dashboard', 
        'produk': 'Data Produk', 
        'transaksi': 'Transaksi Baru', 
        'jurnal': 'Jurnal Keuangan' 
    };
    if (document.getElementById('page-title')) {
        document.getElementById('page-title').innerText = titles[tabName] || 'Dashboard';
    }

    // Update Navigasi Desktop
    tabIds.forEach(t => {
        const btn = document.getElementById('btn-' + t);
        if (btn) {
            if (t === tabName) btn.className = "w-full flex items-center gap-3 px-4 py-3 bg-teal-600 rounded-lg text-white font-medium transition-all duration-200";
            else btn.className = "w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white font-medium transition-all duration-200";
        }
    });

    // Update Navigasi Mobile (Menyesuaikan prefix m-btn dari index.html)
    tabIds.forEach(t => {
        const mobBtn = document.getElementById('m-btn-' + t);
        if (mobBtn) {
            if (t === tabName) mobBtn.className = "flex flex-col items-center gap-1 py-1 text-teal-400 font-medium transition w-16";
            else mobBtn.className = "flex flex-col items-center gap-1 py-1 text-gray-500 hover:text-gray-300 font-medium transition w-16";
        }
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
        renderDaftarProduk(localDataProduk);
        renderDashboard(data.ringkasan, data.terlaris, localDataProduk, data.riwayat_harian);
    } catch (error) {
        console.error("Koneksi gagal:", error);
        const container = document.getElementById('container-daftar-produk');
        if (container) {
            container.innerHTML = `<div class="col-span-full text-center py-8 text-red-500 font-medium">Gagal memuat data produk. Periksa jaringan internet atau URL API.</div>`;
        }
    }
}

// Rombak total untuk merender kartu produk layaknya di tab kasir/transaksi
function renderDaftarProduk(arrayData) {
    const container = document.getElementById('container-daftar-produk');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (arrayData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed">
                <i class="fa-solid fa-box-open text-4xl mb-2 text-gray-300"></i>
                <p class="text-sm italic">Belum ada data barang di dalam sistem.</p>
            </div>`;
        return;
    }

    arrayData.forEach((item, index) => {
        const gambarUrl = item.gambar && item.gambar.trim() !== '' ? item.gambar : 'https://placehold.co/100x100?text=📦';
        
        const cardHTML = `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center relative hover:shadow-md transition duration-200">
                
                <span class="absolute top-2 right-3 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                    #${index + 1}
                </span>

                <div class="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100 shadow-inner">
                    <img src="${gambarUrl}" alt="${item.nama_produk}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100x100?text=📦'">
                </div>

                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-900 text-sm md:text-base truncate pr-10">${item.nama_produk}</h4>
                    
                    <div class="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-400 font-medium">
                        <span>Kode: <b class="font-mono text-gray-600">${item.kode}</b></span>
                        <span>•</span>
                        <span>Size: <b class="text-gray-600">${item.size}</b></span>
                        <span>•</span>
                        <span class="hidden sm:inline">Warna: <b class="text-gray-600">${item.warna}</b></span>
                    </div>
                    
                    <div class="flex justify-between items-center mt-2 border-t pt-1.5 border-dashed border-gray-100">
                        <div>
                            <span class="text-[9px] text-gray-400 block uppercase tracking-wider font-bold">Harga Jual</span>
                            <span class="text-xs md:text-sm font-black text-teal-600">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[9px] text-gray-400 block uppercase tracking-wider font-bold">Sisa Stok</span>
                            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold inline-block mt-0.5 ${Number(item.stok) <= 5 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-200'}">
                                ${item.stok} pcs
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function renderDashboard(ringkasan, terlaris, produk, riwayatHarian) {
    localRiwayatHarian = riwayatHarian || [];

    if(ringkasan) {
        // Penyesuaian Id element dari index.html yang baru
        if(document.getElementById('dash-omset')) document.getElementById('dash-omset').innerText = `Rp ${Number(ringkasan.hari_ini.pemasukan).toLocaleString('id-ID')}`;
        if(document.getElementById('dash-profit')) {
            const profit = Number(ringkasan.hari_ini.pemasukan) - Number(ringkasan.hari_ini.pengeluaran);
            document.getElementById('dash-profit').innerText = `Rp ${profit > 0 ? profit.toLocaleString('id-ID') : 0}`;
        }
        if(document.getElementById('dash-trx-count')) document.getElementById('dash-trx-count').innerText = ringkasan.hari_ini.stok_terjual || 0;
        if(document.getElementById('dash-items-count')) document.getElementById('dash-items-count').innerText = produk.length;
        if(document.getElementById('txt-saldo-kas')) document.getElementById('txt-saldo-kas').innerText = `Rp ${Number(ringkasan.kas_sekarang).toLocaleString('id-ID')}`;
    }
    
    const divTerlaris = document.getElementById('list-terlaris');
    if(divTerlaris) {
        divTerlaris.innerHTML = '';
        if(terlaris && terlaris.length > 0) {
            terlaris.forEach(item => {
                divTerlaris.insertAdjacentHTML('beforeend', `
                    <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-2 md:gap-3">
                            <div class="w-7 h-7 bg-teal-50 text-teal-600 rounded flex items-center justify-center font-bold text-xs"><i class="fa-solid fa-star"></i></div>
                            <div><p class="font-semibold text-gray-800 text-sm">${item.nama}</p><p class="text-xs text-gray-400">Kode: ${item.kode}</p></div>
                        </div>
                        <span class="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">${item.total_jual} Terjual</span>
                    </div>
                `);
            });
        } else { divTerlaris.innerHTML = '<p class="text-gray-400 italic text-sm">Belum ada penjualan bulan ini.</p>'; }
    }

    // Mengganti penyematan id list peringatan stok menipis agar sesuai dengan index.html baru
    const divMenipis = document.getElementById('list-stok-peringatan');
    const badgeMenipis = document.getElementById('badge-stok-menipis');
    
    if(divMenipis) {
        divMenipis.innerHTML = '';
        const produkKritis = produk.filter(p => Number(p.stok) <= 5);
        if(badgeMenipis) badgeMenipis.innerText = produkKritis.length;

        if(produkKritis.length > 0) {
            produkKritis.forEach(item => {
                divMenipis.insertAdjacentHTML('beforeend', `
                    <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border-b border-gray-50 last:border-0">
                        <div class="flex items-center gap-2 md:gap-3">
                            <img src="${item.gambar}" class="w-7 h-7 object-cover rounded" onerror="this.src='https://placehold.co/40x40?text=📦'">
                            <div><p class="font-semibold text-gray-800 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">${item.nama_produk}</p><p class="text-[10px] text-gray-400">Size: ${item.size} | Kode: ${item.kode}</p></div>
                        </div>
                        <span class="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex-shrink-0">Sisa ${item.stok}</span>
                    </div>
                `);
            });
        } else { divMenipis.innerHTML = '<p class="text-green-600 font-medium text-xs py-2"><i class="fa-solid fa-circle-check"></i> Aman! Semua stok di atas 5 pcs.</p>'; }
    }
}

// Penyesuaian filter pencarian data produk menggunakan komponen card grid view yang baru
function filterMasterProduk() {
    const keyword = document.getElementById('cari-master-produk').value.toLowerCase();
    const hasilFilter = localDataProduk.filter(p => 
        p.nama_produk.toLowerCase().includes(keyword) || 
        p.kode.toLowerCase().includes(keyword)
    );
    renderDaftarProduk(hasilFilter);
}

function bukaModalRiwayat() {
    const modal = document.getElementById('modal-riwayat');
    const box = document.getElementById('box-riwayat-content');
    const container = document.getElementById('list-riwayat-body');
    
    if(!container) return;
    container.innerHTML = '';
    
    if (localRiwayatHarian.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed">
                <i class="fa-solid fa-calendar-xmark text-2xl mb-2 text-gray-300"></i>
                <p class="text-xs italic">Belum ada rekam riwayat kas aktif.</p>
            </div>`;
    } else {
        localRiwayatHarian.forEach(r => {
            const opsiDate = { day: 'numeric', month: 'long', year: 'numeric' };
            const tglCantik = new Date(r.tanggal).toLocaleDateString('id-ID', opsiDate);
            
            container.insertAdjacentHTML('beforeend', `
                <div class="w-full p-3 bg-white rounded-xl flex items-center justify-between border border-gray-100 shadow-sm text-xs sm:text-sm">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-calendar-day text-slate-400"></i>
                        <span class="font-bold text-gray-800">${tglCantik}</span>
                    </div>
                    <div class="flex flex-col text-right font-mono text-[11px] sm:text-xs gap-0.5">
                        <span class="text-teal-600 font-bold">+ Rp ${Number(r.pemasukan).toLocaleString('id-ID')}</span>
                        <span class="text-red-500 font-medium">- Rp ${Number(r.pengeluaran).toLocaleString('id-ID')}</span>
                    </div>
                </div>
            `);
        });
    }

    if(modal) modal.classList.remove('hidden');
    if(box) setTimeout(() => box.classList.add('modal-active'), 10);
}

function tutupModalRiwayat() {
    const modal = document.getElementById('modal-riwayat');
    const box = document.getElementById('box-riwayat-content');
    if(box) box.classList.remove('modal-active');
    if(modal) setTimeout(() => modal.classList.add('hidden'), 150);
}

function bukaSelectTipe() {
    const modal = document.getElementById('modal-select-tipe');
    const box = document.getElementById('box-tipe-content');
    modal.classList.remove('hidden');
    setTimeout(() => box.classList.add('modal-active'), 10);
}
function tutupSelectTipe() {
    const modal = document.getElementById('modal-select-tipe');
    const box = document.getElementById('box-tipe-content');
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

function bukaSelectProduk() {
    const modal = document.getElementById('modal-select-produk');
    const box = document.getElementById('box-produk-content');
    modal.classList.remove('hidden');
    document.getElementById('cari-select-produk').value = '';
    renderListSelectProduk(localDataProduk);
    setTimeout(() => {
        box.classList.add('modal-active');
        document.getElementById('cari-select-produk').focus();
    }, 10);
}
function tutupSelectProduk() {
    const modal = document.getElementById('modal-select-produk');
    const box = document.getElementById('box-produk-content');
    box.classList.remove('modal-active');
    setTimeout(() => modal.classList.add('hidden'), 150);
}

function renderListSelectProduk(dataArray) {
    const container = document.getElementById('list-select-produk-container');
    container.innerHTML = '';
    if(dataArray.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed">
                <i class="fa-solid fa-box-open text-3xl mb-2 text-gray-300"></i>
                <p class="text-sm italic">Produk tidak ada dalam sistem.</p>
            </div>`;
        return;
    }
    dataArray.forEach(p => {
        const itemBtn = `
            <button type="button" onclick="pilihProduk('${p.kode}')" class="w-full text-left p-3 bg-white hover:bg-teal-50/50 rounded-xl flex items-center justify-between border border-gray-200/70 hover:border-teal-200 transition group shadow-sm">
                <div class="flex items-center gap-3">
                    <img src="${p.gambar}" class="w-11 h-11 object-cover rounded-lg bg-gray-100 shadow-sm flex-shrink-0" onerror="this.src='https://placehold.co/40x40?text=📦'">
                    <div class="overflow-hidden">
                        <p class="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition truncate">${p.nama_produk}</p>
                        <p class="text-xs text-gray-400 mt-0.5 font-medium">Kode: <span class="font-mono text-gray-600 bg-gray-100 px-1 rounded font-semibold">${p.kode}</span> | Size: ${p.size}</p>
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
    if (document.getElementById('trx-produk')) document.getElementById('trx-produk').value = "";
    if (document.getElementById('text-select-produk')) {
        document.getElementById('text-select-produk').innerText = "-- Pilih Produk --";
        document.getElementById('text-select-produk').className = "text-gray-400 font-medium";
    }
    if (document.getElementById('harga-satuan-text')) document.getElementById('harga-satuan-text').textContent = '-';
    if (document.getElementById('trx-harga-satuan')) document.getElementById('trx-harga-satuan').value = '';
    if (document.getElementById('trx-harga-jual-baru')) document.getElementById('trx-harga-jual-baru').value = '';
    if (document.getElementById('trx-jumlah')) document.getElementById('trx-jumlah').value = "";
    if (document.getElementById('trx-keterangan')) document.getElementById('trx-keterangan').value = "";
    if (document.getElementById('harga-satuan-text')) document.getElementById('harga-satuan-text').classList.remove('hidden');
    if (document.getElementById('trx-harga-satuan')) document.getElementById('trx-harga-satuan').classList.add('hidden');
    if (document.getElementById('box-harga-jual-baru')) document.getElementById('box-harga-jual-baru').classList.add('hidden');
}

function ubahFormTransaksi() {
    const tipe = document.getElementById('trx-tipe')?.value;
    const boxProduk = document.getElementById('box-produk');
    const jumlahInput = document.getElementById('trx-jumlah');
    const spanHarga = document.getElementById('harga-satuan-text');
    const inputHarga = document.getElementById('trx-harga-satuan');
    const boxHargaJual = document.getElementById('box-harga-jual-baru');
    
    if (!tipe || !jumlahInput) return;

    if (tipe === 'Pengeluaran Lain') {
        if(boxProduk) boxProduk.classList.add('hidden');
        jumlahInput.readOnly = false;
        jumlahInput.placeholder = "Masukkan nilai rupiah pengeluaran";
        jumlahInput.className = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium";
        if(document.getElementById('trx-keterangan')) document.getElementById('trx-keterangan').placeholder = "Contoh: Beli bensin toko, plastik packing";
        spanHarga?.classList.add('hidden');
        inputHarga?.classList.add('hidden');
        boxHargaJual?.classList.add('hidden');
    } else if (tipe === 'Penjualan') {
        if(boxProduk) boxProduk.classList.remove('hidden');
        jumlahInput.readOnly = true;
        jumlahInput.placeholder = "Dihitung otomatis berdasarkan Qty";
        jumlahInput.className = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-gray-100 font-medium";
        spanHarga?.classList.remove('hidden');
        inputHarga?.classList.add('hidden');
        boxHargaJual?.classList.add('hidden');
        isiHargaOtomatis();
    } else if (tipe === 'Pembelian Stok') {
        if(boxProduk) boxProduk.classList.remove('hidden');
        jumlahInput.readOnly = true;
        jumlahInput.placeholder = "Dihitung otomatis";
        jumlahInput.className = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-gray-100 font-medium";
        spanHarga?.classList.add('hidden');
        inputHarga?.classList.remove('hidden');
        boxHargaJual?.classList.remove('hidden'); 
        if (selectedProductData && inputHarga) {
            inputHarga.value = Number(selectedProductData.modal);
            if(document.getElementById('trx-harga-jual-baru')) document.getElementById('trx-harga-jual-baru').value = Number(selectedProductData.harga_jual);
        } else if (inputHarga) {
            inputHarga.value = '';
            if(document.getElementById('trx-harga-jual-baru')) document.getElementById('trx-harga-jual-baru').value = '';
        }
        hitungTotal();
    }
}

function isiHargaOtomatis() {
    const tipe = document.getElementById('trx-tipe')?.value;
    const spanHarga = document.getElementById('harga-satuan-text');
    if (!spanHarga) return;

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
    const tipe = document.getElementById('trx-tipe')?.value;
    if (tipe === 'Pengeluaran Lain' || !tipe) return;
    
    const qty = Number(document.getElementById('trx-qty')?.value) || 0;
    let hargaSatuan = 0;

    if (tipe === 'Penjualan' && selectedProductData) {
        hargaSatuan = Number(selectedProductData.harga_jual);
    } else if (tipe === 'Pembelian Stok') {
        hargaSatuan = Number(document.getElementById('trx-harga-satuan')?.value) || 0;
    }
    
    const total = qty * hargaSatuan;
    if(document.getElementById('trx-jumlah')) {
        document.getElementById('trx-jumlah').value = total > 0 ? total : "";
    }
    
    const nama = selectedProductData ? selectedProductData.nama_produk : '';
    if (selectedProductData && document.getElementById('trx-keterangan')) {
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
    if(!btn) return;
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

// Disesuaikan id form submit dari index.html yang baru (simpanDataProdukKeSheets)
async function simpanDataProdukKeSheets(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-produk');
    if(!btn) return;
    btn.innerText = "Mengunggah data..."; btn.disabled = true;

    const payload = {
        action: "addProduk",
        nama_produk: document.getElementById('prod-nama').value,
        kode: document.getElementById('prod-id')?.value || "PRD-" + Date.now(), // Fallback generator kode jika kosong
        gambar: document.getElementById('prod-gambar').value,
        size: "All Size", // Nilai default adaptif karena form index.html disederhanakan
        warna: "Default",
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
    if(modal) modal.classList.remove('hidden');
    if(box) setTimeout(() => box.classList.add('modal-active'), 10);
}
function tutupModalProduk() {
    const modal = document.getElementById('modal-produk');
    const box = document.getElementById('box-form-produk-content');
    if(box) box.classList.remove('modal-active');
    if(modal) setTimeout(() => modal.classList.add('hidden'), 150);
}

document.addEventListener('DOMContentLoaded', () => {
    updateSapaan();
    muatSemuaData();
    switchTab('dashboard');
});

// Registrasi Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log('✅ Service Worker terdaftar', reg))
    .catch(err => console.log('❌ Service Worker gagal', err));
}
