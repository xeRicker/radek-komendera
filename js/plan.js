import { getDb, savePlanToCloud, deletePlanFromCloud } from './storage.js';
import { openModal, closeModal } from './ui.js';

let currentPlan = null;
let targetDayIndex = null;
let hasUnsavedChanges = false;

// Główna funkcja ładowania
export async function loadPlan(id) {
    const db = getDb();
    const original = db.plans.find(p => p.id === id);
    if (!original) {
        alert("Nie znaleziono planu!");
        window.location.href = 'index.html';
        return;
    }
    // Deep copy
    currentPlan = JSON.parse(JSON.stringify(original));

    if (!currentPlan.duration) currentPlan.duration = 4;
    
    renderPlanMeta();
    renderDays();
    markSaved(); 
    setupUnloadWarning();
}

function setupUnloadWarning() {
    window.onbeforeunload = (e) => {
        if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
}

// Funkcja sprawdzająca wyjście (podpięta pod przycisk Wróć)
export function checkExit() {
    if (hasUnsavedChanges) {
        return confirm("Masz niezapisane zmiany. Czy na pewno chcesz wyjść bez zapisywania?");
    }
    return true;
}

// --- STATE ---
function markUnsaved() {
    if (hasUnsavedChanges) return;
    hasUnsavedChanges = true;
    const btn = document.getElementById('savePlanBtn');
    if (btn) {
        btn.classList.add('has-changes');
        btn.innerHTML = '<span class="material-symbols-rounded">save</span> Zapisz Zmiany';
    }
}

function markSaved() {
    hasUnsavedChanges = false;
    const btn = document.getElementById('savePlanBtn');
    if (btn) {
        btn.classList.remove('has-changes');
        btn.innerHTML = '<span class="material-symbols-rounded">check</span> Zapisane';
    }
}

// --- ACTIONS ---

export async function saveCurrentState() {
    if (!hasUnsavedChanges) return;
    await savePlanToCloud(currentPlan);
    markSaved();
}

export function updatePlanData(field, val) { 
    currentPlan[field] = val; 
    if(field === 'name') document.getElementById('planHeaderTitle').innerText = val;
    markUnsaved();
}

export async function deleteCurrentPlan() {
    if(confirm('Usunąć ten plan definitywnie?')) {
        hasUnsavedChanges = false;
        await deletePlanFromCloud(currentPlan.id);
        window.location.href = 'index.html';
    }
}

export function openStudentView() {
    if (hasUnsavedChanges) {
        if(confirm("Masz niezapisane zmiany. Zapisać przed otwarciem?")) {
            savePlanToCloud(currentPlan).then(() => {
                markSaved();
                window.open(`student.html?id=${currentPlan.id}`, '_blank');
            });
        }
    } else {
        window.open(`student.html?id=${currentPlan.id}`, '_blank');
    }
}

// --- RENDER ---

function renderPlanMeta() {
    document.getElementById('planHeaderTitle').innerText = currentPlan.name;
    document.getElementById('planName').value = currentPlan.name;
    document.getElementById('planDuration').value = currentPlan.duration;
    document.getElementById('planColor').value = currentPlan.color || '#CCFF00';
    document.getElementById('planDeload').checked = currentPlan.hasDeload || false;
    document.getElementById('planNote').value = currentPlan.mainNote || '';
}

export function renderDays() {
    const container = document.getElementById('daysContainer');
    container.innerHTML = '';

    currentPlan.days.forEach((day, dIdx) => {
        const dayEl = document.createElement('div');
        dayEl.className = 'glass-panel';
        const isOpen = day.collapsed !== true;

        dayEl.innerHTML = `
            <div class="day-header-area">
                <div class="flex-row">
                    <button class="btn btn-secondary btn-icon-only" onclick="window.PlanLogic.toggleDay(${dIdx}, this)">
                        <span class="material-symbols-rounded chevron-rotate ${!isOpen ? 'collapsed' : ''}">expand_more</span>
                    </button>
                    <input type="text" value="${day.name}" class="day-title-input"
                           onchange="window.PlanLogic.updateDayName(${dIdx}, this.value)">
                </div>
                <button class="btn btn-danger btn-icon-only" onclick="window.PlanLogic.deleteDay(${dIdx})">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
            
            <div id="day-content-${dIdx}" class="day-content ${!isOpen ? 'collapsed' : ''}">
                <div id="list-${dIdx}"></div>
                <button class="btn btn-secondary mt-2" onclick="window.PlanLogic.openPicker(${dIdx})" style="width:100%;border-style:dashed;">
                    <span class="material-symbols-rounded">add</span> Dodaj Ćwiczenie
                </button>
            </div>
        `;
        container.appendChild(dayEl);
        renderExercises(dIdx, day.exercises);
    });
}

function renderExercises(dIdx, list) {
    const el = document.getElementById(`list-${dIdx}`);
    const db = getDb(); 

    list.forEach((ex, eIdx) => {
        const dbEx = db.exercises.find(x => x.name === ex.name);
        const nameClass = dbEx ? 'interactive-name' : '';
        const tooltip = dbEx ? `onmouseenter="showTooltip(event, '${ex.name}')" onmouseleave="hideTooltip()"` : '';

        const row = document.createElement('div');
        row.className = 'exercise-row';
        row.innerHTML = `
            <div class="exercise-header">
                <div style="font-size:1.1rem;font-weight:700;color:#fff;display:flex;align-items:center;">
                    <span class="exercise-number">${eIdx+1}.</span> 
                    <span class="${nameClass}" ${tooltip}>${ex.name}</span>
                </div>
                <button class="btn btn-danger btn-icon-only" style="width:32px;height:32px;min-width:32px;" onclick="window.PlanLogic.removeEx(${dIdx},${eIdx})">
                    <span class="material-symbols-rounded" style="font-size:18px">close</span>
                </button>
            </div>

            <div class="grid-3" style="margin-bottom:15px;">
                <div class="input-group" style="margin:0"><label>Serie</label><input type="text" value="${ex.sets}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'sets',this.value)"></div>
                <div class="input-group" style="margin:0"><label>Powt</label><input type="text" value="${ex.reps}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'reps',this.value)"></div>
                <div class="input-group" style="margin:0"><label>Tempo</label><input type="text" value="${ex.tempo}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'tempo',this.value)"></div>
            </div>
            <div class="grid-2" style="margin-bottom:15px;">
                <div class="input-group" style="margin:0"><label>Przerwa</label><input type="text" value="${ex.rest}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'rest',this.value)"></div>
                <div class="input-group" style="margin:0"><label>RIR / RPE</label><input type="text" value="${ex.weight}" placeholder="np. 2 RIR" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'weight',this.value)"></div>
            </div>
            <div class="input-group" style="margin:0;"><label>Notatki</label><input type="text" value="${ex.note || ''}" placeholder="..." onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'note',this.value)"></div>
        `;
        el.appendChild(row);
    });
}

// --- LOGIC ---

export function toggleDay(dIdx, btn) {
    const content = document.getElementById(`day-content-${dIdx}`);
    const icon = btn.querySelector('.material-symbols-rounded');
    currentPlan.days[dIdx].collapsed = !currentPlan.days[dIdx].collapsed;
    if (currentPlan.days[dIdx].collapsed) {
        content.classList.add('collapsed'); icon.classList.add('collapsed');
    } else {
        content.classList.remove('collapsed'); icon.classList.remove('collapsed');
    }
}

export function addDay() { currentPlan.days.push({ name: 'Nowy Dzień', exercises: [], collapsed: false }); renderDays(); markUnsaved(); }
export function deleteDay(idx) { if(confirm('Usunąć dzień?')) { currentPlan.days.splice(idx, 1); renderDays(); markUnsaved(); } }
export function updateDayName(idx, val) { currentPlan.days[idx].name = val; markUnsaved(); }
export function removeEx(dIdx, eIdx) { currentPlan.days[dIdx].exercises.splice(eIdx, 1); renderDays(); markUnsaved(); }
export function updEx(dIdx, eIdx, field, val) { currentPlan.days[dIdx].exercises[eIdx][field] = val; markUnsaved(); }

export function openPicker(dIndex) {
    targetDayIndex = dIndex;
    const db = getDb();
    const list = document.getElementById('pickerList');
    list.innerHTML = '';
    const sorted = db.exercises.sort((a,b) => a.name.localeCompare(b.name));
    sorted.forEach(ex => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:0.2s;";
        const imgHtml = ex.media ? `<img src="${ex.media}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; background:#222;">` : '<div style="width:40px;height:40px;background:#222;border-radius:6px;"></div>';
        item.innerHTML = `${imgHtml}<span style="font-weight:600;">${ex.name}</span>`;
        item.onmouseover = () => item.style.background = "rgba(255,255,255,0.05)";
        item.onmouseout = () => item.style.background = "transparent";
        item.onclick = () => selectEx(ex.name);
        list.appendChild(item);
    });
    document.getElementById('pickerSearch').value = '';
    openModal('exercisePickerModal');
    setTimeout(() => document.getElementById('pickerSearch').focus(), 100);
}

export function filterPicker(val) {
    const list = document.getElementById('pickerList');
    Array.from(list.children).forEach(child => {
        child.style.display = child.innerText.toLowerCase().includes(val.toLowerCase()) ? 'flex' : 'none';
    });
}

function selectEx(name) {
    currentPlan.days[targetDayIndex].exercises.push({ name: name, sets: '3', reps: '10', weight: '', tempo: '2010', rest: '90s', note: '' });
    closeModal('exercisePickerModal');
    renderDays();
    markUnsaved();
}