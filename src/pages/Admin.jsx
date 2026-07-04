import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function Admin() {
  // STATE NAVIGASI & DATA
  const [tabAktif, setTabAktif] = useState('products')
  const [daftarProduk, setDaftarProduk] = useState([])
  const [daftarPesanan, setDaftarPesanan] = useState([])
  const [daftarKategori, setDaftarKategori] = useState([]) 
  const [sedangMemuat, setSedangMemuat] = useState(true)
  const [kataKunciCari, setKataKunciCari] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')
  
  // STATE MODAL & PROSES
  const [modalTerbuka, setModalTerbuka] = useState(false)
  const [produkEditId, setProdukEditId] = useState(null)
  const [sedangProses, setSedangProses] = useState(false)
  const [sedangGenerateAI, setSedangGenerateAI] = useState(false)
  
  // STATE FORMULIR UTAMA
  const [form, setForm] = useState({
    nama: '', harga: '', harga_diskon: '', deskripsi: '', kategori: '', status: 'Tersedia', wa_aktif: true
  })
  
  // STATE FITUR CANGGIH
  const [fileGaleri, setFileGaleri] = useState([])
  const [pratinjauGaleri, setPratinjauGaleri] = useState([])
  const [skus, setSkus] = useState([{ id: Date.now(), varian: '', ukuran: '', stok: 1 }])
  const [linkEcommerce, setLinkEcommerce] = useState([])
  const [inputKategoriBaru, setInputKategoriBaru] = useState('')

  // 1. MENGAMBIL DATA DARI SUPABASE
  async function muatData() {
    setSedangMemuat(true)
    try {
      const { data: p } = await supabase.from('products').select('*').order('id', { ascending: false })
      const { data: o } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      const { data: k } = await supabase.from('categories').select('*').order('nama', { ascending: true })
      setDaftarProduk(p || [])
      setDaftarPesanan(o || [])
      setDaftarKategori(k || [])
    } catch (error) { console.error(error) } finally { setSedangMemuat(false) }
  }

  useEffect(() => { muatData() }, [])

  // 2. KELOLA KATEGORI MASTER
  const tambahKategori = async (e) => {
    e.preventDefault()
    if (!inputKategoriBaru.trim()) return
    await supabase.from('categories').insert([{ nama: inputKategoriBaru }])
    setInputKategoriBaru(''); muatData()
  }
  const hapusKategori = async (id) => {
    if (confirm('Hapus kategori ini?')) { await supabase.from('categories').delete().eq('id', id); muatData() }
  }

  // 3. KELOLA MODAL PRODUK
  const bukaModal = (p = null) => {
    if (p) {
      setProdukEditId(p.id)
      setForm({ 
        nama: p.nama, harga: p.harga, harga_diskon: p.harga_diskon || '', deskripsi: p.deskripsi || '', 
        kategori: p.kategori || '', status: p.status || 'Tersedia', wa_aktif: p.wa_aktif !== false
      })
      setSkus(p.skus && p.skus.length > 0 ? p.skus : [{ id: Date.now(), varian: 'Default', ukuran: 'All Size', stok: p.stok || 0 }])
      setPratinjauGaleri(p.galeri && p.galeri.length > 0 ? p.galeri : (p.gambar ? [p.gambar] : []))
      setLinkEcommerce(p.link_ecommerce || [])
    } else {
      setProdukEditId(null)
      setForm({ nama: '', harga: '', harga_diskon: '', deskripsi: '', kategori: daftarKategori[0]?.nama || '', status: 'Tersedia', wa_aktif: true })
      setSkus([{ id: Date.now(), varian: '', ukuran: '', stok: 1 }])
      setPratinjauGaleri([])
      setLinkEcommerce([])
    }
    setFileGaleri([]); setModalTerbuka(true)
  }

  // 4. KELOLA SKU (VARIAN/UKURAN/STOK)
  const tambahSku = () => setSkus([...skus, { id: Date.now(), varian: '', ukuran: '', stok: 1 }])
  const hapusSku = (id) => setSkus(skus.filter(s => s.id !== id))
  const ubahSku = (id, field, value) => setSkus(skus.map(s => s.id === id ? { ...s, [field]: field === 'stok' ? parseInt(value) || 0 : value } : s))

  // 5. KELOLA OMNICHANNEL (E-COMMERCE)
  const tambahLink = () => { if(linkEcommerce.length < 3) setLinkEcommerce([...linkEcommerce, { id: Date.now(), nama: 'Shopee', url: '' }]) }
  const hapusLink = (id) => setLinkEcommerce(linkEcommerce.filter(l => l.id !== id))
  const ubahLink = (id, field, value) => setLinkEcommerce(linkEcommerce.map(l => l.id === id ? { ...l, [field]: value } : l))

  // 6. KELOLA GALERI FOTO
  const tanganiPilihGambar = (e) => setFileGaleri([...fileGaleri, ...Array.from(e.target.files)])
  const hapusPratinjauLama = (index) => setPratinjauGaleri(pratinjauGaleri.filter((_, i) => i !== index))
  const hapusFileBaru = (index) => setFileGaleri(fileGaleri.filter((_, i) => i !== index))

  // 7. GENERATOR AI GEMINI
  const buatDeskripsiAI = async () => {
    if (!form.nama) return alert("Mohon isi Nama Produk terlebih dahulu.")
    setSedangGenerateAI(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error("API Key Gemini tidak ditemukan.")

      const prompt = `Buatkan deskripsi produk untuk e-commerce fashion eksklusif. Nama Produk: "${form.nama}". Kategori: "${form.kategori || 'Pakaian'}". Syarat: Tulis 2 paragraf elegan, tonjolkan kesan premium, hindari format bintang tebal berlebihan.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })

      if (!response.ok) throw new Error("Gagal menghubungi AI.")
      const data = await response.json()
      setForm(prev => ({ ...prev, deskripsi: data.candidates[0].content.parts[0].text.trim() }))
    } catch (error) { alert("Error AI: " + error.message) } 
    finally { setSedangGenerateAI(false) }
  }

  // 8. SIMPAN & HAPUS PRODUK
  const simpanProduk = async (e) => {
    e.preventDefault()
    if(skus.length === 0) return alert('Tambahkan minimal 1 varian produk!')
    if(pratinjauGaleri.length === 0 && fileGaleri.length === 0) return alert('Wajib ada minimal 1 foto produk!')
    
    setSedangProses(true)
    try {
      let arrayGaleri = [...pratinjauGaleri]
      if (fileGaleri.length > 0) {
        for (let file of fileGaleri) {
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
          const { error: upErr } = await supabase.storage.from('products').upload(fileName, file)
          if (upErr) throw upErr
          const { data } = supabase.storage.from('products').getPublicUrl(fileName)
          arrayGaleri.push(data.publicUrl)
        }
      }

      const totalStok = skus.reduce((a, b) => a + (b.stok || 0), 0)
      let finalStatus = form.status
      if (totalStok <= 0 && finalStatus === 'Tersedia') finalStatus = 'Sold Out'
      if (totalStok > 0 && finalStatus === 'Sold Out') finalStatus = 'Tersedia'

      const payload = { 
        nama: form.nama, harga: parseFloat(form.harga), harga_diskon: form.harga_diskon ? parseFloat(form.harga_diskon) : null,
        deskripsi: form.deskripsi, kategori: form.kategori, status: finalStatus, wa_aktif: form.wa_aktif,
        stok: totalStok, skus: skus, galeri: arrayGaleri, gambar: arrayGaleri[0], link_ecommerce: linkEcommerce
      }

      if (produkEditId) await supabase.from('products').update(payload).eq('id', produkEditId)
      else await supabase.from('products').insert([payload])
      
      setModalTerbuka(false); muatData()
    } catch (f) { alert('Gagal menyimpan: ' + f.message) }
    finally { setSedangProses(false) }
  }

  const hapusProduk = async (id) => {
    if (confirm('Hapus produk secara permanen?')) { await supabase.from('products').delete().eq('id', id); muatData() }
  }

  // 9. HELPER UI
  const getStatusColor = (status) => status === 'Pre-Order' ? 'badge-warning' : status === 'Sold Out' ? 'badge-danger' : 'badge-success'
  const totalNilaiAset = daftarProduk.reduce((total, p) => total + (p.harga * (p.stok || 0)), 0)

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <nav className="sidebar-nav">
        <div className="brand-logo"><span className="logo-text">AM</span></div>
        <div className="nav-links">
          <button className={`nav-btn ${tabAktif === 'dashboard' ? 'active' : ''}`} onClick={() => setTabAktif('dashboard')}><Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><span className="nav-label">Dashboard</span></button>
          <button className={`nav-btn ${tabAktif === 'products' ? 'active' : ''}`} onClick={() => setTabAktif('products')}><Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><span className="nav-label">Katalog</span></button>
          <button className={`nav-btn ${tabAktif === 'orders' ? 'active' : ''}`} onClick={() => setTabAktif('orders')}><Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" /><span className="nav-label">Pesanan Masuk</span></button>
          <button className={`nav-btn ${tabAktif === 'settings' ? 'active' : ''}`} onClick={() => setTabAktif('settings')}><Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2z" /><span className="nav-label">Master Data</span></button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <div className="scroll-area">
          <header className="page-header"><h1 className="page-title">{tabAktif === 'products' ? 'Manajemen Katalog' : tabAktif === 'settings' ? 'Master Data' : tabAktif === 'orders' ? 'Log Pesanan' : 'Dashboard Ringkasan'}</h1></header>

          {sedangMemuat ? (
            <div className="loading-wrapper"><div className="spinner"></div></div>
          ) : (
            <div className="content-inner">
              
              {/* TAB 1: DASHBOARD RINGKASAN */}
              {tabAktif === 'dashboard' && (
                <div className="dashboard-stats">
                  <div className="stat-box">
                    <div className="stat-icon-wrap"><Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" size={24} /></div>
                    <div><p className="stat-title">Total Produk Aktif</p><h2 className="stat-number">{daftarProduk.length} Item</h2></div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon-wrap"><Icon path="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={24} /></div>
                    <div><p className="stat-title">Estimasi Valuasi Aset</p><h2 className="stat-number">Rp {totalNilaiAset.toLocaleString('id-ID')}</h2></div>
                  </div>
                </div>
              )}

              {/* TAB 2: KATALOG PRODUK */}
              {tabAktif === 'products' && (
                <>
                  <div className="toolbar">
                    <div className="search-bar"><Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35" size={18} /><input type="text" placeholder="Cari produk..." value={kataKunciCari} onChange={(e) => setKataKunciCari(e.target.value)} /></div>
                  </div>
                  
                  <div className="product-grid">
                    {daftarProduk.filter(p => p.nama.toLowerCase().includes(kataKunciCari.toLowerCase())).map(p => (
                      <div key={p.id} className="card-product">
                        <div className="card-image-wrapper">
                          <img src={p.gambar} alt={p.nama} className="card-image" />
                          {p.harga_diskon && <span className="badge-sale" style={{position: 'absolute', top: 12, right: 12}}>SALE</span>}
                          {p.galeri && p.galeri.length > 1 && <span className="badge-gallery"><Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={12}/> {p.galeri.length} Foto</span>}
                        </div>
                        
                        <div className="card-body">
                          <div className="card-meta">
                            <span className="text-category">{p.kategori || 'Koleksi'}</span>
                            <div className="meta-right">
                              <span className="text-stock">{p.stok || 0} Pcs</span>
                              <span className={`status-badge ${getStatusColor(p.status || 'Tersedia')}`}>{p.status || 'Tersedia'}</span>
                            </div>
                          </div>
                          <h3 className="card-title">{p.nama}</h3>
                          
                          <div className="card-footer">
                            <div className="price-group">
                              {p.harga_diskon && <span className="price-strike">Rp {p.harga.toLocaleString('id-ID')}</span>}
                              <span className="price-final">Rp {(p.harga_diskon || p.harga).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="action-icons">
                              <button className="icon-btn" onClick={() => bukaModal(p)}><Icon path="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={16} /></button>
                              <button className="icon-btn danger" onClick={() => hapusProduk(p.id)}><Icon path="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={16} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 3: PESANAN MASUK */}
              {tabAktif === 'orders' && (
                daftarPesanan.length === 0 ? (
                  <div className="empty-state"><Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" size={48} /><p>Belum ada histori pesanan.</p></div>
                ) : (
                  <div className="order-grid">
                    {daftarPesanan.map(o => (
                      <div key={o.id} className="order-card">
                        <div className="order-header">
                          <span className="order-date">{new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="order-price">Rp {o.product_price.toLocaleString('id-ID')}</span>
                        </div>
                        <h4 className="order-client">{o.customer_name}</h4>
                        <div className="order-details">
                          <p><Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" size={12}/> {o.customer_phone}</p>
                          <p><Icon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" size={12}/> {o.product_name}</p>
                          <p><Icon path="M4 6h16 M4 12h16 M4 18h7" size={12}/> {o.size_selected}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* TAB 4: MASTER DATA KATEGORI */}
              {tabAktif === 'settings' && (
                <div className="settings-layout">
                  <div className="card-glass">
                    <div className="card-glass-header">
                      <Icon path="M4 6h16 M4 12h16 M4 18h7" size={24} />
                      <div><h3>Manajemen Kategori</h3><p>Kategorikan produk untuk mempermudah pencarian.</p></div>
                    </div>
                    <form onSubmit={tambahKategori} className="input-group-mobile">
                      <input type="text" placeholder="Cth: Blazer, Sepatu..." value={inputKategoriBaru} onChange={e => setInputKategoriBaru(e.target.value)} required />
                      <button type="submit" className="btn-secondary">Simpan</button>
                    </form>
                    <div className="list-group">
                      {daftarKategori.map(kat => (
                        <div key={kat.id} className="list-item">
                          <span>{kat.nama}</span>
                          <button className="btn-icon-only" onClick={() => hapusKategori(kat.id)}><Icon path="M18 6L6 18 M6 6l12 12" size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* FAB TOMBOL TAMBAH UNTUK MOBILE */}
      {tabAktif === 'products' && <button className="fab" onClick={() => bukaModal()}><Icon path="M12 5v14 M5 12h14" size={24} /></button>}

      {/* =======================================================
          MODAL FORMULIR TAMBAH / EDIT PRODUK LENGKAP
      ======================================================= */}
      {modalTerbuka && (
        <div className="drawer-overlay">
          <div className="drawer-content">
            <div className="drawer-header">
              <h2>{produkEditId ? 'Edit Katalog' : 'Katalog Baru'}</h2>
              <button className="btn-close" onClick={() => setModalTerbuka(false)}><Icon path="M18 6L6 18 M6 6l12 12" size={20} /></button>
            </div>
            
            <form onSubmit={simpanProduk} className="form-layout">
              <div className="form-group full-width">
                <label>Nama Produk</label>
                <input type="text" className="input-clean" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required />
              </div>
              <div className="form-row-mobile">
                <div className="form-group"><label>Harga Normal</label><input type="number" className="input-clean" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} required /></div>
                <div className="form-group"><label>Harga Diskon</label><input type="number" className="input-clean" value={form.harga_diskon} onChange={e => setForm({...form, harga_diskon: e.target.value})} /></div>
              </div>
              <div className="form-row-mobile">
                <div className="form-group">
                  <label>Kategori</label>
                  <select className="input-clean" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} required>
                    <option value="" disabled>Pilih...</option>
                    {daftarKategori.map(kat => <option key={kat.id} value={kat.nama}>{kat.nama}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Status Manual</label><select className="input-clean" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="Tersedia">Tersedia</option><option value="Pre-Order">Pre-Order</option></select></div>
              </div>

              {/* SKU BUILDER (VARIAN & UKURAN) */}
              <div className="sku-builder">
                <div className="sku-header"><label>Atur Varian, Ukuran & Stok</label><button type="button" className="btn-add-sku" onClick={tambahSku}>+ Tambah Baris</button></div>
                {skus.map((sku) => (
                  <div key={sku.id} className="sku-row">
                    <input type="text" placeholder="Varian (Cth: Hitam)" className="input-clean flex-2" value={sku.varian} onChange={e => ubahSku(sku.id, 'varian', e.target.value)} required />
                    <input type="text" placeholder="Ukuran (Cth: L)" className="input-clean flex-1" value={sku.ukuran} onChange={e => ubahSku(sku.id, 'ukuran', e.target.value)} required />
                    <input type="number" placeholder="Stok" className="input-clean flex-1 text-center" value={sku.stok} onChange={e => ubahSku(sku.id, 'stok', e.target.value)} min="0" required />
                    {skus.length > 1 && <button type="button" className="btn-remove-sku" onClick={() => hapusSku(sku.id)}>✕</button>}
                  </div>
                ))}
              </div>

              {/* DESKRIPSI & GENERATOR AI */}
              <div className="form-group full-width">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}>Deskripsi Lengkap</label>
                  <button type="button" className="btn-ai" onClick={buatDeskripsiAI} disabled={sedangGenerateAI}>
                    {sedangGenerateAI ? (
                      <><div className="spinner-small" style={{ borderColor: 'rgba(10,17,14,0.3)', borderTopColor: '#0A110E' }}></div> Merangkai kata...</>
                    ) : (
                      <>✨ Buat dengan AI</>
                    )}
                  </button>
                </div>
                <textarea className="input-clean" rows="4" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} required placeholder="Ketik manual atau gunakan tombol AI di atas..."></textarea>
              </div>
              
              {/* OMNICHANNEL (WA & E-COMMERCE) */}
              <div className="omnichannel-builder">
                <div className="omnichannel-header"><label>Jalur Pembelian</label></div>
                
                <div className="toggle-row">
                  <div>
                    <strong>Pemesanan via WhatsApp</strong>
                    <p>Pembeli bisa mengisi form alamat & order via WA.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={form.wa_aktif} onChange={e => setForm({...form, wa_aktif: e.target.checked})} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="ecommerce-section">
                  <div className="ecommerce-header">
                    <strong>Tautan E-Commerce (Opsional)</strong>
                    {linkEcommerce.length < 3 && <button type="button" className="btn-add-link" onClick={tambahLink}>+ Tambah Link</button>}
                  </div>
                  
                  {linkEcommerce.map(link => (
                    <div key={link.id} className="ecommerce-row">
                      <select className="input-clean flex-1" value={link.nama} onChange={e => ubahLink(link.id, 'nama', e.target.value)}>
                        <option value="Shopee">Shopee</option>
                        <option value="Tokopedia">Tokopedia</option>
                        <option value="Lazada">Lazada</option>
                        <option value="Tiktok Shop">Tiktok Shop</option>
                        <option value="Website">Website Lain</option>
                      </select>
                      <input type="url" placeholder="https://shopee.co.id/..." className="input-clean flex-2" value={link.url} onChange={e => ubahLink(link.id, 'url', e.target.value)} required />
                      <button type="button" className="btn-remove-sku" onClick={() => hapusLink(link.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* GALERI MULTI GAMBAR */}
              <div className="form-group full-width">
                <label>Galeri Foto (Bisa upload banyak)</label>
                <div className="gallery-preview">
                  {pratinjauGaleri.map((url, i) => (
                    <div key={'old'+i} className="gallery-item"><img src={url} alt="" /><button type="button" className="btn-remove-img" onClick={() => hapusPratinjauLama(i)}>✕</button></div>
                  ))}
                  {fileGaleri.map((file, i) => (
                    <div key={'new'+i} className="gallery-item new"><img src={URL.createObjectURL(file)} alt="" /><button type="button" className="btn-remove-img" onClick={() => hapusFileBaru(i)}>✕</button></div>
                  ))}
                  <label className="upload-box"><Icon path="M12 5v14 M5 12h14" size={24} /><input type="file" multiple accept="image/*" onChange={tanganiPilihGambar} className="file-hidden" /></label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-text" onClick={() => setModalTerbuka(false)}>Batal</button>
                <button type="submit" disabled={sedangProses} className="btn-primary">{sedangProses ? 'Menyimpan Data...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- KUMPULAN CSS --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; background: #0A110E; color: #E8ECEA; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent;}
        .app-container { display: flex; height: 100vh; overflow: hidden; }
        .sidebar-nav { display: none; }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .scroll-area { flex: 1; overflow-y: auto; padding: 0 20px 40px; }
        .page-header { padding: 32px 0 24px; } .page-title { font-size: 24px; font-weight: 700; color: #FFF; margin: 0; }
        .toolbar { margin-bottom: 24px; } .search-bar { display: flex; align-items: center; background: #121C18; border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 14px; }
        .search-bar input { background: transparent; border: none; color: #FFF; width: 100%; outline: none; margin-left: 10px; font-family: inherit;}
        
        /* Dashboard & Orders */
        .dashboard-stats { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px;}
        .stat-box { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 24px; padding: 32px; flex: 1; min-width: 250px; display: flex; align-items: flex-start; gap: 24px; }
        .stat-icon-wrap { background: rgba(226,199,146,0.1); color: #E2C792; padding: 16px; border-radius: 16px; }
        .stat-title { font-size: 14px; color: #8CA69D; margin: 0 0 8px 0; }
        .stat-number { font-size: 28px; font-weight: 700; color: #FFF; margin: 0; word-wrap: break-word; }
        
        .order-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .order-card { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
        .order-date { font-size: 12px; color: #8CA69D; }
        .order-price { font-size: 16px; font-weight: 700; color: #E2C792; }
        .order-client { margin: 0; font-size: 18px; color: #FFF; font-weight: 600; }
        .order-details { display: flex; flex-direction: column; gap: 8px; }
        .order-details p { margin: 0; font-size: 13px; color: #E8ECEA; display: flex; align-items: center; gap: 8px; opacity: 0.9; }

        /* Master Data Settings */
        .settings-layout { display: flex; flex-direction: column; gap: 24px; max-width: 100%; }
        .card-glass { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 20px; padding: 32px; }
        .card-glass-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 24px; color: #E2C792; }
        .card-glass-header h3 { margin: 0 0 6px 0; font-size: 18px; color: #FFF; }
        .card-glass-header p { margin: 0; font-size: 13px; color: #8CA69D; }
        .input-group-mobile { display: flex; gap: 12px; margin-bottom: 24px; }
        .input-group-mobile input { flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #FFF; padding: 14px 16px; border-radius: 12px; outline: none; font-family: inherit; }
        .btn-secondary { background: rgba(255,255,255,0.05); color: #FFF; border: 1px solid rgba(255,255,255,0.1); padding: 14px 20px; border-radius: 12px; font-weight: 500; cursor: pointer; }
        .list-group { display: flex; flex-direction: column; gap: 8px; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: rgba(255,255,255,0.02); border-radius: 12px; font-size: 14px; border: 1px solid rgba(255,255,255,0.02); }
        .btn-icon-only { background: none; border: none; color: #666; cursor: pointer; }

        /* CARD PRODUCT */
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .card-product { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column;}
        .card-image-wrapper { height: 220px; background: #0E1613; position: relative; padding: 16px;}
        .card-image { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
        .badge-sale { background: rgba(10,17,14,0.8); color: #FFF; font-size: 10px; font-weight: 700; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .badge-gallery { position: absolute; bottom: 24px; right: 24px; background: rgba(0,0,0,0.7); color: #FFF; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 8px; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px);}
        .card-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
        .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .text-category { font-size: 12px; color: #8CA69D; font-weight: 600; text-transform: uppercase; }
        .meta-right { display: flex; gap: 8px; align-items: center; }
        .text-stock { font-size: 12px; color: #8CA69D; }
        .status-badge { font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase;}
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34D399; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #F87171; }
        .card-title { font-size: 16px; margin: 0 0 24px 0; color: #FFF; line-height: 1.4;}
        .card-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto;}
        .price-group { display: flex; flex-direction: column; gap: 2px; }
        .price-strike { font-size: 12px; color: #666; text-decoration: line-through; }
        .price-final { font-size: 18px; font-weight: 700; color: #E2C792; }
        .action-icons { display: flex; gap: 8px; }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); background: transparent; color: #8CA69D; cursor: pointer; display: flex; justify-content: center; align-items: center; }
        .icon-btn.danger { color: #EF4444; border-color: rgba(239,68,68,0.2); }
        .fab { position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; background: #E2C792; color: #0A110E; border: none; border-radius: 20px; display: flex; justify-content: center; align-items: center; z-index: 40; box-shadow: 0 8px 24px rgba(226,199,146,0.3); }
        
        /* MODAL */
        .drawer-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; justify-content: center; align-items: flex-end; }
        .drawer-content { width: 100%; max-width: 600px; height: 95vh; background: #121C18; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; }
        .drawer-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .drawer-header h2 { margin: 0; font-size: 18px; color: #FFF; }
        .btn-close { background: none; border: none; color: #8CA69D; cursor: pointer; }
        .form-layout { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 13px; color: #8CA69D; }
        .input-clean { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #FFF; padding: 14px; border-radius: 12px; outline: none; font-family: inherit; width: 100%;}
        .form-row-mobile { display: flex; gap: 16px; flex-direction: column; }
        .text-center { text-align: center; }
        .btn-primary { background: #E2C792; color: #0A110E; border: none; padding: 16px; border-radius: 16px; font-weight: 700; width: 100%; font-size: 15px; margin-top: 10px; cursor: pointer;}
        .form-actions { display: flex; justify-content: flex-end; gap: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;}
        .btn-text { background: none; border: none; color: #8CA69D; font-weight: 500; cursor: pointer; padding: 14px 20px; }
        
        /* TOMBOL AI */
        .btn-ai { background: linear-gradient(135deg, #E2C792 0%, #D4AF37 100%); color: #0A110E; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 10px rgba(226,199,146,0.3); transition: 0.2s; }
        .btn-ai:disabled { opacity: 0.7; cursor: wait; }
        
        /* OMNICHANNEL & SKU BUILDER */
        .sku-builder, .omnichannel-builder { background: rgba(226,199,146,0.02); border: 1px solid rgba(226,199,146,0.1); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .sku-header, .omnichannel-header { display: flex; justify-content: space-between; align-items: center; }
        .sku-header label, .omnichannel-header label { font-size: 13px; color: #E2C792; font-weight: 600; }
        .btn-add-sku, .btn-add-link { background: rgba(226,199,146,0.1); color: #E2C792; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .sku-row, .ecommerce-row { display: flex; gap: 8px; align-items: center; }
        .flex-2 { flex: 2; } .flex-1 { flex: 1; }
        .btn-remove-sku { background: rgba(239,68,68,0.1); color: #EF4444; border: none; width: 44px; height: 44px; border-radius: 12px; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 12px;}
        
        /* TOGGLE SWITCH */
        .toggle-row { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .toggle-row strong { font-size: 14px; color: #FFF; display: block; margin-bottom: 4px;}
        .toggle-row p { margin: 0; font-size: 11px; color: #8CA69D; }
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0;}
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .3s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(20px); }
        .ecommerce-section { margin-top: 12px; padding-top: 16px; border-top: 1px dashed rgba(226,199,146,0.1); }
        .ecommerce-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .ecommerce-header strong { font-size: 13px; color: #FFF; }

        /* GALLERY STYLES */
        .gallery-preview { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
        .gallery-item { position: relative; width: 80px; height: 80px; border-radius: 12px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-item.new::after { content: 'NEW'; position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(16,185,129,0.8); color: #FFF; font-size: 8px; text-align: center; padding: 2px 0; font-weight: 800; }
        .btn-remove-img { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #FFF; border: none; width: 20px; height: 20px; border-radius: 50%; font-size: 10px; cursor: pointer; }
        .upload-box { width: 80px; height: 80px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px; display: flex; justify-content: center; align-items: center; cursor: pointer; flex-shrink: 0; color: #8CA69D; }
        .file-hidden { display: none; }
        
        .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFF; border-radius: 50%; animation: spin 1s linear infinite; }
        .spinner { width: 32px; height: 32px; border: 3px solid rgba(226,199,146,0.2); border-top-color: #E2C792; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (min-width: 768px) {
           .sidebar-nav { display: flex; width: 260px; flex-direction: column; background: #0E1613; padding: 24px; border-right: 1px solid rgba(255,255,255,0.05); }
           .nav-links { display: flex; flex-direction: column; gap: 8px; margin-top: 32px;}
           .nav-btn { display: flex; gap: 12px; padding: 12px; background: transparent; color: #8CA69D; border: none; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 500;}
           .nav-btn.active { background: rgba(226,199,146,0.1); color: #E2C792; }
           .fab { display: none; }
           .form-row-mobile { flex-direction: row; }
           .input-group-mobile { flex-direction: row; }
           .drawer-overlay { justify-content: flex-end; align-items: stretch;}
           .drawer-content { height: 100vh; border-radius: 24px 0 0 24px;}
        }
      `}</style>
    </div>
  )
}
