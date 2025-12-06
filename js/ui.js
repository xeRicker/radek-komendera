// --- Modal Logic ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// --- Tooltip Logic (Smart Fit) ---
function showTooltip(event, name) {
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
        // Use container to handle layout, image handles ratio
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

    // Check right edge
    if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 20;
    }

    // Check bottom edge - if flips, go above
    // Note: Since height is dynamic (auto), we guess a safe max height or calculate after render
    // For simplicity and smoothness, we prefer top alignment if bottom is tight
    if (top + 400 > window.innerHeight) {
        top = rect.top - 20; // Will be positioned above via CSS transform if we wanted, but simple JS shift is safer
        // Actually, let's keep it simple: if close to bottom, show ABOVE cursor area
        if (top > window.innerHeight * 0.7) {
             // We need to know height. 
             tt.style.visibility = 'hidden';
             tt.style.display = 'block';
             const h = tt.offsetHeight;
             tt.style.visibility = '';
             top = rect.top - h - 10; 
        }
    }

    tt.style.left = `${left}px`;
    tt.style.top = `${top}px`;
    tt.classList.add('visible');
}

function hideTooltip() {
    const tt = document.getElementById('appTooltip');
    if (tt) {
        tt.classList.remove('visible');
        // Reset position to prevent jump on next show
        setTimeout(() => { tt.style.top = '-9999px'; }, 200);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
});