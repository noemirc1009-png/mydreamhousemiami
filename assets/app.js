const state = {
  listings: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem("mdhFavorites") || "[]")),
  activeView: "idx",
  botLead: {}
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const elements = {
  loginGate: document.querySelector("#loginGate"),
  loginForm: document.querySelector("#loginForm"),
  loginUser: document.querySelector("#loginUser"),
  loginPassword: document.querySelector("#loginPassword"),
  loginStatus: document.querySelector("#loginStatus"),
  idxFrame: document.querySelector("#idxFrame"),
  searchForm: document.querySelector("#searchForm"),
  queryInput: document.querySelector("#queryInput"),
  countyInput: document.querySelector("#countyInput"),
  minPrice: document.querySelector("#minPrice"),
  maxPrice: document.querySelector("#maxPrice"),
  bedsInput: document.querySelector("#bedsInput"),
  typeInput: document.querySelector("#typeInput"),
  hoaInput: document.querySelector("#hoaInput"),
  amenityInput: document.querySelector("#amenityInput"),
  resetButton: document.querySelector("#resetButton"),
  sortInput: document.querySelector("#sortInput"),
  listingGrid: document.querySelector("#listingGrid"),
  favoritesGrid: document.querySelector("#favoritesGrid"),
  template: document.querySelector("#listingTemplate"),
  favoriteCount: document.querySelector("#favoriteCount"),
  resultCount: document.querySelector("#resultCount"),
  medianPrice: document.querySelector("#medianPrice"),
  feedStatus: document.querySelector("#feedStatus"),
  feedMessage: document.querySelector("#feedMessage"),
  leadForm: document.querySelector("#leadForm"),
  leadStatus: document.querySelector("#leadStatus"),
  alertForm: document.querySelector("#alertForm"),
  alertStatus: document.querySelector("#alertStatus"),
  newListingPop: document.querySelector("#newListingPop"),
  newListingClose: document.querySelector("#newListingClose"),
  newListingImage: document.querySelector("#newListingImage"),
  newListingPrice: document.querySelector("#newListingPrice"),
  newListingTitle: document.querySelector("#newListingTitle"),
  newListingAddress: document.querySelector("#newListingAddress"),
  newListingTour: document.querySelector("#newListingTour"),
  chatbotWidget: document.querySelector("#chatbotWidget"),
  chatbotToggle: document.querySelector("#chatbotToggle"),
  chatbotPanel: document.querySelector("#chatbotPanel"),
  chatbotClose: document.querySelector("#chatbotClose"),
  chatbotMessages: document.querySelector("#chatbotMessages"),
  chatbotForm: document.querySelector("#chatbotForm"),
  chatbotInput: document.querySelector("#chatbotInput")
};

const loginCredentials = {
  username: "Peguero26",
  password: "MyHouse26"
};
let beachAudio = null;
const matrixIdxUrl = "https://sef.mlsmatrix.com/Matrix/public/IDX.aspx?idx=988b1ef6";
const mlsRefreshInterval = 30 * 60 * 1000;
const citiesByCounty = {
  "Miami-Dade": [
    "Miami",
    "Miami Beach",
    "Brickell",
    "Doral",
    "Coral Gables",
    "Pinecrest",
    "Aventura",
    "Sunny Isles Beach",
    "Homestead",
    "Hialeah"
  ],
  Broward: [
    "Fort Lauderdale",
    "Hollywood",
    "Pembroke Pines",
    "Miramar",
    "Weston",
    "Plantation",
    "Pompano Beach",
    "Coral Springs"
  ],
  "Palm Beach": [
    "Boca Raton",
    "Delray Beach",
    "West Palm Beach",
    "Boynton Beach",
    "Jupiter",
    "Palm Beach Gardens"
  ],
  Monroe: [
    "Key Largo",
    "Islamorada",
    "Marathon",
    "Key West"
  ],
  Martin: [
    "Stuart",
    "Palm City",
    "Jensen Beach",
    "Hobe Sound"
  ],
  "St. Lucie": [
    "Port St. Lucie",
    "Fort Pierce",
    "St. Lucie West"
  ],
  Collier: [
    "Naples",
    "Marco Island",
    "Immokalee",
    "Ave Maria"
  ],
  Lee: [
    "Fort Myers",
    "Cape Coral",
    "Bonita Springs",
    "Estero"
  ]
};

