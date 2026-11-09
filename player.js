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
    
    // CinemaOS URL Structure
    if (type === 'tv' || type === 'anime') {
        // CinemaOS uses /player/{id}/{season}/{episode}
        url = `https://cinemaos.tech/player/${id}/${season}/${episode}?theme=ffffff`;
    } else {
        // Movies use /player/{id}
        url = `https://cinemaos.tech/player/${id}?theme=ffffff`;
    }

    iframe.onload = () => {
        if (loader) loader.style.display = 'none';
    };

    iframe.src = url;
})();
