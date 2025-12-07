import { GITHUB_CONFIG } from './config.js';
import { showToast } from './notifications.js';

const BASE_URL = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents`;

// Helper do kodowania/dekodowania UTF-8 w Base64 (ważne dla polskich znaków!)
const toBase64 = str => window.btoa(unescape(encodeURIComponent(str)));
const fromBase64 = str => decodeURIComponent(escape(window.atob(str)));

// Kolejka zadań, aby uniknąć konfliktów 409
let requestQueue = Promise.resolve();

function addToQueue(task) {
    requestQueue = requestQueue.then(() => task()).catch(err => {
        console.error("Queue error:", err);
    });
    return requestQueue;
}

// --- API METHODS ---

// 1. Pobierz plik
async function fetchFile(path) {
    const response = await fetch(`${BASE_URL}/${path}?ref=${GITHUB_CONFIG.BRANCH}`, {
        headers: {
            'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) return null; // Plik nie istnieje
        throw new Error(`GitHub Fetch Error: ${response.status}`);
    }

    const data = await response.json();
    // GitHub API zwraca treść w polu .content (base64)
    return JSON.parse(fromBase64(data.content));
}

// 2. Pobierz listę plików w folderze (dla planów)
async function fetchDir(path) {
    const response = await fetch(`${BASE_URL}/${path}?ref=${GITHUB_CONFIG.BRANCH}`, {
        headers: {
            'Authorization': `token ${GITHUB_CONFIG.TOKEN}`
        }
    });
    
    if (!response.ok) return [];
    return await response.json();
}

// 3. Zapisz plik (z obsługą SHA)
async function saveFile(path, content) {
    // Najpierw pobierz SHA pliku (jeśli istnieje), aby zrobić update
    let sha = null;
    try {
        const check = await fetch(`${BASE_URL}/${path}?ref=${GITHUB_CONFIG.BRANCH}`, {
            headers: { 'Authorization': `token ${GITHUB_CONFIG.TOKEN}` }
        });
        if (check.ok) {
            const fileInfo = await check.json();
            sha = fileInfo.sha;
        }
    } catch (e) { /* ignore */ }

    const body = {
        message: `Update ${path} via WebApp`,
        content: toBase64(JSON.stringify(content, null, 2)),
        branch: GITHUB_CONFIG.BRANCH
    };
    if (sha) body.sha = sha;

    const response = await fetch(`${BASE_URL}/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Save failed: ${response.statusText}`);
    return await response.json();
}

// 4. Usuń plik
async function deleteFile(path) {
    // Potrzebujemy SHA żeby usunąć
    const check = await fetch(`${BASE_URL}/${path}?ref=${GITHUB_CONFIG.BRANCH}`, {
        headers: { 'Authorization': `token ${GITHUB_CONFIG.TOKEN}` }
    });
    if (!check.ok) return; // Nie ma co usuwać

    const fileInfo = await check.json();

    await fetch(`${BASE_URL}/${path}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Delete ${path}`,
            sha: fileInfo.sha,
            branch: GITHUB_CONFIG.BRANCH
        })
    });
}

// --- PUBLIC INTERFACE ---

export const GitHub = {
    // Pobiera wszystko i składa w obiekt db (plans + exercises)
    async loadAllData() {
        try {
            // Równoległe pobieranie ćwiczeń i listy planów
            const [exercises, plansList] = await Promise.all([
                fetchFile('storage/exercises.json'),
                fetchDir('storage/plans')
            ]);

            const db = { exercises: exercises || [], plans: [] };

            // Pobierz każdy plan z osobna
            if (Array.isArray(plansList)) {
                // Filtruj tylko pliki .json
                const jsonFiles = plansList.filter(f => f.name.endsWith('.json'));
                
                // Pobieramy plany równolegle
                const plansData = await Promise.all(jsonFiles.map(f => fetchFile(f.path)));
                db.plans = plansData.filter(p => p !== null);
            }

            return db;

        } catch (error) {
            console.error("Critical Load Error:", error);
            showToast("Błąd pobierania danych z GitHub!", "error");
            return null;
        }
    },

    // Kolejkuje zapis ćwiczeń
    async saveExercises(exercises) {
        return addToQueue(() => saveFile('storage/exercises.json', exercises));
    },

    // Kolejkuje zapis konkretnego planu
    async savePlan(plan) {
        return addToQueue(() => saveFile(`storage/plans/${plan.id}.json`, plan));
    },

    // Kolejkuje usunięcie planu
    async deletePlan(planId) {
        return addToQueue(() => deleteFile(`storage/plans/${planId}.json`));
    },
    
    // Zapisz wszystko (np. migracja)
    async saveAll(db) {
        await this.saveExercises(db.exercises);
        for(const plan of db.plans) {
            await this.savePlan(plan);
        }
    }
};