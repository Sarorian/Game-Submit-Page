const myApi = "https://lobsterapi-f663d2b5d447.herokuapp.com";

// Fetch the current patch version
const fetchPatch = async () => {
  const url = "https://ddragon.leagueoflegends.com/api/versions.json";
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data[0]); // Log the latest patch version
    return data[0]; // Return the latest patch version
  } catch (error) {
    console.error("Error fetching patches:", error);
  }
};

// Fetch champion data based on the patch version
const fetchChampions = async (patch) => {
  const url = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const championNames = Object.keys(data.data); // Get the list of champion names (keys of the 'data' object)
    console.log(championNames); // Log the champion names for debugging
    return championNames; // Return the champion names
  } catch (error) {
    console.error("Error fetching champions:", error);
    return []; // Return an empty array in case of an error
  }
};

// Fetch all players from the back-end
async function fetchPlayers() {
  try {
    const response = await fetch(`${myApi}/api/players`);
    if (!response.ok) throw new Error("Failed to fetch players");
    const players = await response.json();
    return players; // Returns an array of players
  } catch (error) {
    console.error("Error fetching players:", error);
    return []; // Return an empty array in case of error
  }
}

// Function to filter champions based on the user's input
const filterChampions = (input, champions) => {
  const query = input.toLowerCase();
  return champions.filter((champion) => champion.toLowerCase().includes(query));
};

// Function to filter players based on the user's input (using gameName or fullName)
const filterPlayers = (input, players) => {
  const query = input.toLowerCase();
  return players.filter(
    (player) =>
      player.gameName.toLowerCase().includes(query) ||
      player.fullName.toLowerCase().includes(query)
  );
};

