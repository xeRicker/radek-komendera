// --- TOAST NOTIFICATIONS ---
export function showToast(message, type = 'success') {
    // Usuń stare toasty
    const old = document.querySelectorAll('.app-toast');
    old.forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    
    let icon = 'check_circle';
    if(type === 'error') icon = 'error';
    if(type === 'loading') icon = 'sync';

    toast.innerHTML = `
        <span class="material-symbols-rounded ${type === 'loading' ? 'spin' : ''}">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animacja wejścia
    requestAnimationFrame(() => toast.classList.add('visible'));

    if (type !== 'loading') {
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    return toast; // Zwracamy referencję żeby móc usunąć loading ręcznie
}

export function hideToast(toastElement) {
    if(toastElement) {
        toastElement.classList.remove('visible');
        setTimeout(() => toastElement.remove(), 300);
    }
}

// --- LOADING OVERLAY ---
export function toggleLoader(show, text = 'Synchronizacja...') {
    let loader = document.getElementById('app-loader-overlay');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loader-overlay';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <h3 class="brand-font" id="loader-text" style="margin-top:15px; font-size:1.2rem;">${text}</h3>
            </div>
        `;
        document.body.appendChild(loader);
    }

    if (show) {
        document.getElementById('loader-text').innerText = text;
        loader.classList.add('active');
    } else {
        loader.classList.remove('active');
    }
}