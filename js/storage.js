import { GitHub } from './github.js';
import { toggleLoader, showToast } from './notifications.js';

const DB_KEY = 'radek_app_cache';
const defaultData = { plans: [], exercises: [] };

export function getDb() {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : defaultData;
}

function saveCache(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export async function initApp() {
    toggleLoader(true, 'Pobieranie danych...'); // Pokaż loader
    try {
        const cloudData = await GitHub.loadAllData();
        if (cloudData) {
            saveCache(cloudData);
        } else {
            // Tylko loguj, nie blokuj UI na zawsze
            console.warn('GitHub connection issue or empty data');
        }
    } catch (e) {
        console.error("Init Error:", e);
        showToast("Błąd inicjalizacji", "error");
    } finally {
        // ZAWSZE ukryj loader na końcu
        toggleLoader(false);
    }
}

export async function saveExercisesToCloud(exercises) {
    const db = getDb();
    db.exercises = exercises;
    saveCache(db);
    
    showToast('Zapisywanie...', 'loading');
    try {
        await GitHub.saveFile('storage/exercises.json', exercises);
        showToast('Zapisano ćwiczenia!', 'success');
    } catch(e) { showToast('Błąd zapisu', 'error'); }
}

export async function savePlanToCloud(plan) {
    const db = getDb();
    const idx = db.plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) db.plans[idx] = plan; else db.plans.push(plan);
    saveCache(db);

    showToast('Zapisywanie planu...', 'loading');
    try {
        await GitHub.saveFile(`storage/plans/${plan.id}.json`, plan);
        showToast('Plan zapisany!', 'success');
    } catch(e) { showToast('Błąd zapisu', 'error'); }
}

export async function deletePlanFromCloud(planId) {
    const db = getDb();
    db.plans = db.plans.filter(p => p.id !== planId);
    saveCache(db);

    showToast('Usuwanie...', 'loading');
    try {
        await GitHub.deleteFile(`storage/plans/${planId}.json`);
        showToast('Usunięto plan', 'success');
    } catch(e) { showToast('Błąd usuwania', 'error'); }
}

export function exportToJson() {
    const data = getDb();
    const el = document.createElement('a');
    el.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)));
    el.setAttribute("download", `Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(el); el.click(); el.remove();
}