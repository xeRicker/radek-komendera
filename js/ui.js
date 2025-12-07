import { getDb } from './storage.js'; // Potrzebne do pobierania danych do tooltipa

// --- MODAL LOGIC ---

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// --- TOOLTIP LOGIC ---

export function showTooltip(event, name) {
    const db = getDb();
    const ex = db.exercises.find(e => e.name === name);
    if (!ex) return;

    const tt = document.getElementById('appTooltip');
    const ttTitle = document.getElementById('ttTitle');
    const ttDesc = document.getElementById('ttDesc');
    const ttMedia = document.getElementById('ttMediaContainer');

    ttTitle.innerText = ex.name;
    ttDesc.innerText = ex.desc || '';
    
    ttMedia.innerHTML = '';
    if (ex.media) {
        ttMedia.style.display = 'flex';
        if (ex.media.includes('.mp4') || ex.media.includes('.webm')) {
            ttMedia.innerHTML = `<video src="${ex.media}" class="tt-media-video" autoplay loop muted playsinline></video>`;
        } else {
            ttMedia.innerHTML = `<img src="${ex.media}" class="tt-media">`;
        }
    } else {
        ttMedia.style.display = 'none';
    }

    // Positioning
    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = 340;
    
    let left = rect.left;
    let top = rect.bottom + 15;

    // Boundary Checks (prawa krawędź)
    if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 20;
    }
    
    // Boundary Checks (dół ekranu)
    if (top + 300 > window.innerHeight) {
        // Jeśli za nisko, pokaż nad kursorem (ale prosto, bez skomplikowanych obliczeń wysokości)
        top = rect.top - 20; 
        tt.style.transform = 'translateY(-100%)'; // Przesuń cały tooltip w górę
    } else {
        tt.style.transform = 'translateY(0)';
    }

    tt.style.left = `${left}px`;
    tt.style.top = `${top}px`;
    tt.classList.add('visible');
}

export function hideTooltip() {
    const tt = document.getElementById('appTooltip');
    if (tt) {
        tt.classList.remove('visible');
        // Reset pozycji po ukryciu
        setTimeout(() => { 
            tt.style.top = '-9999px'; 
            tt.style.transform = 'none';
        }, 200);
    }
}

// --- GLOBAL BINDINGS ---
// To jest konieczne, aby HTML (np. onclick="closeModal(...)") widział te funkcje
// mimo że jesteśmy w module.
window.openModal = openModal;
window.closeModal = closeModal;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;