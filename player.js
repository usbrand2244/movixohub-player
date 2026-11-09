(function() {
    const params = new URLSearchParams(window.location.search);
    const type = (params.get('type') || 'movie').toLowerCase();
    const id = params.get('id');
    const season = params.get('season') || '1';
    const episode = params.get('episode') || '1';

    const iframe = document.getElementById('vidly-frame');
    let url = '';

    if (type === 'anime') {
        // Use AniList ID for anime
        url = `https://vidly.pro/anime/${id}/${episode}/sub`;
    } else if (type === 'tv') {
        url = `https://vidly.pro/tv/${id}/${season}/${episode}`;
    } else {
        url = `https://vidly.pro/movie/${id}`;
    }

    iframe.src = url;
})();
