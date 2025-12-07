import { GitHub } from './github.js';
import { toggleLoader, showToast } from './notifications.js';

const DB_KEY = 'radek_app_db_cache'; // Zmieniona nazwa, to teraz tylko cache

const defaultData = {
    plans: [],
    exercises: []
};

// --- SYNC METHODS (Dla UI - szybki odczyt z cache) ---
export function getDb() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultData;
    return JSON.parse(raw);
}

function saveCache(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// --- ASYNC METHODS (Dla GitHub) ---

// Wywołaj to na starcie każdej strony (index.html, exercises.html)
export async function initApp() {
    toggleLoader(true, 'Pobieranie danych...');
    const remoteData = await GitHub.loadAllData();
    
    if (remoteData) {
        saveCache(remoteData); // Aktualizuj cache
        // showToast('Dane zaktualizowane', 'success');
    }
    toggleLoader(false);
}

// Zapisz ćwiczenia (lokalnie + chmura)
export async function saveExercisesToCloud(exercises) {
    // 1. Zapisz w cache natychmiast dla UI
    const db = getDb();
    db.exercises = exercises;
    saveCache(db);

    // 2. Wyślij do chmury w tle
    const toast = showToast('Zapisywanie w chmurze...', 'loading');
    try {
        await GitHub.saveExercises(exercises);
        // hideToast(toast); // Opcjonalnie
        showToast('Zapisano ćwiczenia!', 'success');
    } catch (e) {
        showToast('Błąd zapisu!', 'error');
    }
}

// Zapisz Plan (lokalnie + chmura)
export async function savePlanToCloud(plan) {
    // 1. Update Cache
    const db = getDb();
    const idx = db.plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) db.plans[idx] = plan;
    else db.plans.push(plan);
    saveCache(db);

    // 2. Cloud Update
    const toast = showToast('Synchronizacja planu...', 'loading');
    try {
        await GitHub.savePlan(plan);
        showToast('Plan zapisany!', 'success');
    } catch (e) {
        showToast('Błąd zapisu planu!', 'error');
        console.error(e);
    }
}

// Usuń Plan
export async function deletePlanFromCloud(planId) {
    // 1. Update Cache
    const db = getDb();
    db.plans = db.plans.filter(p => p.id !== planId);
    saveCache(db);

    // 2. Cloud
    const toast = showToast('Usuwanie...', 'loading');
    try {
        await GitHub.deletePlan(planId);
        showToast('Plan usunięty', 'success');
    } catch (e) {
        showToast('Błąd usuwania!', 'error');
    }
}

// Globalny backup (eksport do pliku - stara funkcja)
export function exportToJson() {
    const data = getDb();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const el = document.createElement('a');
    el.setAttribute("href", dataStr);
    el.setAttribute("download", `Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(el);
    el.click();
    el.remove();
}