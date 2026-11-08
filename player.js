// ============================================
// VERCEL PLAYER — Vidsrc.sh with sandbox
// Main domain is now vidsrc.sh (per official docs)
// ============================================

const params = new URLSearchParams(window.location.search);
const type = (params.get('type') || 'movie').toLowerCase();
const id = params.get('id');
const season = params.get('season') || '1';
const episode = params.get('episode') || '1';

const iframe = document.getElementById('player-frame');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('error');

function showError(message) {
    loader.style.display = 'none';
    errorBox.style.display = 'flex';
    errorBox.textContent = message;
}

function loadPlayer() {
    if (!id) {
        showError('Missing media ID.');
        return;
    }

    let playerURL = '';

    // Vidsrc.sh uses TMDB IDs directly (numeric)
    // For anime: use TV show structure with TMDB ID
    if (type === 'movie') {
        playerURL = `https://vidsrc.sh/embed/movie/${id}`;
    } else if (type === 'tv' || type === 'anime') {
        // Both TV shows and anime use the TV endpoint
        // Anime on TMDB is just a TV show, so this works
        playerURL = `https://vidsrc.sh/embed/tv/${id}/${season}/${episode}`;
    } else {
        showError('Unsupported media type.');
        return;
    }

    console.log('[Vidsrc Player] Loading:', playerURL);

    iframe.onload = () => {
        loader.style.display = 'none';
    };

    iframe.src = playerURL;

    // Fallback loader hide
    setTimeout(() => {
        loader.style.display = 'none';
    }, 12000);
}

loadPlayer();
