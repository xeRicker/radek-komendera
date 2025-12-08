import { getDb } from '../../core/storage.js';

export function renderHeader(plan) {
    if(!plan) return;
    document.getElementById('planHeaderTitle').innerText = plan.name;
    document.getElementById('planName').value = plan.name;
    document.getElementById('planDuration').value = plan.duration;
    document.getElementById('planColor').value = plan.color || '#CCFF00';
    document.getElementById('planDeload').checked = plan.hasDeload || false;
    document.getElementById('planNote').value = plan.mainNote || '';
}

export function renderDays(plan) {
    const container = document.getElementById('daysContainer');
    if(!container) return;
    container.innerHTML = '';

    if (!plan.days) return;

    plan.days.forEach((day, dIdx) => {
        const isOpen = !day.collapsed;
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.innerHTML = `
            <div class="day-header-area">
                <div class="day-header-left">
                    <button class="btn btn-secondary btn-icon-only" onclick="window.PlanLogic.toggleDay(${dIdx})">
                        <span class="material-symbols-rounded chevron-rotate ${!isOpen ? 'collapsed' : ''}">expand_more</span>
                    </button>
                    <!-- Input nazwy dnia (flex:1) -->
                    <input type="text" value="${day.name}" class="day-title-input"
                           onchange="window.PlanLogic.updateDayName(${dIdx}, this.value)">
                </div>
                <!-- Przycisk usuwania (nie spadnie na dół dzięki flex) -->
                <button class="btn btn-danger btn-icon-only" onclick="window.PlanLogic.deleteDay(${dIdx})">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
            
            <div id="day-content-${dIdx}" class="day-content ${!isOpen ? 'collapsed' : ''}">
                <div id="list-${dIdx}"></div>
                <button class="btn btn-secondary mt-2" onclick="window.PlanLogic.openPicker(${dIdx})" style="width:100%; border:1px dashed rgba(255,255,255,0.2); background:rgba(255,255,255,0.02); margin-top:20px;">
                    <span class="material-symbols-rounded">add</span> Dodaj Ćwiczenie
                </button>
            </div>
        `;
        container.appendChild(div);
        renderExercisesList(dIdx, day.exercises);
    });
}

function renderExercisesList(dIdx, list) {
    const el = document.getElementById(`list-${dIdx}`);
    if(!el) return;
    const db = getDb(); 

    list.forEach((ex, eIdx) => {
        const dbEx = db.exercises.find(x => x.name === ex.name);
        
        const nameHtml = dbEx 
            ? `<span class="interactive-text exercise-name-large" onmouseenter="window.showTooltip(event, '${ex.name}')" onmouseleave="window.hideTooltip()">${ex.name}</span>`
            : `<span class="exercise-name-large">${ex.name}</span>`;

        // Parsowanie tempa (np. "3-0-1" -> [3, 0, 1])
        let t1 = '', t2 = '', t3 = '';
        if(ex.tempo) {
            // Obsługa separatora myślnik lub spacja
            const parts = ex.tempo.replace(/[^0-9a-zA-Z]/g, '-').split('-'); 
            if(parts.length >= 1) t1 = parts[0];
            if(parts.length >= 2) t2 = parts[1];
            if(parts.length >= 3) t3 = parts[2];
            // Fallback dla starego formatu (np. "3010")
            if(parts.length === 1 && ex.tempo.length >= 3) {
                 t1 = ex.tempo[0]; t2 = ex.tempo[1]; t3 = ex.tempo[2];
            }
        }

        const row = document.createElement('div');
        row.className = 'exercise-row';
        row.innerHTML = `
            <div class="exercise-header">
                <div style="display:flex; align-items:center; flex:1;">
                    ${nameHtml}
                </div>
                <button class="btn btn-danger btn-icon-only" style="width:36px;height:36px;min-width:36px;" onclick="window.PlanLogic.removeEx(${dIdx},${eIdx})">
                    <span class="material-symbols-rounded" style="font-size:20px">close</span>
                </button>
            </div>

            <div class="grid-3">
                <div class="input-group"><label>Serie</label><input type="text" value="${ex.sets}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'sets',this.value)"></div>
                <div class="input-group"><label>Powtórzenia</label><input type="text" value="${ex.reps}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'reps',this.value)"></div>
                
                <!-- TEMPO NA 3 INPUTY -->
                <div class="input-group">
                    <div class="tempo-grid">
                        <div class="tempo-col">
                            <label>EKS</label>
                            <input type="text" class="tempo-small-input" value="${t1}" placeholder="3" 
                                onchange="window.PlanLogic.updateTempo(${dIdx}, ${eIdx}, 0, this.value)">
                        </div>
                        <div class="tempo-col">
                            <label>PAU</label>
                            <input type="text" class="tempo-small-input" value="${t2}" placeholder="0" 
                                onchange="window.PlanLogic.updateTempo(${dIdx}, ${eIdx}, 1, this.value)">
                        </div>
                        <div class="tempo-col">
                            <label>KON</label>
                            <input type="text" class="tempo-small-input" value="${t3}" placeholder="1" 
                                onchange="window.PlanLogic.updateTempo(${dIdx}, ${eIdx}, 2, this.value)">
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid-2">
                <div class="input-group"><label>Przerwa</label><input type="text" value="${ex.rest}" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'rest',this.value)"></div>
                <div class="input-group"><label>RIR / RPE</label><input type="text" value="${ex.weight}" placeholder="np. 2 RIR" onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'weight',this.value)"></div>
            </div>
            <div class="input-group" style="margin-bottom:0;"><label>Notatki do ćwiczenia</label><input type="text" value="${ex.note || ''}" placeholder="..." onchange="window.PlanLogic.updEx(${dIdx},${eIdx},'note',this.value)"></div>
        `;
        el.appendChild(row);
    });
}