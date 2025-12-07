import { getDb, savePlanToCloud, deletePlanFromCloud } from './storage.js';
import { openModal, closeModal } from './ui.js';

let currentPlan = null;
let targetDayIndex = null;

// Główna funkcja ładowania (wywoływana z HTML)
export async function loadPlan(id) {
    const db = getDb();
    currentPlan = db.plans.find(p => p.id === id);
    
    if (!currentPlan) {
        alert("Nie znaleziono planu!");
        window.location.href = 'index.html';
        return;
    }

    // Ustawienia domyślne dla starych planów
    if (!currentPlan.duration) currentPlan.duration = 4;
    
    renderPlanMeta();
    renderDays();
}

function renderPlanMeta() {
    document.getElementById('planHeaderTitle').innerText = currentPlan.name;
    document.getElementById('planName').value = currentPlan.name;
    document.getElementById('planDuration').value = currentPlan.duration;
    document.getElementById('planColor').value = currentPlan.color || '#CCFF00';
    document.getElementById('planDeload').checked = currentPlan.hasDeload || false;
    document.getElementById('planNote').value = currentPlan.mainNote || '';
}

// --- FUNKCJE EKSPORTOWANE DO HTML ---

export function updatePlanData(field, val) { 
    currentPlan[field] = val; 
    if(field === 'name') document.getElementById('planHeaderTitle').innerText = val;
}

export async function saveCurrentState() {
    await savePlanToCloud(currentPlan);
}

export async function deleteCurrentPlan() {
    if(confirm('Usunąć ten plan definitywnie?')) {
        await deletePlanFromCloud(currentPlan.id);
        window.location.href = 'index.html';
    }
}

export function openStudentView() {
    // Zapisujemy przed otwarciem, żeby uczeń widział zmiany
    savePlanToCloud(currentPlan).then(() => {
        window.open(`student.html?id=${currentPlan.id}`, '_blank');
    });
}

// --- RENDEROWANIE DNI I ĆWICZEŃ ---

export function renderDays() {
    const container = document.getElementById('daysContainer');
    container.innerHTML = '';

    currentPlan.days.forEach((day, dIdx) => {
        const dayEl = document.createElement('div');
        dayEl.className = 'glass-panel';
        
        dayEl.innerHTML = `
            <div class="flex-row space-between" style="margin-bottom:25px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px;">
                <input type="text" value="${day.name}" 
                       style="font-family:'Kanit';font-size:1.4rem;background:transparent;border:none;width:auto;color:var(--primary-color);padding:0;"
                       onchange="window.PlanLogic.updateDayName(${dIdx}, this.value)">
                <button class="btn btn-danger btn-icon-only" onclick="window.PlanLogic.deleteDay(${dIdx})">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
            
            <div id="list-${dIdx}"></div>

            <button class="btn btn-secondary mt-2" onclick="window.PlanLogic.openPicker(${dIdx})" style="width:100%;border-style:dashed;">
                <span class="material-symbols-rounded">add</span> Dodaj Ćwiczenie
            </button>
        `;
        container.appendChild(dayEl);
        renderExercises(dIdx, day.exercises);
    });
}

