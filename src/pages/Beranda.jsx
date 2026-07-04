import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function Beranda() {
  const [daftarProduk, setDaftarProduk] = useState([])
  const [sedangMemuat, setSedangMemuat] = useState(true)
  const [produkTerpilih, setProdukTerpilih] = useState(null)
  const [modeCheckout, setModeCheckout] = useState(false)
  const [sedangMengirim, setSedangMengirim] = useState(false)
  
  // State untuk Detail Produk (Galeri & Varian Aktif)
  const [gambarUtama, setGambarUtama] = useState('')
  const [form, setForm] = useState({ nama: '', whatsapp: '', alamat: '', varian: '', ukuran: '', jumlah: 1, catatan: '' })

  useEffect(() => {
    async function ambilProduk() {
      try {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false })
        if (!error && data) setDaftarProduk(data)
      } catch (error) { console.error(error) } 
      finally { setSedangMemuat(false) }
    }
    ambilProduk()
  }, [])

  const bukaDetail = (produk) => {
    if (produk.status === 'Sold Out') return
    setProdukTerpilih(produk)
    setGambarUtama(produk.galeri && produk.galeri.length > 0 ? produk.galeri[0] : produk.gambar)
    setForm({ nama: '', whatsapp: '', alamat: '', varian: '', ukuran: '', jumlah: 1, catatan: '' })
  }

  const tanganiInput = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  
  const ubahVarian = (varianDipilih) => {
    setForm(prev => ({ ...prev, varian: varianDipilih, ukuran: '' }))
  }

  const aturJumlah = (aksi) => setForm(prev => ({ ...prev, jumlah: aksi === 'tambah' ? prev.jumlah + 1 : (prev.jumlah > 1 ? prev.jumlah - 1 : 1) }))

  const kirimKeWhatsApp = async (e) => {
    e.preventDefault()
    if (!form.nama || !form.whatsapp || !form.alamat || !form.varian || !form.ukuran) {
      alert("Mohon lengkapi Form Varian, Ukuran, dan Data Pengiriman Anda.")
      return
    }

    setSedangMengirim(true)
    try {
      const hargaFinal = produkTerpilih.harga_diskon || produkTerpilih.harga
      const pesan = 
        `Halo Admin, saya memesan *${produkTerpilih.nama}*.\n\n` +
        `👤 *Data Pembeli:*\nNama: ${form.nama}\nWhatsApp: ${form.whatsapp}\nAlamat:\n${form.alamat}\n\n` +
        `🛍️ *Detail Produk:*\n- Varian: ${form.varian}\n- Ukuran: ${form.ukuran}\n- Jumlah: ${form.jumlah} Pcs\n- Harga Total: Rp ${(hargaFinal * form.jumlah).toLocaleString('id-ID')}\n\n` +
        `📝 *Catatan:*\n${form.catatan || '-'}`

      const urlWhatsApp = `https://wa.me/6288218025773?text=${encodeURIComponent(pesan)}` // Ganti Nomor WA Anda
      setProdukTerpilih(null)
      setModeCheckout(false)
      window.open(urlWhatsApp, '_blank')
    } catch (error) { alert(error.message) } 
    finally { setSedangMengirim(false) }
  }

  const getStatusColor = (status) => {
    if (status === 'Pre-Order') return 'badge-warning'
    if (status === 'Sold Out') return 'badge-danger'
    return 'badge-success'
  }

  const daftarVarianUnik = produkTerpilih?.skus ? [...new Set(produkTerpilih.skus.map(s => s.varian))] : []
  const daftarUkuranTersedia = form.varian && produkTerpilih?.skus ? produkTerpilih.skus.filter(s => s.varian === form.varian) : []

  return (
    <div className="store-wrapper">
      
      {/* HEADER & HERO */}
      <header className="store-header">
        <div className="header-top">
          <div><h1 className="brand-name">Atelier Mode</h1><p className="brand-tagline">Koleksi Sandang Eksklusif</p></div>
          <div className="profile-circle">AM</div>
        </div>
        <div className="hero-card">
          <div className="hero-text-container">
            <span className="hero-badge">New Arrival</span>
            <h2 className="hero-title">Elegansi<br/>Musim Ini</h2>
          </div>
          <div className="hero-circle-decoration"></div>
        </div>
      </header>

      {/* KATALOG UTAMA (DIKEMBALIKAN DESAIN MEWAHNYA) */}
      <main className="main-catalog">
        <h3 className="section-title">Katalog Pilihan</h3>
        {sedangMemuat ? (
          <div className="loading-state"><div className="spinner"></div><p>Menyiapkan katalog...</p></div>
        ) : daftarProduk.length === 0 ? (
          <div className="empty-catalog"><p>Belum ada koleksi yang dirilis saat ini.</p></div>
        ) : (
          <div className="catalog-grid">
            {daftarProduk.map((produk) => (
              <div key={produk.id} className="product-card">
                <div className="image-wrapper">
                  <img src={produk.gambar} alt={produk.nama} className="product-image" />
                  <div className="card-badges-top">
                    {produk.harga_diskon && <span className="badge-sale">SALE</span>}
                  </div>
                </div>
                
                <div className="product-info">
                  <div className="product-meta">
                    <span className="text-category">{produk.kategori || 'Koleksi'}</span>
                    <span className={`status-badge ${getStatusColor(produk.status || 'Tersedia')}`}>
                      {produk.status || 'Tersedia'}
                    </span>
                  </div>
                  
                  <h4 className="product-name">{produk.nama}</h4>
                  <p className="product-desc">
                    {produk.deskripsi ? produk.deskripsi.substring(0, 60) + '...' : 'Material premium berkualitas tinggi.'}
                  </p>
                  
                  <div className="price-row">
                    <div className="price-group">
                      {produk.harga_diskon && <span className="price-strike">Rp {produk.harga.toLocaleString('id-ID')}</span>}
                      <span className="price-active">Rp {(produk.harga_diskon || produk.harga).toLocaleString('id-ID')}</span>
                    </div>
                    
                    <button 
                      className={`action-btn ${produk.status === 'Sold Out' ? 'disabled' : ''}`} 
                      onClick={() => bukaDetail(produk)}
                      disabled={produk.status === 'Sold Out'}
                    >
                      {produk.status === 'Sold Out' ? 'Habis' : 'Detail'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETAIL PRODUK (GALERI & DESKRIPSI) */}
      {produkTerpilih && !modeCheckout && (
        <div className="modal-overlay">
          <div className="detail-sheet">
            <div className="sheet-handle" onClick={() => setProdukTerpilih(null)}></div>
            <button className="btn-close-sheet" onClick={() => setProdukTerpilih(null)}>✕</button>
            
            <div className="detail-scroll-area">
              <div className="detail-image-container">
                <img src={gambarUtama} alt="" className="detail-hero-image" />
              </div>
              
              {/* Thumbnail Gallery */}
              {produkTerpilih.galeri && produkTerpilih.galeri.length > 1 && (
                <div className="thumbnail-row">
                  {produkTerpilih.galeri.map((imgUrl, idx) => (
                    <img 
                      key={idx} src={imgUrl} alt="" 
                      className={`thumbnail-img ${gambarUtama === imgUrl ? 'active' : ''}`}
                      onClick={() => setGambarUtama(imgUrl)}
                    />
                  ))}
                </div>
              )}

              <div className="detail-content">
                <div className="detail-meta">
                  <span className="text-category">{produkTerpilih.kategori || 'Koleksi'}</span>
                  <span className={`status-badge ${getStatusColor(produkTerpilih.status)}`}>{produkTerpilih.status}</span>
                </div>
                <h2 className="detail-title">{produkTerpilih.nama}</h2>
                <div className="detail-price-group">
                  {produkTerpilih.harga_diskon && <span className="detail-price-strike">Rp {produkTerpilih.harga.toLocaleString('id-ID')}</span>}
                  <span className="detail-price-active">Rp {(produkTerpilih.harga_diskon || produkTerpilih.harga).toLocaleString('id-ID')}</span>
                </div>
                <div className="detail-description-box">
                  <h4>Tentang Koleksi Ini</h4>
                  <p className="detail-description-text">{produkTerpilih.deskripsi}</p>
                </div>
              </div>
            </div>
            
            {/* OMNICHANNEL BOTTOM BAR */}
            <div className="sticky-bottom-bar">
              {produkTerpilih.link_ecommerce && produkTerpilih.link_ecommerce.length > 0 && (
                <div className="ecommerce-btn-group">
                  {produkTerpilih.link_ecommerce.map(link => (
                    <button key={link.id} className="btn-ecommerce" onClick={() => window.open(link.url, '_blank')}>
                      <Icon path="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" size={18} />
                      Beli via {link.nama}
                    </button>
                  ))}
                </div>
              )}
              
              {produkTerpilih.wa_aktif !== false && (
                <button className="btn-primary" onClick={() => setModeCheckout(true)}>
                  Pesan via WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM CHECKOUT WA */}
      {modeCheckout && produkTerpilih && (
        <div className="checkout-overlay">
          <div className="checkout-wrapper">
            <header className="checkout-header">
              <button className="btn-back" onClick={() => setModeCheckout(false)}><Icon path="M19 12H5 M12 19l-7-7 7-7" size={24} /></button>
              <h1 className="checkout-title">Selesaikan Pesanan</h1>
              <div style={{ width: 24 }}></div>
            </header>

            <form onSubmit={kirimKeWhatsApp} className="checkout-scroll form-padding">
              <div className="product-summary">
                <img src={gambarUtama} alt="" className="summary-thumb" />
                <div>
                  <p className="summary-label">Produk Terpilih</p>
                  <h2 className="summary-product-name">{produkTerpilih.nama}</h2>
                </div>
              </div>

              {/* Pemilihan Varian (Motif/Warna) */}
              <section className="form-section">
                <div className="section-header">
                  <div className="icon-wrap"><Icon path="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34 M18 2l4 4-10 10H8v-4L18 2z" size={18} /></div>
                  <h3>1. Pilih Varian / Motif</h3>
                </div>
                <div className="size-grid">
                  {daftarVarianUnik.map((varian) => (
                    <label key={varian} className={`size-pill ${form.varian === varian ? 'active' : ''}`}>
                      <input type="radio" name="varian" value={varian} checked={form.varian === varian} onChange={() => ubahVarian(varian)} className="hidden-radio" required />
                      {varian}
                    </label>
                  ))}
                </div>
              </section>

              {/* Pemilihan Ukuran */}
              <section className={`form-section ${!form.varian ? 'disabled-section' : ''}`}>
                <div className="section-header">
                  <div className="icon-wrap"><Icon path="M6 9l6 6 6-6" size={18} /></div>
                  <h3>2. Pilih Ukuran <span className="sub-text">(Sesuai Varian)</span></h3>
                </div>
                {!form.varian ? (
                  <p className="hint-text">Pilih varian di atas untuk melihat ukuran.</p>
                ) : (
                  <div className="size-grid">
                    {daftarUkuranTersedia.map((sku) => {
                      const isHabis = sku.stok <= 0;
                      return (
                        <label key={sku.id} className={`size-pill ${form.ukuran === sku.ukuran ? 'active' : ''} ${isHabis ? 'habis' : ''}`}>
                          <input type="radio" name="ukuran" value={sku.ukuran} checked={form.ukuran === sku.ukuran} onChange={tanganiInput} className="hidden-radio" disabled={isHabis} required />
                          {sku.ukuran}
                          {isHabis && <span className="stok-alert">Habis</span>}
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Data Pengiriman */}
              <section className="form-section">
                <div className="section-header">
                  <div className="icon-wrap"><Icon path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={18} /></div>
                  <h3>3. Data Pengiriman</h3>
                </div>
                <div className="input-group">
                  <label>Nama Lengkap <span className="required">*</span></label>
                  <input type="text" name="nama" required value={form.nama} onChange={tanganiInput} className="input-field" placeholder="Masukkan nama Anda" />
                </div>
                <div className="input-group">
                  <label>Nomor WhatsApp <span className="required">*</span></label>
                  <input type="tel" name="whatsapp" required value={form.whatsapp} onChange={tanganiInput} className="input-field" placeholder="Cth: 081234567890" />
                </div>
                <div className="input-group">
                  <label>Alamat Lengkap <span className="required">*</span></label>
                  <textarea name="alamat" required rows="3" value={form.alamat} onChange={tanganiInput} className="input-field textarea" placeholder="Jalan, RT/RW, Desa, Kecamatan, Kota, Kode Pos"></textarea>
                </div>
                
                <div className="form-row">
                  <div className="input-group flex-1">
                    <label>Jumlah Beli</label>
                    <div className="qty-selector">
                      <button type="button" className="qty-btn" onClick={() => aturJumlah('kurang')}><Icon path="M5 12h14" size={16} /></button>
                      <span className="qty-number">{form.jumlah}</span>
                      <button type="button" className="qty-btn" onClick={() => aturJumlah('tambah')}><Icon path="M12 5v14 M5 12h14" size={16} /></button>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label>Catatan Opsional</label>
                  <input type="text" name="catatan" value={form.catatan} onChange={tanganiInput} className="input-field" placeholder="Titip di pos satpam..." />
                </div>
              </section>

              <div className="action-container">
                <button type="submit" disabled={sedangMengirim} className="btn-whatsapp">
                  {sedangMengirim ? <span className="btn-content"><div className="spinner-small"></div> Memproses...</span> : 'Kirim Reservasi via WA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CSS (DIKEMBALIKAN FULL TANPA MINIFIKASI EKSTREM) --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #0A110E; color: #E8ECEA; font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .store-wrapper { min-height: 100vh; padding-bottom: 80px; }
        .store-header { padding: 24px 24px 0 24px; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; background: #0E1613; border-bottom: 1px solid rgba(226,199,146,0.05); padding-bottom: 32px; margin-bottom: 32px; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .brand-name { font-size: 24px; font-weight: 700; color: #E2C792; margin: 0; letter-spacing: -0.5px;}
        .brand-tagline { font-size: 12px; color: #8CA69D; margin: 4px 0 0 0; }
        .profile-circle { width: 44px; height: 44px; border-radius: 50%; background: rgba(226,199,146,0.1); color: #E2C792; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 14px; border: 1px solid rgba(226,199,146,0.2); }
        .hero-card { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 32px; padding: 32px; position: relative; overflow: hidden; }
        .hero-text-container { position: relative; z-index: 2; }
        .hero-badge { background: rgba(226, 199, 146, 0.15); color: #E2C792; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .hero-title { font-size: 32px; margin: 16px 0; line-height: 1.2; font-weight: 700; color: #FFF; letter-spacing: -1px; }
        .hero-circle-decoration { position: absolute; right: -40px; bottom: -40px; width: 160px; height: 160px; background: rgba(226,199,146,0.03); border-radius: 50%; z-index: 1; border: 1px solid rgba(226,199,146,0.1); }
        
        /* KATALOG UTAMA (VERSI MEWAH KEMBALI) */
        .main-catalog { padding: 0 24px; max-width: 1200px; margin: 0 auto; }
        .section-title { font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #FFF; }
        .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .product-card { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 24px; padding: 16px; display: flex; align-items: center; gap: 20px; transition: 0.3s; }
        .product-card:active { transform: scale(0.98); }
        .image-wrapper { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
        .product-image { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
        .card-badges-top { position: absolute; top: -8px; left: -8px; }
        .badge-sale { background: #EF4444; color: #FFF; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 4px 10px rgba(239,68,68,0.3); }
        
        .product-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .product-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .text-category { font-size: 11px; font-weight: 600; color: #8CA69D; text-transform: uppercase; }
        .status-badge { font-size: 9px; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34D399; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #F87171; }
        
        .product-name { font-size: 16px; margin: 0 0 6px 0; font-weight: 600; color: #FFF; }
        .product-desc { font-size: 12px; color: #8CA69D; margin: 0 0 16px 0; line-height: 1.4; }
        .price-row { display: flex; justify-content: space-between; align-items: flex-end; }
        .price-group { display: flex; flex-direction: column; gap: 2px; }
        .price-strike { font-size: 11px; color: #666; text-decoration: line-through; }
        .price-active { font-size: 16px; font-weight: 700; color: #E2C792; }
        
        .action-btn { background: rgba(226,199,146,0.1); color: #E2C792; border: 1px solid rgba(226,199,146,0.2); padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .action-btn.disabled { background: rgba(255,255,255,0.05); color: #666; border-color: transparent; cursor: not-allowed; }

        /* MODAL DETAIL SHEET */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; flex-direction: column; justify-content: flex-end; z-index: 9999; }
        .detail-sheet { background: #0A110E; width: 100%; height: 90vh; border-top-left-radius: 32px; border-top-right-radius: 32px; display: flex; flex-direction: column; position: relative; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-top: 1px solid rgba(255,255,255,0.05); }
        .sheet-handle { width: 100%; height: 30px; display: flex; justify-content: center; align-items: center; cursor: pointer; position: absolute; top: 0; z-index: 10; }
        .sheet-handle::after { content: ''; width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 4px; }
        .btn-close-sheet { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.5); color: #FFF; border: none; font-size: 16px; z-index: 10; cursor: pointer; backdrop-filter: blur(4px); }
        
        .detail-scroll-area { flex: 1; overflow-y: auto; padding-bottom: 120px; }
        .detail-image-container { width: 100%; height: 350px; background: #0E1613; border-top-left-radius: 32px; border-top-right-radius: 32px; overflow: hidden; }
        .detail-hero-image { width: 100%; height: 100%; object-fit: cover; }
        
        /* Thumbnails */
        .thumbnail-row { display: flex; gap: 12px; padding: 16px 24px 0 24px; overflow-x: auto; }
        .thumbnail-img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; opacity: 0.5; cursor: pointer; border: 2px solid transparent; transition: 0.2s;}
        .thumbnail-img.active { opacity: 1; border-color: #E2C792; }

        .detail-content { padding: 24px; }
        .detail-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .detail-title { font-size: 24px; font-weight: 700; color: #FFF; margin: 0 0 12px 0; }
        .detail-price-group { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .detail-price-strike { font-size: 14px; color: #666; text-decoration: line-through; }
        .detail-price-active { font-size: 24px; font-weight: 800; color: #E2C792; margin: 0; }
        .detail-description-box h4 { font-size: 16px; color: #FFF; margin: 0 0 12px 0; }
        .detail-description-text { font-size: 14px; color: #8CA69D; line-height: 1.6; margin: 0; white-space: pre-wrap; }
        
        /* OMNICHANNEL BOTTOM BAR */
        .sticky-bottom-bar { position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 24px 24px 24px; background: linear-gradient(to top, #0A110E 80%, transparent); display: flex; flex-direction: column; gap: 12px;}
        .ecommerce-btn-group { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; }
        .btn-ecommerce { flex-shrink: 0; background: rgba(226,199,146,0.05); border: 1px solid rgba(226,199,146,0.3); color: #E2C792; padding: 14px 20px; border-radius: 16px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .btn-ecommerce:active { background: rgba(226,199,146,0.15); }
        .btn-primary { width: 100%; background: #E2C792; color: #0A110E; border: none; padding: 16px; border-radius: 20px; font-weight: 700; font-size: 16px; display: flex; justify-content: center; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(226,199,146,0.2); }

        /* CHECKOUT FULL SCREEN */
        .checkout-overlay { position: fixed; inset: 0; background: #0A110E; z-index: 9999; display: flex; justify-content: center; animation: slideLeft 0.3s ease; }
        .checkout-wrapper { width: 100%; max-width: 600px; display: flex; flex-direction: column; height: 100%; }
        .checkout-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(10, 17, 14, 0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 10; }
        .btn-back { background: none; border: none; color: #8CA69D; padding: 4px; display: flex; cursor: pointer; }
        .checkout-title { font-size: 16px; font-weight: 600; color: #FFF; margin: 0; }
        .checkout-scroll { flex: 1; overflow-y: auto; padding-bottom: 40px; }
        
        .product-summary { padding: 24px; display: flex; gap: 16px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .summary-thumb { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; }
        .summary-label { font-size: 11px; color: #8CA69D; text-transform: uppercase; font-weight: 600; margin: 0 0 4px 0; }
        .summary-product-name { font-size: 18px; color: #E2C792; font-weight: 700; margin: 0; }

        .form-padding { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        .form-section { background: #121C18; border: 1px solid rgba(255,255,255,0.04); border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 20px; transition: 0.3s; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .icon-wrap { background: rgba(226,199,146,0.1); color: #E2C792; padding: 8px; border-radius: 12px; display: flex; justify-content: center; align-items: center; }
        .section-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #FFF; }
        
        .form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 500; color: #8CA69D; padding-left: 4px; }
        .required { color: #EF4444; }
        .optional { font-size: 11px; color: #666; font-weight: 400; }
        .sub-text { font-size: 11px; color: #8CA69D; font-weight: 400; }
        .hint-text { font-size: 13px; color: #E2C792; font-style: italic; margin: 0; }
        .disabled-section { opacity: 0.5; pointer-events: none; }
        
        .input-field { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); color: #FFF; padding: 16px 20px; border-radius: 16px; font-size: 14px; font-family: inherit; outline: none; transition: 0.3s; width: 100%; }
        .input-field::placeholder { color: #556B61; }
        .input-field:focus { border-color: #E2C792; background: rgba(226,199,146,0.03); }
        .textarea { resize: none; min-height: 100px; }
        
        .size-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .size-pill { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); color: #8CA69D; padding: 14px 20px; border-radius: 16px; font-size: 14px; font-weight: 600; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;}
        .size-pill.active { background: rgba(226,199,146,0.1); border-color: #E2C792; color: #E2C792; }
        .size-pill.habis { opacity: 0.3; text-decoration: line-through; cursor: not-allowed; }
        .hidden-radio { display: none; }
        .stok-alert { font-size: 9px; color: #EF4444; margin-top: 4px; text-decoration: none;}
        
        .qty-selector { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 4px; height: 53px; }
        .qty-btn { background: transparent; border: none; color: #E2C792; width: 44px; height: 100%; border-radius: 12px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; }
        .qty-btn:active { background: rgba(226,199,146,0.1); }
        .qty-number { font-size: 16px; font-weight: 600; color: #FFF; width: 32px; text-align: center; }
        
        .action-container { margin-top: 12px; position: sticky; bottom: 20px; z-index: 10; }
        .btn-whatsapp { width: 100%; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #FFF; border: none; padding: 18px; border-radius: 20px; font-weight: 700; font-size: 16px; font-family: inherit; cursor: pointer; box-shadow: 0 10px 25px rgba(37, 211, 102, 0.25); transition: 0.3s; }
        .btn-whatsapp:active { transform: scale(0.97); }
        .btn-whatsapp:disabled { opacity: 0.8; cursor: not-allowed; }
        .btn-content { display: flex; align-items: center; justify-content: center; gap: 10px; }
        
        .loading-state, .empty-catalog { text-align: center; padding: 40px; color: #8CA69D; }
        .spinner-small { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #FFF; border-radius: 50%; animation: spin 1s linear infinite; }
        .spinner { width: 32px; height: 32px; border: 3px solid rgba(226,199,146,0.2); border-top-color: #E2C792; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
