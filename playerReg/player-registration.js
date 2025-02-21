const myApiEndpoint = "https://lobsterapi-f663d2b5d447.herokuapp.com";

document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("registration-form");
  const messageDiv = document.getElementById("message");
  const championInput = document.getElementById("favorite-champion");
  const suggestionBox = document.getElementById("champion-suggestions");

  const API_BASE_URL =
    "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id";

  // Function to fetch PUUID from the server
  async function fetchPUUID(gameName, tagLine) {
    try {
      const response = await fetch(
        `${myApiEndpoint}/api/get-puuid?gameName=${encodeURIComponent(
          gameName
        )}&tagLine=${encodeURIComponent(tagLine)}`
      );

      if (!response.ok) {
        throw new Error("Failed to retrieve PUUID");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching PUUID:", error);
      return null;
    }
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
  const createAutocomplete = (inputElement, champions) => {
    let container = inputElement.parentElement;
    if (!container.classList.contains("input-container")) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("input-container");
      inputElement.parentNode.insertBefore(wrapper, inputElement);
      wrapper.appendChild(inputElement);
      container = wrapper;
    }

    let suggestionBox = container.querySelector(".autocomplete-suggestions");
    if (!suggestionBox) {
      suggestionBox = document.createElement("div");
      suggestionBox.classList.add("autocomplete-suggestions");
      container.appendChild(suggestionBox);
    }

    inputElement.addEventListener("input", () => {
      const query = inputElement.value.trim().toLowerCase();

      if (query.length > 0) {
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "block";

        const matches = filterChampions(query, champions);
        if (matches.length > 0) {
          matches.forEach((match, index) => {
            const suggestionItem = document.createElement("div");
            suggestionItem.textContent = match;
            suggestionItem.classList.add("suggestion-item");
            if (index === 0) {
              suggestionItem.classList.add("highlight"); // Highlight the top suggestion
            }
            suggestionItem.addEventListener("click", () => {
              inputElement.value = match;
              suggestionBox.innerHTML = "";
              suggestionBox.style.display = "none";
            });
            suggestionBox.appendChild(suggestionItem);
          });
        } else {
          suggestionBox.innerHTML = `<div class="suggestion-item no-match">No matches found</div>`;
        }
      } else {
        suggestionBox.style.display = "none";
      }
    });

    inputElement.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && suggestionBox.style.display === "block") {
        e.preventDefault(); // Prevent default tab behavior
        const firstSuggestion = suggestionBox.querySelector(".suggestion-item");
        if (firstSuggestion) {
          inputElement.value = firstSuggestion.textContent; // Set input to top suggestion
          suggestionBox.innerHTML = "";
          suggestionBox.style.display = "none";
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        suggestionBox.style.display = "none";
      }
    });
  };

  // Initialize champion autocomplete
  const champions = await fetchChampions();
  if (champions.length > 0) {
    createAutocomplete(championInput, champions);
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
    console.log(gameName, tagLine);
    if (!gameName || !tagLine) {
      messageDiv.textContent = "Invalid Riot ID format. Use 'Name#Tag'.";
      messageDiv.style.color = "red";
      return;
    }

    messageDiv.textContent = "Fetching PUUID...";
    messageDiv.style.color = "blue";

    const dataFromRiot = await fetchPUUID(gameName, tagLine);
    if (!dataFromRiot) {
      messageDiv.textContent =
        "Failed to fetch Player Data. Please check your Riot ID.";
      messageDiv.style.color = "red";
      return;
    }

    // Prepare the player data object to send to the backend
    const playerData = {
      fullName,
      riotID: `${dataFromRiot.gameName}#${dataFromRiot.tagLine}`, // Construct Riot ID from API
      gameName: dataFromRiot.gameName,
      tagLine: dataFromRiot.tagLine,
      puuid: dataFromRiot.puuid,
      favoriteChampion,
    };

    console.log("Player Registered:", playerData);

    // Send the player data to the backend API
    try {
      const response = await fetch(`${myApiEndpoint}/api/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        throw new Error("Failed to register player");
      }

      const data = await response.json();

      // Show success message
      messageDiv.textContent = "Player registered successfully!";
      messageDiv.style.color = "green";

      form.reset(); // Reset the form after successful submission

      setTimeout(() => (messageDiv.textContent = ""), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error("Error submitting player:", error);
      messageDiv.textContent = "Error registering player.";
      messageDiv.style.color = "red";
    }
  });
});
