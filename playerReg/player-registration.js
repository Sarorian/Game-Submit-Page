document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("registration-form");
  const messageDiv = document.getElementById("message");
  const championInput = document.getElementById("favorite-champion");
  const suggestionBox = document.getElementById("champion-suggestions");

  const API_BASE_URL =
    "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id";

  // Function to get API key from local storage
  function getApiKey() {
    return localStorage.getItem("riotApiKey");
  }

  // Function to set API key (run once manually in the browser console)
  function setApiKey(key) {
    localStorage.setItem("riotApiKey", key);
  }

  // Fetch latest patch version
  async function fetchPatch() {
    try {
      const response = await fetch(
        "https://ddragon.leagueoflegends.com/api/versions.json"
      );
      const data = await response.json();
      return data[0]; // Latest patch version
    } catch (error) {
      console.error("Error fetching patch version:", error);
    }
  }

  // Fetch champion list
  async function fetchChampions() {
    const patch = await fetchPatch();
    if (!patch) return [];

    try {
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`
      );
      const data = await response.json();
      return Object.keys(data.data);
    } catch (error) {
      console.error("Error fetching champions:", error);
      return [];
    }
  }

  // Filter champions based on input
  function filterChampions(query, champions) {
    return champions.filter((champion) =>
      champion.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Show autocomplete suggestions
  function createAutocomplete(inputElement, champions) {
    inputElement.addEventListener("input", () => {
      const query = inputElement.value.trim();
      suggestionBox.innerHTML = "";

      if (query.length === 0) {
        suggestionBox.style.display = "none";
        return;
      }

      const matches = filterChampions(query, champions);
      if (matches.length > 0) {
        matches.forEach((match) => {
          const item = document.createElement("div");
          item.textContent = match;
          item.classList.add("suggestion-item");
          item.addEventListener("click", () => {
            inputElement.value = match;
            suggestionBox.innerHTML = "";
            suggestionBox.style.display = "none";
          });
          suggestionBox.appendChild(item);
        });
      } else {
        const noMatch = document.createElement("div");
        noMatch.textContent = "No matches found";
        noMatch.classList.add("suggestion-item", "no-match");
        suggestionBox.appendChild(noMatch);
      }

      suggestionBox.style.display = "block";
    });

    document.addEventListener("click", (e) => {
      if (!suggestionBox.contains(e.target) && e.target !== inputElement) {
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
      }
    });
  }

  // Initialize champion autocomplete
  const champions = await fetchChampions();
  if (champions.length > 0) {
    createAutocomplete(championInput, champions);
  }

  // Fetch PUUID from Riot API using stored API key
  async function fetchPUUID(gameName, tagLine) {
    const API_KEY = getApiKey();
    if (!API_KEY) {
      console.error(
        "API Key is missing. Set it using `localStorage.setItem('riotApiKey', 'YOUR_API_KEY');`"
      );
      messageDiv.textContent = "API Key is missing. Set it in local storage.";
      messageDiv.style.color = "red";
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(gameName)}/${encodeURIComponent(
          tagLine
        )}?api_key=${API_KEY}`
      );

      if (!response.ok) throw new Error("Failed to fetch PUUID");
      const data = await response.json();
      return data; // Returns full Riot API response (puuid, gameName, tagLine)
    } catch (error) {
      console.error("Error fetching PUUID:", error);
      return null;
    }
  }

  // Handle form submission
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = document.getElementById("full-name").value.trim();
    const riotID = document.getElementById("riot-id").value.trim();
    const favoriteChampion = document
      .getElementById("favorite-champion")
      .value.trim();

    if (!fullName || !riotID || !favoriteChampion) {
      messageDiv.textContent = "Please fill in all fields.";
      messageDiv.style.color = "red";
      return;
    }

    const [gameName, tagLine] = riotID.split("#");
    if (!gameName || !tagLine) {
      messageDiv.textContent = "Invalid Riot ID format. Use 'Name#Tag'.";
      messageDiv.style.color = "red";
      return;
    }

    messageDiv.textContent = "Fetching PUUID...";
    messageDiv.style.color = "blue";

    const riotData = await fetchPUUID(gameName, tagLine);
    if (!riotData || !riotData.puuid) {
      messageDiv.textContent =
        "Failed to fetch PUUID. Please check your Riot ID.";
      messageDiv.style.color = "red";
      return;
    }

    // Use the returned Riot API data for accurate gameName and tagLine
    const playerData = {
      fullName,
      riotID: `${riotData.gameName}#${riotData.tagLine}`, // Construct Riot ID from API
      gameName: riotData.gameName,
      tagLine: riotData.tagLine,
      puuid: riotData.puuid,
      favoriteChampion,
      gamesPlayed: { wins: 0, losses: 0 },
      championsPlayed: {},
      rolesPlayed: {
        top: { wins: 0, losses: 0 },
        jg: { wins: 0, losses: 0 },
        mid: { wins: 0, losses: 0 },
        adc: { wins: 0, losses: 0 },
        supp: { wins: 0, losses: 0 },
      },
    };

    console.log("Player Registered:", playerData);

    messageDiv.textContent = "Player registered successfully!";
    messageDiv.style.color = "green";

    form.reset();
    setTimeout(() => (messageDiv.textContent = ""), 3000);
  });
});
