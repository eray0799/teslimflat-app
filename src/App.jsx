import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

/** ========== Basit Admin Girişi ========== */
const ADMIN_CODE = "24admin";

/** ========== Supabase REST ayarları ========== */
const SUPABASE_URL = "https://boouupvwgkuptzhujsoj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3V1cHZ3Z2t1cHR6aHVqc29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzI4MzIsImV4cCI6MjA3MzUwODgzMn0.BkH2X5-WEQCW6QljEF-Uu8WAe6WjmPnMCYapcVh8YL0";
const TABLE = "flat24teslimatlar";
const REST_URL = `${SUPABASE_URL}/rest/v1/${TABLE}`;
const REST_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/** ========== Tema / Layout ========== */
function useTheme() {
  useEffect(() => {
    const styleId = "teslim-panel-theme";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        *{box-sizing:border-box}
        html,body,#root{width:100%;height:100%}
        body{background:#f5f7fb;margin:0;overflow-x:hidden}
        .container-fluid{max-width:100vw;padding-left:16px;padding-right:16px}
        .row.g-3{--bs-gutter-x:1rem;--bs-gutter-y:1rem}
        .card{border:0;box-shadow:0 6px 22px rgba(0,0,0,.06)}
        .card-header{background:linear-gradient(180deg,#fff,#f1f4fa);border-bottom:1px solid #e6ebf2}
        .list-group-item{transition:background-color .12s ease}
        .list-group-item:hover{background:#eef5ff}
        .badge.bg-success{background:#169a5a!important}
        .badge.bg-secondary{background:#7a869a!important}
        .btn-outline-primary{border-color:#7aa7ff}
        .btn-outline-primary:hover{background:#e9f2ff}
        .day-box{background:#fff;border:1px solid #e3e9fb;border-left:5px solid #0d6efd}
        .day-head{padding:.5rem .75rem;display:flex;align-items:center;gap:.5rem;background:#f8faff;border-bottom:1px solid #e3e9fb}
        .day-pill{display:inline-flex;align-items:center;gap:.5rem;background:#eaf1ff;border:1px solid #cfe1ff;color:#0b5ed7;padding:.2rem .55rem;border-radius:999px;font-weight:600}
        .day-date{color:#4b5a77;font-weight:500}
        .appt{background:#fff;border:1px solid #e6ebf2}
        .appt:hover{background:#f3f7ff}
        .table td,.table th{vertical-align:middle}
        .form-control,.form-select{height:32px;padding:0 .5rem}
        /* Daire özetinde kompakt bilgi ızgarası */
        .kv{display:grid;grid-template-columns:1fr 1fr;gap:.5rem 1rem}
        .kv>div{background:#fff;border:1px solid #e9eef6;border-radius:.5rem;padding:.5rem .75rem}
        .kv dt{font-size:.8rem;color:#6c757d;margin:0}
        .kv dd{margin:0;font-weight:600}
        @media (max-width: 992px){ .kv{grid-template-columns:1fr} }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

/** ========== Tarih yardımcıları ========== */
const startOfWeek = (date) => { const d=new Date(date); const day=(d.getDay()+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-day); return d; };
const addDays = (date,n)=>{ const d=new Date(date); d.setDate(d.getDate()+n); return d; };
const weekdaysOfWeek = (ws)=>Array.from({length:5},(_,i)=>addDays(ws,i));
const toISODate = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const formatTRDate = (d)=>d.toLocaleDateString("tr-TR",{year:"numeric",month:"2-digit",day:"2-digit"});
const formatTimeStr = (t)=>{ if(!t) return ""; const p=t.split(":"); return `${p[0]}:${p[1]}`; };

/** ========== Donut Grafik (satılanlar üzerinden oran) ========== */
function DonutChart({ title, delivered, remaining, stock=0, baslayanYasam=0, size=180, stroke=28 }) {
  const total = delivered + remaining; // sadece satılanlar
  const deliveredPct = total ? delivered/total : 0;
  const remainingPct = total ? remaining/total : 0;
  const radius=(size-stroke)/2, circ=2*Math.PI*radius;
  const deliveredLen=circ*deliveredPct, remainingLen=circ*remainingPct;
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="mb-2 fw-semibold text-center">{title}</div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size/2},${size/2})`}>
          <circle r={radius} fill="none" stroke="#e9ecef" strokeWidth={stroke}/>
          <circle r={radius} fill="none" stroke="#198754" strokeWidth={stroke}
            strokeDasharray={`${deliveredLen} ${circ-deliveredLen}`} transform="rotate(-90)"/>
          <circle r={radius} fill="none" stroke="#0d6efd" strokeWidth={stroke}
            strokeDasharray={`${remainingLen} ${circ-remainingLen}`} transform={`rotate(${deliveredPct*360-90})`}/>
          <text x="0" y="-8" textAnchor="middle" fontSize="15" fontWeight="600" fill="#212529">Satılan: {total}</text>
          <text x="0" y="14" textAnchor="middle" fontSize="12" fill="#6c757d">Teslim / Kalan</text>
        </g>
      </svg>
      <div className="d-flex flex-column gap-1 mt-2 small text-center">
        <span className="d-inline-flex align-items-center justify-content-center">
          <span style={{width:10,height:10,background:"#198754",display:"inline-block",borderRadius:2}} className="me-1"/>
          Teslim: {delivered} ({total?Math.round(delivered/total*100):0}%)
        </span>
        <span className="d-inline-flex align-items-center justify-content-center">
          <span style={{width:10,height:10,background:"#0d6efd",display:"inline-block",borderRadius:2}} className="me-1"/>
          Kalan: {remaining} ({total?Math.round(remaining/total*100):0}%)
        </span>
        <span className="text-muted">Stok: {stock}</span>
        <span className="text-muted">Başlayan Yaşam: {baslayanYasam}</span>
      </div>
    </div>
  );
}

/** ========== Şema ve izinli alanlar ========== */
const SCHEMA_TYPES = {
  daire:"text", created_at:"timestamp", mal_sahibi:"text", durum:"text",
  blok:"text", no:"int", kat:"int", tip:"text", cephe:"text",
  genel_brut:"numeric", brut:"numeric", net:"numeric",
  satis_tarihi:"date", sozlesme_tarihi:"date",
  acenta:"text", musteri:"text",
  teslim_durumu:"text", teslim_notu:"text",
  teslim_randevu_tarihi:"date", teslim_randevu_saati:"time",
  demirbas:"numeric", aidat:"numeric",
  demirbas_odeme_durumu:"text",
  kdv_muafiyeti:"text", ipotek_durumu:"text", tapu_durumu:"text",
  suzme_sayac:"text" // "takıldı" | "takılmadı"
};
const ALLOW_EDIT_FIELDS = new Set([
  "teslim_randevu_tarihi",
  "teslim_randevu_saati",
  "teslim_durumu",
  "teslim_notu",
  "demirbas_odeme_durumu",
]);

/** ========== Tip dönüştürücü ========== */
function coerceValue(field, value) {
  const t = SCHEMA_TYPES[field] || "text";
  if (value === "" || value === null || value === undefined) return null;
  switch (t) {
    case "int": {
      const n = parseInt(String(value).replace(",", "."), 10);
      return Number.isNaN(n) ? null : n;
    }
    case "numeric": {
      const n = parseFloat(String(value).replace(/\./g, "").replace(",", "."));
      return Number.isNaN(n) ? null : n;
    }
    case "date":
      return String(value);
    case "time": {
      const s = String(value);
      if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
      if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, "0") + ":00";
      return null;
    }
    case "timestamp":
      return String(value);
    default:
      return String(value);
  }
}

/** ========== Normalizasyonlar & yardımcılar ========== */
const isSold = (r)=>Boolean((r.musteri && String(r.musteri).trim()) || r.satis_tarihi);
const isDelivered = (r)=>{ const d=(r.teslim_durumu||"").toLowerCase(); return d.includes("teslim edildi"); };
const statusEq = (r, text)=> ((r?.teslim_durumu || "").toLowerCase() === text.toLowerCase());
const normVarYok = (v)=>{ const s=(v||"").toLowerCase(); if(!s) return "Yok"; if(s.includes("var")) return "Var"; if(s.includes("yok")) return "Yok"; return "Yok"; };
const normTapu = (v)=>{ const s=(v||"").toString().trim(); return s || "Devredilmedi"; };
const normSuzmeTakildi = (v)=>{ const s=(v||"").toLowerCase(); return s.includes("takıldı")||s.includes("takildi"); };
function demirbasState(v){
  const s=(v||"").toLowerCase().trim();
  if (s.includes("ödenmedi")) return "odenmedi";
  if (s.includes("ödendi")) return "odendi";
  return "none";
}
function prettySuzme(v){
  if (v === null || v === undefined || v === "") return "-";
  return normSuzmeTakildi(v) ? "Takıldı" : "Takılmadı";
}
// Acenta / etiket esnek eşleşme (aksan/boşluk farkı, includes)
function slugify(s){
  return String(s||"")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"") // aksanları sil
    .replace(/[^a-z0-9]+/g,"")      // harf/rakam dışını sil
    .trim();
}
function matchPatterns(value, patterns){
  const sv = slugify(value);
  return patterns.some(p => sv.includes(slugify(p)));
}

/** ========== App ========== */
export default function App(){
  useTheme();

  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [isAdmin,setIsAdmin]=useState(()=>window.localStorage.getItem("tp_admin")==="1");
  const [showAllList,setShowAllList]=useState(false);
  const [edit,setEdit]=useState({});
  const [notice,setNotice]=useState("");
  const pkRef=useMemo(()=>selected?selected.daire:null,[selected]);

  const [currentWeekStart,setCurrentWeekStart]=useState(()=>startOfWeek(new Date()));
  const weekDays=useMemo(()=>weekdaysOfWeek(currentWeekStart),[currentWeekStart]);

  /** ---- Veri çek ---- */
  async function fetchAll(){
    setLoading(true); setErr("");
    try{
      const res=await fetch(`${REST_URL}?select=*`,{headers:REST_HEADERS});
      if(!res.ok) throw new Error(`Yükleme hatası: ${res.status} ${res.statusText}`);
      const data=await res.json();
      data.sort((a,b)=>{
        const ab=(a.blok||"").toUpperCase(), bb=(b.blok||"").toUpperCase();
        if(ab===bb){ const an=Number.isFinite(a.no)?a.no:parseInt(a.no,10)||0; const bn=Number.isFinite(b.no)?b.no:parseInt(b.no,10)||0; return an-bn; }
        return ab.localeCompare(bb,"tr");
      });
      setRows(data);
      if(selected){
        const again=data.find(r=>r.daire===selected.daire);
        setSelected(again||null);
        setEdit(again?{...again}:{});
      }
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ fetchAll(); },[]);

  /** ---- Filtre ---- */
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q) return rows;
    return rows.filter(r=>{
      const daire=(r.daire||"").toLowerCase();
      const blok=(r.blok||"").toLowerCase();
      const no=(r.no??"").toString().toLowerCase();
      const musteri=(r.musteri||"").toLowerCase();
      const malSahibi=(r.mal_sahibi||"").toLowerCase();
      const combo1=`${blok}${no}`, combo2=`${blok}-${no}`;
      return (
        daire.includes(q) ||
        blok.includes(q) ||
        no.includes(q) ||
        combo1.includes(q) ||
        combo2.includes(q) ||
        musteri.includes(q) ||
        malSahibi.includes(q)
      );
    });
  },[rows,search]);

  /** ---- Takvim ---- */
  const appointmentsByDay=useMemo(()=>{
    const map={}; weekDays.forEach(d=>map[toISODate(d)]=[]);
    rows.forEach(r=>{ if(!r.teslim_randevu_tarihi) return; const key=r.teslim_randevu_tarihi; if(map[key]) map[key].push(r); });
    Object.keys(map).forEach(k=>map[k].sort((a,b)=>(a.teslim_randevu_saati||"").localeCompare(b.teslim_randevu_saati||"")));
    return map;
  },[rows,weekDays]);

  /** ---- Gruplar & Donut istatistikleri ---- */
  const rows24G=useMemo(
    ()=>rows.filter(r=>matchPatterns(r.acenta, ["24 gayrimenkul","24gayrimenkul","24-gayrimenkul"])),
    [rows]
  );
  const rowsGunesli=useMemo(
    ()=>rows.filter(r=>matchPatterns(r.acenta, ["güneşli proje","gunesli proje","gunesliproje","güneşliproje","gunesli"])),
    [rows]
  );

  const groupStats=(groupRows)=>{
    const sold=groupRows.filter(isSold);
    const delivered=sold.filter(isDelivered).length;
    const remaining=Math.max(sold.length-delivered,0);
    const stock=Math.max(groupRows.length-sold.length,0);
    const baslayanYasam=groupRows.filter(r=>normSuzmeTakildi(r.suzme_sayac)).length;
    return {delivered,remaining,stock,baslayanYasam};
  };
  const statsTotal=useMemo(()=>groupStats(rows),[rows]);
  const stats24=useMemo(()=>groupStats(rows24G),[rows24G]);
  const statsGun=useMemo(()=>groupStats(rowsGunesli),[rowsGunesli]);

  /** ---- REST yardımcıları ---- */
  async function patchByDaire(daireKey,body){
    const res=await fetch(`${REST_URL}?daire=eq.${encodeURIComponent(daireKey)}`,{
      method:"PATCH", headers:REST_HEADERS, body:JSON.stringify(body)
    });
    if(!res.ok){
      let txt="";
      try{ txt=await res.text(); }catch{}
      throw new Error(`Güncelleme hatası: ${res.status} ${res.statusText} ${txt}`);
    }
  }

  /** ---- HERKES: Teslim statüleri ---- */
  async function markDelivered(r){
    if(!r?.daire) return;
    if(statusEq(r,"teslim edildi")) return;
    try{ await patchByDaire(r.daire,{teslim_durumu:"Teslim Edildi"}); await fetchAll(); }
    catch(e){ alert("Güncelleme başarısız: "+e.message); }
  }
  async function markUndelivered(r){
    if(!r?.daire) return;
    if(statusEq(r,"teslim edilmedi")) return;
    try{ await patchByDaire(r.daire,{teslim_durumu:"Teslim Edilmedi"}); await fetchAll(); }
    catch(e){ alert("Güncelleme başarısız: "+e.message); }
  }
  async function markRejected(r){
    if(!r?.daire) return;
    if(statusEq(r,"teslim reddedildi")) return;
    try{ await patchByDaire(r.daire,{teslim_durumu:"Teslim Reddedildi"}); await fetchAll(); }
    catch(e){ alert("Güncelleme başarısız: "+e.message); }
  }

  /** ---- HERKES: Demirbaş Ödendi / Ödenmedi ---- */
  async function setDemirbas(r,ok){
    if(!r?.daire) return;
    const state=demirbasState(r.demirbas_odeme_durumu);
    if((ok && state==="odendi") || (!ok && state==="odenmedi")) return;
    try{ await patchByDaire(r.daire,{demirbas_odeme_durumu: ok?"Ödendi":"Ödenmedi"}); await fetchAll(); }
    catch(e){ alert("Güncelleme başarısız: "+e.message); }
  }

  /** ---- HERKES: Süzme sayaç Takıldı / Takılmadı ---- */
  async function setSuzme(r,takildi){
    if(!r?.daire) return;
    const cur=normSuzmeTakildi(r.suzme_sayac);
    if((takildi && cur) || (!takildi && !cur)) return;
    try{ await patchByDaire(r.daire,{suzme_sayac: takildi?"takıldı":"takılmadı"}); await fetchAll(); }
    catch(e){ alert("Güncelleme başarısız: "+e.message); }
  }

  /** ---- Admin giriş/çıkış ---- */
  function handleLogin(){
    if(isAdmin){ setIsAdmin(false); window.localStorage.removeItem("tp_admin"); return; }
    const code=window.prompt("Giriş kodu:");
    if(code===ADMIN_CODE){ setIsAdmin(true); window.localStorage.setItem("tp_admin","1"); }
    else if(code!==null){ alert("Kod hatalı."); }
  }

  /** ---- Inline edit ---- */
  useEffect(()=>{ setEdit(selected?{...selected}:{}) },[selected]);
  function onEditChange(field,value){ setEdit(p=>({...p,[field]:value})); }
  function isLocked(field){ if(field==="created_at") return true; if(!isAdmin) return true; return !ALLOW_EDIT_FIELDS.has(field); }

  /** ---- Kaydet ---- */
  async function handleSave(){
    if(!isAdmin||!selected) return;
    const original=selected, changed={};
    Object.keys(SCHEMA_TYPES).forEach((k)=>{
      if(!(k in original)&&!(k in edit)) return;
      if(isLocked(k)) return;
      const orig=original[k]??null, nv=coerceValue(k,edit[k]??null);
      const os=orig===null?null:String(orig), ns=nv===null?null:String(nv);
      if(os!==ns) changed[k]=nv;
    });
    if(Object.keys(changed).length===0) return;
    try{
      await patchByDaire(pkRef,changed);
      await fetchAll();
      setNotice("Kaydedildi");
      setTimeout(()=>setNotice(""), 2000);
    }catch(e){
      alert("Kaydetme başarısız: "+e.message);
    }
  }

  /** ---- Liste: 5 ön gösterim + Hepsini Göster ---- */
  const listToShow=useMemo(()=> search.trim()?filtered : (showAllList?filtered:filtered.slice(0,5)), [filtered,search,showAllList]);

  /** ---- UI ---- */
  return (
    <div className="container-fluid py-3">
      {/* Üst bar */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Flat24 Teslim Paneli</h1>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchAll} disabled={loading}>{loading?"Yükleniyor...":"Yenile"}</button>
          <button className={`btn btn-sm ${isAdmin?"btn-danger":"btn-primary"}`} onClick={handleLogin} title={isAdmin?"Çıkış yap":"Giriş yap"}>
            {isAdmin?"Çıkış":"Giriş"}
          </button>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2">Hata: {err}</div>}

      <div className="row g-3">
        {/* SOL: Liste */}
        <div className="col-12 col-lg-3">
          <div className="card h-100">
            <div className="card-header py-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text">Ara</span>
                <input className="form-control" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Örn: A25 / A-25 / A Blok / İsim"/>
              </div>
            </div>
            <div className="card-body p-0" style={{maxHeight:680,overflowY:"auto"}}>
              {listToShow.length===0 && <div className="p-3 text-muted small">Kayıt bulunamadı.</div>}
              <ul className="list-group list-group-flush">
                {listToShow.map(r=>{
                  const delivered=isDelivered(r), active=selected?.daire===r.daire;
                  return (
                    <li key={r.daire||`${r.blok}-${r.no}`} className={`list-group-item d-flex justify-content-between align-items-center ${active?"active":""}`}
                      role="button" onClick={()=>setSelected(r)}
                      style={{background:active?undefined:delivered?"#e8fbf2":undefined,color:active?undefined:delivered?"#157347":undefined}}
                      title={r.daire||`${r.blok}-${r.no}`}>
                      <div className="d-flex flex-column">
                        <span className="fw-semibold">{r.daire||`${r.blok}-${r.no}`}</span>
                        <span className="small text-muted">{r.musteri||r.mal_sahibi||"-"}</span>
                      </div>
                      <span className={`badge ${delivered?"bg-success":"bg-secondary"}`}>{r.teslim_durumu||"Durum Yok"}</span>
                    </li>
                  );
                })}
              </ul>
              {!search.trim() && filtered.length>5 && (
                <div className="p-2 d-flex justify-content-center">
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>setShowAllList(s=>!s)}>{showAllList?"Daha Az Göster":"Hepsini Göster"}</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ORTA: Takvim + Daire Özeti */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <div className="btn-group btn-group-sm">
                <button className="btn btn-outline-primary" onClick={()=>setCurrentWeekStart(addDays(currentWeekStart,-7))}>← Önceki</button>
                <button className="btn btn-outline-secondary" onClick={()=>setCurrentWeekStart(startOfWeek(new Date()))}>Bugün</button>
                <button className="btn btn-outline-primary" onClick={()=>setCurrentWeekStart(addDays(currentWeekStart,7))}>Sonraki →</button>
              </div>
              <div className="small text-muted">
                {formatTRDate(weekDays[0])} – {formatTRDate(weekDays[weekDays.length-1])}
              </div>
            </div>

            <div className="card-body">
              {/* Günler */}
              <div className="d-flex flex-column gap-3">
                {weekDays.map(d=>{
                  const key=toISODate(d), items=appointmentsByDay[key]||[];
                  const weekday=d.toLocaleDateString("tr-TR",{weekday:"long"});
                  return (
                    <div key={key} className="day-box rounded">
                      <div className="day-head">
                        <span className="day-pill">{weekday}<span className="day-date ms-2">{formatTRDate(d)}</span></span>
                      </div>
                      <div className="p-2">
                        {items.length===0 ? <div className="text-muted small">Randevu yok</div> : (
                          <div className="d-flex flex-column gap-2">
                            {items.map(r=>(
                              <div key={`${r.daire}-${r.teslim_randevu_saati||"x"}`} className="appt p-2 rounded" role="button" onClick={()=>setSelected(r)}>
                                <div className="d-flex justify-content-between">
                                  <span className="fw-semibold">{r.daire||`${r.blok}-${r.no}`}</span>
                                  <span className="badge bg-primary">{r.teslim_randevu_saati?formatTimeStr(r.teslim_randevu_saati):"—"}</span>
                                </div>
                                <div className="small text-muted d-flex flex-wrap align-items-center gap-2">
                                  <span>{(r.musteri||r.mal_sahibi||"-")} • {(r.teslim_durumu||"Durum Yok")}</span>
                                  {(() => { // Demirbaş rozeti: her randevuda, net farklı
                                    const st = demirbasState(r.demirbas_odeme_durumu);
                                    if (st === "odendi") return <span className="badge bg-success">✓ Demirbaş: Ödendi</span>;
                                    if (st === "odenmedi") return <span className="badge bg-danger">✗ Demirbaş: Ödenmedi</span>;
                                    return <span className="badge bg-secondary">— Demirbaş</span>;
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Seçili daire özeti */}
              <div className="mt-4">
                <h2 className="h6 d-flex justify-content-between align-items-center">
                  <span>Daire Özeti</span>
                  {selected && (
                    <span className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-success"
                        onClick={()=>markDelivered(selected)}
                        disabled={statusEq(selected,"teslim edildi")}
                        title='Durumu "Teslim Edildi" yap'>
                        Teslim Edildi
                      </button>
                      <button className="btn btn-sm btn-outline-danger"
                        onClick={()=>markUndelivered(selected)}
                        disabled={statusEq(selected,"teslim edilmedi")}
                        title='Durumu "Teslim Edilmedi" yap'>
                        Teslim Edilmedi
                      </button>
                      <button className="btn btn-sm btn-outline-warning"
                        onClick={()=>markRejected(selected)}
                        disabled={statusEq(selected,"teslim reddedildi")}
                        title='Durumu "Teslim Reddedildi" yap'>
                        Teslim Reddedildi
                      </button>
                    </span>
                  )}
                </h2>

                {!selected ? (
                  <div className="text-muted small">Soldan veya takvimden bir daire seçiniz.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <tbody>
                        <tr>
                          <th colSpan={2}><div className="fs-5 fw-bold text-primary">{selected.daire || `${selected.blok}-${selected.no}`}</div></th>
                        </tr>

                        {/* 1) Randevu + Kaydet */}
                        <tr>
                          <th>Randevu Tarihi / Saati</th>
                          <td>
                            <div className="d-flex gap-2 flex-wrap align-items-center">
                              {inputFor("teslim_randevu_tarihi", edit, onEditChange, "date", isLockedGlobal("teslim_randevu_tarihi"))}
                              {inputFor("teslim_randevu_saati", edit, onEditChange, "time", isLockedGlobal("teslim_randevu_saati"))}
                              {isAdmin && (
                                <span className="ms-auto d-flex align-items-center gap-2">
                                  <button className="btn btn-sm btn-primary" onClick={handleSave}>Kaydet</button>
                                  {notice && <span className="text-success fw-semibold small">{notice}</span>}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* 2) Teslim Durumu */}
                        {renderRow("Teslim Durumu","teslim_durumu",edit,onEditChange)}
                        {/* 3) Not */}
                        {renderRow("Not","teslim_notu",edit,onEditChange)}
                        {/* 4) Demirbaş / Aidat (sabit) */}
                        {renderRowLocked("Demirbaş","demirbas",edit)}
                        {renderRowLocked("Aidat","aidat",edit)}

                        {/* 5) Demirbaş Ödeme (iki yönlü) */}
                        <tr>
                          <th>Demirbaş Ödeme</th>
                          <td className="d-flex align-items-center gap-2 flex-wrap">
                            {readOnlyField(selected.demirbas_odeme_durumu,"text")}
                            {(() => {
                              const st = demirbasState(selected.demirbas_odeme_durumu);
                              return (
                                <>
                                  <button className="btn btn-sm btn-outline-success" onClick={()=>setDemirbas(selected,true)} disabled={st==="odendi"}>Ödendi</button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={()=>setDemirbas(selected,false)} disabled={st==="odenmedi"}>Ödenmedi</button>
                                </>
                              );
                            })()}
                          </td>
                        </tr>

                        {/* 6) Başlayan Yaşam (Süzme Sayaç) */}
                        <tr>
                          <th>Başlayan Yaşam (Süzme Sayaç)</th>
                          <td className="d-flex align-items-center gap-2 flex-wrap">
                            <span>{prettySuzme(selected.suzme_sayac)}</span>
                            <button className="btn btn-sm btn-outline-success" onClick={()=>setSuzme(selected,true)} disabled={normSuzmeTakildi(selected.suzme_sayac)}>Takıldı</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>setSuzme(selected,false)} disabled={!normSuzmeTakildi(selected.suzme_sayac)}>Takılmadı</button>
                          </td>
                        </tr>

                        {/* Diğer bilgiler – derli toplu ızgara */}
                        <tr>
                          <th colSpan={2}>
                            <div className="kv mt-1">
                              <div><dl><dt>Blok</dt><dd>{selected.blok ?? "-"}</dd></dl></div>
                              <div><dl><dt>No</dt><dd>{selected.no ?? "-"}</dd></dl></div>
                              <div><dl><dt>Kat</dt><dd>{selected.kat ?? "-"}</dd></dl></div>
                              <div><dl><dt>Tip</dt><dd>{selected.tip ?? "-"}</dd></dl></div>
                              <div><dl><dt>Cephe</dt><dd>{selected.cephe ?? "-"}</dd></dl></div>
                              <div><dl><dt>Genel Brüt</dt><dd>{formatMoney(selected.genel_brut)}</dd></dl></div>
                              <div><dl><dt>Brüt</dt><dd>{formatMoney(selected.brut)}</dd></dl></div>
                              <div><dl><dt>Net</dt><dd>{formatMoney(selected.net)}</dd></dl></div>
                              <div><dl><dt>Mal Sahibi</dt><dd>{selected.mal_sahibi ?? "-"}</dd></dl></div>
                              <div><dl><dt>Müşteri</dt><dd>{selected.musteri ?? "-"}</dd></dl></div>
                              <div><dl><dt>Acenta</dt><dd>{selected.acenta ?? "-"}</dd></dl></div>
                              <div><dl><dt>KDV Muafiyeti</dt><dd>{normVarYok(selected.kdv_muafiyeti)}</dd></dl></div>
                              <div><dl><dt>İpotek</dt><dd>{normVarYok(selected.ipotek_durumu)}</dd></dl></div>
                              <div><dl><dt>Tapu</dt><dd>{normTapu(selected.tapu_durumu)}</dd></dl></div>
                              <div><dl><dt>Satış Tarihi</dt><dd>{selected.satis_tarihi?String(selected.satis_tarihi).slice(0,10):"-"}</dd></dl></div>
                              <div><dl><dt>Sözleşme Tarihi</dt><dd>{selected.sozlesme_tarihi?String(selected.sozlesme_tarihi).slice(0,10):"-"}</dd></dl></div>
                              <div><dl><dt>Oluşturma</dt><dd className="text-muted">{selected.created_at || "-"}</dd></dl></div>
                            </div>
                          </th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: Donutlar */}
        <div className="col-12 col-lg-2">
          <div className="card h-100">
            <div className="card-header py-2"><strong>Özet</strong></div>
            <div className="card-body d-flex flex-column gap-4 align-items-center">
              <DonutChart title="Toplam" delivered={statsTotal.delivered} remaining={statsTotal.remaining} stock={statsTotal.stock} baslayanYasam={statsTotal.baslayanYasam}/>
              <div className="w-100" style={{borderTop:"1px dashed #e3e8ef"}}/>
              <DonutChart title="24 Gayrimenkul" delivered={stats24.delivered} remaining={stats24.remaining} stock={stats24.stock} baslayanYasam={stats24.baslayanYasam}/>
              <div className="w-100" style={{borderTop:"1px dashed #e3e8ef"}}/>
              <DonutChart title="Güneşli Proje" delivered={statsGun.delivered} remaining={statsGun.remaining} stock={statsGun.stock} baslayanYasam={statsGun.baslayanYasam}/>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-muted small mt-3">Eray Önay</div>
    </div>
  );
}

/** ====== Inline yardımcıları ====== */
function renderRow(label,field,edit,onEditChange,multi=null){
  if(multi&&Array.isArray(multi)){
    return (<tr><th>{label}</th><td><div className="d-flex gap-2 flex-wrap">
      {multi.map(([f,t])=>(
        <div key={f} className="d-flex align-items-center gap-2">
          <span className="small text-muted" style={{minWidth:110}}>{titleCase(f)}</span>
          {inputFor(f,edit,onEditChange,t,isLockedGlobal(f))}
        </div>
      ))}
    </div></td></tr>);
  }
  return (<tr><th>{label}</th><td>{field?inputFor(field,edit,onEditChange,SCHEMA_TYPES[field],isLockedGlobal(field)):<span className="text-muted">—</span>}</td></tr>);
}
function renderRowLocked(label,field,edit,multi=null){
  if(multi&&Array.isArray(multi)){
    return (<tr><th>{label}</th><td><div className="d-flex gap-2 flex-wrap">
      {multi.map(([f,t])=>(
        <div key={f} className="d-flex align-items-center gap-2">
          <span className="small text-muted" style={{minWidth:110}}>{titleCase(f)}</span>
          {readOnlyField(edit?.[f],t)}
        </div>
      ))}
    </div></td></tr>);
  }
  return (<tr><th>{label}</th><td>{readOnlyField(edit?.[field],SCHEMA_TYPES[field])}</td></tr>);
}
function readOnlyField(value,typeHint){
  if(typeHint==="date") return <span>{value?String(value).slice(0,10):"-"}</span>;
  if(typeHint==="time") return <span>{value?String(value).slice(0,5):"-"}</span>;
  if(typeHint==="numeric") return <span>{value===null||value===undefined||value===""?"-":formatMoney(value)}</span>;
  return <span>{value ?? "-"}</span>;
}
function isLockedGlobal(field){ if(field==="created_at") return true; if(!window?.localStorage?.getItem("tp_admin")) return true; return !ALLOW_EDIT_FIELDS.has(field); }
function inputFor(field,edit,onEditChange,typeHint,lockedForce=false){
  if(field==="kdv_muafiyeti"||field==="ipotek_durumu"||field==="tapu_durumu"||field==="suzme_sayac"){ return readOnlyField(edit?.[field],SCHEMA_TYPES[field]); }
  const t=(typeHint||SCHEMA_TYPES[field]||"text"), val=edit?.[field]??"", locked=lockedForce||isLockedGlobal(field);
  if(t==="date"){ const v=val?String(val).slice(0,10):""; return <input className="form-control form-control-sm" type="date" value={v} onChange={e=>onEditChange(field,e.target.value)} disabled={locked} style={{minWidth:160}}/>; }
  if(t==="time"){ const v=val?String(val).slice(0,5):""; return <input className="form-control form-control-sm" type="time" value={v} onChange={e=>onEditChange(field,e.target.value)} disabled={locked} style={{minWidth:120}}/>; }
  if(t==="int"||t==="numeric"){ return <input className="form-control form-control-sm" type="text" value={val??""} onChange={e=>onEditChange(field,e.target.value)} disabled={locked} style={{minWidth:120}} placeholder={t==="int"?"0":"0,00"}/>; }
  return <input className="form-control form-control-sm" type="text" value={val??""} onChange={e=>onEditChange(field,e.target.value)} disabled={locked} style={{minWidth:200}} placeholder={titleCase(field)}/>;
}
function titleCase(s){ return String(s||"").replaceAll("_"," ").replace(/\w\S*/g,t=>t.charAt(0).toUpperCase()+t.slice(1)); }
function formatMoney(v){ if(v===null||v===undefined||v==="") return "-"; const n=Number(v); if(Number.isNaN(n)) return String(v); return n.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" ₺"; }