// Function to create the autocomplete box next to the input field
// Function to create the autocomplete box next to the input field
const createAutocomplete = (inputElement, champions, players = []) => {
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

  inputElement.addEventListener("input", async () => {
    const query = inputElement.value.trim().toLowerCase();

    if (query.length > 0) {
      suggestionBox.innerHTML = "";
      suggestionBox.style.display = "block";

      // If no players data is passed, filter champions, else filter players
      const matches =
        players.length > 0
          ? filterPlayers(query, players)
          : filterChampions(query, champions);
      if (matches.length > 0) {
        matches.forEach((match, index) => {
          const suggestionItem = document.createElement("div");
          suggestionItem.textContent =
            match.gameName || match.fullName || match; // Use gameName or fullName
          suggestionItem.classList.add("suggestion-item");
          if (index === 0) {
            suggestionItem.classList.add("highlight"); // Highlight the top suggestion
          }
          suggestionItem.addEventListener("click", () => {
            inputElement.value = match.gameName || match.fullName || match; // Set input to selected item
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

// Main function to fetch both the patch and champions
const getChampions = async () => {
  const patch = await fetchPatch(); // Get the patch version
  if (patch) {
    const champions = await fetchChampions(patch); // Fetch champions using the patch version

    if (champions.length === 0) {
      console.error("No champions fetched.");
      return; // Exit if no champions are fetched
    }

    // Now, create autocomplete for all champion input fields
    const championInputs = document.querySelectorAll(
      'input[name*="champion-"]'
    );
    championInputs.forEach((inputElement) => {
      createAutocomplete(inputElement, champions); // Apply autocomplete to each champion input
    });

    // Apply autocomplete for all ban input fields as well
    const banInputs = document.querySelectorAll('input[name*="ban-"]');
    banInputs.forEach((banInputElement) => {
      createAutocomplete(banInputElement, champions); // Apply autocomplete to each ban input
    });
  }
};

getChampions(); // Call the main function to fetch both champions and apply autocomplete

// Player Name Dropdown functionality
async function initializePlayerAutocomplete() {
  const players = await fetchPlayers(); // Fetch all players
  const playerInputs = document.querySelectorAll('input[name*="player-"]');
  playerInputs.forEach((inputElement) => {
    createAutocomplete(inputElement, [], players); // Apply autocomplete to each player input using fetched players
  });
}

initializePlayerAutocomplete(); // Initialize player name autocomplete when page is loaded

// Your existing code for form handling and player fields...
document.addEventListener("DOMContentLoaded", function () {
  const dateInput = document.getElementById("match-date");
  const currentDate = new Date().toISOString().split("T")[0];
  dateInput.value = currentDate;
  const winningTeamContainer = document.getElementById(
    "winning-team-container"
  );
  const losingTeamContainer = document.getElementById("losing-team-container");
  const bansContainer = document.getElementById("champion-bans");

  // Creating the player fields and bans is the same as before...
  function createPlayerFields(teamContainer, teamType, numPlayers) {
    // Clear any previous team data before adding new input fields
    teamContainer.innerHTML = "";

    for (let i = 1; i <= numPlayers; i++) {
      const playerDiv = document.createElement("div");
      playerDiv.classList.add("player");
      playerDiv.id = `${teamType}-player-${i}`;

      // Player name input
      const playerInput = document.createElement("input");
      playerInput.type = "text";
      playerInput.name = `${teamType}-player-${i}`;
      playerInput.placeholder = "Player Name";
      playerInput.required = true;

      // Champion input
      const championInput = document.createElement("input");
      championInput.type = "text";
      championInput.name = `${teamType}-champion-${i}`;
      championInput.placeholder = "Champion Name";
      championInput.required = true;

      // KDA input
      const kdaInput = document.createElement("input");
      kdaInput.type = "text";
      kdaInput.name = `${teamType}-kda-${i}`;
      kdaInput.placeholder = "KDA ex. 1/2/3";
      kdaInput.required = true;

      // Captain checkbox
      const captainInput = document.createElement("input");
      captainInput.type = "checkbox";
      captainInput.name = `${teamType}-captain-${i}`;

      // Add event listener for captain selection
      captainInput.addEventListener("change", function () {
        // Uncheck other captains in the same team when one is selected
        const captainInputs = teamContainer.querySelectorAll(
          `input[name^="${teamType}-captain"]`
        );
        captainInputs.forEach((input) => {
          if (input !== captainInput) {
            input.checked = false;
          }
        });
      });

      // Append inputs to playerDiv
      playerDiv.appendChild(playerInput);
      playerDiv.appendChild(championInput);
      playerDiv.appendChild(kdaInput);
      playerDiv.appendChild(captainInput);

      // Append playerDiv to the team container
      teamContainer.appendChild(playerDiv);
    }
  }

  // Function to create ban fields
  function createBanFields(numBans) {
    bansContainer.innerHTML = "";
    for (let i = 1; i <= numBans; i++) {
      const banInput = document.createElement("input");
      banInput.type = "text";
      banInput.name = `ban-${i}`;
      banInput.placeholder = `Ban ${i} Champion`;
      bansContainer.appendChild(banInput);
    }
  }

  // Create player fields and bans
  createPlayerFields(winningTeamContainer, "winning", 5);
  createPlayerFields(losingTeamContainer, "losing", 5);
  createBanFields(10);

  // Handle form submission
  // Handle form submission
  document
    .getElementById("submit-button")
    .addEventListener("click", async function () {
      const date = document.getElementById("match-date").value;
      const minutes = document.getElementById("match-minutes").value;
      const seconds = document.getElementById("match-seconds").value;

      const winningTeam = [];
      const losingTeam = [];
      const bans = [];

      // Validate required fields are filled
      let isValid = true;
      const allInputs = document.querySelectorAll("input[required]");
      allInputs.forEach((input) => {
        if (!input.value.trim()) {
          input.style.border = "2px solid red"; // Highlight missing fields
          isValid = false;
        } else {
          input.style.border = ""; // Reset border if valid
        }
      });

      // Ensure at least one player is selected as captain in each team
      const winningCaptains = document.querySelectorAll(
        'input[name^="winning-captain"]:checked'
      );
      const losingCaptains = document.querySelectorAll(
        'input[name^="losing-captain"]:checked'
      );

      if (winningCaptains.length === 0) {
        alert("Please select at least one captain for the winning team.");
        isValid = false;
      }

      if (losingCaptains.length === 0) {
        alert("Please select at least one captain for the losing team.");
        isValid = false;
      }

      if (!isValid) {
        return; // Prevent submission if validation fails
      }

      const listOfRoles = ["top", "jg", "mid", "adc", "supp"];

      // Collect data for winning team
      for (let i = 1; i <= 5; i++) {
        const kdaValue = document.querySelector(
          `[name="winning-kda-${i}"]`
        ).value;
        const [kills, deaths, assists] = kdaValue
          .split("/")
          .map((value) => parseInt(value.trim()));

        winningTeam.push({
          playerName: document.querySelector(`[name="winning-player-${i}"]`)
            .value,
          champion: document.querySelector(`[name="winning-champion-${i}"]`)
            .value,
          kills: kills || 0,
          deaths: deaths || 0,
          assists: assists || 0,
          isCaptain: document.querySelector(`[name="winning-captain-${i}"]`)
            .checked,
          role: listOfRoles[i - 1],
        });
      }

      // Collect data for losing team
      for (let i = 1; i <= 5; i++) {
        const kdaValue = document.querySelector(
          `[name="losing-kda-${i}"]`
        ).value;
        const [kills, deaths, assists] = kdaValue
          .split("/")
          .map((value) => parseInt(value.trim()));

        losingTeam.push({
          playerName: document.querySelector(`[name="losing-player-${i}"]`)
            .value,
          champion: document.querySelector(`[name="losing-champion-${i}"]`)
            .value,
          kills: kills || 0,
          deaths: deaths || 0,
          assists: assists || 0,
          isCaptain: document.querySelector(`[name="losing-captain-${i}"]`)
            .checked,
          role: listOfRoles[i - 1],
        });
      }

      // Collect bans
      for (let i = 1; i <= 10; i++) {
        bans.push(document.querySelector(`[name="ban-${i}"]`).value);
      }

      // Create the match data object
      const matchData = {
        date: date,
        time: `${minutes}:${seconds}`,
        winningTeam: winningTeam,
        losingTeam: losingTeam,
        bans: bans,
      };

      console.log(matchData);
      console.log(JSON.stringify(matchData));

      // Send data to the backend to store it in the database
      try {
        const response = await fetch(`${myApi}/api/matches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(matchData),
        });

        if (!response.ok) {
          throw new Error("Failed to submit match data");
        }

        const data = await response.json();

        // Show success message
        const message = document.createElement("div");
        message.innerText = "Match data submitted successfully!";
        message.style.color = "green";
        document.body.appendChild(message);

        // Remove the message after 3 seconds
        setTimeout(() => {
          message.remove();
        }, 3000);

        // Clear the form after submission
        document.getElementById("match-form").reset();
      } catch (error) {
        console.error("Error submitting match:", error);
        alert("Failed to submit match data.");
      }
    });
});
