
const SIMURG_SUPABASE_URL = "https://kgbajrrfwcsbdbbuvhww.supabase.co";
const SIMURG_SUPABASE_KEY = "sb_publishable_4pCcxpRqlaYeTY3D2CwgGA_Il3LfwLj";
const SIMURG_SYNC_ID = "main";

function setCloudStatus(message, type) {
  const el = document.getElementById('cloudSyncStatus');
  if (!el) return;
  el.classList.remove('ok','err');
  if (type) el.classList.add(type);
  el.textContent = message;
}

function simurgCloudHeaders(extra) {
  return Object.assign({
    "apikey": SIMURG_SUPABASE_KEY,
    "Authorization": "Bearer " + SIMURG_SUPABASE_KEY,
    "Content-Type": "application/json"
  }, extra || {});
}

async function pushToCloud() {
  try {
    if (!confirm("Bu cihazdaki mevcut Simurg OS verisi buluta gönderilecek ve cloud ana kayıt güncellenecek. Devam edelim mi?")) {
      setCloudStatus("Push cancelled.", "");
      return;
    }
    setCloudStatus("Pushing local data to cloud...", "");
    const payload = {
      data: DATA,
      pushedAt: new Date().toISOString(),
      version: "simurg-os-sync-v1"
    };
    const res = await fetch(SIMURG_SUPABASE_URL + "/rest/v1/simurg_data?on_conflict=id", {
      method: "POST",
      headers: simurgCloudHeaders({
        "Prefer": "resolution=merge-duplicates,return=representation"
      }),
      body: JSON.stringify({
        id: SIMURG_SYNC_ID,
        payload: payload,
        updated_at: new Date().toISOString()
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + " " + txt);
    }
    setCloudStatus("Cloud sync complete: local data pushed successfully.", "ok");
  } catch (err) {
    setCloudStatus("Push failed: " + err.message, "err");
  }
}

async function pullFromCloud() {
  try {
    setCloudStatus("Pulling data from cloud...", "");
    const res = await fetch(SIMURG_SUPABASE_URL + "/rest/v1/simurg_data?id=eq." + encodeURIComponent(SIMURG_SYNC_ID) + "&select=payload,updated_at", {
      method: "GET",
      headers: simurgCloudHeaders()
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + " " + txt);
    }
    const rows = await res.json();
    if (!rows.length || !rows[0].payload || !rows[0].payload.data) {
      setCloudStatus("Cloud has no Simurg OS data yet. Push from one device first.", "err");
      return;
    }
    if (!confirm("Pull From Cloud bu cihazdaki mevcut local veriyi buluttaki kayıtla güncelleyecek. Devam edelim mi?")) {
      setCloudStatus("Pull cancelled.", "");
      return;
    }
    DATA = rows[0].payload.data;
    localStorage.setItem('atlas_summary_reports', JSON.stringify(DATA));
    if (!DATA.appleWatch) DATA.appleWatch = [];
    if (!DATA.dailyNotes) DATA.dailyNotes = [];
    if (!DATA.weeklyNotes) DATA.weeklyNotes = [];
    if (!DATA.customGymPrograms) DATA.customGymPrograms = {};
    render();
    setCloudStatus("Cloud data pulled successfully. Last update: " + (rows[0].updated_at || "-"), "ok");
  } catch (err) {
    setCloudStatus("Pull failed: " + err.message, "err");
  }
}

async function checkCloudStatus() {
  try {
    setCloudStatus("Checking cloud...", "");
    const res = await fetch(SIMURG_SUPABASE_URL + "/rest/v1/simurg_data?id=eq." + encodeURIComponent(SIMURG_SYNC_ID) + "&select=updated_at", {
      method: "GET",
      headers: simurgCloudHeaders()
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + " " + txt);
    }
    const rows = await res.json();
    if (!rows.length) {
      setCloudStatus("Cloud is reachable, but no data exists yet. Push first.", "ok");
    } else {
      setCloudStatus("Cloud is reachable. Last cloud update: " + rows[0].updated_at, "ok");
    }
  } catch (err) {
    setCloudStatus("Cloud check failed: " + err.message, "err");
  }
}
