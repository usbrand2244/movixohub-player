const params = new URLSearchParams(window.location.search);

const type = (params.get("type") || "movie").toLowerCase();
const id = params.get("id");

const season = params.get("season") || "1";
const episode = params.get("episode") || "1";

const iframe = document.getElementById("vidly-player");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");

function showError(message) {
    loader.style.display = "none";
    errorBox.style.display = "flex";
    errorBox.textContent = message;
}

function loadPlayer() {

    if (!id || !/^\d+$/.test(id)) {
        showError("Invalid or missing movie/show ID.");
        return;
    }

    let playerURL = "";

    if (type === "movie") {

        playerURL = `https://vidly.pro/movie/${id}`;

    } else if (type === "tv") {

        if (!/^\d+$/.test(season) || !/^\d+$/.test(episode)) {
            showError("Invalid season or episode.");
            return;
        }

        playerURL = `https://vidly.pro/tv/${id}/${season}/${episode}`;

    } else if (type === "anime") {

        if (!/^\d+$/.test(episode)) {
            showError("Invalid episode.");
            return;
        }

        playerURL = `https://vidly.pro/anime/${id}/${episode}/sub`;

    } else {

        showError("Unsupported media type.");
        return;
    }

    iframe.onload = () => {
        loader.style.display = "none";
    };

    iframe.src = playerURL;

    // Fallback if the iframe does not fire its load event.
    setTimeout(() => {
        loader.style.display = "none";
    }, 12000);
}

loadPlayer();