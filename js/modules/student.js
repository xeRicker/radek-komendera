import { initApp, getDb, savePlanToCloud } from '../core/storage.js';
import { showTooltip, showInfoTooltip, hideTooltip } from '../ui/tooltip.js';
import { showToast } from '../ui/notifications.js';

let currentPlan = null;
let hasChanges = false;

export async function init(id) {
    await initApp();
    const db = getDb();
    if(!db.plans) return;
    const plan = db.plans.find(p => p.id === id);
    if (!plan) return;

    currentPlan = JSON.parse(JSON.stringify(plan)); // Deep copy do edycji
    
    document.getElementById('stPlanName').innerText = currentPlan.name;
    document.getElementById('stPlanNote').innerText = currentPlan.mainNote || '';
    renderRows(currentPlan);
}

// --- LOGIKA ZAPISU ---

function markChanged() {
    hasChanges = true;
    const btn = document.getElementById('saveProgressBtn');
    if(btn) {
        btn.classList.add('has-changes');
        btn.innerHTML = '<span class="material-symbols-rounded">save</span> Zapisz Postęp';
    }
}

export async function saveProgress() {
    if(!currentPlan) return;
    await savePlanToCloud(currentPlan);
    hasChanges = false;
    
    const btn = document.getElementById('saveProgressBtn');
    if(btn) {
        btn.classList.remove('has-changes');
        btn.innerHTML = '<span class="material-symbols-rounded">check</span> Zapisano';
    }
}

export function updateResult(dayIdx, exIdx, weekIdx, value) {
    const ex = currentPlan.days[dayIdx].exercises[exIdx];
    if(!ex.results) ex.results = {};
    
    // Klucz np. "w1", "w2", "deload"
    const key = weekIdx === 'deload' ? 'deload' : `w${weekIdx}`;
    
    if(ex.results[key] !== value) {
        ex.results[key] = value;
        markChanged();
    }
}

export function updateStatus(dayIdx, exIdx, weekIdx, status) {
    const ex = currentPlan.days[dayIdx].exercises[exIdx];
    if(!ex.status) ex.status = {};
    
    const key = weekIdx === 'deload' ? 'deload' : `w${weekIdx}`;
    
    // Toggle logic
    if(ex.status[key] === status) {
        delete ex.status[key];
    } else {
        ex.status[key] = status;
    }
    markChanged();
    renderRows(currentPlan); // Prerenderuj żeby zaktualizować kolorki
}

// --- RENDEROWANIE ---

