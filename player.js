(function() {
    const params = new URLSearchParams(window.location.search);
    const type = (params.get('type') || 'movie').toLowerCase();
    const id = params.get('id');
    const season = params.get('season') || '1';
    const episode = params.get('episode') || '1';

    const iframe = document.getElementById('vidly-frame');
    let url = '';

    if (type === 'anime') {
        // Vidly uses AniList IDs for anime
        url = `https://vidly.pro/anime/${id}/${episode}/sub`;
    } else if (type === 'tv') {
        // Vidly uses TMDB IDs for TV
        url = `https://vidly.pro/tv/${id}/${season}/${episode}`;
    } else {
        // Vidly uses TMDB IDs for movies
        url = `https://vidly.pro/movie/${id}`;
    }

    iframe.src = url;
})();
