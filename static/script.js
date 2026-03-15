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
            // Add a slight delay for cinematic loading feel
            setTimeout(() => {
                files.forEach((file, index) => {
                    const card = createMediaCard(file);
                    // Cascade fade in effect
                    card.style.animationDelay = `${index * 0.05}s`;
                    card.classList.add('fade-in');
                    grid.appendChild(card);
                });
                grid.classList.remove('hidden');
            }, 300);
        }
    } catch (error) {
        console.error("Failed to load media:", error);
        emptyState.innerHTML = '<i class="ph ph-warning-circle"></i><p>Failed to scan library.</p>';
        emptyState.classList.remove('hidden');
    } finally {
        setTimeout(() => {
            loading.classList.add('hidden');
            refreshIcon.classList.remove('spin');
        }, 300);
    }
}

function createMediaCard(file) {
    const a = document.createElement('a');
    
    // Determine link destination
    const isPlayable = ['video', 'image', 'audio'].includes(file.type);
    if (isPlayable) {
        a.href = `/player/${encodeURIComponent(file.name)}`;
    } else {
        a.href = `/stream/${encodeURIComponent(file.name)}`;
        a.target = "_blank";
    }
    
    a.className = 'media-card';
    
    // Thumbnail container
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'card-thumbnail';
    
    // Placeholder inner
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-thumb';
    
    // Determine icon based on file type
    const icon = document.createElement('i');
    if (file.type === 'video') icon.className = 'ph ph-film-strip';
    else if (file.type === 'image') icon.className = 'ph ph-image-square';
    else if (file.type === 'audio') icon.className = 'ph ph-vinyl-record';
    else if (file.type === 'document') icon.className = 'ph ph-file-text';
    else icon.className = 'ph ph-file';
    
    placeholder.appendChild(icon);
    thumbContainer.appendChild(placeholder);
    
    // Overlay for hover (Play button or Download)
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    const actionIcon = document.createElement('i');
    actionIcon.className = isPlayable ? 'ph-fill ph-play-circle play-icon' : 'ph-fill ph-download-simple play-icon';
    overlay.appendChild(actionIcon);
    thumbContainer.appendChild(overlay);
    
    a.appendChild(thumbContainer);
    
    // Info Container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'card-info';
    
    const title = document.createElement('div');
    title.className = 'card-title';
    // Remove extension for cleaner look
    const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    title.textContent = rawName;
    
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    
    // Get file extension text
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toUpperCase();
    meta.textContent = `${file.type} • ${ext}`;
    
    infoContainer.appendChild(title);
    infoContainer.appendChild(meta);
    
    a.appendChild(infoContainer);
    
    return a;
}
