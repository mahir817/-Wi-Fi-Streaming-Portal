document.addEventListener('DOMContentLoaded', () => {
    loadMedia();
});

async function loadMedia() {
    const grid = document.getElementById('media-grid');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn.querySelector('i');
    
    // Reset UI state
    grid.innerHTML = '';
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
    loading.classList.remove('hidden');
    refreshIcon.classList.add('spin');
    
    try {
        const response = await fetch('/api/media');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const files = await response.json();
        
        if (files.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            files.forEach(file => {
                const card = createMediaCard(file);
                grid.appendChild(card);
            });
            grid.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Failed to load media:", error);
        emptyState.innerHTML = '<i class="ph ph-warning-circle"></i><p>Failed to scan media directory.</p>';
        emptyState.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
        refreshIcon.classList.remove('spin');
    }
}

function createMediaCard(file) {
    const a = document.createElement('a');
    
    if (['video', 'image', 'audio'].includes(file.type)) {
        a.href = `/player/${encodeURIComponent(file.name)}`;
    } else {
        a.href = `/stream/${encodeURIComponent(file.name)}`;
        a.target = "_blank"; // Open documents and other files directly in the browser or download
    }
    
    a.className = `glass-card type-${file.type}`;
    
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-wrapper';
    
    const icon = document.createElement('i');
    if (file.type === 'video') {
        icon.className = 'ph ph-video-camera';
    } else if (file.type === 'image') {
        icon.className = 'ph ph-image';
    } else if (file.type === 'audio') {
        icon.className = 'ph ph-music-notes';
    } else if (file.type === 'document') {
        icon.className = 'ph ph-file-text';
    } else {
        icon.className = 'ph ph-file';
    }
    
    iconWrapper.appendChild(icon);
    a.appendChild(iconWrapper);
    
    const title = document.createElement('div');
    title.className = 'filename';
    title.textContent = file.name;
    a.appendChild(title);
    
    return a;
}
