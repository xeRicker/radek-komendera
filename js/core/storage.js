import { GitHub } from './github.js';
import { toggleLoader, showToast } from '../ui/notifications.js';

const DB_KEY = 'radek_app_cache';
const defaultData = { plans: [], exercises: [] };
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export function getDb() {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : defaultData;
}

function saveCache(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export async function initApp() {
    toggleLoader(true, 'Pobieranie danych...');
    
    if (IS_LOCALHOST) {
        console.log("🛠️ Tryb Localhost");
        
        if (!localStorage.getItem(DB_KEY)) {
            saveCache(defaultData);
        }

        // Czekamy chwilę, żeby CSS zdążył się załadować przed wyświetleniem dymka
        setTimeout(() => {
            toggleLoader(false);
            showToast('Tryb Localhost: Dane lokalne', 'success');
        }, 500);
        return;
    }

    try {
        const cloudData = await GitHub.loadAllData();
        if (cloudData && (cloudData.exercises.length > 0 || cloudData.plans.length > 0)) {
            saveCache(cloudData);
        }
    } catch (e) {
        console.error("Init Error:", e);
        showToast("Błąd pobierania danych", "error");
    } finally {
        toggleLoader(false);
    }
}

// Eksporty do zapisu (bez zmian w logice, tylko czyszczenie)
export async function saveExercisesToCloud(exercises) {
    const db = getDb();
    db.exercises = exercises;
    saveCache(db);
    
    if (IS_LOCALHOST) { showToast('Zapisano lokalnie (DEV)', 'success'); return; }

    showToast('Zapisywanie...', 'loading');
    try { await GitHub.saveFile('storage/exercises.json', exercises); showToast('Zapisano!', 'success'); } 
    catch(e) { showToast('Błąd zapisu', 'error'); }
}

export async function savePlanToCloud(plan) {
    const db = getDb();
    const idx = db.plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) db.plans[idx] = plan; else db.plans.push(plan);
    saveCache(db);

    if (IS_LOCALHOST) { showToast('Plan zapisany (DEV)', 'success'); return; }

    showToast('Zapisywanie...', 'loading');
    try { await GitHub.saveFile(`storage/plans/${plan.id}.json`, plan); showToast('Zapisano!', 'success'); } 
    catch(e) { showToast('Błąd zapisu', 'error'); }
}

export async function deletePlanFromCloud(planId) {
    const db = getDb();
    db.plans = db.plans.filter(p => p.id !== planId);
    saveCache(db);

    if (IS_LOCALHOST) { showToast('Usunięto (DEV)', 'success'); return; }

    try { await GitHub.deleteFile(`storage/plans/${planId}.json`); showToast('Usunięto', 'success'); } 
    catch(e) { showToast('Błąd usuwania', 'error'); }
}

export function exportToJson() {
    const data = getDb();
    const el = document.createElement('a');
    el.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)));
    el.setAttribute("download", `Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(el); el.click(); el.remove();
}