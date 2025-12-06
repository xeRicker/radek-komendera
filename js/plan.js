let currentPlan = null;
let targetDayIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return window.location.href = 'index.html';

    currentPlan = getPlan(id);
    if (!currentPlan) return window.location.href = 'index.html';

    if (!currentPlan.duration) currentPlan.duration = 4;
    if (currentPlan.hasDeload === undefined) currentPlan.hasDeload = false;

    renderPlanMeta();
    renderDays();
});

function renderPlanMeta() {
    document.getElementById('planHeaderTitle').innerText = currentPlan.name;
    document.getElementById('planName').value = currentPlan.name;
    document.getElementById('planColor').value = currentPlan.color || '#CCFF00';
    document.getElementById('planDuration').value = currentPlan.duration;
    document.getElementById('planDeload').checked = currentPlan.hasDeload;
    document.getElementById('planNote').value = currentPlan.mainNote || '';
}

function updatePlanData(field, value) {
    currentPlan[field] = value;
    if (field === 'name') document.getElementById('planHeaderTitle').innerText = value;
}

function saveCurrentState() { updatePlan(currentPlan); }

function deleteCurrentPlan() {
    if(confirm('Usunąć ten plan definitywnie?')) {
        const db = getDb();
        db.plans = db.plans.filter(p => p.id !== currentPlan.id);
        saveDb(db);
        window.location.href = 'index.html';
    }
}

function openStudentView() {
    saveCurrentState();
    window.open(`student.html?id=${currentPlan.id}`, '_blank');
}

// --- RENDERING DAYS & EXERCISES ---

function renderDays() {
    const container = document.getElementById('daysContainer');
    container.innerHTML = '';

    currentPlan.days.forEach((day, dIndex) => {
        const dayEl = document.createElement('div');
        dayEl.className = 'glass-panel';
        
        dayEl.innerHTML = `
            <div class="flex-row space-between" style="margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                <input type="text" value="${day.name}" 
                       style="font-family:'Kanit'; font-style:italic; font-size:1.4rem; background:transparent; border:none; width:auto; color:var(--primary-color); padding:0;"
                       onchange="updateDayName(${dIndex}, this.value)">
                <button class="btn btn-danger btn-icon-only" onclick="deleteDay(${dIndex})">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
            
            <div id="exercises-list-${dIndex}"></div>

            <button class="btn btn-secondary mt-2" onclick="openExercisePicker(${dIndex})" style="width: 100%; border-style: dashed;">
                <span class="material-symbols-rounded">add_circle</span> Dodaj Ćwiczenie
            </button>
        `;
        container.appendChild(dayEl);
        renderExercises(dIndex, day.exercises);
    });
}

function renderExercises(dIndex, exercises) {
    const list = document.getElementById(`exercises-list-${dIndex}`);
    list.innerHTML = '';
    const db = getDb();

    exercises.forEach((ex, eIndex) => {
        const row = document.createElement('div');
        row.className = 'exercise-row';

        const dbEx = db.exercises.find(x => x.name === ex.name);
        // Jeśli jest w bazie, dodajemy klasę interaktywną i eventy, jeśli nie - zwykły tekst
        const nameClass = dbEx ? 'interactive-name' : '';
        const tooltipEvents = dbEx ? `onmouseenter="showTooltip(event, '${ex.name}')" onmouseleave="hideTooltip()"` : '';

        row.innerHTML = `
            <div class="exercise-header">
                <div style="font-size:1.1rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:10px;">
                    <span style="color:var(--primary-color); font-style:italic;">${eIndex + 1}.</span> 
                    <span class="${nameClass}" ${tooltipEvents}>${ex.name}</span>
                </div>
                <button class="btn btn-danger btn-icon-only" style="width:32px; height:32px; min-width:32px;" onclick="removeExercise(${dIndex}, ${eIndex})">
                    <span class="material-symbols-rounded" style="font-size:18px">close</span>
                </button>
            </div>

            <div class="grid-3" style="margin-bottom: 20px;">
                <div class="input-group" style="margin-bottom:0">
                    <label>Serie</label>
                    <input type="text" value="${ex.sets}" onchange="updateEx(${dIndex}, ${eIndex}, 'sets', this.value)">
                </div>
                <div class="input-group" style="margin-bottom:0">
                    <label>Powtórzenia</label>
                    <input type="text" value="${ex.reps}" onchange="updateEx(${dIndex}, ${eIndex}, 'reps', this.value)">
                </div>
                <div class="input-group" style="margin-bottom:0">
                    <label>Tempo</label>
                    <input type="text" value="${ex.tempo}" onchange="updateEx(${dIndex}, ${eIndex}, 'tempo', this.value)">
                </div>
            </div>
            
            <div class="grid-2" style="margin-bottom: 20px;">
                 <div class="input-group" style="margin-bottom:0">
                    <label>Przerwa</label>
                    <input type="text" value="${ex.rest}" onchange="updateEx(${dIndex}, ${eIndex}, 'rest', this.value)">
                </div>
                <div class="input-group" style="margin-bottom:0">
                    <label>RIR / RPE</label>
                    <input type="text" value="${ex.weight}" placeholder="np. 2 RIR" onchange="updateEx(${dIndex}, ${eIndex}, 'weight', this.value)">
                </div>
            </div>

            <div class="input-group" style="margin-bottom:0;">
                <label>Notatki do ćwiczenia</label>
                <input type="text" value="${ex.note || ''}" placeholder="..." onchange="updateEx(${dIndex}, ${eIndex}, 'note', this.value)">
            </div>
        `;
        list.appendChild(row);
    });
}

// --- ACTIONS ---
function addDay() { currentPlan.days.push({ name: 'Nowy Dzień', exercises: [] }); saveCurrentState(); renderDays(); }
function deleteDay(idx) { if(confirm('Usunąć dzień?')) { currentPlan.days.splice(idx, 1); saveCurrentState(); renderDays(); } }
function updateDayName(idx, val) { currentPlan.days[idx].name = val; saveCurrentState(); }
function removeExercise(dIdx, eIdx) { currentPlan.days[dIdx].exercises.splice(eIdx, 1); saveCurrentState(); renderDays(); }
function updateEx(dIdx, eIdx, field, val) { currentPlan.days[dIdx].exercises[eIdx][field] = val; saveCurrentState(); }

// --- PICKER ---
function openExercisePicker(dIndex) {
    targetDayIndex = dIndex;
    const db = getDb();
    const list = document.getElementById('pickerList');
    list.innerHTML = '';
    const sorted = db.exercises.sort((a,b) => a.name.localeCompare(b.name));

    sorted.forEach(ex => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:0.2s;";
        item.innerHTML = `
            ${ex.media ? `<img src="${ex.media}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; background:#222;">` : '<div style="width:40px;height:40px;background:#222;border-radius:6px;"></div>'}
            <span style="font-weight:600;">${ex.name}</span>
        `;
        item.onmouseover = () => item.style.background = "rgba(255,255,255,0.05)";
        item.onmouseout = () => item.style.background = "transparent";
        item.onclick = () => selectEx(ex.name);
        list.appendChild(item);
    });
    
    document.getElementById('pickerSearch').value = '';
    openModal('exercisePickerModal');
    setTimeout(() => document.getElementById('pickerSearch').focus(), 100);
}

function filterPicker(val) {
    const list = document.getElementById('pickerList');
    Array.from(list.children).forEach(child => {
        child.style.display = child.innerText.toLowerCase().includes(val.toLowerCase()) ? 'flex' : 'none';
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