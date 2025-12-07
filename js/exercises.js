// WAŻNE: Importy muszą być na samej górze
import { getDb, saveExercisesToCloud } from './storage.js';

let isEditing = false;
let editingIndex = -1;

export function renderExerciseList() {
    const db = getDb(); // Teraz to zadziała, bo zaimportowaliśmy getDb
    const list = document.getElementById('exerciseList');
    if (!list) return;

    list.innerHTML = '';
    
    if (!db.exercises || db.exercises.length === 0) {
        list.innerHTML = '<div class="text-sec" style="text-align:center; padding:20px;">Baza pusta. Dodaj pierwsze ćwiczenie.</div>';
        return;
    }

    db.exercises.forEach((ex, index) => {
        const item = document.createElement('div');
        item.className = 'glass-panel flex-row space-between';
        item.style.padding = '15px';
        item.style.marginBottom = '10px';
        
        // Zabezpieczenie przed brakiem mediów
        const imgHTML = ex.media ? 
            `<img src="${ex.media}" class="list-img" onerror="this.src='https://via.placeholder.com/70?text=Error'">` : 
            `<div class="list-img" style="display:flex;align-items:center;justify-content:center;color:#555"><span class="material-symbols-rounded">image</span></div>`;

        item.innerHTML = `
            <div class="flex-row">
                ${imgHTML}
                <div>
                    <h4 class="brand-font">${ex.name}</h4>
                    <p style="font-size:0.8rem; color:#888;">${ex.desc ? (ex.desc.length > 50 ? ex.desc.substring(0, 50) + '...' : ex.desc) : ''}</p>
                </div>
            </div>
            <div class="flex-row">
                <!-- Używamy window.ExLogic, bo przypiszemy to w HTML -->
                <button class="btn btn-secondary btn-icon-only" onclick="window.ExLogic.startEdit(${index})">
                    <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="btn btn-danger btn-icon-only" onclick="window.ExLogic.deleteEx(${index})">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

export async function saveExercise() {
    const name = document.getElementById('exName').value;
    const media = document.getElementById('exMedia').value;
    const desc = document.getElementById('exDesc').value;

    if (!name) return alert("Nazwa jest wymagana");

    const db = getDb();
    
    if (isEditing) {
        db.exercises[editingIndex] = { name, media, desc };
        isEditing = false;
        editingIndex = -1;
        document.getElementById('formTitle').innerText = 'Dodaj Ćwiczenie';
        document.getElementById('saveExBtn').innerHTML = '<span class="material-symbols-rounded">add</span> Dodaj';
    } else {
        db.exercises.push({ name, media, desc });
    }

    // Reset formularza
    document.getElementById('exName').value = '';
    document.getElementById('exMedia').value = '';
    document.getElementById('exDesc').value = '';

    // Render lokalny (natychmiastowy)
    renderExerciseList();

    // Zapis do chmury
    await saveExercisesToCloud(db.exercises);
}

export function startEdit(index) {
    const db = getDb();
    const ex = db.exercises[index];
    
    document.getElementById('exName').value = ex.name;
    document.getElementById('exMedia').value = ex.media;
    document.getElementById('exDesc').value = ex.desc;

    isEditing = true;
    editingIndex = index;
    
    document.getElementById('formTitle').innerText = 'Edytuj Ćwiczenie';
    document.getElementById('saveExBtn').innerHTML = '<span class="material-symbols-rounded">save</span> Zapisz';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function deleteEx(index) {
    if(confirm("Usunąć ćwiczenie?")) {
        const db = getDb();
        db.exercises.splice(index, 1);
        
        // Render lokalny
        renderExerciseList();
        
        // Zapis do chmury
        await saveExercisesToCloud(db.exercises);
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