const zipLookup = {
  "33010": { city: "Hialeah", county: "Miami-Dade" },
  "33012": { city: "Hialeah", county: "Miami-Dade" },
  "33013": { city: "Hialeah", county: "Miami-Dade" },
  "33014": { city: "Hialeah", county: "Miami-Dade" },
  "33015": { city: "Miami Lakes", county: "Miami-Dade" },
  "33016": { city: "Hialeah", county: "Miami-Dade" },
  "33018": { city: "Hialeah", county: "Miami-Dade" },
  "33030": { city: "Homestead", county: "Miami-Dade" },
  "33031": { city: "Homestead", county: "Miami-Dade" },
  "33032": { city: "Homestead", county: "Miami-Dade" },
  "33033": { city: "Homestead", county: "Miami-Dade" },
  "33034": { city: "Florida City", county: "Miami-Dade" },
  "33035": { city: "Homestead", county: "Miami-Dade" },
  "33101": { city: "Miami", county: "Miami-Dade" },
  "33109": { city: "Miami Beach", county: "Miami-Dade" },
  "33125": { city: "Miami", county: "Miami-Dade" },
  "33126": { city: "Miami", county: "Miami-Dade" },
  "33127": { city: "Miami", county: "Miami-Dade" },
  "33128": { city: "Miami", county: "Miami-Dade" },
  "33129": { city: "Brickell", county: "Miami-Dade" },
  "33130": { city: "Brickell", county: "Miami-Dade" },
  "33131": { city: "Brickell", county: "Miami-Dade" },
  "33132": { city: "Miami", county: "Miami-Dade" },
  "33133": { city: "Coconut Grove", county: "Miami-Dade" },
  "33134": { city: "Coral Gables", county: "Miami-Dade" },
  "33135": { city: "Miami", county: "Miami-Dade" },
  "33136": { city: "Miami", county: "Miami-Dade" },
  "33137": { city: "Miami", county: "Miami-Dade" },
  "33138": { city: "Miami", county: "Miami-Dade" },
  "33139": { city: "Miami Beach", county: "Miami-Dade" },
  "33140": { city: "Miami Beach", county: "Miami-Dade" },
  "33141": { city: "Miami Beach", county: "Miami-Dade" },
  "33142": { city: "Miami", county: "Miami-Dade" },
  "33143": { city: "South Miami", county: "Miami-Dade" },
  "33144": { city: "Miami", county: "Miami-Dade" },
  "33145": { city: "Miami", county: "Miami-Dade" },
  "33146": { city: "Coral Gables", county: "Miami-Dade" },
  "33149": { city: "Key Biscayne", county: "Miami-Dade" },
  "33154": { city: "Bal Harbour", county: "Miami-Dade" },
  "33155": { city: "Miami", county: "Miami-Dade" },
  "33156": { city: "Pinecrest", county: "Miami-Dade" },
  "33157": { city: "Palmetto Bay", county: "Miami-Dade" },
  "33160": { city: "Aventura", county: "Miami-Dade" },
  "33161": { city: "North Miami", county: "Miami-Dade" },
  "33162": { city: "North Miami Beach", county: "Miami-Dade" },
  "33165": { city: "Miami", county: "Miami-Dade" },
  "33166": { city: "Doral", county: "Miami-Dade" },
  "33172": { city: "Doral", county: "Miami-Dade" },
  "33173": { city: "Kendall", county: "Miami-Dade" },
  "33174": { city: "Miami", county: "Miami-Dade" },
  "33175": { city: "Miami", county: "Miami-Dade" },
  "33176": { city: "Kendall", county: "Miami-Dade" },
  "33178": { city: "Doral", county: "Miami-Dade" },
  "33179": { city: "Aventura", county: "Miami-Dade" },
  "33180": { city: "Aventura", county: "Miami-Dade" },
  "33181": { city: "North Miami", county: "Miami-Dade" },
  "33182": { city: "Miami", county: "Miami-Dade" },
  "33183": { city: "Kendall", county: "Miami-Dade" },
  "33184": { city: "Miami", county: "Miami-Dade" },
  "33185": { city: "Miami", county: "Miami-Dade" },
  "33186": { city: "Kendall", county: "Miami-Dade" },
  "33187": { city: "Miami", county: "Miami-Dade" },
  "33189": { city: "Cutler Bay", county: "Miami-Dade" },
  "33190": { city: "Cutler Bay", county: "Miami-Dade" },
  "33193": { city: "Kendall", county: "Miami-Dade" },
  "33196": { city: "Kendall", county: "Miami-Dade" },
  "33301": { city: "Fort Lauderdale", county: "Broward" },
  "33304": { city: "Fort Lauderdale", county: "Broward" },
  "33305": { city: "Wilton Manors", county: "Broward" },
  "33308": { city: "Fort Lauderdale", county: "Broward" },
  "33311": { city: "Fort Lauderdale", county: "Broward" },
  "33312": { city: "Fort Lauderdale", county: "Broward" },
  "33313": { city: "Lauderhill", county: "Broward" },
  "33314": { city: "Davie", county: "Broward" },
  "33315": { city: "Fort Lauderdale", county: "Broward" },
  "33316": { city: "Fort Lauderdale", county: "Broward" },
  "33317": { city: "Plantation", county: "Broward" },
  "33319": { city: "Lauderhill", county: "Broward" },
  "33321": { city: "Tamarac", county: "Broward" },
  "33322": { city: "Sunrise", county: "Broward" },
  "33323": { city: "Sunrise", county: "Broward" },
  "33324": { city: "Plantation", county: "Broward" },
  "33325": { city: "Davie", county: "Broward" },
  "33326": { city: "Weston", county: "Broward" },
  "33327": { city: "Weston", county: "Broward" },
  "33328": { city: "Davie", county: "Broward" },
  "33330": { city: "Davie", county: "Broward" },
  "33331": { city: "Weston", county: "Broward" },
  "33332": { city: "Weston", county: "Broward" },
  "33004": { city: "Dania Beach", county: "Broward" },
  "33009": { city: "Hallandale Beach", county: "Broward" },
  "33019": { city: "Hollywood", county: "Broward" },
  "33020": { city: "Hollywood", county: "Broward" },
  "33021": { city: "Hollywood", county: "Broward" },
  "33023": { city: "Miramar", county: "Broward" },
  "33024": { city: "Pembroke Pines", county: "Broward" },
  "33025": { city: "Miramar", county: "Broward" },
  "33026": { city: "Pembroke Pines", county: "Broward" },
  "33027": { city: "Miramar", county: "Broward" },
  "33028": { city: "Pembroke Pines", county: "Broward" },
  "33029": { city: "Pembroke Pines", county: "Broward" },
  "33060": { city: "Pompano Beach", county: "Broward" },
  "33062": { city: "Pompano Beach", county: "Broward" },
  "33063": { city: "Margate", county: "Broward" },
  "33064": { city: "Pompano Beach", county: "Broward" },
  "33065": { city: "Coral Springs", county: "Broward" },
  "33066": { city: "Coconut Creek", county: "Broward" },
  "33067": { city: "Parkland", county: "Broward" },
  "33068": { city: "North Lauderdale", county: "Broward" },
  "33069": { city: "Pompano Beach", county: "Broward" },
  "33071": { city: "Coral Springs", county: "Broward" },
  "33073": { city: "Coconut Creek", county: "Broward" },
  "33076": { city: "Parkland", county: "Broward" },
  "33401": { city: "West Palm Beach", county: "Palm Beach" },
  "33403": { city: "North Palm Beach", county: "Palm Beach" },
  "33405": { city: "West Palm Beach", county: "Palm Beach" },
  "33407": { city: "West Palm Beach", county: "Palm Beach" },
  "33408": { city: "North Palm Beach", county: "Palm Beach" },
  "33410": { city: "Palm Beach Gardens", county: "Palm Beach" },
  "33411": { city: "Royal Palm Beach", county: "Palm Beach" },
  "33414": { city: "Wellington", county: "Palm Beach" },
  "33417": { city: "West Palm Beach", county: "Palm Beach" },
  "33418": { city: "Palm Beach Gardens", county: "Palm Beach" },
  "33426": { city: "Boynton Beach", county: "Palm Beach" },
  "33428": { city: "Boca Raton", county: "Palm Beach" },
  "33431": { city: "Boca Raton", county: "Palm Beach" },
  "33432": { city: "Boca Raton", county: "Palm Beach" },
  "33433": { city: "Boca Raton", county: "Palm Beach" },
  "33434": { city: "Boca Raton", county: "Palm Beach" },
  "33435": { city: "Boynton Beach", county: "Palm Beach" },
  "33436": { city: "Boynton Beach", county: "Palm Beach" },
  "33437": { city: "Boynton Beach", county: "Palm Beach" },
  "33444": { city: "Delray Beach", county: "Palm Beach" },
  "33445": { city: "Delray Beach", county: "Palm Beach" },
  "33446": { city: "Delray Beach", county: "Palm Beach" },
  "33458": { city: "Jupiter", county: "Palm Beach" },
  "33469": { city: "Jupiter", county: "Palm Beach" },
  "33477": { city: "Jupiter", county: "Palm Beach" },
  "33480": { city: "Palm Beach", county: "Palm Beach" },
  "33483": { city: "Delray Beach", county: "Palm Beach" },
  "33486": { city: "Boca Raton", county: "Palm Beach" },
  "33487": { city: "Boca Raton", county: "Palm Beach" },
  "33496": { city: "Boca Raton", county: "Palm Beach" },
  "33498": { city: "Boca Raton", county: "Palm Beach" },
  "33037": { city: "Key Largo", county: "Monroe" },
  "33036": { city: "Islamorada", county: "Monroe" },
  "33050": { city: "Marathon", county: "Monroe" },
  "33040": { city: "Key West", county: "Monroe" },
  "34102": { city: "Naples", county: "Collier" },
  "34103": { city: "Naples", county: "Collier" },
  "34108": { city: "Naples", county: "Collier" },
  "34109": { city: "Naples", county: "Collier" },
  "34110": { city: "Naples", county: "Collier" },
  "34113": { city: "Naples", county: "Collier" },
  "34114": { city: "Naples", county: "Collier" },
  "34119": { city: "Naples", county: "Collier" },
  "34120": { city: "Naples", county: "Collier" },
  "34134": { city: "Bonita Springs", county: "Lee" },
  "33904": { city: "Cape Coral", county: "Lee" },
  "33908": { city: "Fort Myers", county: "Lee" },
  "33913": { city: "Fort Myers", county: "Lee" },
  "33914": { city: "Cape Coral", county: "Lee" },
  "33919": { city: "Fort Myers", county: "Lee" },
  "33928": { city: "Estero", county: "Lee" },
  "34952": { city: "Port St. Lucie", county: "St. Lucie" },
  "34953": { city: "Port St. Lucie", county: "St. Lucie" },
  "34957": { city: "Jensen Beach", county: "Martin" },
  "34983": { city: "Port St. Lucie", county: "St. Lucie" },
  "34986": { city: "Port St. Lucie", county: "St. Lucie" },
  "34990": { city: "Palm City", county: "Martin" },
  "34994": { city: "Stuart", county: "Martin" },
  "34996": { city: "Stuart", county: "Martin" },
  "34997": { city: "Stuart", county: "Martin" }
};

