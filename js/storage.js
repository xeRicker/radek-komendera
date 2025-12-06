const DB_KEY = 'radek_app_db_v2';

const defaultData = {
    plans: [],
    exercises: []
};

// Pobierz dane
function getDb() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultData;
    return JSON.parse(raw);
}

// Zapisz dane
function saveDb(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Pobierz konkretny plan
function getPlan(id) {
    const db = getDb();
    return db.plans.find(p => p.id === id);
}

// Zaktualizuj konkretny plan
function updatePlan(updatedPlan) {
    const db = getDb();
    const index = db.plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
        db.plans[index] = updatedPlan;
        saveDb(db);
        return true;
    }
    return false;
}

// Eksport do pliku
function exportToJson() {
    const data = getDb();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const el = document.createElement('a');
    el.setAttribute("href", dataStr);
    el.setAttribute("download", `RadekKomendera_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(el);
    el.click();
    el.remove();
}

// Import z pliku
function importFromJson(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            saveDb(json);
            callback(true);
        } catch (err) {
            console.error(err);
            callback(false);
        }
    };
    reader.readAsText(file);
}