function renderRows(plan) {
    const container = document.getElementById('stDaysContainer');
    if(!container) return;
    
    // Zachowaj scroll position przy przerysowaniu
    const scrollPos = window.scrollY;
    
    container.innerHTML = '';
    const weeks = parseInt(plan.duration) || 4;

    plan.days.forEach((day, dIdx) => {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.innerHTML = `<h2 class="brand-font" style="margin-bottom:20px; color:var(--primary-color); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; font-size:1.8rem;">${day.name}</h2>`;

        day.exercises.forEach((ex, exIdx) => {
            // Parsowanie tempa
            let t1='2', t2='1', t3='2';
            if(ex.tempo) {
                const parts = ex.tempo.replace(/[^0-9a-zA-Z]/g, '-').split('-');
                if(parts.length >= 1) t1 = parts[0];
                if(parts.length >= 2) t2 = parts[1];
                if(parts.length >= 3) t3 = parts[2];
            }

            // Nagłówki
            let headerCols = '';
            for(let i=1; i<=weeks; i++) headerCols += `<th>TYDZIEŃ ${i}</th>`;
            if(plan.hasDeload) headerCols += `<th style="color:var(--primary-color)">DELOAD</th>`;

            // Inputy
            let inputCols = '';
            for(let i=1; i<=weeks; i++) {
                inputCols += createCell(dIdx, exIdx, i, ex);
            }
            if(plan.hasDeload) {
                inputCols += createCell(dIdx, exIdx, 'deload', ex, true);
            }

            const exDiv = document.createElement('div');
            exDiv.style.marginBottom = "40px";
            exDiv.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom:12px;">
                        <span class="interactive-text brand-font" 
                              style="font-size:1.5rem;"
                              onmouseenter="window.showTooltip(event, '${ex.name}')" 
                              onmouseleave="window.hideTooltip()">
                              ${ex.name}
                        </span>
                    </div>
                    
                    <div class="student-meta-grid" style="display:flex; gap:10px; flex-wrap:wrap;">
                        <div class="meta-pill interact-pill" onmouseenter="window.showInfoTooltip(event, 'SERIE')" onmouseleave="window.hideTooltip()">
                            <span style="color:#888;font-size:0.65rem;display:block;font-weight:700;">SERIE</span> <b style="font-size:1rem">${ex.sets}</b>
                        </div>
                        <div class="meta-pill interact-pill" onmouseenter="window.showInfoTooltip(event, 'POWT')" onmouseleave="window.hideTooltip()">
                            <span style="color:#888;font-size:0.65rem;display:block;font-weight:700;">POWT</span> <b style="font-size:1rem">${ex.reps}</b>
                        </div>
                        
                        <div class="meta-pill" style="background:rgba(255,255,255,0.06); padding:6px 14px; border-radius:10px; display:flex; gap:8px;">
                            <div style="text-align:center" class="interact-text" onmouseenter="window.showInfoTooltip(event, 'EKS')" onmouseleave="window.hideTooltip()">
                                <span style="font-size:0.6rem;color:#888;font-weight:700">EKS</span><div style="font-weight:700;font-size:0.95rem">${t1}</div>
                            </div>
                            <div style="width:1px; background:rgba(255,255,255,0.1)"></div>
                            <div style="text-align:center" class="interact-text" onmouseenter="window.showInfoTooltip(event, 'PAU')" onmouseleave="window.hideTooltip()">
                                <span style="font-size:0.6rem;color:#888;font-weight:700">PAU</span><div style="font-weight:700;font-size:0.95rem">${t2}</div>
                            </div>
                            <div style="width:1px; background:rgba(255,255,255,0.1)"></div>
                            <div style="text-align:center" class="interact-text" onmouseenter="window.showInfoTooltip(event, 'KON')" onmouseleave="window.hideTooltip()">
                                <span style="font-size:0.6rem;color:#888;font-weight:700">KON</span><div style="font-weight:700;font-size:0.95rem">${t3}</div>
                            </div>
                        </div>

                        <div class="meta-pill interact-pill" onmouseenter="window.showInfoTooltip(event, 'PRZERWA')" onmouseleave="window.hideTooltip()">
                            <span style="color:#888;font-size:0.65rem;display:block;font-weight:700;">PRZERWA</span> <b style="font-size:1rem">${ex.rest}</b>
                        </div>
                        ${ex.weight ? `<div class="meta-pill interact-pill" style="border:1px solid rgba(204,255,0,0.3);" onmouseenter="window.showInfoTooltip(event, 'RIR')" onmouseleave="window.hideTooltip()"><span style="color:var(--primary-color);font-size:0.65rem;display:block;font-weight:700;">RIR</span> <b style="color:var(--primary-color);font-size:1rem">${ex.weight}</b></div>` : ''}
                    </div>
                    
                    ${ex.note ? `
                    <div style="margin-top:12px; padding:12px; background:rgba(204,255,0,0.05); border:1px solid rgba(204,255,0,0.1); border-radius:10px; display:flex; gap:10px; align-items:center; color:var(--primary-color);">
                        <span class="material-symbols-rounded" style="font-size:20px;">info</span>
                        <span style="font-size:0.9rem; font-weight:500;">${ex.note}</span>
                    </div>` : ''}
                </div>
                <div class="student-table-wrapper">
                    <table class="student-table"><thead><tr>${headerCols}</tr></thead><tbody><tr>${inputCols}</tr></tbody></table>
                </div>
            `;
            div.appendChild(exDiv);
        });
        container.appendChild(div);
    });
    
    // Restore scroll
    window.scrollTo(0, scrollPos);
}

function createCell(dIdx, exIdx, week, ex, isDeload = false) {
    const bgStyle = isDeload ? 'background:rgba(204,255,0,0.05);' : '';
    const placeholder = isDeload ? 'Lżej' : '-';
    
    // Pobierz zapisane dane
    const key = week === 'deload' ? 'deload' : `w${week}`;
    const savedVal = ex.results ? (ex.results[key] || '') : '';
    const status = ex.status ? (ex.status[key] || '') : '';
    
    // Klasa statusu
    let statusClass = '';
    if(status === 'green') statusClass = 'state-green';
    if(status === 'yellow') statusClass = 'state-yellow';
    if(status === 'red') statusClass = 'state-red';

    return `
    <td class="student-cell ${statusClass}" style="${bgStyle}">
        <input class="result-input" placeholder="${placeholder}" value="${savedVal}" 
               oninput="window.StudentLogic.updateResult(${dIdx}, ${exIdx}, '${week}', this.value)">
        <div class="status-dots">
            <div class="status-dot" style="color:#aaffaa; border-color:#aaffaa;" onclick="window.StudentLogic.updateStatus(${dIdx}, ${exIdx}, '${week}', 'green')">✓</div>
            <div class="status-dot" style="color:#ffffaa; border-color:#ffffaa;" onclick="window.StudentLogic.updateStatus(${dIdx}, ${exIdx}, '${week}', 'yellow')">=</div>
            <div class="status-dot" style="color:#ffaaaa; border-color:#ffaaaa;" onclick="window.StudentLogic.updateStatus(${dIdx}, ${exIdx}, '${week}', 'red')">✕</div>
        </div>
    </td>`;
}

// Global Exports
window.StudentLogic = {
    init,
    saveProgress,
    updateResult,
    updateStatus
};