init();

async function init() {
  bindEvents();
  updateCityOptions();
  startMlsAutoRefresh();
  state.listings = await loadListings();
  applyFilters();
  scheduleNewListingPop();
}

function bindEvents() {
  bindLogin();

  if (elements.searchForm) {
    elements.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.activeView === "featured") {
        applyFilters();
        return;
      }
      updateIdxFrame();
      switchView("idx");
    });
  }

  if (elements.resetButton) {
    elements.resetButton.addEventListener("click", () => {
      elements.searchForm.reset();
      elements.idxFrame.src = matrixIdxUrl;
      applyFilters();
    });
  }

  if (elements.countyInput) {
    elements.countyInput.addEventListener("change", () => {
      updateCityOptions();
      applyFilters();
    });
  }

  elements.sortInput.addEventListener("change", applyFilters);

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  elements.leadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const lead = Object.fromEntries(new FormData(elements.leadForm).entries());
    submitLead({
      ...lead,
      source: "contact_form",
      page: window.location.href
    }, elements.leadStatus, elements.leadForm);
  });

  elements.alertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const alert = Object.fromEntries(new FormData(elements.alertForm).entries());
    alert.createdAt = new Date().toISOString();

    try {
      const response = await fetch(apiUrl("/api/search-alerts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert)
      });
      if (!response.ok) throw new Error(`Alert request failed: ${response.status}`);
      elements.alertStatus.textContent = "Search alert created. Email automation will use this saved search.";
    } catch (error) {
      const savedAlerts = JSON.parse(localStorage.getItem("mdhSearchAlerts") || "[]");
      savedAlerts.push(alert);
      localStorage.setItem("mdhSearchAlerts", JSON.stringify(savedAlerts));
      elements.alertStatus.textContent = "Search alert saved on this browser. Run the backend to send it to email automation.";
      console.error(error);
    }

    elements.alertForm.reset();
  });

  elements.newListingClose.addEventListener("click", hideNewListingPop);
  elements.newListingTour.addEventListener("click", () => {
    const listing = state.featuredListing;
    hideNewListingPop();
    if (listing) {
      switchView("contact");
      document.querySelector("[name='property']").value = `${listing.address} - MLS ${listing.mls}`;
    }
  });

  bindChatbot();
}

function bindChatbot() {
  if (!elements.chatbotWidget) return;

  elements.chatbotToggle.addEventListener("click", () => toggleChatbot(true));
  elements.chatbotClose.addEventListener("click", () => toggleChatbot(false));
  elements.chatbotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleBotPrompt(elements.chatbotInput.value);
  });

  document.querySelectorAll("[data-bot-prompt]").forEach((button) => {
    button.addEventListener("click", () => handleBotPrompt(button.dataset.botPrompt));
  });

  addBotMessage("Hi, I am the MyDreamHouse assistant. Are you buying, selling, renting, or looking for a showing?");
}

