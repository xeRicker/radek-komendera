import { initApp, getDb, savePlanToCloud, deletePlanFromCloud, exportToJson } from '../core/storage.js';

let isDeleteMode = false;
let selectedPlans = new Set();

export async function init() {
    await initApp();
    render();
}

function render() {
    const db = getDb();
    const grid = document.getElementById('plansGrid');
    if(!grid) return;
    
    grid.innerHTML = '';
    
    if(!db.plans || db.plans.length === 0) {
        grid.innerHTML = `<div class="glass-panel empty-state" style="grid-column:1/-1; text-align:center; padding:40px;"><span class="material-symbols-rounded empty-state-icon" style="font-size:48px; color:#333">folder_off</span><h2 style="color:#666; margin:10px 0;">BRAK PLANÓW</h2><button class="btn" onclick="window.DashLogic.createPlan()" style="margin-top:20px;"><span class="material-symbols-rounded">add</span> Stwórz</button></div>`;
        return;
    }

    db.plans.forEach(plan => {
        const card = document.createElement('div');
        const deleteClass = isDeleteMode ? 'delete-mode' : '';
        const selectClass = selectedPlans.has(plan.id) ? 'selected' : '';
        const borderStyle = selectedPlans.has(plan.id) ? `2px solid var(--danger-color)` : `1px solid transparent`;
        
        card.className = `glass-panel plan-card ${deleteClass} ${selectClass}`;
        card.style.borderLeft = `5px solid ${plan.color || '#CCFF00'}`;
        if(isDeleteMode && selectedPlans.has(plan.id)) card.style.border = borderStyle;

        card.onclick = () => cardClick(plan.id);
        
        card.innerHTML = `
            <div class="flex-row space-between">
                <h3 class="brand-font" style="font-size:1.4rem;">${plan.name}</h3>
                <span class="material-symbols-rounded" style="color:${plan.color || '#CCFF00'}">fitness_center</span>
            </div>
            <p class="text-sec" style="font-size:0.9rem;margin-top:10px;">${plan.days ? plan.days.length : 0} Dni &bull; ${plan.duration || 4} Tygodnie</p>
            ${isDeleteMode ? `<div style="position:absolute; top:15px; right:15px; color:var(--danger-color);"><span class="material-symbols-rounded">${selectedPlans.has(plan.id) ? 'check_circle' : 'radio_button_unchecked'}</span></div>` : ''}
        `;
        grid.appendChild(card);
    });
}

function cardClick(id) {
    if (isDeleteMode) {
        selectedPlans.has(id) ? selectedPlans.delete(id) : selectedPlans.add(id);
        render();
    } else {
        window.location.href = `plan.html?id=${id}`;
    }
}

// --- PUBLIC ACTIONS ---
export async function createPlan() {
    // DODANO: mainNote z domyślną wartością
    const newPlan = { 
        id: Date.now().toString(), 
        name: 'Nowy Podopieczny', 
        color: '#CCFF00', 
        days: [], 
        duration: 4,
        mainNote: 'Powodzenia na treningu!' 
    };
    await savePlanToCloud(newPlan);
    render();
}

export function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode; 
    selectedPlans.clear();
    const bar = document.getElementById('deleteActionBar');
    if(bar) bar.style.display = isDeleteMode ? 'flex' : 'none';
    render();
}

export async function deleteSelected() {
    if(confirm(`Usunąć ${selectedPlans.size} planów?`)) {
        for (let id of selectedPlans) await deletePlanFromCloud(id);
        toggleDeleteMode();
    }
}

export const downloadBackup = exportToJson;

window.DashLogic = {
    init,
    createPlan,
    toggleDeleteMode,
    deleteSelected,
    downloadBackup
};