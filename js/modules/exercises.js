import { getDb, saveExercisesToCloud } from '../core/storage.js';
import { showTooltip, hideTooltip } from '../ui/tooltip.js';

let isEditing = false;
let editingIndex = -1;

export function renderList() {
    const db = getDb();
    const list = document.getElementById('exerciseList');
    if(!list) return;
    list.innerHTML = '';

    if (!db.exercises || db.exercises.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:#666;">Baza pusta.</div>';
        return;
    }

    db.exercises.forEach((ex, index) => {
        const item = document.createElement('div');
        item.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px;`;
        
        const img = ex.media 
            ? `<img src="${ex.media}" class="list-img" style="width:60px; height:60px; min-width:60px; object-fit:cover; border-radius:8px; background:#222;">` 
            : `<div style="width:60px; height:60px; min-width:60px; border-radius:8px; background:#222; display:flex; align-items:center; justify-content:center; color:#555;"><span class="material-symbols-rounded">image</span></div>`;

        item.innerHTML = `
            <div class="flex-row" style="gap: 15px;">
                ${img}
                <div>
                    <!-- USUNIĘTO color:#fff ABY HOVER DZIAŁAŁ -->
                    <h4 class="interactive-text brand-font" 
                        onmouseenter="window.showTooltip(event, '${ex.name}')" 
                        onmouseleave="window.hideTooltip()"
                        style="font-size:1.1rem; margin-bottom:4px;">
                        ${ex.name}
                    </h4>
                    <p style="font-size:0.8rem; color:#888; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${ex.desc || ''}
                    </p>
                </div>
            </div>
            <div class="flex-row">
                <button class="btn btn-secondary btn-icon-only" onclick="window.ExLogic.edit(${index})"><span class="material-symbols-rounded">edit</span></button>
                <button class="btn btn-danger btn-icon-only" onclick="window.ExLogic.del(${index})"><span class="material-symbols-rounded">delete</span></button>
            </div>
        `;
        list.appendChild(item);
    });
}

// ... (Reszta funkcji save, edit, del, resetForm bez zmian - skopiuj z poprzedniej wersji lub zostaw jeśli masz) ...
export async function save() {
    const name = document.getElementById('exName').value;
    const media = document.getElementById('exMedia').value;
    const desc = document.getElementById('exDesc').value;
    if (!name) return alert("Nazwa jest wymagana");
    const db = getDb();
    const data = { name, media, desc };
    if (isEditing) {
        db.exercises[editingIndex] = data;
        isEditing = false;
        editingIndex = -1;
        document.getElementById('formTitle').innerText = 'Dodaj Ćwiczenie';
        document.getElementById('saveExBtn').innerHTML = '<span class="material-symbols-rounded">add</span> Dodaj';
    } else { db.exercises.push(data); }
    document.getElementById('exName').value = '';
    document.getElementById('exMedia').value = '';
    document.getElementById('exDesc').value = '';
    await saveExercisesToCloud(db.exercises);
    renderList();
}
export function edit(index) {
    const ex = getDb().exercises[index];
    document.getElementById('exName').value = ex.name;
    document.getElementById('exMedia').value = ex.media;
    document.getElementById('exDesc').value = ex.desc;
    isEditing = true;
    editingIndex = index;
    document.getElementById('formTitle').innerText = 'Edytuj Ćwiczenie';
    document.getElementById('saveExBtn').innerHTML = '<span class="material-symbols-rounded">save</span> Zapisz Zmiany';
    document.querySelector('.container').scrollTo({ top: 0, behavior: 'smooth' });
}
export async function del(index) {
    if(confirm("Usunąć?")) {
        const db = getDb();
        db.exercises.splice(index, 1);
        await saveExercisesToCloud(db.exercises);
        renderList();
    }
}
export function resetForm() {
    document.getElementById('exName').value = '';
    document.getElementById('exMedia').value = '';
    document.getElementById('exDesc').value = '';
    isEditing = false;
    document.getElementById('formTitle').innerText = 'Dodaj Ćwiczenie';
    document.getElementById('saveExBtn').innerHTML = '<span class="material-symbols-rounded">add</span> Dodaj';
}