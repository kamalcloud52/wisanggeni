const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrdqmCriKy7bx9DMKpfseybncuSDqUxjsKgl7g1_Lanb-CN_X0hGyi90n8F7NCCKpXiA/exec";
let DATA_PRODUK = [];
let DATA_TRANSAKSI = [];

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    updateGreeting();
});

async function fetchData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        DATA_PRODUK = data.produk;
        DATA_TRANSAKSI = data.transaksi;
        renderDashboard();
        renderTabelProduk();
    } catch (err) {
        console.error("Gagal ambil data:", err);
    }
}

// Navigasi Tab
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    
    // Update active button style
    const btns = ['dashboard', 'produk', 'transaksi'];
    btns.forEach(b => {
        const btn = document.getElementById(`btn-${b}`);
        const mobBtn = document.getElementById(`mob-btn-${b}`);
        if (b === tabId) {
            btn.className = "w-full flex items-center gap-3 px-4 py-3 bg-teal-600 rounded-lg text-white font-medium transition";
            if(mobBtn) mobBtn.classList.add('text-teal-400');
        } else {
            btn.className = "w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition";
            if(mobBtn) mobBtn.classList.remove('text-teal-400');
        }
    });
    
    document.getElementById('page-title').innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);
}

// Dashboard Logic
function renderDashboard() {
    const today = new Date().toLocaleDateString('id-ID');
    let masukHariIni = 0, keluarHariIni = 0, terjualHariIni = 0;
    let masukBulanIni = 0, keluarBulanIni = 0;

    DATA_TRANSAKSI.forEach(t => {
        const tgl = new Date(t[0]).toLocaleDateString('id-ID');
        const nominal = Number(t[6]);
        
        if (tgl === today) {
            if (t[1] === 'Penjualan') {
                masukHariIni += nominal;
                terjualHariIni += Number(t[4]);
            } else {
                keluarHariIni += nominal;
            }
        }
        
        // Akumulasi Bulanan
        if (new Date(t[0]).getMonth() === new Date().getMonth()) {
            if (t[1] === 'Penjualan') masukBulanIni += nominal;
            else keluarBulanIni += nominal;
        }
    });

    document.getElementById('dash-pemasukan').innerText = formatRupiah(masukHariIni);
    document.getElementById('dash-pengeluaran').innerText = formatRupiah(keluarHariIni);
    document.getElementById('dash-terjual').innerText = terjualHariIni;
    document.getElementById('dash-pemasukan-bulan').innerText = formatRupiah(masukBulanIni);
    document.getElementById('dash-pengeluaran-bulan').innerText = formatRupiah(keluarBulanIni);
    document.getElementById('dash-kas').innerText = formatRupiah(masukBulanIni - keluarBulanIni);
    
    renderStokMenipis();
}

function renderStokMenipis() {
    const list = document.getElementById('list-menipis');
    const menipis = DATA_PRODUK.filter(p => p[7] <= 5);
    if (menipis.length === 0) {
        list.innerHTML = "Stok aman terkendali.";
        return;
    }
    list.innerHTML = menipis.map(p => `
        <div class="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
            <div>
                <p class="font-bold text-slate-800 text-sm">${p[0]}</p>
                <p class="text-xs text-red-600">Sisa: ${p[7]} pcs</p>
            </div>
            <button onclick="pilihProdukTrans('${p[1]}')" class="text-xs bg-white px-3 py-1 rounded border shadow-sm hover:bg-gray-50">Isi Stok</button>
        </div>
    `).join('');
}

// Tabel Produk
function renderTabelProduk() {
    const body = document.getElementById('tabel-produk-body');
    body.innerHTML = DATA_PRODUK.map((p, i) => `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-center">${i+1}</td>
            <td class="p-4 font-medium">${p[0]}</td>
            <td class="p-4 hidden sm:table-cell"><img src="${p[2]}" class="w-10 h-10 object-cover rounded shadow-sm"></td>
            <td class="p-4 text-gray-500">${p[1]}</td>
            <td class="p-4">${p[3]}</td>
            <td class="p-4 hidden md:table-cell">${p[4]}</td>
            <td class="p-4 hidden md:table-cell">${formatRupiah(p[5])}</td>
            <td class="p-4 font-bold text-teal-600">${formatRupiah(p[6])}</td>
            <td class="p-4"><span class="px-2 py-1 ${p[7] <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} rounded-full font-bold text-xs">${p[7]}</span></td>
            <td class="p-4 text-center">
                <button class="text-blue-500 hover:text-blue-700 mx-1"><i class="fa-solid fa-pen"></i></button>
            </td>
        </tr>
    `).join('');
}

