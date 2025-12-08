import { getDb } from '../core/storage.js';

// Słownik definicji dla ucznia
const DEFINITIONS = {
    'SERIE': 'Ilość serii roboczych do wykonania w danym ćwiczeniu.',
    'POWT': 'Zakres powtórzeń. Dobierz ciężar tak, aby zmieścić się w tym przedziale zachowując poprawną technikę.',
    'TEMPO': 'Tempo wykonywania powtórzenia (patrz niżej).',
    'EKS': 'Faza Ekscentryczna (Opuszczanie). Czas w sekundach, w którym opuszczasz ciężar.',
    'PAU': 'Pauza w punkcie maksymalnego rozciągnięcia mięśnia (w sekundach).',
    'KON': 'Faza Koncentryczna (Wyciskanie/Podnoszenie). Zazwyczaj wykonujemy dynamicznie.',
    'PRZERWA': 'Czas odpoczynku między seriami.',
    'RIR': 'Reps In Reserve (Powtórzenia w zapasie). Ile powtórzeń mógłbyś jeszcze zrobić technicznie.',
    'DELOAD': 'Tydzień lżejszy. Zmniejsz ciężar lub ilość serii, aby zregenerować organizm.'
};

export function showTooltip(event, name) {
    const db = getDb();
    const ex = db.exercises.find(e => e.name === name);
    if (!ex) return;

    const tt = document.getElementById('appTooltip');
    const ttTitle = document.querySelector('.tt-title');
    const ttDesc = document.querySelector('.tt-desc');
    const ttMediaContainer = document.getElementById('ttMediaContainer');

    // Włącz media container (dla ćwiczeń)
    ttMediaContainer.style.display = 'block';
    
    ttTitle.innerText = ex.name;
    ttDesc.innerText = ex.desc || '';
    
    ttMediaContainer.innerHTML = '';
    if (ex.media) {
        const isVideo = ex.media.match(/\.(mp4|webm)$/i);
        if(isVideo) {
             ttMediaContainer.innerHTML = `<video src="${ex.media}" class="tt-media-video" autoplay loop muted playsinline></video>`;
        } else {
             ttMediaContainer.innerHTML = `<img src="${ex.media}" class="tt-media">`;
        }
    } else {
        // Placeholder jeśli brak zdjęcia
        ttMediaContainer.innerHTML = `<div style="width:100%;height:200px;display:flex;align-items:center;justify-content:center;color:#333"><span class="material-symbols-rounded" style="font-size:48px">image_not_supported</span></div>`;
    }

    positionTooltip(event, tt);
}

// NOWA FUNKCJA: Prosty tooltip z definicją
export function showInfoTooltip(event, key) {
    const text = DEFINITIONS[key];
    if (!text) return;

    const tt = document.getElementById('appTooltip');
    const ttTitle = document.querySelector('.tt-title');
    const ttDesc = document.querySelector('.tt-desc');
    const ttMediaContainer = document.getElementById('ttMediaContainer');

    // Ukryj media container (tylko tekst)
    ttMediaContainer.style.display = 'none';

    ttTitle.innerText = key; // Np. "SERIE"
    ttDesc.innerText = text;

    positionTooltip(event, tt);
}

function positionTooltip(event, tt) {
    tt.classList.add('visible');

    const rect = event.target.getBoundingClientRect();
    const ttWidth = 340; 
    // const ttHeight is dynamic

    let left = rect.left; 
    let top = rect.bottom + 10;

    if (left + ttWidth > window.innerWidth) {
        left = window.innerWidth - ttWidth - 20;
    }
    
    // Sprawdź czy nie wychodzi dołem
    if (top + 400 > window.innerHeight) {
        top = rect.top - tt.offsetHeight - 10;
        if(top < 0) top = 10; // Bezpiecznik
    }

    tt.style.left = `${left}px`;
    tt.style.top = `${top}px`;
}

export function hideTooltip() {
    const tt = document.getElementById('appTooltip');
    if (tt) {
        tt.classList.remove('visible');
        setTimeout(() => { 
            if(!tt.classList.contains('visible')) {
                tt.style.top = '-9999px'; 
            }
        }, 200);
    }
}

window.showTooltip = showTooltip;
window.showInfoTooltip = showInfoTooltip;
window.hideTooltip = hideTooltip;