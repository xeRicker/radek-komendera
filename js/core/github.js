import { GITHUB_CONFIG } from '../config.js';

const BASE_URL = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents`;
const toBase64 = str => window.btoa(unescape(encodeURIComponent(str)));
const fromBase64 = str => decodeURIComponent(escape(window.atob(str)));

let requestQueue = Promise.resolve();
function addToQueue(task) {
    requestQueue = requestQueue.then(() => task()).catch(err => console.error("GH Queue Error:", err));
    return requestQueue;
}

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
    const url = method === 'GET' 
        ? `${BASE_URL}/${path}?ref=${GITHUB_CONFIG.BRANCH}&t=${Date.now()}` 
        : `${BASE_URL}/${path}`;
    return fetch(url, options);
}

export const GitHub = {
    async loadAllData() {
        try {
            let exercises = [];
            const exRes = await fetchAPI('storage/exercises.json');
            if (exRes.ok) {
                const json = await exRes.json();
                exercises = JSON.parse(fromBase64(json.content));
            }

            let plans = [];
            const plansRes = await fetchAPI('storage/plans');
            if (plansRes.ok) {
                const plansList = await plansRes.json();
                if (Array.isArray(plansList)) {
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
            }
            return { exercises, plans };
        } catch (error) {
            console.error("Critical GitHub Error:", error);
            return { exercises: [], plans: [] };
        }
    },

    async saveFile(path, content) {
        return addToQueue(async () => {
            let sha = null;
            const check = await fetchAPI(path);
            if (check.ok) {
                const info = await check.json();
                sha = info.sha;
            }
            const res = await fetchAPI(path, 'PUT', {
                message: `Update ${path}`,
                content: toBase64(JSON.stringify(content, null, 2)),
                branch: GITHUB_CONFIG.BRANCH,
                sha: sha || undefined
            });
            if (!res.ok) throw new Error('GH Save Failed');
            return res;
        });
    },

    async deleteFile(path) {
        return addToQueue(async () => {
            const check = await fetchAPI(path);
            if (!check.ok) return;
            const info = await check.json();
            await fetchAPI(path, 'DELETE', {
                message: `Delete ${path}`,
                sha: info.sha,
                branch: GITHUB_CONFIG.BRANCH
            });
        });
    }
};