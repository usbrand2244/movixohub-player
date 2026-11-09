(function() {
    const params = new URLSearchParams(window.location.search);
    const type = (params.get('type') || 'movie').toLowerCase();
    const id = params.get('id');
    const season = params.get('season') || '1';
    const episode = params.get('episode') || '1';

    const iframe = document.getElementById('video-frame');
    const loader = document.getElementById('loader');
    const errorBox = document.getElementById('error');

    if (!id) {
        if (loader) loader.style.display = 'none';
        if (errorBox) { errorBox.style.display = 'flex'; errorBox.textContent = 'Invalid or missing ID.'; }
        return;
    }

    let url = '';
    
    // Assuming VidBolt uses standard paths
    if (type === 'anime') {
        // Anime uses AniList ID (assuming /anime/{id}/{episode}/sub)
        url = `https://vidbolt.pro/anime/${id}/${episode}/sub`;
    } else if (type === 'tv') {
        url = `https://vidbolt.pro/tv/${id}/${season}/${episode}`;
    } else {
        url = `https://vidbolt.pro/movie/${id}`;
    }

    iframe.onload = () => {
        if (loader) loader.style.display = 'none';
    };

    iframe.src = url;
})();
