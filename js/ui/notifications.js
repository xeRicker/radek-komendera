export function showToast(message, type = 'success') {
    // Usuń stare toasty, żeby nie robić śmietnika
    const old = document.querySelectorAll('.app-toast');
    old.forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    
    let icon = 'check_circle';
    if(type === 'error') icon = 'error';
    if(type === 'loading') icon = 'sync';

    toast.innerHTML = `
        <span class="material-symbols-rounded ${type === 'loading' ? 'spin' : ''}" style="font-size: 24px;">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Wymuś reflow dla animacji
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Auto-hide
    if (type !== 'loading') {
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400); // Czekamy aż zniknie animacja
        }, 3000);
    }
    
    return toast;
}

// Loader - pełnoekranowy (bez zmian w logice, ale styl CSS go naprawia)
export function toggleLoader(show, text = 'Synchronizacja...') {
    let loader = document.getElementById('app-loader-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loader-overlay';
        loader.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;justify-content:center;align-items:center;opacity:0;pointer-events:none;transition:0.3s;";
        loader.innerHTML = `
            <div style="text-align:center">
                <div class="spinner" style="width:50px;height:50px;border:4px solid rgba(255,255,255,0.1);border-top-color:var(--primary-color);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px auto;"></div>
                <h3 class="brand-font" style="color:#fff">${text}</h3>
            </div>`;
        document.body.appendChild(loader);
    }

    if (show) {
        loader.querySelector('h3').innerText = text;
        loader.style.opacity = '1';
        loader.style.pointerEvents = 'all';
    } else {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
    }
}