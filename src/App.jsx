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
        .list-group-item{transition:background-color .12s ease;cursor:pointer}
        .list-group-item:hover{background:#eef5ff}
        /* Teslim edilen: açık yeşil */
        .list-group-item.delivered{background:#e6f7ee !important; color:#16784f !important;}
        .appt.delivered{background:#e6f7ee !important; color:#16784f !important;}
        /* Teslim reddedildi: açık kırmızı */
        .list-group-item.rejected{background:#fde7ea !important; color:#a12a36 !important;}
        .appt.rejected{background:#fde7ea !important; color:#a12a36 !important;}
        .badge.bg-success{background:#169a5a!important}
        .badge.bg-secondary{background:#7a869a!important}
        .btn-outline-primary{border-color:#7aa7ff}
        .btn-outline-primary:hover{background:#e9f2ff}
        .day-box{background:#fff;border:1px solid #e3e9fb;border-left:5px solid #0d6efd;border-radius:.5rem}
        .day-head{padding:.5rem .75rem;display:flex;align-items:center;gap:.5rem;background:#f8faff;border-bottom:1px solid #e3e9fb;border-top-left-radius:.5rem;border-top-right-radius:.5rem}
        .day-pill{display:inline-flex;align-items:center;gap:.5rem;background:#eaf1ff;border:1px solid #cfe1ff;color:#0b5ed7;padding:.2rem .55rem;border-radius:999px;font-weight:600}
        .day-date{color:#4b5a77;font-weight:500}
        .appt{background:#fff;border:1px solid #e6ebf2;border-radius:.5rem}
        .appt:hover{background:#f3f7ff}
        .table td,.table th{vertical-align:middle}
        .form-control,.form-select{height:32px;padding:0 .5rem}
        /* Daire özeti grid */
        .kv{display:grid;grid-template-columns:1fr 1fr;gap:.5rem 1rem}
        .kv>div{background:#fff;border:1px solid #e9eef6;border-radius:.5rem;padding:.5rem .75rem}
        .kv dt{font-size:.8rem;color:#6c757d;margin:0}
        .kv dd{margin:0;font-weight:600}
        @media (max-width: 992px){ .kv{grid-template-columns:1fr} }
        /* Donut legend işaretleri */
        .legend-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
      `;
      document.head.appendChild(style);
    }
  }, []);
}

/** ========== Tarih yardımcıları ========== */
const startOfWeek = (date) => {
  const d=new Date(date);
  const day=(d.getDay()+6)%7; // Mon=0..Sun=6
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-day);
  return d;
};
const addDays = (date,n)=>{ const d=new Date(date); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d; };
const weekdaysOfWeek = (ws)=>Array.from({length:5},(_,i)=>addDays(ws,i));
const toISODate = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const formatTRDate = (d)=>d.toLocaleDateString("tr-TR",{year:"numeric",month:"2-digit",day:"2-digit"});
const formatTimeStr = (t)=>{ if(!t) return ""; const p=String(t).split(":"); return `${p[0]}:${p[1]}`; };
const isWeekend = (d) => d.getDay()===6 || d.getDay()===0;
const clampBusinessDay = (d0) => {
  const d=new Date(d0); d.setHours(0,0,0,0);
  if (d.getDay()===6) return addDays(d,2);
  if (d.getDay()===0) return addDays(d,1);
  return d;
};
const addBusinessDays = (d, dir) => {
  let nd = addDays(d, dir>0?1:-1);
  while (isWeekend(nd)) nd = addDays(nd, dir>0?1:-1);
  return nd;
};

/** ========== Donut Grafik (eski format) ========== */
function DonutChart({ title, delivered=0, remaining=0, stock=0, baslayanYasam=0, size=160, stroke=24 }) {
  const d = Number(delivered)||0;
  const r = Number(remaining)||0;
  const sold = d + r;                 // Satılan
  const pct = sold ? d / sold : 0;
  const radius=(size-stroke)/2;
  const circ=2*Math.PI*radius;
  const greenLen=circ*pct;
  const blueLen=circ-greenLen;

  const green="#198754";
  const blue="#0d6efd";
  const track="#e9ecef";

  const pctTxtDelivered = sold ? Math.round((d/sold)*100) : 0;
  const pctTxtRemaining = 100 - pctTxtDelivered;

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="fw-semibold mb-1">{title}</div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size/2},${size/2})`}>
          {/* Gri zemin */}
          <circle r={radius} fill="none" stroke={track} strokeWidth={stroke} />
          {/* Teslim (yeşil) */}
          <circle r={radius} fill="none" stroke={green} strokeWidth={stroke}
                  strokeDasharray={`${greenLen} ${circ-greenLen}`} transform="rotate(-90)" />
          {/* Kalan (mavi) */}
          <circle r={radius} fill="none" stroke={blue} strokeWidth={stroke}
                  strokeDasharray={`${blueLen} ${circ-blueLen}`} transform={`rotate(${pct*360-90})`} />
          {/* Merkez metin */}
          <text x="0" y="-2" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111">
            Satılan: {sold}
          </text>
          <text x="0" y="14" textAnchor="middle" fontSize="11" fill="#6c757d">
            Teslim / Kalan
          </text>
        </g>
      </svg>
      {/* Legend */}
      <div className="mt-2 small">
        <div><span className="legend-dot" style={{background:"#198754"}}></span>Teslim: {d} ({pctTxtDelivered}%)</div>
        <div><span className="legend-dot" style={{background:"#0d6efd"}}></span>Kalan: {r} ({pctTxtRemaining}%)</div>
      </div>
      <div className="small text-muted mt-1">Stok: {stock}</div>
      <div className="small text-muted">Başlayan Yaşam: {baslayanYasam}</div>
    </div>
  );
}

/** ========== Normalizasyonlar & yardımcılar ========== */
const isSold = (r)=>Boolean((r.musteri && String(r.musteri).trim()) || r.satis_tarihi);
const isDelivered = (r)=> String(r.teslim_durumu||"").toLowerCase().includes("teslim edildi");
const isRejected = (r)=> String(r.teslim_durumu||"").toLowerCase().includes("teslim reddedildi");
const statusEq = (r, text)=> ((r?.teslim_durumu || "").toLowerCase() === text.toLowerCase());
const normVarYok = (v)=>{ const s=(v||"").toLowerCase(); if(!s) return "Yok"; if(s.includes("var")) return "Var"; if(s.includes("yok")) return "Yok"; return "Yok"; };
const normTapu = (v)=>{ const s=(v||"").toString().trim(); return s || "Devredilmedi"; };
const normSuzmeTakildi = (v)=>{ const s=String(v||"").toLowerCase(); return s.includes("takıldı")||s.includes("takildi"); };
function demirbasState(v){ const s=String(v||"").toLowerCase(); if(s.includes("ödendi")) return "odendi"; if(s.includes("ödenmedi")) return "odenmedi"; return "none"; }
function formatMoney(v){ if(v===null||v===undefined||v==="") return "-"; const n=Number(v); return Number.isNaN(n)?String(v):n.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" ₺"; }

/** ========== Girdi/oku yardımcıları ========== */
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
  suzme_sayac:"text"
};
const ALLOW_EDIT_FIELDS = new Set(["teslim_randevu_tarihi","teslim_randevu_saati","teslim_durumu","teslim_notu","demirbas_odeme_durumu"]);

function toInputValue(type, value){
  switch(type){
    case "date": return value? String(value).slice(0,10):"";
    case "time": {
      const s = value? String(value).slice(0,5):"";
      if (/^\d{2}:\d{2}$/.test(s)) return s;
      if (/^\d{1}:\d{2}$/.test(s)) return `0${s}`;
      return "";
    }
    case "numeric":
    case "int":
      return value ?? "";
    case "timestamp":
      return String(value ?? "");
    default:
      return String(value ?? "");
  }
}
function readOnlyCell(type, value){
  if(type==="date") return <span>{value? String(value).slice(0,10):"-"}</span>;
  if(type==="time") return <span>{value? String(value).slice(0,5):"-"}</span>;
  if(type==="numeric") return <span>{formatMoney(value)}</span>;
  return <span>{value ?? "-"}</span>;
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

  /** Takvim: tek mod (day|week) */
  const [viewMode,setViewMode]=useState("day");
  const [currentDate,setCurrentDate]=useState(()=>clampBusinessDay(new Date()));
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
        const ab=(a.blok||"").toUpperCase();
        const bb=(b.blok||"").toUpperCase();
        if(ab===bb){
          const an=Number.isFinite(a.no)?a.no:parseInt(a.no,10)||0;
          const bn=Number.isFinite(b.no)?b.no:parseInt(b.no,10)||0;
          return an-bn;
        }
        return ab.localeCompare(bb,"tr");
      });
      setRows(data);
      if (selected) {
        const again=data.find(r=>r.daire===selected.daire);
        setSelected(again||null);
        setEdit(again?{...again}:{});
      }
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ fetchAll(); /* eslint-disable-next-line */ },[]);

  /** ---- Filtre ---- */
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q) return rows;
    return rows.filter(r=>{
      const daire=(r.daire||"").toLowerCase();
      const blok=(r.blok||"").toLowerCase();
      const no=String(r.no||"").toLowerCase();
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

  /** ---- Randevular ---- */
  function getAppointmentsFor(date){
    const key=toISODate(date);
    const arr=rows.filter(r=>r.teslim_randevu_tarihi===key);
    arr.sort((a,b)=>(a.teslim_randevu_saati||"").localeCompare(b.teslim_randevu_saati||""));
    return arr;
  }
  const appointmentsByDayInWeek=useMemo(()=>{
    const map={}; weekDays.forEach(d=>map[toISODate(d)]=[]);
    rows.forEach(r=>{
      const k=r.teslim_randevu_tarihi;
      if(k && map[k]) map[k].push(r);
    });
    Object.keys(map).forEach(k=>map[k].sort((a,b)=>(a.teslim_randevu_saati||"").localeCompare(b.teslim_randevu_saati||"")));
    return map;
  },[rows,weekDays]);

  /** ---- Gruplar & Donut verileri ---- */
  const rowsOwner24 = useMemo(
    ()=>rows.filter(r=>/(^|\s)24\s*gayrimenkul/i.test(r.mal_sahibi||"")),
    [rows]
  );
  const rowsOwnerArsa = useMemo(
    ()=>rows.filter(r=>(/(arsa\s*sahibi|g[üu]ne[sş]li\s*proje)/i).test(r.mal_sahibi||"")),
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
  const stats24=useMemo(()=>groupStats(rowsOwner24),[rowsOwner24]);
  const statsArsa=useMemo(()=>groupStats(rowsOwnerArsa),[rowsOwnerArsa]);

  /** ---- REST yardımcıları ---- */
  async function patchByDaire(daireKey,body){
    const res=await fetch(`${REST_URL}?daire=eq.${encodeURIComponent(daireKey)}`,{
      method:"PATCH", headers:REST_HEADERS, body:JSON.stringify(body)
    });
    if(!res.ok){
      let txt=""; try{ txt=await res.text(); }catch{}
      throw new Error(`Güncelleme hatası: ${res.status} ${res.statusText} ${txt}`);
    }
  }
  async function markDelivered(r){ if(!r?.daire||statusEq(r,"teslim edildi")) return; await patchByDaire(r.daire,{teslim_durumu:"Teslim Edildi"}); fetchAll(); }
  async function markUndelivered(r){ if(!r?.daire||statusEq(r,"teslim edilmedi")) return; await patchByDaire(r.daire,{teslim_durumu:"Teslim Edilmedi"}); fetchAll(); }
  async function markRejected(r){ if(!r?.daire||statusEq(r,"teslim reddedildi")) return; await patchByDaire(r.daire,{teslim_durumu:"Teslim Reddedildi"}); fetchAll(); }
  async function setDemirbas(r,ok){ if(!r?.daire) return; const st=demirbasState(r.demirbas_odeme_durumu); if((ok&&st==="odendi")||(!ok&&st==="odenmedi")) return; await patchByDaire(r.daire,{demirbas_odeme_durumu: ok?"Ödendi":"Ödenmedi"}); fetchAll(); }
  async function setSuzme(r,t){ if(!r?.daire) return; const cur=normSuzmeTakildi(r.suzme_sayac); if((t&&cur)||(!t&&!cur)) return; await patchByDaire(r.daire,{suzme_sayac: t?"takıldı":"takılmadı"}); fetchAll(); }

  /** ---- Admin ---- */
  function handleLogin(){
    if(isAdmin){ setIsAdmin(false); window.localStorage.removeItem("tp_admin"); return; }
    const code=window.prompt("Giriş kodu:");
    if(code===ADMIN_CODE){ setIsAdmin(true); window.localStorage.setItem("tp_admin","1"); }
    else if(code!==null){ alert("Kod hatalı."); }
  }
  useEffect(()=>{ setEdit(selected?{...selected}:{}); },[selected]);
  function onEditChange(field,value){ setEdit(p=>({...p,[field]:value})); }
  function isLocked(field){ if(field==="created_at") return true; if(!isAdmin) return true; return !ALLOW_EDIT_FIELDS.has(field); }
  async function handleSave(){
    if(!isAdmin||!selected) return;
    const changed={};
    Object.keys(SCHEMA_TYPES).forEach(k=>{
      if(!(k in selected) && !(k in edit)) return;
      if(isLocked(k)) return;
      const ov=selected[k]??null, nv=edit[k]??null;
      if(String(ov??"")!==String(nv??"")) changed[k]=nv;
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
                  const delivered=isDelivered(r);
                  const rejected=isRejected(r);
                  const demSt=demirbasState(r.demirbas_odeme_durumu);
                  const active=selected?.daire===r.daire;
                  const classes = [
                    "list-group-item",
                    "d-flex","justify-content-between","align-items-center",
                    rejected ? "rejected" : (delivered ? "delivered" : ""),
                    active ? "border-primary" : ""
                  ].join(" ").replace(/\s+/g," ").trim();

                  return (
                    <li key={r.daire||`${r.blok}-${r.no}`}
                        className={classes}
                        onClick={()=>setSelected(r)}
                        title={r.daire||`${r.blok}-${r.no}`}>
                      <div className="d-flex flex-column">
                        <span className="fw-semibold">{r.daire||`${r.blok}-${r.no}`}</span>
                        <span className="small text-muted">{r.musteri||r.mal_sahibi||"-"}</span>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        <span className={`badge ${delivered ? "bg-success" : "bg-secondary"} mb-1`}>{r.teslim_durumu||"Durum Yok"}</span>
                        {demSt==="odendi" && <span className="badge bg-success">Demirbaş Ödendi</span>}
                        {demSt==="odenmedi" && <span className="badge bg-danger">Demirbaş Ödenmedi</span>}
                        {demSt==="none" && <span className="badge bg-secondary">— Demirbaş</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Hepsini Göster / Daha Az */}
              {search.trim()==="" && filtered.length>5 && (
                <div className="p-2 text-center">
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>setShowAllList(s=>!s)}>
                    {showAllList?"Daha Az Göster":"Hepsini Göster"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ORTA: Navigasyon (takvimin hemen üstünde) + Takvim */}
        <div className="col-12 col-lg-7">
          {/* Navigasyon — ÖN GÖSTERİM METNİ YOK */}
          <div className="mb-2 d-flex flex-wrap align-items-center gap-2">
            {/* Gün */}
            <div className="btn-group btn-group-sm me-2">
              <button className="btn btn-outline-primary" onClick={()=>{ setViewMode("day"); setCurrentDate(d=>addBusinessDays(clampBusinessDay(d),-1)); }}>
                ← Önceki Gün
              </button>
              <button className={`btn btn-outline-${viewMode==="day"?"secondary":"primary"}`} onClick={()=>{ setViewMode("day"); setCurrentDate(clampBusinessDay(new Date())); }}>
                Bugün
              </button>
              <button className="btn btn-outline-primary" onClick={()=>{ setViewMode("day"); setCurrentDate(d=>addBusinessDays(clampBusinessDay(d),+1)); }}>
                Sonraki Gün →
              </button>
            </div>
            {/* Hafta */}
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-primary" onClick={()=>{ setViewMode("week"); setCurrentWeekStart(ws=>addDays(ws,-7)); }}>
                ← Önceki Hafta
              </button>
              <button className={`btn btn-outline-${viewMode==="week"?"secondary":"primary"}`} onClick={()=>{ setViewMode("week"); setCurrentWeekStart(startOfWeek(new Date())); }}>
                Bu Hafta
              </button>
              <button className="btn btn-outline-primary" onClick={()=>{ setViewMode("week"); setCurrentWeekStart(ws=>addDays(ws,7)); }}>
                Sonraki Hafta →
              </button>
            </div>
          </div>

          <div className="card h-100">
            <div className="card-header py-2"><strong>Takvim</strong></div>
            <div className="card-body">
              {viewMode==="day" ? (
                /** --- Gün: tek kutu (iş günü) --- */
                (() => {
                  const d = clampBusinessDay(currentDate);
                  const items = getAppointmentsFor(d);
                  return (
                    <div className="day-box">
                      <div className="day-head">
                        <span className="day-pill">
                          {d.toLocaleDateString("tr-TR",{weekday:"long"})}
                          <span className="day-date ms-2">{formatTRDate(d)}</span>
                        </span>
                      </div>
                      <div className="p-2">
                        {items.length===0 ? (
                          <div className="small text-muted">Randevu yok</div>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            {items.map(r=>{
                              const delivered=isDelivered(r);
                              const rejected=isRejected(r);
                              const classes = `appt p-2 ${rejected?"rejected":(delivered?"delivered":"")}`;
                              return (
                                <div key={`${toISODate(d)}-${r.daire}-${r.teslim_randevu_saati||"x"}`}
                                     className={classes}
                                     onClick={()=>setSelected(r)}>
                                  <div className="d-flex justify-content-between">
                                    <span className="fw-semibold">{r.daire||`${r.blok}-${r.no}`}</span>
                                    <span className="badge bg-primary">{formatTimeStr(r.teslim_randevu_saati)||"—"}</span>
                                  </div>
                                  <div className="small text-muted d-flex flex-wrap gap-2 mt-1">
                                    <span>{r.musteri||r.mal_sahibi||"-"} • {r.teslim_durumu||"Durum Yok"}</span>
                                    {(() => {
                                      const st = demirbasState(r.demirbas_odeme_durumu);
                                      if (st === "odendi") return <span className="badge bg-success">✓ Demirbaş: Ödendi</span>;
                                      if (st === "odenmedi") return <span className="badge bg-danger">✗ Demirbaş: Ödenmedi</span>;
                                      return <span className="badge bg-secondary">— Demirbaş</span>;
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /** --- Hafta: Pzt–Cum 5 gün --- */
                <div className="d-flex flex-column gap-3">
                  {weekDays.map(d=>{
                    const key=toISODate(d), items=(appointmentsByDayInWeek[key]||[]);
                    return (
                      <div key={key} className="day-box">
                        <div className="day-head">
                          <span className="day-pill">
                            {d.toLocaleDateString("tr-TR",{weekday:"long"})}
                            <span className="day-date ms-2">{formatTRDate(d)}</span>
                          </span>
                        </div>
                        <div className="p-2">
                          {items.length===0 ? (
                            <div className="small text-muted">Randevu yok</div>
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {items.map(r=>{
                                const delivered=isDelivered(r);
                                const rejected=isRejected(r);
                                const classes = `appt p-2 ${rejected?"rejected":(delivered?"delivered":"")}`;
                                return (
                                  <div key={`${key}-${r.daire}-${r.teslim_randevu_saati||"x"}`}
                                       className={classes}
                                       onClick={()=>setSelected(r)}>
                                    <div className="d-flex justify-content-between">
                                      <span className="fw-semibold">{r.daire||`${r.blok}-${r.no}`}</span>
                                      <span className="badge bg-primary">{formatTimeStr(r.teslim_randevu_saati)||"—"}</span>
                                    </div>
                                    <div className="small text-muted d-flex flex-wrap gap-2 mt-1">
                                      <span>{r.musteri||r.mal_sahibi||"-"} • {r.teslim_durumu||"Durum Yok"}</span>
                                      {(() => {
                                        const st = demirbasState(r.demirbas_odeme_durumu);
                                        if (st === "odendi") return <span className="badge bg-success">✓ Demirbaş: Ödendi</span>;
                                        if (st === "odenmedi") return <span className="badge bg-danger">✗ Demirbaş: Ödenmedi</span>;
                                        return <span className="badge bg-secondary">— Demirbaş</span>;
                                      })()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seçili daire özeti */}
              <div className="mt-4">
                <h2 className="h6 d-flex justify-content-between align-items-center">
                  <span>Daire Özeti</span>
                  {selected && (
                    <span className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-success" onClick={()=>markDelivered(selected)} disabled={statusEq(selected,"teslim edildi")}>Teslim Edildi</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>markUndelivered(selected)} disabled={statusEq(selected,"teslim edilmedi")}>Teslim Edilmedi</button>
                      <button className="btn btn-sm btn-outline-warning" onClick={()=>markRejected(selected)} disabled={statusEq(selected,"teslim reddedildi")}>Teslim Reddedildi</button>
                    </span>
                  )}
                </h2>

                {!selected ? (
                  <div className="text-muted small">Soldan liste veya takvimden bir daire seçiniz.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <tbody>
                        <tr>
                          <th colSpan={2}>
                            <div className="fs-5 fw-bold text-primary">{selected.daire||`${selected.blok}-${selected.no}`}</div>
                          </th>
                        </tr>
                        <tr>
                          <th>Randevu Tarihi / Saati</th>
                          <td>
                            <div className="d-flex gap-2 flex-wrap align-items-center">
                              <input className="form-control form-control-sm" type="date"
                                     value={toInputValue("date", edit.teslim_randevu_tarihi)}
                                     onChange={(e)=>onEditChange("teslim_randevu_tarihi", e.target.value)} disabled={isLocked("teslim_randevu_tarihi")} />
                              <input className="form-control form-control-sm" type="time"
                                     value={toInputValue("time", edit.teslim_randevu_saati)}
                                     onChange={(e)=>onEditChange("teslim_randevu_saati", e.target.value)} disabled={isLocked("teslim_randevu_saati")} />
                              {isAdmin && (
                                <span className="ms-auto d-flex align-items-center gap-2">
                                  <button className="btn btn-sm btn-primary" onClick={handleSave}>Kaydet</button>
                                  {notice && <span className="text-success fw-semibold small">{notice}</span>}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th>Teslim Durumu</th>
                          <td>
                            <input className="form-control form-control-sm" type="text"
                                   value={toInputValue("text", edit.teslim_durumu)}
                                   onChange={(e)=>onEditChange("teslim_durumu", e.target.value)} disabled={isLocked("teslim_durumu")} />
                          </td>
                        </tr>
                        <tr>
                          <th>Not</th>
                          <td>
                            <input className="form-control form-control-sm" type="text"
                                   value={toInputValue("text", edit.teslim_notu)}
                                   onChange={(e)=>onEditChange("teslim_notu", e.target.value)} disabled={isLocked("teslim_notu")} />
                          </td>
                        </tr>
                        <tr>
                          <th>Demirbaş</th>
                          <td>{readOnlyCell("numeric", selected.demirbas)}</td>
                        </tr>
                        <tr>
                          <th>Aidat</th>
                          <td>{readOnlyCell("numeric", selected.aidat)}</td>
                        </tr>
                        <tr>
                          <th>Demirbaş Ödeme</th>
                          <td className="d-flex align-items-center gap-2 flex-wrap">
                            <span>{selected.demirbas_odeme_durumu ?? "-"}</span>
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
                        <tr>
                          <th>Başlayan Yaşam (Süzme Sayaç)</th>
                          <td className="d-flex align-items-center gap-2 flex-wrap">
                            <span>{selected.suzme_sayac ? (normSuzmeTakildi(selected.suzme_sayac)?"Takıldı":"Takılmadı") : "-"}</span>
                            <button className="btn btn-sm btn-outline-success" onClick={()=>setSuzme(selected,true)} disabled={normSuzmeTakildi(selected.suzme_sayac)}>Takıldı</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>setSuzme(selected,false)} disabled={!normSuzmeTakildi(selected.suzme_sayac)}>Takılmadı</button>
                          </td>
                        </tr>
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

        {/* SAĞ: Donutlar (eski format) */}
        <div className="col-12 col-lg-2">
          <div className="card h-100">
            <div className="card-header py-2">
              <strong>Özet</strong>
            </div>
            <div className="card-body d-flex flex-column gap-4 align-items-center">
              <DonutChart title="Toplam" {...statsTotal} />
              <div className="w-100" style={{borderTop:"1px dashed #e3e8ef"}}/>
              <DonutChart title="24 Gayrimenkul" {...stats24} />
              <div className="w-100" style={{borderTop:"1px dashed #e3e8ef"}}/>
              <DonutChart title="Arsa Sahibi" {...statsArsa} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-muted small mt-3">Eray Önay</div>
    </div>
  );
}