// Fungsi Transaksi
function hitungTotal() {
    const qty = document.getElementById('trx-qty').value;
    const harga = document.getElementById('trx-tipe').value === 'Penjualan' 
        ? document.getElementById('harga-satuan-text').getAttribute('data-harga')
        : document.getElementById('trx-harga-satuan').value;
    
    document.getElementById('trx-jumlah').value = qty * (harga || 0);
}

async function simpanTransaksi(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-trx');
    btn.disabled = true;
    btn.innerText = "Menyimpan...";

    const data = {
        action: 'transaksi',
        tipe: document.getElementById('trx-tipe').value,
        kode: document.getElementById('trx-produk').value,
        nama: document.getElementById('text-select-produk').innerText,
        qty: Number(document.getElementById('trx-qty').value),
        hargaSatuan: Number(document.getElementById('trx-jumlah').value) / Number(document.getElementById('trx-qty').value),
        total: Number(document.getElementById('trx-jumlah').value),
        keterangan: document.getElementById('trx-keterangan').value
    };

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showPopup("✅ Transaksi Berhasil Dicatat!");
        document.getElementById('form-transaksi').reset();
        fetchData();
        switchTab('dashboard');
    } catch (err) {
        showPopup("❌ Gagal menyimpan");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Catatan Keuangan';
    }
}

// Helpers
function formatRupiah(num) {
    return "Rp " + Number(num).toLocaleString('id-ID');
}

function updateGreeting() {
    const hours = new Date().getHours();
    let sapaan = "Selamat Malam";
    if (hours < 11) sapaan = "Selamat Pagi";
    else if (hours < 15) sapaan = "Selamat Siang";
    else if (hours < 19) sapaan = "Selamat Sore";
    document.getElementById('sapaan-text').innerHTML = `${sapaan}, Faza 👋🏻`;
}

function showPopup(msg) {
    document.getElementById('popup-pesan').innerText = msg;
    document.getElementById('popup-kustom').classList.remove('hidden');
}

function tutupPopup() {
    document.getElementById('popup-kustom').classList.add('hidden');
}

// Modal Logics (Select Tipe & Produk)
function bukaSelectTipe() { document.getElementById('modal-select-tipe').classList.remove('hidden'); setTimeout(() => document.getElementById('box-tipe-content').classList.add('modal-active'), 10); }
function tutupSelectTipe() { document.getElementById('box-tipe-content').classList.remove('modal-active'); setTimeout(() => document.getElementById('modal-select-tipe').classList.add('hidden'), 300); }

function pilihTipe(val, text) {
    document.getElementById('trx-tipe').value = val;
    document.getElementById('text-select-tipe').innerText = text;
    tutupSelectTipe();
    
    const boxHargaSatuan = document.getElementById('trx-harga-satuan');
    const labelHargaSatuan = document.getElementById('harga-satuan-text');
    
    if (val === 'Penjualan') {
        boxHargaSatuan.classList.add('hidden');
        labelHargaSatuan.classList.remove('hidden');
    } else {
        boxHargaSatuan.classList.remove('hidden');
        labelHargaSatuan.classList.add('hidden');
    }
}

function bukaSelectProduk() {
    document.getElementById('modal-select-produk').classList.remove('hidden');
    setTimeout(() => document.getElementById('box-produk-content').classList.add('modal-active'), 10);
    const container = document.getElementById('list-select-produk-container');
    container.innerHTML = DATA_PRODUK.map(p => `
        <button onclick="pilihProdukFix('${p[1]}', '${p[0]}', ${p[6]})" class="w-full text-left p-3 hover:bg-teal-50 flex items-center gap-3 border-b border-gray-100 transition">
            <img src="${p[2]}" class="w-10 h-10 object-cover rounded">
            <div>
                <p class="font-bold text-sm text-gray-800">${p[0]}</p>
                <p class="text-xs text-gray-500">${p[1]} - Stok: ${p[7]}</p>
            </div>
        </button>
    `).join('');
}

function pilihProdukFix(kode, nama, harga) {
    document.getElementById('trx-produk').value = kode;
    document.getElementById('text-select-produk').innerText = nama;
    document.getElementById('harga-satuan-text').innerText = formatRupiah(harga);
    document.getElementById('harga-satuan-text').setAttribute('data-harga', harga);
    document.getElementById('trx-keterangan').value = `${document.getElementById('trx-tipe').value} ${nama}`;
    tutupSelectProduk();
    hitungTotal();
}

function tutupSelectProduk() { document.getElementById('box-produk-content').classList.remove('modal-active'); setTimeout(() => document.getElementById('modal-select-produk').classList.add('hidden'), 300); }
