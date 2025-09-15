import React, { useEffect, useMemo, useState } from "react";

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

/** ========== Bootstrap + Tema ========== */
function useBootstrapAndTheme() {
  useEffect(() => {
    // Bootstrap
    const id = "bootstrap-cdn-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
      document.head.appendChild(link);
    }
    // Tema
    const styleId = "teslim-panel-theme";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        body { background-color: #f5f7fb; }
        .card { border: 0; box-shadow: 0 6px 22px rgba(0,0,0,.06); }
        .card-header { background: linear-gradient(180deg,#fff,#f1f4fa); border-bottom: 1px solid #e6ebf2; }
        .list-group-item { transition: background-color .12s ease; }
        .list-group-item:hover { background-color: #eef5ff; }
        .badge.bg-success { background-color: #169a5a !important; }
        .badge.bg-secondary { background-color: #7a869a !important; }
        .btn-outline-primary { border-color: #7aa7ff; }
        .btn-outline-primary:hover { background-color: #e9f2ff; }

        /* TAKVİM */
        .day-box { background:#ffffff; border: 1px solid #e3e9fb; border-left: 5px solid #0d6efd; }
        .day-head { padding:.5rem .75rem; display:flex; align-items:center; gap:.5rem; background:#f8faff; border-bottom:1px solid #e3e9fb; }
        .day-pill { display:inline-flex; align-items:center; gap:.5rem; background:#eaf1ff; border:1px solid #cfe1ff; color:#0b5ed7; padding:.2rem .55rem; border-radius:999px; font-weight:600; }
        .day-date { color:#4b5a77; font-weight:500; }
        .appt { background:#ffffff; border: 1px solid #e6ebf2; }
        .appt:hover { background:#f3f7ff; }

        .table td, .table th { vertical-align: middle; }
        .form-control, .form-select { height: 32px; padding: 0 .5rem; }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

/** ========== Tarih yardımcıları (Hafta içi) ========== */
function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Pazartesi başlangıç
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function weekdaysOfWeek(weekStartMonday) {
  return Array.from({ length: 5 }, (_, i) => addDays(weekStartMonday, i)); // Pzt–Cum
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatTRDate(d) {
  return d.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
function formatTimeStr(t) {
  if (!t) return "";
  const parts = t.split(":");
  return `${parts[0]}:${parts[1]}`;
}

/** ========== Donut Grafik ========== */
function DonutChart({ title, delivered, remaining, size = 180, stroke = 28 }) {
  const total = delivered + remaining;
  const deliveredPct = total === 0 ? 0 : delivered / total;
  const remainingPct = total === 0 ? 0 : remaining / total;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const deliveredLen = circ * deliveredPct;
  const remainingLen = circ * remainingPct;
  const deliveredText = total ? `${Math.round(deliveredPct * 100)}%` : "0%";
  const remainingText = total ? `${Math.round(remainingPct * 100)}%` : "0%";

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="mb-2 fw-semibold">{title}</div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="#e9ecef" strokeWidth={stroke} />
          <circle
            r={radius}
            fill="none"
            stroke="#198754"
            strokeWidth={stroke}
            strokeDasharray={`${deliveredLen} ${circ - deliveredLen}`}
            transform="rotate(-90)"
          />
          <circle
            r={radius}
            fill="none"
            stroke="#0d6efd"
            strokeWidth={stroke}
            strokeDasharray={`${remainingLen} ${circ - remainingLen}`}
            transform={`rotate(${deliveredPct * 360 - 90})`}
          />
          <text x="0" y="-8" textAnchor="middle" fontSize="16" fontWeight="600" fill="#212529">
            Toplam: {total}
          </text>
          <text x="0" y="14" textAnchor="middle" fontSize="13" fill="#6c757d">
            Teslim / Kalan
          </text>
        </g>
      </svg>
      <div className="d-flex gap-3 mt-2 small">
        <span className="d-inline-flex align-items-center">
          <span style={{ width: 10, height: 10, background: "#198754", display: "inline-block", borderRadius: 2 }} className="me-1" />
          Teslim: {delivered} ({deliveredText})
        </span>
        <span className="d-inline-flex align-items-center">
          <span style={{ width: 10, height: 10, background: "#0d6efd", display: "inline-block", borderRadius: 2 }} className="me-1" />
          Kalan: {remaining} ({remainingText})
        </span>
      </div>
    </div>
  );
}

/** ========== Şema: tip dönüştürme + kilit alanlar ========== */
const SCHEMA_TYPES = {
  daire: "text",
  created_at: "timestamp",
  mal_sahibi: "text",
  durum: "text",
  blok: "text",
  no: "int",
  kat: "int",
  tip: "text",
  cephe: "text",
  genel_brut: "numeric",
  brut: "numeric",
  net: "numeric",
  satis_tarihi: "date",
  sozlesme_tarihi: "date",
  acenta: "text",
  musteri: "text",
  teslim_durumu: "text",
  teslim_notu: "text",
  teslim_randevu_tarihi: "date",
  teslim_randevu_saati: "time",
  demirbas: "numeric",        // TL — sabit (admin editleyemez)
  aidat: "numeric",           // TL — sabit (admin editleyemez)
  demirbas_odeme_durumu: "text",
  kdv_muafiyeti: "text",
  ipotek_durumu: "text",
  tapu_durumu: "text",
};

// Adminin değiştirebileceği alanların beyaz listesi
const ALLOW_EDIT_FIELDS = new Set([
  "teslim_randevu_tarihi",
  "teslim_randevu_saati",
  "teslim_durumu",
  "teslim_notu",
  "demirbas_odeme_durumu",
]);

function coerceValue(field, value) {
  const t = SCHEMA_TYPES[field] || "text";
  if (value === "" || value === null || value === undefined) return null;
  switch (t) {
    case "int": {
      const n = parseInt(String(value).replace(",", "."), 10);
      return Number.isNaN(n) ? null : n;
    }
    case "numeric": {
      const n = parseFloat(String(value).replace(/\./g, "").replace(",", ".")); // 1.234,56 → 1234.56
      return Number.isNaN(n) ? null : n;
    }
    case "date":
      return String(value); // YYYY-MM-DD
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

/** ========== Normalizasyon yardımcıları (görüntü için) ========== */
function normVarYok(v) {
  const s = (v || "").toString().toLowerCase();
  if (!s) return "Yok";
  if (s.includes("var")) return "Var";
  if (s.includes("yok")) return "Yok";
  return "Yok";
}
function normTapu(v) {
  const s = (v || "").toString().trim();
  if (!s) return "Devredilmedi";
  return s;
}

/** ========== Ana Uygulama ========== */
export default function App() {
  useBootstrapAndTheme();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [isAdmin, setIsAdmin] = useState(
    () => window.localStorage.getItem("tp_admin") === "1"
  );

  // Inline edit state (admin doğrudan yazar)
  const [edit, setEdit] = useState({});
  const pkRef = useMemo(() => (selected ? selected.daire : null), [selected]);

  // Hafta içi takvim
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date())
  );
  const weekDays = useMemo(
    () => weekdaysOfWeek(currentWeekStart),
    [currentWeekStart]
  );

  // Veri çek
  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const url = `${REST_URL}?select=*`;
      const res = await fetch(url, { headers: REST_HEADERS });
      if (!res.ok) throw new Error(`Yükleme hatası: ${res.status} ${res.statusText}`);
      const data = await res.json();

      // Sıralama: A1..An, sonra B1..Bn
      data.sort((a, b) => {
        const ab = (a.blok || "").toString().toUpperCase();
        const bb = (b.blok || "").toString().toUpperCase();
        if (ab === bb) {
          const an = Number.isFinite(a.no) ? a.no : parseInt(a.no, 10) || 0;
          const bn = Number.isFinite(b.no) ? b.no : parseInt(b.no, 10) || 0;
          return an - bn;
        }
        return ab.localeCompare(bb, "tr");
      });

      setRows(data);
      if (selected) {
        const again = data.find((r) => r.daire === selected.daire);
        setSelected(again || null);
        setEdit(again ? { ...again } : {});
      }
    } catch (e) {
      console.error(e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // Arama filtresi
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const daire = (r.daire || "").toString().toLowerCase();
      const blok = (r.blok || "").toString().toLowerCase();
      const no = (r.no ?? "").toString().toLowerCase();
      const combo1 = `${blok}${no}`;
      const combo2 = `${blok}-${no}`;
      return (
        daire.includes(q) ||
        blok.includes(q) ||
        no.includes(q) ||
        combo1.includes(q) ||
        combo2.includes(q)
      );
    });
  }, [rows, search]);

  // Teslim kontrolü
  function isDelivered(r) {
    const d = (r.teslim_durumu || "").toString().toLowerCase();
    return d.includes("teslim") && !d.includes("değil") && !d.includes("bekliyor");
  }

  // Randevuları günlere dağıt (Pzt–Cum)
  const appointmentsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => (map[toISODate(d)] = []));
    rows.forEach((r) => {
      if (!r.teslim_randevu_tarihi) return;
      const key = r.teslim_randevu_tarihi; // yyyy-mm-dd
      if (map[key]) map[key].push(r);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) =>
        (a.teslim_randevu_saati || "").localeCompare(b.teslim_randevu_saati || "")
      );
    });
    return map;
  }, [rows, weekDays]);

  // Donut: toplam + kırılımlar
  const deliveredCountTotal = useMemo(() => rows.filter(isDelivered).length, [rows]);
  const remainingCountTotal = Math.max(rows.length - deliveredCountTotal, 0);

  function byAcenta(name) {
    const n = (name || "").toString().toLowerCase();
    return rows.filter((r) => (r.acenta || "").toString().toLowerCase() === n);
  }
  const rows24G = useMemo(() => byAcenta("24 gayrimenkul"), [rows]);
  const rowsGunesli = useMemo(() => byAcenta("güneşli proje"), [rows]);

  const delivered24G = useMemo(() => rows24G.filter(isDelivered).length, [rows24G]);
  const remaining24G = Math.max(rows24G.length - delivered24G, 0);

  const deliveredGunesli = useMemo(() => rowsGunesli.filter(isDelivered).length, [rowsGunesli]);
  const remainingGunesli = Math.max(rowsGunesli.length - deliveredGunesli, 0);

  /** ========== Güncellemeler ========== */
  async function patchByDaire(daireKey, body) {
    const url = `${REST_URL}?daire=eq.${encodeURIComponent(daireKey)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: REST_HEADERS,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Güncelleme hatası: ${res.status} ${res.statusText}`);
  }

  async function toggleDemirbasOdeme(r) {
    if (!isAdmin || !r?.daire) return;
    const current = (r.demirbas_odeme_durumu || "").toString().toLowerCase();
    const next = current.includes("öden") ? "Ödenmedi" : "Ödendi";
    try {
      await patchByDaire(r.daire, { demirbas_odeme_durumu: next });
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Güncelleme başarısız: " + e.message);
    }
  }

  async function setTeslimEdildi(r) {
    if (!isAdmin || !r?.daire) return;
    try {
      await patchByDaire(r.daire, { teslim_durumu: "Teslim Edildi" });
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Güncelleme başarısız: " + e.message);
    }
  }

  /** ========== Admin giriş/çıkış ========== */
  function handleLogin() {
    if (isAdmin) {
      setIsAdmin(false);
      window.localStorage.removeItem("tp_admin");
      return;
    }
    const code = window.prompt("Giriş kodu:");
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      window.localStorage.setItem("tp_admin", "1");
    } else if (code !== null) {
      alert("Kod hatalı.");
    }
  }

  /** ========== Inline edit yardımcıları ========== */
  useEffect(() => {
    if (selected) {
      setEdit({ ...selected });
    } else {
      setEdit({});
    }
  }, [selected]);

  function onEditChange(field, value) {
    setEdit((prev) => ({ ...prev, [field]: value }));
  }

  function isLocked(field) {
    if (field === "created_at") return true;
    if (!isAdmin) return true;
    return !ALLOW_EDIT_FIELDS.has(field);
  }

  async function handleSave() {
    if (!isAdmin || !selected) return;
    const original = selected;
    const changed = {};

    Object.keys(SCHEMA_TYPES).forEach((k) => {
      if (!(k in original) && !(k in edit)) return;

      // Kilitli alanlar admin tarafından değiştirilemez → atla
      if (isLocked(k)) return;

      const origVal = original[k] ?? null;
      const newValRaw = edit[k] ?? null;
      const newVal = coerceValue(k, newValRaw);
      const origStr = origVal === null ? null : String(origVal);
      const newStr = newVal === null ? null : String(newVal);
      if (origStr !== newStr) changed[k] = newVal;
    });

    if (Object.keys(changed).length === 0) {
      return; // değişiklik yok
    }

    try {
      const daireKey = pkRef;
      await patchByDaire(daireKey, changed);
      await fetchAll();
      const newKey = changed.daire ?? daireKey;
      const updated = rows.find((r) => r.daire === newKey) || null;
      setSelected(updated);
    } catch (e) {
      console.error(e);
      alert("Kaydetme başarısız: " + e.message);
    }
  }

  function handleCancel() {
    setEdit({ ...selected });
  }

  /** ========== UI ========== */
  return (
    <div className="container-fluid py-3">
      {/* Üst bar */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Teslim Paneli</h1>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchAll} disabled={loading}>
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
          <button
            className={`btn btn-sm ${isAdmin ? "btn-danger" : "btn-primary"}`}
            onClick={handleLogin}
            title={isAdmin ? "Çıkış yap" : "Giriş yap"}
          >
            {isAdmin ? "Çıkış" : "Giriş"}
          </button>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2">Hata: {err}</div>}

      <div className="row g-3">
        {/* SOL: Daire Listesi */}
        <div className="col-12 col-lg-3">
          <div className="card h-100">
            <div className="card-header py-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text">Ara</span>
                <input
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Örn: A25 / A-25 / A Blok"
                />
              </div>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 680, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div className="p-3 text-muted small">Kayıt bulunamadı.</div>
              )}
              <ul className="list-group list-group-flush">
                {filtered.map((r) => {
                  const delivered = isDelivered(r);
                  const active = selected?.daire === r.daire;
                  return (
                    <li
                      key={r.daire || `${r.blok}-${r.no}`}
                      className={`list-group-item d-flex justify-content-between align-items-center ${active ? "active" : ""}`}
                      role="button"
                      onClick={() => setSelected(r)}
                      style={{
                        background: active ? undefined : delivered ? "#e8fbf2" : undefined,
                        color: active ? undefined : delivered ? "#157347" : undefined,
                      }}
                      title={r.daire || `${r.blok}-${r.no}`}
                    >
                      <div className="d-flex flex-column">
                        <span className="fw-semibold">{r.daire || `${r.blok}-${r.no}`}</span>
                        <span className="small text-muted">{r.musteri || r.mal_sahibi || "-"}</span>
                      </div>
                      <span className={`badge ${delivered ? "bg-success" : "bg-secondary"}`}>
                        {r.teslim_durumu || "Durum Yok"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* ORTA: Büyük Takvim (Pzt–Cum, alt alta) + Seçili detay/inline edit */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                >
                  ← Önceki
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setCurrentWeekStart(startOfWeek(new Date()))}
                >
                  Bugün
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                >
                  Sonraki →
                </button>
              </div>
              <div className="small text-muted">
                {formatTRDate(weekDays[0])} – {formatTRDate(weekDays[weekDays.length - 1])}
              </div>
            </div>

            <div className="card-body">
              {/* Günler alt alta, randevular liste */}
              <div className="d-flex flex-column gap-3">
                {weekDays.map((d) => {
                  const key = toISODate(d);
                  const items = appointmentsByDay[key] || [];
                  const weekday = d.toLocaleDateString("tr-TR", { weekday: "long" });
                  return (
                    <div key={key} className="day-box rounded">
                      <div className="day-head">
                        <span className="day-pill">
                          {weekday}
                          <span className="day-date">{formatTRDate(d)}</span>
                        </span>
                      </div>
                      <div className="p-2">
                        {items.length === 0 ? (
                          <div className="text-muted small">Randevu yok</div>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            {items.map((r) => (
                              <div
                                key={`${r.daire}-${r.teslim_randevu_saati || "x"}`}
                                className="appt p-2 rounded"
                                role="button"
                                onClick={() => setSelected(r)}
                              >
                                <div className="d-flex justify-content-between">
                                  <span className="fw-semibold">{r.daire || `${r.blok}-${r.no}`}</span>
                                  <span className="badge bg-primary">
                                    {r.teslim_randevu_saati ? formatTimeStr(r.teslim_randevu_saati) : "—"}
                                  </span>
                                </div>
                                <div className="small text-muted">
                                  {(r.musteri || r.mal_sahibi || "-")} • {(r.teslim_durumu || "Durum Yok")}
                                  {/* YENİ: demirbaş ödeme durumu sadece Teslim Edildi ise göster */}
                                  {isDelivered(r) && r.demirbas_odeme_durumu ? (
                                    <span className={`badge ms-2 ${r.demirbas_odeme_durumu.toLowerCase().includes("öden") ? "bg-success" : "bg-warning text-dark"}`}>
                                      Demirbaş: {r.demirbas_odeme_durumu}
                                    </span>
                                  ) : null}
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

              {/* Seçili daire + inline edit */}
              <div className="mt-4">
                <h2 className="h6 d-flex justify-content-between align-items-center">
                  <span>Daire Özeti</span>
                  <span className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setTeslimEdildi(selected)}
                      disabled={!isAdmin || !selected}
                      title={isAdmin ? 'Durumu "Teslim Edildi" yap' : "Değiştirmek için giriş yapın"}
                    >
                      Teslim Edildi Yap
                    </button>
                  </span>
                </h2>

                {!selected ? (
                  <div className="text-muted small">Soldan veya takvimden bir daire seçiniz.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <tbody>
                        {/* BAŞLIK: Daire adı belirgin */}
                        <tr>
                          <th colSpan={2}>
                            <div className="fs-5 fw-bold text-primary">
                              {selected.daire || `${selected.blok}-${selected.no}`}
                            </div>
                          </th>
                        </tr>

                        {/* 1) Randevu Tarihi / Saati + Kaydet/Vazgeç */}
                        {renderRow("Randevu Tarihi / Saati", null, edit, onEditChange, [
                          ["teslim_randevu_tarihi","date"], ["teslim_randevu_saati","time"]
                        ])}
                        {isAdmin && selected ? (
                          <tr>
                            <th></th>
                            <td className="d-flex justify-content-end">
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
                                <button className="btn btn-outline-secondary" onClick={handleCancel}>Vazgeç</button>
                              </div>
                            </td>
                          </tr>
                        ) : null}

                        {/* 2) Teslim Durumu */}
                        {renderRow("Teslim Durumu", "teslim_durumu", edit, onEditChange)}
                        {/* 3) Not */}
                        {renderRow("Not", "teslim_notu", edit, onEditChange)}
                        {/* 4) Demirbaş (TL) */}
                        {renderRowLocked("Demirbaş", "demirbas", edit)}
                        {/* 5) Aidat (TL) */}
                        {renderRowLocked("Aidat", "aidat", edit)}
                        {/* 6) Demirbaş Ödeme */}
                        <tr>
                          <th>Demirbaş Ödeme</th>
                          <td className="d-flex align-items-center gap-2 flex-wrap">
                            {inputFor("demirbas_odeme_durumu", edit, onEditChange, "text", isLocked("demirbas_odeme_durumu"))}
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleDemirbasOdeme(selected)}
                              disabled={!isAdmin}
                              title={isAdmin ? "Demirbaş ödeme durumunu değiştir" : "Değiştirmek için giriş yapın"}
                            >
                              Toggle
                            </button>
                          </td>
                        </tr>

                        {/* DİĞER BİLGİLER (daha aşağıda) */}
                        {renderRowTripleLocked("Blok / No / Kat", ["blok","no","kat"], edit)}
                        {renderRowLocked("Tip / Cephe", null, edit, [
                          ["tip","text"], ["cephe","text"]
                        ])}
                        {renderRowLocked("Metrekare (Genel/Brüt/Net)", null, edit, [
                          ["genel_brut","numeric"], ["brut","numeric"], ["net","numeric"]
                        ])}
                        {renderRowLocked("Mal Sahibi / Müşteri", null, edit, [
                          ["mal_sahibi","text"], ["musteri","text"]
                        ])}
                        {renderRowLocked("Acenta", "acenta", edit)}

                        {/* KDV / İpotek / Tapu — kilitli */}
                        <tr>
                          <th>KDV / İpotek / Tapu</th>
                          <td>
                            <span>
                              {normVarYok(selected.kdv_muafiyeti)} / {normVarYok(selected.ipotek_durumu)} / {normTapu(selected.tapu_durumu)}
                            </span>
                          </td>
                        </tr>

                        {renderRowLocked("Satış / Sözleşme Tarihi", null, edit, [
                          ["satis_tarihi","date"], ["sozlesme_tarihi","date"]
                        ])}
                        <tr>
                          <th>Oluşturma</th>
                          <td><span className="text-muted small">{selected.created_at || "-"}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: Donut Grafikleri */}
        <div className="col-12 col-lg-2">
          <div className="card h-100">
            <div className="card-header py-2">
              <strong>Teslim Kırılımı</strong>
            </div>
            <div className="card-body d-flex flex-column gap-4 align-items-center">
              <DonutChart
                title="Toplam"
                delivered={deliveredCountTotal}
                remaining={remainingCountTotal}
              />
              <div className="w-100" style={{borderTop:"1px dashed #e3e8ef"}} />
              <DonutChart
                title="24 Gayrimenkul"
                delivered={useMemo(() => rows24G.filter(isDelivered).length, [rows24G])}
                remaining={Math.max(rows24G.length - rows24G.filter(isDelivered).length, 0)}
              />
              <div className="w-100" style={{borderTop:"1px dashed #e3e8ef"}} />
              <DonutChart
                title="Güneşli Proje"
                delivered={useMemo(() => rowsGunesli.filter(isDelivered).length, [rowsGunesli])}
                remaining={Math.max(rowsGunesli.length - rowsGunesli.filter(isDelivered).length, 0)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="text-center text-muted small mt-3">Eray Önay</div>
    </div>
  );
}

/** ====== Inline render yardımcıları ====== */
function renderRow(label, field, edit, onEditChange, multi = null) {
  if (multi && Array.isArray(multi)) {
    return (
      <tr>
        <th>{label}</th>
        <td>
          <div className="d-flex gap-2 flex-wrap">
            {multi.map(([f, t]) => (
              <div key={f} className="d-flex align-items-center gap-2">
                <span className="small text-muted" style={{minWidth:110}}>{titleCase(f)}</span>
                {inputFor(f, edit, onEditChange, t, isLockedGlobal(f))}
              </div>
            ))}
          </div>
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <th>{label}</th>
      <td>
        {field ? inputFor(field, edit, onEditChange, SCHEMA_TYPES[field], isLockedGlobal(field)) : <span className="text-muted">—</span>}
      </td>
    </tr>
  );
}

function renderRowLocked(label, field, edit, multi = null) {
  // Tamamen salt-okunur render (admin bile değiştiremez)
  if (multi && Array.isArray(multi)) {
    return (
      <tr>
        <th>{label}</th>
        <td>
          <div className="d-flex gap-2 flex-wrap">
            {multi.map(([f, t]) => (
              <div key={f} className="d-flex align-items-center gap-2">
                <span className="small text-muted" style={{minWidth:110}}>{titleCase(f)}</span>
                {readOnlyField(edit?.[f], t)}
              </div>
            ))}
          </div>
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <th>{label}</th>
      <td>{readOnlyField(edit?.[field], SCHEMA_TYPES[field])}</td>
    </tr>
  );
}

function renderRowTripleLocked(label, fields, edit) {
  return (
    <tr>
      <th>{label}</th>
      <td>
        <div className="d-flex gap-2 flex-wrap">
          {fields.map((f) => (
            <div key={f} className="d-flex align-items-center gap-2">
              <span className="small text-muted" style={{minWidth:110}}>{titleCase(f)}</span>
              {readOnlyField(edit?.[f], SCHEMA_TYPES[f])}
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

function readOnlyField(value, typeHint) {
  if (typeHint === "date") return <span>{value ? String(value).slice(0,10) : "-"}</span>;
  if (typeHint === "time") return <span>{value ? String(value).slice(0,5) : "-"}</span>;
  if (typeHint === "numeric") return <span>{value === null || value === undefined || value === "" ? "-" : Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺"}</span>;
  return <span>{value ?? "-"}</span>;
}

// Global kilit (admin + beyaz liste dikkate alınır)
function isLockedGlobal(field) {
  if (field === "created_at") return true;
  if (!window?.localStorage?.getItem("tp_admin")) return true;
  return !ALLOW_EDIT_FIELDS.has(field);
}

function inputFor(field, edit, onEditChange, typeHint, lockedForce = false) {
  // Özel alanlar: Var/Yok & Tapu seçimi (her zaman salt okunur göstermek istiyoruz)
  if (field === "kdv_muafiyeti" || field === "ipotek_durumu" || field === "tapu_durumu") {
    return readOnlyField(edit?.[field], SCHEMA_TYPES[field]);
  }

  const t = (typeHint || SCHEMA_TYPES[field] || "text");
  const val = edit?.[field] ?? "";

  const locked = lockedForce || isLockedGlobal(field);

  if (t === "date") {
    const v = val ? String(val).slice(0,10) : "";
    return (
      <input
        className="form-control form-control-sm"
        type="date"
        value={v}
        onChange={(e) => onEditChange(field, e.target.value)}
        disabled={locked}
        style={{ minWidth: 160 }}
      />
    );
  }
  if (t === "time") {
    const v = val ? String(val).slice(0,5) : "";
    return (
      <input
        className="form-control form-control-sm"
        type="time"
        value={v}
        onChange={(e) => onEditChange(field, e.target.value)}
        disabled={locked}
        style={{ minWidth: 120 }}
      />
    );
  }
  if (t === "int" || t === "numeric") {
    return (
      <input
        className="form-control form-control-sm"
        type="text"
        value={val ?? ""}
        onChange={(e) => onEditChange(field, e.target.value)}
        disabled={locked}
        style={{ minWidth: 120 }}
        placeholder={t === "int" ? "0" : "0,00"}
      />
    );
  }
  return (
    <input
      className="form-control form-control-sm"
      type="text"
      value={val ?? ""}
      onChange={(e) => onEditChange(field, e.target.value)}
      disabled={locked}
      style={{ minWidth: 200 }}
      placeholder={titleCase(field)}
    />
  );
}

/** ---- Yardımcılar ---- */
function titleCase(s) {
  return String(s || "")
    .replaceAll("_", " ")
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}
