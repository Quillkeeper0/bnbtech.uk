/* =========================================================
ESIM ELIGIBILITY CHECKER (client-side, no backend)
Data: Osmocom TAC Database (CC-BY-SA 3.0) - tacdb.json
Loaded lazily on first use, cached in memory for the session.
========================================================== */
let _tacDb = null;
let _tacDbLoading = null;

function loadTacDb() {
    if (_tacDb) return Promise.resolve(_tacDb);
    if (_tacDbLoading) return _tacDbLoading;
    _tacDbLoading = fetch('data/tacdb.json')
        .then(r => { if (!r.ok) throw new Error('tacdb fetch failed'); return r.json(); })
        .then(json => { _tacDb = json; return json; })
        .catch(err => { console.error('eSIM checker: could not load local TAC database', err); return null; });
    return _tacDbLoading;
}

function luhnCheckImei(imei) {
    if (!/^\d{15}$/.test(imei)) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
        let d = parseInt(imei[i], 10);
        if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
    }
    return sum % 10 === 0;
}

function classifyEsim(brand, model) {
    const b = (brand || '').toLowerCase();
    const m = (model || '').toLowerCase();

    if (b.includes('apple') || m.includes('iphone') || m.includes('ipad')) {
        if (m.includes('ipad')) return 'uncertain';
        if (/\bxs\b|\bxr\b/.test(m)) return 'supported';
        if (/\bx\b/.test(m) && !/\bxs\b|\bxr\b/.test(m)) return 'not_supported';
        const numMatch = m.match(/iphone\s*(\d+)/);
        if (numMatch) return parseInt(numMatch[1], 10) >= 11 ? 'supported' : 'not_supported';
        if (m.includes('se')) return 'uncertain'; // SE gen 1 (no) vs gen 2/3 (yes) - name alone can't tell
        return 'uncertain';
    }