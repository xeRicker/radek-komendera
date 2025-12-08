import { getDb, savePlanToCloud, deletePlanFromCloud } from '../../core/storage.js';
import { openModal, closeModal } from '../../ui/modal.js';
import { PlanState } from './state.js';
import * as Render from './render.js';
import { showToast } from '../../ui/notifications.js';
import { showTooltip, hideTooltip } from '../../ui/tooltip.js';

let targetDayIndex = null;

async function loadPlan(id) {
    const db = getDb();
    if (!db.plans) return;
    const original = db.plans.find(p => p.id === id);
    if (!original) { showToast("Nie znaleziono planu", "error"); return; }
    
    PlanState.init(original);
    refreshUI();
    setupSaveBtnState();
}

function refreshUI() {
    if(!PlanState.current) return;
    Render.renderHeader(PlanState.current);
    Render.renderDays(PlanState.current);
}

function setupSaveBtnState() {
    const btn = document.getElementById('savePlanBtn');
    if (!btn) return;
    if(PlanState.hasUnsavedChanges) {
        btn.classList.add('has-changes');
        btn.innerHTML = '<span class="material-symbols-rounded">save</span> Zapisz Zmiany';
    } else {
        btn.classList.remove('has-changes');
        btn.innerHTML = '<span class="material-symbols-rounded">check</span> Zapisane';
    }
}

async function saveCurrentState() {
    if (!PlanState.hasUnsavedChanges) return;
    await savePlanToCloud(PlanState.current);
    PlanState.markSaved();
    setupSaveBtnState();
}

function updatePlanData(field, val) {
    PlanState.updateField(field, val);
    if(field === 'name') document.getElementById('planHeaderTitle').innerText = val;
    setupSaveBtnState();
}

async function deleteCurrentPlan() {
    if(confirm('Usunąć?')) {
        await deletePlanFromCloud(PlanState.current.id);
        window.location.href = 'index.html';
    }
}

function checkExit() { return PlanState.hasUnsavedChanges ? confirm("Masz niezapisane zmiany?") : true; }

function openStudentView() {
    if(!PlanState.current) return;
    const url = `student.html?id=${PlanState.current.id}`;
    if (PlanState.hasUnsavedChanges) {
        if(confirm("Zapisać przed otwarciem?")) { saveCurrentState().then(() => window.open(url, '_blank')); }
    } else { window.open(url, '_blank'); }
}

// --- NOWA FUNKCJA: KOPIUJ LINK ---
async function copyLink() {
    if(!PlanState.current) return;
    
    // Generowanie pełnego linku
    const baseUrl = window.location.origin + window.location.pathname.replace('plan.html', 'student.html');
    const link = `${baseUrl}?id=${PlanState.current.id}`;
    
    try {
        await navigator.clipboard.writeText(link);
        showToast('Link do planu skopiowany!', 'success');
    } catch (err) {
        // Fallback dla starszych przeglądarek lub braku uprawnień
        prompt("Skopiuj link ręcznie:", link);
    }
}

function toggleDay(idx) { PlanState.toggleDay(idx); refreshUI(); }
function addDay() { PlanState.addDay(); refreshUI(); setupSaveBtnState(); }
function deleteDay(idx) { if(confirm('Usunąć dzień?')) { PlanState.deleteDay(idx); refreshUI(); setupSaveBtnState(); } }
function updateDayName(idx, val) { PlanState.current.days[idx].name = val; PlanState.markChanged(); setupSaveBtnState(); }
function removeEx(dIdx, eIdx) { PlanState.removeExercise(dIdx, eIdx); refreshUI(); setupSaveBtnState(); }
function updEx(dIdx, eIdx, field, val) { PlanState.updateExercise(dIdx, eIdx, field, val); setupSaveBtnState(); }

function updateTempo(dIdx, eIdx, partIndex, value) {
    const ex = PlanState.current.days[dIdx].exercises[eIdx];
    let current = ex.tempo ? ex.tempo.replace(/[^0-9a-zA-Z]/g, '-').split('-') : ['2','1','2'];
    while(current.length < 3) current.push('0');
    current[partIndex] = value;
    PlanState.updateExercise(dIdx, eIdx, 'tempo', current.join('-'));
    setupSaveBtnState();
}

function openPicker(dIndex) {
    targetDayIndex = dIndex;
    const db = getDb();
    const list = document.getElementById('pickerList');
    list.innerHTML = '';
    
    const headerBtn = document.createElement('div');
    headerBtn.style.padding = '0 0 15px 0';
    headerBtn.innerHTML = `<button class="btn btn-secondary" onclick="window.location.href='exercises.html'" style="width:100%"><span class="material-symbols-rounded">fitness_center</span> Zarządzaj Bazą</button>`;
    list.appendChild(headerBtn);

    const exercises = db.exercises || [];
    exercises.sort((a,b) => a.name.localeCompare(b.name)).forEach(ex => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;";
        const img = ex.media ? `<img src="${ex.media}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">` : `<div style="width:40px;height:40px;background:#222;border-radius:6px;"></div>`;
        item.innerHTML = `${img}<span style="font-weight:600;">${ex.name}</span>`;
        
        item.onmouseenter = (e) => showTooltip(e, ex.name);
        item.onmouseleave = () => hideTooltip();

        item.onclick = () => {
            PlanState.addExercise(targetDayIndex, { name: ex.name, sets: '3', reps: '10', weight: '', tempo: '2-1-2', rest: '90s', note: '' });
            closeModal('exercisePickerModal');
            hideTooltip();
            refreshUI();
            setupSaveBtnState();
        };
        list.appendChild(item);
    });
    
    document.getElementById('pickerSearch').value = '';
    openModal('exercisePickerModal');
    setTimeout(() => document.getElementById('pickerSearch').focus(), 100);
}

function filterPicker(val) {
    Array.from(document.getElementById('pickerList').children).forEach(child => {
        if(child.innerText) child.style.display = child.innerText.toLowerCase().includes(val.toLowerCase()) ? 'flex' : 'none';
    });
}

window.PlanLogic = {
    loadPlan, saveCurrentState, updatePlanData, deleteCurrentPlan, checkExit, openStudentView, copyLink, // DODANO export copyLink
    toggleDay, addDay, deleteDay, updateDayName, removeEx, updEx, updateTempo, openPicker, filterPicker
};