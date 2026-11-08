// In playCurrentMedia, replace the embedUrl assignments:

if (mediaToPlay.mediaType === 'anime') {
    // Anime uses TMDB ID directly (no AniList needed!)
    displayTitle = `${title} - Episode ${currentEpisode} (SUB)`;
    document.getElementById('player-title').textContent = displayTitle;
    
    // Use TMDB ID directly - no AniList resolution needed
    embedUrl = `${PLAYER_DOMAIN}/?type=anime&id=${mediaToPlay.id}&season=1&episode=${currentEpisode}`;
    
} else if (mediaToPlay.mediaType === 'tv') {
    displayTitle = `${title} - Season ${currentSeason}, Episode ${currentEpisode}`;
    document.getElementById('player-title').textContent = displayTitle;
    embedUrl = `${PLAYER_DOMAIN}/?type=tv&id=${mediaToPlay.id}&season=${currentSeason}&episode=${currentEpisode}`;
} else {
    document.getElementById('player-title').textContent = displayTitle;
    embedUrl = `${PLAYER_DOMAIN}/?type=movie&id=${mediaToPlay.id}`;
}
