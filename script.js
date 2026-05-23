const API_URL = "https://script.google.com/macros/s/AKfycbzrdqmCriKy7bx9DMKpfseybncuSDqUxjsKgl7g1_Lanb-CN_X0hGyi90n8F7NCCKpXiA/exec";

let localDataProduk = [];
let localRiwayatHarian = [];
let selectedProductData = null;

// ==================== UTILITY ====================
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
    } catch (error) {
        console.error("Koneksi gagal:", error);
        document.getElementById('tabel-produk-body').innerHTML = `<tr><td colspan="10" class="p-4 text-center text-red-500 font-medium">Gagal memuat data. Periksa jaringan internet atau URL API.</td></tr>`;
    }
}

function renderTabelProduk(arrayData) {
    const tbody = document.getElementById('tabel-produk-body');
    tbody.innerHTML = '';
    if(arrayData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-gray-400 italic">Belum ada data barang.</td></tr>`;
        return;
    }
    arrayData.forEach((item, index) => {
        const row = `
            <tr class="border-b hover:bg-slate-50/80 transition duration-150">
                <td class="p-2 md:p-4 font-medium text-gray-500">${index + 1}</td>
                <td class="p-2 md:p-4 font-bold text-gray-900">${item.nama_produk}</td>
                <td class="p-2 md:p-4 hidden sm:table-cell">
                    <img src="${item.gambar}" alt="Foto" class="w-10 h-10 object-cover rounded shadow-sm bg-gray-100" onerror="this.src='https://placehold.co/40x40?text=No+Img'">
                </td>
                <td class="p-2 md:p-4"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-mono border font-semibold">${item.kode}</span></td>
                <td class="p-2 md:p-4 font-medium">${item.size}</td>
                <td class="p-2 md:p-4 text-gray-600 hidden md:table-cell">${item.warna}</td>
                <td class="p-2 md:p-4 text-gray-500 hidden md:table-cell">Rp ${Number(item.modal).toLocaleString('id-ID')}</td>
                <td class="p-2 md:p-4 text-teal-600 font-bold">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                <td class="p-2 md:p-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${item.stok <= 5 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}">
                        ${item.stok} pcs
                    </span>
                </td>
                <td class="p-2 md:p-4 text-center whitespace-nowrap">
                    <button onclick="editProduk('${item.kode}')" class="text-blue-600 hover:text-blue-800 mr-3 transition" title="Edit">
                        <i class="fa-regular fa-pen-to-square text-base"></i>
                    </button>
                    <button onclick="hapusProduk('${item.kode}', '${item.nama_produk.replace(/'/g, "\\'")}')" class="text-red-600 hover:text-red-800 transition" title="Hapus">
                        <i class="fa-regular fa-trash-can text-base"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
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
                        <div><p class="font-semibold text-gray-800 text-sm">${item.nama}</p><p class="text-xs text-gray-400">Kode: ${item.kode}</p></div>
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
                        <div><p class="font-semibold text-gray-800 text-sm">${item.nama_produk}</p><p class="text-xs text-gray-400">Size: ${item.size} | Warna: ${item.warna}</p></div>
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

async function simpanProduk(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-prod');
    btn.innerText = "Mengunggah data..."; btn.disabled = true;

    const kodeBaru = document.getElementById('prod-kode').value.trim();
    const kodeSudahAda = localDataProduk.some(p => p.kode === kodeBaru);
    if (kodeSudahAda) {
        tampilkanPopup("Kode produk sudah digunakan. Gunakan kode lain.", "gagal");
        btn.innerText = "Simpan ke Sheets"; btn.disabled = false;
        return;
    }

    const payload = {
        action: "addProduk",
        nama_produk: document.getElementById('prod-nama').value,
        kode: kodeBaru,
        gambar: document.getElementById('prod-gambar').value,
        size: document.getElementById('prod-size').value,
        warna: document.getElementById('prod-warna').value,
        modal: Number(document.getElementById('prod-modal').value) || 0,
        harga_jual: Number(document.getElementById('prod-jual').value) || 0,
        stok: Number(document.getElementById('prod-stok').value) || 0
    };

    try {
        const response = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await response.text();
        if (result.includes("ERROR") || result.includes("Error")) throw new Error(result);
        tampilkanPopup("Registrasi barang baru sukses!", "sukses");
        document.getElementById('form-produk').reset();
        tutupModalProduk();
        muatSemuaData();
    } catch (error) {
        tampilkanPopup("Gagal memasukkan data produk: " + error.message, "gagal");
    }
    btn.innerText = "Simpan ke Sheets"; btn.disabled = false;
}

function editProduk(kode) {
    const produk = localDataProduk.find(p => p.kode === kode);
    if (!produk) return;

    document.getElementById('edit-prod-kode_lama').value = kode;
    document.getElementById('edit-prod-nama').value = produk.nama_produk;
    document.getElementById('edit-prod-kode').value = produk.kode;
    document.getElementById('edit-prod-gambar').value = produk.gambar;
    document.getElementById('edit-prod-size').value = produk.size;
    document.getElementById('edit-prod-warna').value = produk.warna;
    document.getElementById('edit-prod-modal').value = produk.modal;
    document.getElementById('edit-prod-jual').value = produk.harga_jual;

    const modal = document.getElementById('modal-edit-produk');
    const box = document.getElementById('box-edit-produk-content');
    modal.classList.remove('hidden');
    setTimeout(() => box.classList.add('modal-active'), 10);
}

async function simpanEditProduk(event) {
    event.preventDefault();
    const btn = event.submitter;
    const originalText = btn.innerText;
    btn.innerText = "Menyimpan..."; btn.disabled = true;

    const kodeLama = document.getElementById('edit-prod-kode_lama').value;
    const payload = {
        action: "editProduk",
        kode_lama: kodeLama,
        nama_produk: document.getElementById('edit-prod-nama').value,
        kode: document.getElementById('edit-prod-kode').value,
        gambar: document.getElementById('edit-prod-gambar').value,
        size: document.getElementById('edit-prod-size').value,
        warna: document.getElementById('edit-prod-warna').value,
        modal: Number(document.getElementById('edit-prod-modal').value) || 0,
        harga_jual: Number(document.getElementById('edit-prod-jual').value) || 0
    };

    try {
        const response = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await response.text();
        if (result.includes("ERROR") || result.includes("Error")) throw new Error(result);
        tampilkanPopup("Data produk berhasil diperbarui!", "sukses");
        tutupModalEditProduk();
        muatSemuaData();
    } catch (error) {
        tampilkanPopup("Gagal mengedit produk: " + error.message, "gagal");
    }
    btn.innerText = originalText; btn.disabled = false;
}

function tutupModalEditProduk() {
    const modal = document.getElementById('modal-edit-produk');
    const box = document.getElementById('box-edit-produk-content');
    box.classList.remove('modal-active');
    setTimeout(() => modal.classList.add('hidden'), 150);
}

function hapusProduk(kode, nama) {
    if (confirm(`Yakin hapus produk "${nama}"? Semua transaksi yang terkait akan tetap ada, tapi produk tidak bisa dipilih lagi.`)) {
        (async () => {
            try {
                const response = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "hapusProduk", kode: kode }) });
                const result = await response.text();
                if (result.includes("ERROR") || result.includes("Error")) throw new Error(result);
                tampilkanPopup(`Produk "${nama}" berhasil dihapus.`, "sukses");
                muatSemuaData();
            } catch (error) {
                tampilkanPopup("Gagal menghapus produk: " + error.message, "gagal");
            }
        })();
    }
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

function bukaModalRiwayat(tipe) { ... } // (saya singkat, tapi Anda sudah punya lengkap)
function tutupModalRiwayat() { ... }
// ... dan seterusnya semua fungsi transaksi yang sudah ada di versi asli
