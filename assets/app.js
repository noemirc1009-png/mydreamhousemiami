const state = {
  listings: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem("mdhFavorites") || "[]")),
  activeView: "idx"
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

  addBotMessage("Hi, I am the MyDreamHouse assistant. I can help with showings, saved searches, favorites, and Miami-area home questions.");
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

  window.setTimeout(() => {
    const reply = getBotReply(prompt);
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
  const text = prompt.toLowerCase();

  if (text.includes("showing") || text.includes("tour") || text.includes("appointment") || text.includes("visit")) {
    return {
      message: "Perfect. I opened the contact form so you can request a showing. Add the address or MLS number and your preferred time.",
      action: () => switchView("contact")
    };
  }

  if (text.includes("alert") || text.includes("email") || text.includes("saved search") || text.includes("automatic")) {
    return {
      message: "I opened Search Alerts. Your client can enter city, price, beds, HOA preference, and frequency for automated listing emails.",
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
      message: "For HOA, use Search Alerts to request a maximum HOA or No HOA. The live MLS Matrix window also has the official MLS criteria filters."
    };
  }

  if (text.includes("price") || text.includes("budget") || text.includes("pre approval") || text.includes("preapproval")) {
    return {
      message: "I can help narrow a search by budget. For a serious purchase, get pre-approved first, then use Search Alerts with your price range and preferred city."
    };
  }

  if (looksLikeLead(prompt)) {
    saveBotLead(prompt);
    return {
      message: "Thank you. I saved your message as a lead on this browser. For faster service, open Contact and send your name, email, and property details.",
      action: () => switchView("contact")
    };
  }

  return {
    message: "I can help with: schedule a showing, create a search alert, search MLS homes, explain HOA options, or open favorites. What would you like to do?"
  };
}

function looksLikeLead(text) {
  return /\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text) || /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text);
}

function saveBotLead(message) {
  const leads = JSON.parse(localStorage.getItem("mdhBotLeads") || "[]");
  const lead = {
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
        statusElement.textContent = "Lead sent. Please check your email and confirm FormSubmit if this is the first message.";
      }
      if (formElement) formElement.reset();
      return;
    }

    const savedLeads = JSON.parse(localStorage.getItem("mdhPendingLeads") || "[]");
    savedLeads.push(leadWithTime);
    localStorage.setItem("mdhPendingLeads", JSON.stringify(savedLeads));

    if (statusElement) {
      statusElement.textContent = "Lead saved on this browser. Backend email sending is not connected yet.";
    }

    console.error(error);
  }
}

async function submitLeadWithFormSubmit(lead) {
  try {
    const response = await fetch("https://formsubmit.co/ajax/misaelpeguero@yahoo.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        _subject: "New MyDreamHouse Lead",
        _template: "table",
        _captcha: "false",
        source: lead.source || "website",
        createdAt: lead.createdAt || "",
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        property: lead.property || "",
        message: lead.message || lead.notes || "",
        page: lead.page || window.location.href
      })
    });

    return response.ok;
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