function renderExercises(dIdx, list) {
    const el = document.getElementById(`list-${dIdx}`);
    const db = getDb(); // Pobieramy bazę, żeby sprawdzić podglądy ćwiczeń

    list.forEach((ex, eIdx) => {
        const dbEx = db.exercises.find(x => x.name === ex.name);
        const nameClass = dbEx ? 'interactive-name' : '';
        const tooltip = dbEx ? `onmouseenter="showTooltip(event, '${ex.name}')" onmouseleave="hideTooltip()"` : '';

        const row = document.createElement('div');
        row.className = 'exercise-row';
        row.innerHTML = `
            <div class="exercise-header">
                <div style="font-size:1.1rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:10px;">
                    <span style="color:var(--primary-color);font-style:italic;">${eIdx+1}.</span> 
                    <span class="${nameClass}" ${tooltip}>${ex.name}</span>
                </div>
                <button class="btn btn-danger btn-icon-only" style="width:32px;height:32px;min-width:32px;" onclick="window.PlanLogic.removeEx(${dIdx},${eIdx})">
                    <span class="material-symbols-rounded" style="font-size:18px">close</span>
                </button>
            </div>

            <div class="grid-3" style="margin-bottom:15px;">
                <div class="input-group" style="margin:0">
                    <label>Serie</label>
                    <input type="text" value="${ex.sets}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'sets',this.value)">
                </div>
                <div class="input-group" style="margin:0">
                    <label>Powt</label>
                    <input type="text" value="${ex.reps}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'reps',this.value)">
                </div>
                <div class="input-group" style="margin:0">
                    <label>Tempo</label>
                    <input type="text" value="${ex.tempo}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'tempo',this.value)">
                </div>
            </div>
            <div class="grid-2" style="margin-bottom:15px;">
                 <div class="input-group" style="margin:0">
                    <label>Przerwa</label>
                    <input type="text" value="${ex.rest}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'rest',this.value)">
                </div>
                <div class="input-group" style="margin:0">
                    <label>RIR / RPE</label>
                    <input type="text" value="${ex.weight}" placeholder="np. 2 RIR" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'weight',this.value)">
                </div>
            </div>
            <div class="input-group" style="margin:0;">
                <label>Notatki</label>
                <input type="text" value="${ex.note || ''}" placeholder="..." onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'note',this.value)">
            </div>
        `;
        el.appendChild(row);
    });
}

// --- LOGIKA EDYCJI ---

export function addDay() { 
    currentPlan.days.push({ name: 'Nowy Dzień', exercises: [] }); 
    saveCurrentState(); 
    renderDays(); 
}

export function deleteDay(idx) { 
    if(confirm('Usunąć dzień?')) { 
        currentPlan.days.splice(idx, 1); 
        saveCurrentState(); 
        renderDays(); 
    } 
}

export function updateDayName(idx, val) { 
    currentPlan.days[idx].name = val; 
    saveCurrentState(); 
}

export function removeEx(dIdx, eIdx) { 
    currentPlan.days[dIdx].exercises.splice(eIdx, 1); 
    saveCurrentState(); 
    renderDays(); 
}

export function updEx(dIdx, eIdx, field, val) { 
    currentPlan.days[dIdx].exercises[eIdx][field] = val; 
    saveCurrentState(); 
}

// --- EXERCISE PICKER ---

export function openPicker(dIndex) {
    targetDayIndex = dIndex;
    const db = getDb();
    const list = document.getElementById('pickerList');
    list.innerHTML = '';
    
    // Sortuj alfabetycznie
    const sorted = db.exercises.sort((a,b) => a.name.localeCompare(b.name));

    sorted.forEach(ex => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:0.2s;";
        
        const imgHtml = ex.media 
            ? `<img src="${ex.media}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; background:#222;">`
            : '<div style="width:40px;height:40px;background:#222;border-radius:6px;"></div>';

        item.innerHTML = `
            ${imgHtml}
            <span style="font-weight:600;">${ex.name}</span>
        `;
        
        item.onmouseover = () => item.style.background = "rgba(255,255,255,0.05)";
        item.onmouseout = () => item.style.background = "transparent";
        
        item.onclick = () => {
            selectEx(ex.name);
        };
        list.appendChild(item);
    });
    
    document.getElementById('pickerSearch').value = '';
    openModal('exercisePickerModal');
    setTimeout(() => document.getElementById('pickerSearch').focus(), 100);
}

export function filterPicker(val) {
    const list = document.getElementById('pickerList');
    Array.from(list.children).forEach(child => {
        const txt = child.innerText.toLowerCase();
        child.style.display = txt.includes(val.toLowerCase()) ? 'flex' : 'none';
    });
}

function selectEx(name) {
    currentPlan.days[targetDayIndex].exercises.push({
        name: name, sets: '3', reps: '10', weight: '', tempo: '2010', rest: '90s', note: ''
    });
    saveCurrentState();
    closeModal('exercisePickerModal');
    renderDays();
}