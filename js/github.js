import { GITHUB_CONFIG } from './config.js';

const BASE_URL = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents`;

// Kodowanie znaków (obsługa polskich liter)
const toBase64 = str => window.btoa(unescape(encodeURIComponent(str)));
const fromBase64 = str => decodeURIComponent(escape(window.atob(str)));

// Kolejka zapytań (żeby nie wysłać 2 naraz)
let requestQueue = Promise.resolve();
function addToQueue(task) {
    requestQueue = requestQueue.then(() => task()).catch(err => console.error("GH Queue Error:", err));
    return requestQueue;
}

// Główna funkcja do komunikacji z API
async function fetchAPI(path, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    // Dodajemy timestamp, żeby przeglądarka nie cache'owała zapytań
    const url = method === 'GET' 
        ? `${BASE_URL}/${path}?ref=${GITHUB_CONFIG.BRANCH}&t=${Date.now()}` 
        : `${BASE_URL}/${path}`;

    const res = await fetch(url, options);
    return res;
}

export const GitHub = {
    // 1. Ładowanie danych (Odporne na brak folderów)
    async loadAllData() {
        console.log("🔄 Próba pobrania danych z GitHub...");
        
        try {
            // A. Pobieramy ćwiczenia
            // Jeśli plik nie istnieje (404), zwracamy pustą tablicę []
            let exercises = [];
            const exRes = await fetchAPI('storage/exercises.json');
            if (exRes.ok) {
                const json = await exRes.json();
                exercises = JSON.parse(fromBase64(json.content));
            } else {
                console.log("ℹ️ Brak pliku exercises.json (To normalne na start). Tworzę pustą bazę.");
            }

            // B. Pobieramy plany
            // Jeśli folder nie istnieje (404), zwracamy pustą tablicę []
            let plans = [];
            const plansRes = await fetchAPI('storage/plans');
            if (plansRes.ok) {
                const plansList = await plansRes.json();
                if (Array.isArray(plansList)) {
                    // Pobieramy zawartość każdego znalezionego pliku .json
                    const jsonFiles = plansList.filter(f => f.name.endsWith('.json'));
                    const promises = jsonFiles.map(f => 
                        fetchAPI(f.path)
                            .then(r => r.json())
                            .then(d => JSON.parse(fromBase64(d.content)))
                            .catch(() => null)
                    );
                    const results = await Promise.all(promises);
                    plans = results.filter(p => p !== null);
                }
            } else {
                console.log("ℹ️ Brak folderu storage/plans (To normalne na start).");
            }

            return { exercises, plans };

        } catch (error) {
            console.error("❌ Błąd krytyczny GitHub:", error);
            // Zwracamy puste dane, żeby aplikacja się nie wysypała
            return { exercises: [], plans: [] };
        }
    },

    // 2. Zapisywanie pliku (Automatycznie tworzy foldery!)
    async saveFile(path, content) {
        return addToQueue(async () => {
            // Sprawdzamy czy plik już istnieje, żeby pobrać jego SHA (wymagane do nadpisania)
            let sha = null;
            const check = await fetchAPI(path);
            if (check.ok) {
                const info = await check.json();
                sha = info.sha;
            }

            // GitHub API automatycznie utworzy foldery w ścieżce, jeśli nie istnieją
            const res = await fetchAPI(path, 'PUT', {
                message: `Update ${path} via App`,
                content: toBase64(JSON.stringify(content, null, 2)),
                branch: GITHUB_CONFIG.BRANCH,
                sha: sha || undefined // Jeśli null (nowy plik), nie wysyłamy SHA
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(`GitHub Save Error: ${err.message}`);
            }
            return res;
        });
    },

    // 3. Usuwanie pliku
    async deleteFile(path) {
        return addToQueue(async () => {
            const check = await fetchAPI(path);
            if (!check.ok) return; // Plik już nie istnieje, sukces
            
            const info = await check.json();
            await fetchAPI(path, 'DELETE', {
                message: `Delete ${path}`,
                sha: info.sha,
                branch: GITHUB_CONFIG.BRANCH
            });
        });
    }
};