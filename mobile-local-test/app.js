import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const STORAGE_KEY = 'Open-Akquise_local_test_config_v1';

const defaultConfig = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    tableName: 'immobilien',
    appPassword: '',
};

const setupStatusEl = document.getElementById('setupStatus');
const loginStatusEl = document.getElementById('loginStatus');
const rowsEl = document.getElementById('rows');

const statTotalEl = document.getElementById('statTotal');
const statSoldEl = document.getElementById('statSold');
const statOpenEl = document.getElementById('statOpen');
const statFilteredEl = document.getElementById('statFiltered');

const controls = {
    supabaseUrl: document.getElementById('supabaseUrl'),
    supabaseKey: document.getElementById('supabaseKey'),
    tableName: document.getElementById('tableName'),
    appPassword: document.getElementById('appPassword'),
    loginPassword: document.getElementById('loginPassword'),
    roleSelect: document.getElementById('roleSelect'),
    agentName: document.getElementById('agentName'),
    searchInput: document.getElementById('searchInput'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    loginBtn: document.getElementById('loginBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
};

let allRows = [];

function readConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultConfig };
        return { ...defaultConfig, ...JSON.parse(raw) };
    } catch {
        return { ...defaultConfig };
    }
}

function writeConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function setStatus(el, message, kind = '') {
    el.textContent = message;
    el.className = `status ${kind}`.trim();
}

function euro(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('de-AT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getTitle(row) {
    return row.title || row.titel || row.bezeichnung || 'Ohne Titel';
}

function getStatus(row) {
    return row.status || row.stand || 'Unbekannt';
}

function getAgent(row) {
    return row.betreut_von || row.agent || row.berater || '';
}

function getPlz(row) {
    return row.plz || row.zip || '';
}

function getOrt(row) {
    return row.ort || row.city || '';
}

function getKaufpreis(row) {
    return row.kaufpreis || row.preis || row.price || 0;
}

function formatRow(row) {
    return {
        id: String(row.external_id || row.id || ''),
        title: String(getTitle(row)),
        plz: String(getPlz(row)),
        ort: String(getOrt(row)),
        status: String(getStatus(row)),
        agent: String(getAgent(row)),
        kaufpreis: Number(getKaufpreis(row)) || 0,
    };
}

function renderRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
        rowsEl.innerHTML = `<tr><td colspan="6" class="muted">Keine Eintraege gefunden.</td></tr>`;
        return;
    }

    const html = list.map((raw) => {
        const r = formatRow(raw);
        return `
            <tr>
                <td>${escapeHtml(r.id)}</td>
                <td>${escapeHtml(r.title)}</td>
                <td>${escapeHtml(`${r.plz} ${r.ort}`.trim())}</td>
                <td>${escapeHtml(r.status)}</td>
                <td>${escapeHtml(r.agent || '-')}</td>
                <td>${escapeHtml(euro(r.kaufpreis))} EUR</td>
            </tr>
        `;
    }).join('');

    rowsEl.innerHTML = html;
}

function renderStats(fullList, filteredList) {
    const sold = fullList.filter((r) => String(getStatus(r)).toLowerCase().includes('verkauf')).length;
    statTotalEl.textContent = String(fullList.length);
    statSoldEl.textContent = String(sold);
    statOpenEl.textContent = String(Math.max(fullList.length - sold, 0));
    statFilteredEl.textContent = String(filteredList.length);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function applyFilter() {
    const search = controls.searchInput.value.trim().toLowerCase();
    const filtered = !search
        ? [...allRows]
        : allRows.filter((row) => {
            const x = formatRow(row);
            return [
                x.id,
                x.title,
                x.plz,
                x.ort,
                x.status,
                x.agent,
                String(x.kaufpreis),
            ].join(' ').toLowerCase().includes(search);
        });

    renderRows(filtered);
    renderStats(allRows, filtered);
}

function loadControlsFromConfig(config) {
    controls.supabaseUrl.value = config.supabaseUrl || '';
    controls.supabaseKey.value = config.supabaseAnonKey || '';
    controls.tableName.value = config.tableName || defaultConfig.tableName;
    controls.appPassword.value = config.appPassword || defaultConfig.appPassword;
}

function collectConfigFromControls() {
    return {
        supabaseUrl: controls.supabaseUrl.value.trim(),
        supabaseAnonKey: controls.supabaseKey.value.trim(),
        tableName: controls.tableName.value.trim() || defaultConfig.tableName,
        appPassword: controls.appPassword.value.trim() || defaultConfig.appPassword,
    };
}

async function loadData() {
    const config = collectConfigFromControls();
    const enteredPassword = controls.loginPassword.value.trim();
    const selectedRole = controls.roleSelect.value;
    const selectedAgent = controls.agentName.value.trim();

    if (!enteredPassword || enteredPassword !== config.appPassword) {
        setStatus(loginStatusEl, 'Falsches Passwort.', 'error');
        return;
    }

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
        setStatus(loginStatusEl, 'Bitte erst Supabase URL und Anon Key im Setup speichern.', 'error');
        return;
    }

    if (selectedRole === 'agent' && !selectedAgent) {
        setStatus(loginStatusEl, 'Bitte Agent Name eingeben.', 'error');
        return;
    }

    setStatus(loginStatusEl, 'Lade Daten...', '');

    try {
        const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: {
                persistSession: false,
            },
        });

        let query = supabase.from(config.tableName).select('*').limit(500);
        if (selectedRole === 'agent') {
            query = query.eq('betreut_von', selectedAgent);
        }

        const { data, error } = await query;
        if (error) {
            throw new Error(error.message);
        }

        allRows = Array.isArray(data) ? data : [];
        applyFilter();
        setStatus(loginStatusEl, `Daten geladen: ${allRows.length} Eintraege.`, 'ok');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        setStatus(loginStatusEl, `Laden fehlgeschlagen: ${message}`, 'error');
    }
}

function init() {
    const config = readConfig();
    loadControlsFromConfig(config);

    controls.saveConfigBtn.addEventListener('click', () => {
        const nextConfig = collectConfigFromControls();
        writeConfig(nextConfig);
        setStatus(setupStatusEl, 'Setup gespeichert.', 'ok');
    });

    controls.loginBtn.addEventListener('click', () => {
        loadData();
    });

    controls.reloadBtn.addEventListener('click', () => {
        loadData();
    });

    controls.searchInput.addEventListener('input', applyFilter);
}

init();