function toggleChatbot(open) {
  elements.chatbotPanel.classList.toggle("hidden", !open);
  elements.chatbotToggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    elements.chatbotInput.focus();
  }
}

function handleBotPrompt(rawPrompt) {
  const prompt = rawPrompt.trim();
  if (!prompt) return;

  addUserMessage(prompt);
  elements.chatbotInput.value = "";
  updateBotLead(prompt);

  window.setTimeout(() => {
    const reply = getBotReply(prompt);
    state.botLead.lastQuestion = reply.nextQuestion || "";
    addBotMessage(reply.message);
    if (reply.action) reply.action();
  }, 260);
}

function addUserMessage(message) {
  addChatMessage(message, "user");
}

function addBotMessage(message) {
  addChatMessage(message, "bot");
}

function addChatMessage(message, type) {
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${type}`;
  bubble.textContent = message;
  elements.chatbotMessages.appendChild(bubble);
  elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

function getBotReply(prompt) {
  const text = normalizeBotText(prompt);
  const lead = state.botLead;
  const promptHasZip = /\b3\d{4}\b/.test(prompt);

  if (lead.lastQuestion === "timeline") {
    const timeline = detectLooseTimeline(text);
    if (timeline) {
      lead.timeline = timeline;
      const missing = nextMissingLeadField();
      return {
        message: missing
          ? `${leadSummarySentence()} ${smartFollowUp(missing)}`
          : "Perfect. I have enough information and I am sending it to Misael now.",
        nextQuestion: missing,
        action: () => missing ? undefined : sendBotLeadSummary()
      };
    }
  }

  if (text.includes("reset") || text.includes("start over")) {
    state.botLead = {};
    return {
      message: "No problem. Let us start fresh. Are you buying, selling, renting, or looking for a showing?"
    };
  }

  if (text.includes("showing") || text.includes("tour") || text.includes("appointment") || text.includes("visit")) {
    lead.intent = "showing";
    const missing = nextMissingLeadField();
    return {
      message: missing
        ? `${leadSummarySentence()} Perfect, I can help schedule a showing. ${smartFollowUp(missing)}`
        : "Perfect. I have the showing details. I am sending this to Misael now.",
      nextQuestion: missing,
      action: () => missing ? switchView("contact") : sendBotLeadSummary()
    };
  }

  if (text.includes("alert") || text.includes("email") || text.includes("saved search") || text.includes("automatic")) {
    lead.intent = "search alert";
    return {
      message: lead.location
        ? `${leadSummarySentence()} I opened Search Alerts so the search can be saved with city, price, beds, HOA, and frequency.`
        : "I opened Search Alerts. Tell me the city or ZIP where you want listings, and I will help shape the search.",
      nextQuestion: lead.location ? "" : "city or ZIP",
      action: () => switchView("alerts")
    };
  }

  if (text.includes("search") || text.includes("mls") || text.includes("idx") || text.includes("map")) {
    return {
      message: "The live Matrix IDX search is on Map + List. Use the MLS tools there for the most accurate live results from your IDX feed.",
      action: () => switchView("idx")
    };
  }

  if (text.includes("favorite") || text.includes("save")) {
    return {
      message: "I opened Favorites. Visitors can save homes from the Featured listings and come back to them on this device.",
      action: () => switchView("favorites")
    };
  }

  if (text.includes("hoa")) {
    return {
      message: "For HOA, I can track No HOA or a maximum monthly HOA. Tell me something like: no HOA, HOA under 500, or any HOA."
    };
  }

  if (text.includes("price") || text.includes("budget") || text.includes("pre approval") || text.includes("preapproval")) {
    return {
      message: lead.budget
        ? `I have your budget as ${lead.budget}. Do you already have a pre-approval, or do you need help getting ready?`
        : "What price range are you comfortable with? Example: 500k to 800k."
    };
  }

  if (promptHasZip && lead.zip && lead.locationSource === "zip") {
    const missing = nextMissingLeadField();
    return {
      message: missing
        ? `I found ZIP ${lead.zip}: ${lead.location}, ${lead.county} County. ${smartFollowUp(missing)}`
        : `I found ZIP ${lead.zip}: ${lead.location}, ${lead.county} County. I have enough information and I am sending it to Misael now.`,
      nextQuestion: missing,
      action: () => missing ? undefined : sendBotLeadSummary()
    };
  }

  if (looksLikeLead(prompt)) {
    updateBotLead(prompt);
    if (hasEnoughBotLead()) {
      sendBotLeadSummary();
      return {
        message: "Thank you. I sent your information to Misael. He can follow up with the best next step.",
        action: () => switchView("contact")
      };
    }
    return {
      message: `Thank you. I have your contact. What city, budget, and type of home are you looking for?`,
      action: () => switchView("contact")
    };
  }

  if (hasEnoughBotLead()) {
    const missing = nextImportantLeadField();
    if (missing) {
      return {
        message: `${leadSummarySentence()} ${smartFollowUp(missing)}`,
        nextQuestion: missing
      };
    }
    sendBotLeadSummary();
    return {
      message: "I have enough information to help. I sent your request to Misael and opened the contact page in case you want to add more details.",
      action: () => switchView("contact")
    };
  }

  const missing = nextMissingLeadField();
  if (missing) {
    return {
      message: `${acknowledgePrompt(prompt)} ${leadSummarySentence()} ${smartFollowUp(missing)}`,
      nextQuestion: missing
    };
  }

  return {
    message: "I can help with buying, selling, renting, showings, MLS search, HOA, and saved alerts. Tell me your city, budget, bedrooms, and when you want to move."
  };
}

function looksLikeLead(text) {
  return /\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text) || /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text);
}

function updateBotLead(prompt) {
  const text = prompt.toLowerCase();
  const normalized = normalizeBotText(prompt);
  const lead = state.botLead;
  lead.transcript = [...(lead.transcript || []), prompt].slice(-8);

  const shortNumber = prompt.match(/^\s*([1-9])\s*$/);
  if (shortNumber) {
    if (lead.lastQuestion === "bedrooms" || (!lead.beds && lead.location)) {
      lead.beds = `${shortNumber[1]}+ beds`;
      return;
    }
    if (lead.lastQuestion === "budget" && Number(shortNumber[1]) >= 1) {
      lead.budget = `${shortNumber[1]}00k`;
      return;
    }
  }

  if (lead.lastQuestion === "timeline") {
    const looseTimeline = detectLooseTimeline(normalized);
    if (looseTimeline) {
      lead.timeline = looseTimeline;
      return;
    }
  }

  const zip = prompt.match(/\b3\d{4}\b/);
  if (zip) {
    lead.zip = zip[0];
    const match = zipLookup[zip[0]];
    if (match) {
      lead.location = match.city;
      lead.county = match.county;
      lead.locationSource = "zip";
    }
  }

  if (text.includes("buy") || text.includes("buyer") || text.includes("purchase")) lead.intent = "buyer";
  if (text.includes("sell") || text.includes("seller") || text.includes("list my")) lead.intent = "seller";
  if (text.includes("rent") || text.includes("rental") || text.includes("lease")) lead.intent = "renter";
  if (text.includes("showing") || text.includes("tour") || text.includes("visit")) lead.intent = "showing";

  const email = prompt.match(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i);
  if (email) lead.email = email[0];

  const phone = prompt.match(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  if (phone) lead.phone = phone[0];

  const beds = normalized.match(/\b([1-9])\s*(?:bed|beds|bedroom|bedrooms|br)\b/);
  if (beds) lead.beds = `${beds[1]}+ beds`;

  const budget = prompt.match(/\$?\s?\d{3,}(?:,\d{3})*(?:\s?(?:k|m|million))?(?:\s?(?:-|to)\s?\$?\s?\d{3,}(?:,\d{3})*(?:\s?(?:k|m|million))?)?/i);
  if (budget && /price|budget|\$|k|million|m\b|to|-/.test(text)) lead.budget = budget[0].trim();

  const locations = Object.values(citiesByCounty).flat();
  const location = locations.find((city) => normalized.includes(city.toLowerCase()));
  if (location) {
    lead.location = location;
    lead.county = countyForCity(location);
    lead.locationSource = "city";
  }

  if (normalized.includes("condo")) lead.propertyType = "Condo";
  if (normalized.includes("townhouse") || normalized.includes("townhome")) lead.propertyType = "Townhouse";
  if (normalized.includes("single family") || normalized.includes("house")) lead.propertyType = "Single Family";
  if (normalized.includes("waterfront") || normalized.includes("water front")) lead.amenities = "Waterfront";
  if (normalized.includes("pool")) lead.amenities = [lead.amenities, "Pool"].filter(Boolean).join(", ");
  if (normalized.includes("no hoa")) lead.hoa = "No HOA";
  if (normalized.includes("hoa under")) lead.hoa = prompt.match(/hoa under\s?\$?\d+/i)?.[0] || "HOA limit requested";
  if (normalized.includes("cash")) lead.financing = "Cash";
  if (normalized.includes("pre approved") || normalized.includes("pre-approved") || normalized.includes("preapproval")) lead.financing = "Pre-approved";

  const timelineWords = ["today", "tomorrow", "this week", "next week", "this month", "weekend", "month", "week", "soon", "asap", "30 days", "60 days", "90 days", "later"];
  const timeline = timelineWords.find((word) => normalized.includes(word));
  if (timeline) lead.timeline = timeline;
}

function detectLooseTimeline(text) {
  if (text.includes("next") && text.includes("week")) return "next week";
  if (text.includes("this") && text.includes("month")) return "this month";
  if (text.includes("this") && text.includes("week")) return "this week";
  if (text.trim() === "week" || text.includes("in a week")) return "next week";
  if (text.includes("weekend")) return "weekend";
  if (text.includes("soon") || text.includes("asap")) return "soon";
  if (text.includes("later")) return "later";
  if (/\b30\b/.test(text)) return "30 days";
  if (/\b60\b/.test(text)) return "60 days";
  if (/\b90\b/.test(text)) return "90 days";
  if (text.length <= 16 && text.includes("month")) return "this month";
  return "";
}

function normalizeBotText(value) {
  return String(value)
    .toLowerCase()
    .replace(/\bmont\b|\bmonht\b|\bmoth\b|\bmnth\b/g, "month")
    .replace(/\bnexxt\b|\bnextt\b|\bnxt\b/g, "next")
    .replace(/\bths\b|\bdis\b/g, "this")
    .replace(/\btomorow\b|\btommorow\b/g, "tomorrow")
    .replace(/\bweak\b/g, "week")
    .replace(/\bbedroms\b|\bbedrom\b|\bbdr\b/g, "bedrooms")
    .replace(/\bbugdet\b|\bbudjet\b/g, "budget")
    .replace(/\bmiame\b/g, "miami")
    .replace(/\bdorla\b/g, "doral");
}

function nextMissingLeadField() {
  const lead = state.botLead;
  if (!lead.intent) return "goal";
  if (!lead.location && lead.intent !== "seller") return "city or ZIP";
  if (!lead.budget && lead.intent !== "seller") return "budget";
  if (!lead.beds && ["buyer", "renter", "search alert"].includes(lead.intent)) return "bedrooms";
  if (!lead.timeline) return "timeline";
  if (!lead.email && !lead.phone) return "email or phone";
  return "";
}

function nextImportantLeadField() {
  const lead = state.botLead;
  if (!lead.timeline) return "timeline";
  if (!lead.budget && lead.intent !== "seller") return "budget";
  if (!lead.beds && ["buyer", "renter", "search alert"].includes(lead.intent)) return "bedrooms";
  return "";
}

function smartFollowUp(field) {
  const prompts = {
    goal: "Are you buying, selling, renting, or scheduling a showing?",
    "city or ZIP": "Which city or ZIP do you prefer? For example Miami, Doral, Brickell, Aventura, or Coral Gables.",
    budget: "What budget or price range should I use? Example: 600k to 900k.",
    bedrooms: "How many bedrooms do you need?",
    timeline: "When would you like to move or see homes: this week, next week, this month, or later?",
    "email or phone": "What email or phone number should Misael use to contact you?"
  };
  return prompts[field] || "Tell me a little more so I can help.";
}

function acknowledgePrompt(prompt) {
  const text = normalizeBotText(prompt);
  if (text.includes("thank")) return "You are welcome.";
  if (text.includes("yes") || text.includes("ok")) return "Great.";
  if (text.includes("no ")) return "No problem.";
  if (/\b3\d{4}\b/.test(text)) return "Got it.";
  return "Got it.";
}

function leadSummarySentence() {
  const lead = state.botLead;
  const parts = [];
  if (lead.intent) parts.push(lead.intent);
  if (lead.location) parts.push(lead.zip ? `${lead.location} ${lead.zip}` : lead.location);
  if (lead.county) parts.push(`${lead.county} County`);
  if (lead.budget) parts.push(lead.budget);
  if (lead.beds) parts.push(lead.beds);
  if (lead.propertyType) parts.push(lead.propertyType);
  if (lead.hoa) parts.push(lead.hoa);
  if (!parts.length) return "";
  return `So far I have: ${parts.join(", ")}.`;
}

function countyForCity(city) {
  return Object.entries(citiesByCounty).find(([, cities]) => cities.includes(city))?.[0] || "";
}

function hasEnoughBotLead() {
  const lead = state.botLead;
  return Boolean((lead.email || lead.phone) && (lead.intent || lead.location || lead.budget || lead.propertyType));
}

function sendBotLeadSummary() {
  const lead = state.botLead;
  const summary = [
    `Intent: ${lead.intent || ""}`,
    `Location: ${lead.location || ""}`,
    `ZIP: ${lead.zip || ""}`,
    `County: ${lead.county || ""}`,
    `Budget: ${lead.budget || ""}`,
    `Beds: ${lead.beds || ""}`,
    `Property Type: ${lead.propertyType || ""}`,
    `Amenities: ${lead.amenities || ""}`,
    `HOA: ${lead.hoa || ""}`,
    `Financing: ${lead.financing || ""}`,
    `Timeline: ${lead.timeline || ""}`,
    `Email: ${lead.email || ""}`,
    `Phone: ${lead.phone || ""}`,
    "",
    "Conversation:",
    ...(lead.transcript || [])
  ].join("\n");
  saveBotLead(summary, {
    email: lead.email || "",
    phone: lead.phone || "",
    property: [lead.location, lead.zip].filter(Boolean).join(" "),
    zip: lead.zip || "",
    county: lead.county || "",
    name: lead.name || ""
  });
  state.botLead = {};
}

function saveBotLead(message, details = {}) {
  const leads = JSON.parse(localStorage.getItem("mdhBotLeads") || "[]");
  const lead = {
    ...details,
    message,
    source: "chatbot",
    page: window.location.href,
    createdAt: new Date().toISOString()
  };
  leads.push(lead);
  localStorage.setItem("mdhBotLeads", JSON.stringify(leads));
  submitLead(lead);
}

async function submitLead(lead, statusElement, formElement) {
  const leadWithTime = {
    ...lead,
    createdAt: lead.createdAt || new Date().toISOString()
  };

  const sentByWeb3Forms = await submitLeadWithWeb3Forms(leadWithTime);
  if (sentByWeb3Forms) {
    if (statusElement) {
      statusElement.textContent = "Lead sent. We will contact you soon.";
    }
    if (formElement) formElement.reset();
    return;
  }

  try {
    const response = await fetch(apiUrl("/api/leads"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadWithTime)
    });

    if (!response.ok) throw new Error(`Lead request failed: ${response.status}`);
    const result = await response.json();

    if (statusElement) {
      statusElement.textContent = result.emailAutomationConnected
        ? "Lead sent. We will contact you soon."
        : "Lead saved on the backend. Add the email webhook to receive automatic emails.";
    }

    if (formElement) formElement.reset();
  } catch (error) {
    const sentByFormSubmit = await submitLeadWithFormSubmit(leadWithTime);
    if (sentByFormSubmit) {
      if (statusElement) {
        statusElement.textContent = "Lead submitted through FormSubmit. If a new tab opened, complete the confirmation there, then check Yahoo spam/inbox.";
      }
      if (formElement) formElement.reset();
      return;
    }

    openLeadEmailFallback(leadWithTime);

    const savedLeads = JSON.parse(localStorage.getItem("mdhPendingLeads") || "[]");
    savedLeads.push(leadWithTime);
    localStorage.setItem("mdhPendingLeads", JSON.stringify(savedLeads));

    if (statusElement) {
      statusElement.textContent = window.MLS_CONFIG?.web3FormsAccessKey
        ? "Online sending is unavailable, so an email draft was opened and the lead was saved on this browser."
        : "Add the free Web3Forms access key to activate automatic email. An email draft was opened as backup.";
    }

    console.error(error);
  }
}

async function submitLeadWithWeb3Forms(lead) {
  const accessKey = window.MLS_CONFIG?.web3FormsAccessKey || "";
  if (!accessKey) return false;

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "New MyDreamHouse Lead",
        from_name: "MYDreamHouse Peguero Real State",
        botcheck: "",
        source: lead.source || "website",
        createdAt: lead.createdAt || "",
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        property: lead.property || "",
        zip: lead.zip || "",
        county: lead.county || "",
        message: lead.message || lead.notes || "",
        page: lead.page || window.location.href
      })
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.success !== false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function openLeadEmailFallback(lead) {
  const subject = encodeURIComponent("New MyDreamHouse Lead");
  const body = encodeURIComponent([
    "New MyDreamHouse lead",
    "",
    `Name: ${lead.name || ""}`,
    `Email: ${lead.email || ""}`,
    `Phone: ${lead.phone || ""}`,
    `Property: ${lead.property || ""}`,
    `ZIP: ${lead.zip || ""}`,
    `County: ${lead.county || ""}`,
    `Message: ${lead.message || lead.notes || ""}`,
    `Source: ${lead.source || ""}`,
    `Page: ${lead.page || window.location.href}`,
    `Created: ${lead.createdAt || new Date().toISOString()}`
  ].join("\n"));

  window.location.href = `mailto:misaelpeguero@yahoo.com?subject=${subject}&body=${body}`;
}

async function submitLeadWithFormSubmit(lead) {
  try {
    const targetName = `formsubmitLead${Date.now()}`;
    window.open("", targetName, "width=520,height=680");
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://formsubmit.co/misaelpeguero@yahoo.com";
    form.target = targetName;
    form.hidden = true;

    const payload = {
      _subject: "New MyDreamHouse Lead",
      _template: "table",
      _captcha: "false",
      _next: window.location.href,
      source: lead.source || "website",
      createdAt: lead.createdAt || "",
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      property: lead.property || "",
      zip: lead.zip || "",
      county: lead.county || "",
      message: lead.message || lead.notes || "",
      page: lead.page || window.location.href
    };

    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
    return true;
  } catch (formSubmitError) {
    console.error(formSubmitError);
    return false;
  }
}

function scheduleNewListingPop() {
  window.setTimeout(() => {
    if (sessionStorage.getItem("mdhListingPopClosed") === "true") return;
    showNewListingPop();
  }, 1800);
}

function showNewListingPop() {
  const listings = [...state.listings].sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt));
  const listing = listings[0];
  if (!listing) return;

  state.featuredListing = listing;
  elements.newListingImage.src = listing.image;
  elements.newListingImage.alt = listing.title;
  elements.newListingPrice.textContent = currency.format(listing.price);
  elements.newListingTitle.textContent = listing.title;
  elements.newListingAddress.textContent = listing.address;
  elements.newListingPop.classList.remove("hidden");
}

function hideNewListingPop() {
  sessionStorage.setItem("mdhListingPopClosed", "true");
  elements.newListingPop.classList.add("hidden");
}

function bindLogin() {
  if (sessionStorage.getItem("mdhLoggedIn") === "true") {
    elements.loginGate.classList.add("hidden");
  }

  startBeachSound();
  elements.loginGate.addEventListener("pointerdown", startBeachSound, { once: true });
  elements.loginGate.addEventListener("keydown", startBeachSound, { once: true });

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = elements.loginUser.value.trim();
    const password = elements.loginPassword.value;

    if (username === loginCredentials.username && password === loginCredentials.password) {
      sessionStorage.setItem("mdhLoggedIn", "true");
      elements.loginGate.classList.add("hidden");
      elements.loginForm.reset();
      return;
    }

    elements.loginStatus.textContent = "Incorrect username or password.";
  });
}

function startBeachSound() {
  if (elements.loginGate.classList.contains("hidden")) return;
  if (beachAudio) {
    beachAudio.resume();
    return;
  }

  try {
    beachAudio = createBeachSound();
    beachAudio.start();
  } catch (error) {
    beachAudio = null;
    console.info("Beach sound will start after browser allows audio.", error);
  }
}

function createBeachSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const master = context.createGain();
  const noiseGain = context.createGain();
  const waveGain = context.createGain();
  const filter = context.createBiquadFilter();
  const waveOscillator = context.createOscillator();
  const waveShape = context.createGain();

  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  filter.type = "lowpass";
  filter.frequency.value = 850;
  filter.Q.value = 0.8;
  noiseGain.gain.value = 0.08;
  waveGain.gain.value = 0.035;
  master.gain.value = 0.28;

  waveOscillator.type = "sine";
  waveOscillator.frequency.value = 0.13;
  waveShape.gain.value = 0.05;

  waveOscillator.connect(waveShape);
  waveShape.connect(noiseGain.gain);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  master.connect(context.destination);

  return {
    start() {
      noise.start();
      waveOscillator.start();
      context.resume();
    },
    resume() {
      context.resume();
    },
    stop() {
      noise.stop();
      waveOscillator.stop();
      context.close();
    }
  };
}

function updateCityOptions() {
  if (!elements.countyInput || !elements.queryInput) return;
  const selectedCounty = elements.countyInput?.value || "";
  const selectedCity = elements.queryInput?.value || "";
  const cities = selectedCounty
    ? citiesByCounty[selectedCounty] || []
    : Object.values(citiesByCounty).flat();

  elements.queryInput.innerHTML = '<option value="">Any City</option>';
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    elements.queryInput.appendChild(option);
  });

  if (cities.includes(selectedCity)) {
    elements.queryInput.value = selectedCity;
  }
}

function updateIdxFrame() {
  const url = new URL(matrixIdxUrl);
  const filters = {
    location: elements.queryInput?.value || "",
    county: elements.countyInput?.value || "",
    minprice: elements.minPrice?.value || "",
    maxprice: elements.maxPrice?.value || "",
    beds: elements.bedsInput?.value || "",
    propertytype: elements.typeInput?.value || "",
    maxhoa: elements.hoaInput?.value || "",
    amenity: elements.amenityInput?.value || "",
    nohoa: elements.hoaInput?.value === "0" ? "true" : ""
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  url.searchParams.set("refresh", Date.now().toString());
  elements.idxFrame.src = url.toString();
}

function startMlsAutoRefresh() {
  window.setInterval(() => {
    if (state.activeView === "idx") {
      reloadIdxFrame();
    }
    loadListings().then((listings) => {
      state.listings = listings;
      applyFilters();
    });
  }, mlsRefreshInterval);
}

function reloadIdxFrame() {
  const url = new URL(elements.idxFrame.src || matrixIdxUrl, window.location.href);
  url.searchParams.set("refresh", Date.now().toString());
  elements.idxFrame.src = url.toString();
}

async function loadListings() {
  if (!window.MLS_CONFIG?.enabled || !window.MLS_CONFIG.endpoint) {
    elements.feedStatus.textContent = "Sample listings";
    elements.feedMessage.textContent = "MLS is not connected yet. These properties are demo data.";
    return window.SAMPLE_LISTINGS;
  }

  try {
    const response = await fetch(buildListingsUrl(), {
      headers: window.MLS_CONFIG.apiKey ? { Authorization: `Bearer ${window.MLS_CONFIG.apiKey}` } : {}
    });
    if (!response.ok) throw new Error(`MLS request failed: ${response.status}`);
    const payload = await response.json();
    elements.feedStatus.textContent = `${window.MLS_CONFIG.provider} connected`;
    elements.feedMessage.textContent = "Listings loaded from your MLS feed.";
    return normalizeMlsListings(payload);
  } catch (error) {
    elements.feedStatus.textContent = "MLS unavailable";
    elements.feedMessage.textContent = "Showing sample listings until the feed connection is fixed.";
    console.error(error);
    return window.SAMPLE_LISTINGS;
  }
}

function apiUrl(path) {
  const baseUrl = window.MLS_CONFIG?.apiBaseUrl || "";
  return baseUrl ? new URL(path, baseUrl).toString() : path;
}

function buildListingsUrl() {
  const url = new URL(window.MLS_CONFIG.endpoint, window.MLS_CONFIG?.apiBaseUrl || window.location.href);
  const query = elements.queryInput?.value.trim() || "";
  if (query) url.searchParams.set("city", query);
  return url;
}

function normalizeMlsListings(payload) {
  const rows = Array.isArray(payload) ? payload : payload.value || payload.listings || [];
  return rows.map((item, index) => ({
    id: item.ListingKey || item.id || `MLS-${index}`,
    mls: item.ListingId || item.mls || "",
    title: item.PublicRemarks?.slice(0, 42) || item.title || "MLS Listing",
    address: item.UnparsedAddress || item.address || "Address available by request",
    city: item.City || item.city || "",
    county: item.CountyOrParish || item.county || "",
    type: item.PropertySubType || item.type || "Single Family",
    amenities: item.AssociationAmenities || item.CommunityFeatures || item.amenities || [],
    status: item.StandardStatus || item.status || "Active",
    price: Number(item.ListPrice || item.price || 0),
    beds: Number(item.BedroomsTotal || item.beds || 0),
    baths: Number(item.BathroomsTotalInteger || item.baths || 0),
    sqft: Number(item.LivingArea || item.sqft || 0),
    hoa: Number(item.AssociationFee || item.AssociationFee2 || item.hoa || 0),
    year: Number(item.YearBuilt || item.year || 0),
    listedAt: item.OnMarketDate || item.listedAt || "",
    image: item.Media?.[0]?.MediaURL || item.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=80"
  }));
}

function applyFilters() {
  const query = (elements.queryInput?.value || "").trim().toLowerCase();
  const county = elements.countyInput?.value || "";
  const min = Number(elements.minPrice?.value || 0);
  const max = Number(elements.maxPrice?.value || 999999999);
  const beds = Number(elements.bedsInput?.value || 0);
  const type = elements.typeInput?.value || "";
  const hoa = Number(elements.hoaInput?.value || 999999);
  const amenity = elements.amenityInput?.value || "";

  state.filtered = state.listings.filter((listing) => {
    const city = String(listing.city || "").toLowerCase();
    const matchesType = !type ||
      type === listing.type ||
      (type === "Residential" && ["Single Family", "Townhouse"].includes(listing.type));

    return (!query || city === query) &&
      (!county || listing.county === county) &&
      listing.price >= min &&
      listing.price <= max &&
      listing.beds >= beds &&
      (hoa === 0 ? listing.hoa === 0 : listing.hoa <= hoa) &&
      (!amenity || listing.amenities.includes(amenity)) &&
      matchesType;
  });

  sortListings();
  render();
}

function sortListings() {
  const sort = elements.sortInput.value;
  state.filtered.sort((a, b) => {
    if (sort === "priceAsc") return a.price - b.price;
    if (sort === "priceDesc") return b.price - a.price;
    if (sort === "beds") return b.beds - a.beds;
    return new Date(b.listedAt) - new Date(a.listedAt);
  });
}

function render() {
  renderListings(elements.listingGrid, state.filtered);
  renderListings(elements.favoritesGrid, state.listings.filter((listing) => state.favorites.has(listing.id)), true);
  elements.favoriteCount.textContent = state.favorites.size;
  elements.resultCount.textContent = state.filtered.length;
  elements.medianPrice.textContent = calculateMedian(state.filtered);
}

function renderListings(container, listings, favoritesOnly = false) {
  container.innerHTML = "";
  if (!listings.length) {
    container.innerHTML = `<div class="empty-state">${favoritesOnly ? "No favorites saved yet." : "No homes match this search."}</div>`;
    return;
  }

  listings.forEach((listing) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    card.querySelector("img").src = listing.image;
    card.querySelector("img").alt = listing.title;
    card.querySelector(".price").textContent = currency.format(listing.price);
    card.querySelector(".status").textContent = listing.status;
    card.querySelector("h3").textContent = listing.title;
    card.querySelector(".address").textContent = listing.address;
    card.querySelector(".facts").innerHTML = `
      <span>${listing.beds} beds</span>
      <span>${listing.baths} baths</span>
      <span>${listing.sqft.toLocaleString()} sqft</span>
      <span>HOA ${listing.hoa ? currency.format(listing.hoa) + "/mo" : "N/A"}</span>
      <span>${listing.county || "County N/A"}</span>
      <span>${listing.amenities?.[0] || "Amenities"}</span>
      <span>${listing.type}</span>
      <span>MLS ${listing.mls}</span>
    `;

    const favoriteButton = card.querySelector(".favorite-button");
    favoriteButton.classList.toggle("saved", state.favorites.has(listing.id));
    favoriteButton.textContent = state.favorites.has(listing.id) ? "Saved" : "Save";
    favoriteButton.addEventListener("click", () => toggleFavorite(listing.id));

    card.querySelector(".details-button").addEventListener("click", () => {
      alert(`${listing.title}\n${listing.address}\n${currency.format(listing.price)}\nMLS ${listing.mls}`);
    });

    card.querySelector(".tour-button").addEventListener("click", () => {
      switchView("contact");
      document.querySelector("[name='property']").value = `${listing.address} - MLS ${listing.mls}`;
    });

    container.appendChild(card);
  });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem("mdhFavorites", JSON.stringify([...state.favorites]));
  render();
}

function switchView(view) {
  state.activeView = view;
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelector("#idxView").classList.toggle("hidden", view !== "idx");
  document.querySelector("#featuredView").classList.toggle("hidden", view !== "featured");
  document.querySelector("#favoritesView").classList.toggle("hidden", view !== "favorites");
  document.querySelector("#alertView").classList.toggle("hidden", view !== "alerts");
  document.querySelector("#contactView").classList.toggle("hidden", view !== "contact");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function calculateMedian(listings) {
  if (!listings.length) return "$0";
  const prices = listings.map((listing) => listing.price).sort((a, b) => a - b);
  const middle = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[middle] : (prices[middle - 1] + prices[middle]) / 2;
  return currency.format(median);
}
