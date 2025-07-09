


// Current deck height calc



// Supabase Client

const supabaseUrl = 'https://duzgjnjivzbcyhecltui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emdqbmppdnpiY3loZWNsdHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODgyNzgsImV4cCI6MjA2NzM2NDI3OH0.vwkSSBiufzea9PQ_sN2r0ET4xWQqmE8F54VTnBgpTsc';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function handleRegister() {
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-password-confirm").value;
  const username = document.getElementById("reg-username").value.trim();
  const acceptedPrivacy = document.getElementById("checkbox-privacy").checked;
  const marketingConsent = document.getElementById("checkbox-marketing").checked;
  console.log("Marketing consent: ", marketingConsent);
  console.log("Marketing Checkbox erkannt:", marketingConsent);

  // Prüfung: Pflichtfelder + Privacy
  if (!email || !password || !confirm || !username || !acceptedPrivacy) {
    alert("Bitte alle Felder ausfüllen & Datenschutz akzeptieren.");
    return;
  }

  if (password !== confirm) {
    alert("Passwörter stimmen nicht überein.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    alert("Fehler: " + error.message);
    return;
  }

  const userId = data?.user?.id;

  if (userId) {
    // Prüfe, ob E-Mail schon in profiles existiert
    const { data: existingProfiles, error: selectError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', email);

    if (existingProfiles && existingProfiles.length > 0) {
      alert("Diese E-Mail-Adresse ist bereits registriert.");
      return;
    }

    // Username und E-Mail in profiles speichern
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([{ id: userId, username: username, email: email }]);

    if (profileError) {
      console.error("Fehler beim Speichern des Profils:", profileError.message);
    }

  
// Nur wenn Marketing-Checkbox gesetzt → in marketing_consent speichern
if (marketingConsent) {
  const { error: marketingError } = await supabaseClient
    .from('marketing_consent')
    .insert([{ id: userId, email: email, username: username }]);

  if (marketingError) {
    console.error("❌ Fehler beim Speichern der Marketing-Zustimmung:", marketingError.message);
  } else {
    console.log("✅ Marketing consent erfolgreich gespeichert:", email, username);
  }
}

    alert("Registration complete! Please confirm your E-Mail.");
    showLogin();
  } else {
    alert("Registration failed.");
  }
}

// Login
async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login failed: " + error.message);
  } else {
    // Hole Profil-Daten
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("Fehler beim Laden des Profils:", profileError.message);
    } else {
      console.log("Profil geladen:", profileData);

      // Username im DeckBuilder anzeigen (optional)
      const usernameDisplay = document.getElementById("user-username-display");
      if (usernameDisplay && profileData.username) {
        usernameDisplay.textContent = "Username: " + profileData.username;
      }

      // 🟢 Speichern für Account.html:
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: profileData?.username || '',
        privacy: profileData?.privacy || false
      };
      localStorage.setItem('userData', JSON.stringify(userData));
    }

    document.getElementById("login-overlay").style.display = "none";
    showArchetypeOverlay();
  }
}


// Session prüfen beim Laden (Supabase)
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    document.getElementById("login-overlay").style.display = "none";
    showArchetypeOverlay();
  } else {
    document.getElementById("login-overlay").style.display = "flex";
  }
});

// Fenster wechseln
function showRegister() {
  document.getElementById("login-overlay").classList.add("hidden");
  document.getElementById("register-overlay").classList.remove("hidden");
}

function showLogin() {
  document.getElementById("register-overlay").classList.add("hidden");
  document.getElementById("login-overlay").classList.remove("hidden");
}



// Account Bereich anzeigen
async function showAccount() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    console.error("Kein Benutzer gefunden:", error?.message);
    return;
  }

  document.getElementById("user-email-display").innerText = "E-Mail: " + user.email;
  document.getElementById("account-page").classList.remove("hidden");

  const { data: profileData, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Fehler beim Laden des Profils:", profileError.message);
    return;
  }

  // Username anzeigen
  const usernameField = document.getElementById("user-username-display");
  if (usernameField && profileData.username) {
    usernameField.textContent = "Username: " + profileData.username;
  }

  // Optional: Privacy Einstellungen anzeigen (wenn gespeichert)
  const privacyField = document.getElementById("user-privacy-display");
  if (privacyField) {
    const consent = profileData.marketing_consent ? "Yes" : "No";
    privacyField.textContent = "Marketing Consent: " + consent;
  }
}

// Logout
async function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userData");
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}











// ==== Scroll-Effekte für Filterbar und Banner ====

window.addEventListener("scroll", () => {
  const filterBar = document.getElementById("filter-bar");
  const filterPanel = document.getElementById("mobile-filter-panel");
  const banner = document.querySelector(".banner");

  const stickyTriggerPoint = 200;  // Punkt, ab dem Sticky startet

  // Sticky Filter Bar
  if (window.scrollY >= stickyTriggerPoint) {
    filterBar.classList.add("sticky");
  } else {
    filterBar.classList.remove("sticky");
  }


  // Banner Opacity + Parallax Effekt
  const maxScroll = 200;
  if (banner) {
    if (window.scrollY < maxScroll) {
      const opacity = 1 - window.scrollY / maxScroll;
      const translateY = -window.scrollY;
      banner.style.opacity = opacity;
      banner.style.transform = `translateY(${translateY}px)`;
    } else {
      banner.style.opacity = 0;
      banner.style.transform = `translateY(-100px)`;
    }
  }
});


// Dropdown

window.addEventListener("scroll", () => {
  const mobileFilterWrapper = document.getElementById("mobile-filter-sticky-wrapper");
  const stickyTriggerPoint = 200;

  if (!mobileFilterWrapper) return;

  if (window.scrollY >= stickyTriggerPoint) {
    mobileFilterWrapper.classList.add("sticky");
  } else {
    mobileFilterWrapper.classList.remove("sticky");
  }
});


// Filter Mobile (Dropdown)

document.getElementById('toggle-filter-panel').addEventListener('click', () => {
  const panel = document.getElementById('mobile-filter-panel');
  panel.classList.toggle('show');
});

//Hamburger Menü 

const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
const profileIcons = document.querySelector('.profile');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('show');
  profileIcons.classList.toggle('show');
});







//  Deck ein-/ausklappen (Mobile Slide-Out) 


const mobileDeckBtn = document.getElementById('mobile-deck-button');
const mobileSlideout = document.getElementById('mobile-current-deck');
const closeSlideout = document.getElementById('close-slideout');

mobileDeckBtn.addEventListener('click', () => {
  mobileSlideout.classList.toggle('open');
});

closeSlideout.addEventListener('click', () => {
  mobileSlideout.classList.remove('open');
});



// Archetype Overlay - Klick statt Hover (Mobile)

// Deck-Start nur bei Klick auf die "archetype-main" (Icon + Text)
document.querySelectorAll('.archetype-option').forEach(option => {
  const main = option.querySelector('.archetype-main');
  const archetype = option.dataset.archetype;

  if (main) {
    main.addEventListener('click', () => {
      currentArchetype = archetype;
      startDeckBuilder(archetype);
    });
  }
});

// Info-Dropdown toggeln – ohne Deck zu starten
function toggleInfo(event, button) {
  event.stopPropagation();

  const option = button.closest('.archetype-option');
  const allOptions = document.querySelectorAll('.archetype-option');

  allOptions.forEach(opt => {
    if (opt !== option) {
      opt.classList.remove('active');
    }
  });

  option.classList.toggle('active');
}

// Beispiel-Funktion: Deck laden und Overlay schließen
function startDeckBuilder(selected) {
  const filtered = cards.filter(card => card.Archetype === selected);
  renderCards(filtered);

  // Overlay schließen
  const overlay = document.getElementById('archetype-overlay');
  if (overlay) overlay.style.display = 'none';

  // Deck UI anpassen
  document.getElementById("current-deck").className = selected;
  document.getElementById("mobile-current-deck").className = selected;
}






// CARDS.JSON Verknüpfung
// =======================
// Karten-Rendering
// =======================

function renderCard(card) {
  const grid = document.getElementById("card-grid");

  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.id = card.ID;

  // Daten für spätere Filter und Ausgrau-Prüfung
  cardEl.dataset.archetype = card.Archetype;

  // Prüfen, ob Karte im Deck
  const isInDeck = currentDeck.some(c => c.ID === card.ID);
  if (isInDeck) cardEl.classList.add("disabled");

  cardEl.innerHTML = `
    <img src="${card.Image}" alt="${card.Name}" />
    <div class="card-info">
      <h3>${card.Name}</h3>
      <p><strong>Mana:</strong> ${card.Mana}</p>
      <p><strong>Type:</strong> ${card.Type}</p>
      <p><strong>Effect:</strong> ${card.Effect}</p>
    </div>
  `;

  // Nur anklickbar, wenn nicht im Deck
  if (!isInDeck) {
    cardEl.addEventListener("click", () => {
      addToDeck(card);

      // Karte im Grid nachträglich ausgrauen, ohne alles neu zu rendern
      cardEl.classList.add("disabled");
    });
  }

  grid.appendChild(cardEl);
}

function renderCards(cardArray) {
  const grid = document.getElementById("card-grid");
  grid.innerHTML = "";
  cardArray.forEach(renderCard);
}



// =======================
// Archetypen-Ordnerlogik
// =======================

function getFolderNumber(archetype) {
  const map = {
    "Unbound": "1",
    "War": "2",
    "Sorcery": "3",
    "Outlaw": "4",
    "Nature": "5",
    "Precision": "6",
    "Faith": "7",
    "Occult": "8",
    "Diverse": "9",
    "Print": "10"
  };
  return map[archetype] || "0";
}


// =======================
// Globale Kartenvariable
// =======================

let openedDeckId = null;
let cards = [];
let currentDeck = [];
let selectedArchetype = null;
let currentArchetype = null;


function addToDeck(card) {
  const alreadyInDeck = currentDeck.some(c => c.ID === card.ID);
  if (alreadyInDeck) {
    alert("Card already in deck.");
    return;
  }

  const archetypeCards = currentDeck.filter(c => c.Archetype !== "Unbound");
  const unboundCards = currentDeck.filter(c => c.Archetype === "Unbound");

  // Keine Unbound-Karten erlauben, wenn weniger als 20 Archetypen-Karten im Deck sind
  if (card.Archetype === "Unbound") {
    const archetypeCount = currentDeck.filter(c => c.Archetype !== "Unbound").length;
    if (archetypeCount < 25) {
      showAnnouncement("You need at least 25 Archetype cards before adding Unbound cards.");
      return;
    }
  }

  if (archetypeCards.length === 24 && card.Archetype !== "Unbound") {
    showAnnouncement("You now have 25 archetype cards. Unbound cards are unlocked.");
  }

  if (unboundCards.length >= 25) {
    alert("Not more than 25 unbound cards allowed.");
    return;
  }

  if (currentDeck.length >= 50) {
    alert("You reached the limit of 50 cards.");
    return;
  }

  // Ins Deck
  currentDeck.push(card);

  updateDeckDisplay();
  updateUnboundButtonState();

  // Ausgrauen
  const addedCardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
  if (addedCardEl) {
    addedCardEl.classList.add("disabled");
    addedCardEl.style.pointerEvents = "none";
  }
}


// Announcement 20 Archetype Cards

function showAnnouncement(message) {
  let announcement = document.getElementById("announcement");

  if (!announcement) {
    announcement = document.createElement("div");
    announcement.id = "announcement";
    announcement.className = "announcement";
    document.body.appendChild(announcement);
  }

  announcement.textContent = message;
  announcement.classList.add("show");

  setTimeout(() => {
    announcement.classList.remove("show");
  }, 4500); // 4,5sec
}



// Current Deck Funktionen
function isMobile() {
  return window.innerWidth <= 768;  // Grenze für Mobile
} 

function updateDeckDisplay() {
  const desktopDeck = document.getElementById("deck-content");
  const mobileDeck = document.getElementById("mobile-deck-content");

  desktopDeck.innerHTML = "";
  mobileDeck.innerHTML = "";

  const overlap = 0.75;
  const cardHeight = 200;
  const offset = cardHeight * (1 - overlap);

  const desktopImgs = [];

  currentDeck.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = card.Image;
    img.alt = card.Name;
    img.className = "deck-card";
    img.style.position = "absolute";
    img.style.top = `${index * offset}px`;

    // Speichern für späteres Hover
    desktopImgs.push({ img, card, imgMobile: undefined }); // Will set imgMobile below

    const imgMobile = img.cloneNode(true);
    imgMobile.classList.add("mobile-deck-card");
    imgMobile.dataset.index = index;
    // Save imgMobile reference in desktopImgs as well if needed
    desktopImgs[desktopImgs.length - 1].imgMobile = imgMobile;

    // Doppelklick Desktop
    img.addEventListener("dblclick", () => {
      currentDeck = currentDeck.filter(c => c.ID !== card.ID);
      updateDeckDisplay();
      const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
      if (cardEl) {
        cardEl.classList.remove("disabled");
        cardEl.style.pointerEvents = "auto";
      }
    });

    // Doppelklick Mobile
    imgMobile.addEventListener("dblclick", () => {
      currentDeck = currentDeck.filter(c => c.ID !== card.ID);
      updateDeckDisplay();
      const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
      if (cardEl) {
        cardEl.classList.remove("disabled");
        cardEl.style.pointerEvents = "auto";
      }
    });

    desktopDeck.appendChild(img);
    mobileDeck.appendChild(imgMobile);



    // Klick-Event für Mobile Hover
 if (isMobile()) {
  imgMobile.addEventListener("click", ((currentCard) => (e) => {
    e.stopPropagation();
    const hoverPopup = document.getElementById("deck-hover-popup");
    const hoverImg = document.getElementById("hover-popup-img");
    if (!hoverPopup || !hoverImg) return;

    const isVisible = hoverPopup.classList.contains("visible");

    if (!isVisible) {
      hoverImg.src = currentCard.Image;
      hoverImg.alt = currentCard.Name;
      hoverPopup.classList.add("visible");

      const closeOnClick = (event) => {
        if (!hoverPopup.contains(event.target) && !mobileDeck.contains(event.target)) {
          hoverPopup.classList.remove("visible");
          document.removeEventListener("click", closeOnClick);
        }
      };

      document.addEventListener("click", closeOnClick);
    } else {
      hoverPopup.classList.remove("visible");
    }
  })(card));
    }
  });

  // Deck-Counter aktualisieren
  document.querySelectorAll('#deck-counter').forEach(counter => {
    counter.textContent = `${currentDeck.length} / 50`;
  });
  //Hover Popup Current Deck
  const hoverPopup = document.getElementById("deck-hover-popup");
  const hoverImg = document.getElementById("hover-popup-img");

  if (hoverPopup && hoverImg) {
    desktopImgs.forEach(({ img, card }) => {
      img.addEventListener("mouseenter", (e) => {
        hoverImg.src = card.Image;
        hoverImg.alt = card.Name;

        const popupWidth = 260;
        hoverPopup.style.left = `${e.clientX - popupWidth}px`;
        hoverPopup.style.top = `${e.clientY - 150}px`;

        hoverPopup.classList.add("visible");
      });

      let hoverX = 0;
      let hoverY = 0;
      let rafPending = false;

      img.addEventListener("mousemove", (e) => {
        hoverX = e.clientY;
        hoverY = e.clientX;

        if (!rafPending) {
          requestAnimationFrame(() => {
            hoverPopup.style.top = `${hoverX - 150}px`;
            hoverPopup.style.left = `${hoverY - 260}px`;
            rafPending = false;
          });
          rafPending = true;
        }
      });

      img.addEventListener("mouseleave", () => {
        hoverPopup.classList.remove("visible");
      });

      // Doppelklick-Eventlistener
      img.addEventListener("dblclick", () => {
        if (currentDeck.length === 0) {
          hoverPopup.classList.remove("visible");
        }
      });
    });
  }


  // Entferne Ausgrauung im Grid, wenn Deck leer ist
  if (currentDeck.length === 0) {
    document.querySelectorAll('.card.disabled').forEach(cardEl => {
      cardEl.classList.remove("disabled");
      cardEl.style.pointerEvents = "auto";
    });
  }
}


// Ausgrauen zurücksetzen, wenn Karte entfernt

function removeFromDeck(card) {
  currentDeck = currentDeck.filter(c => c.ID !== card.ID);
  updateDeckDisplay();

  const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
  if (cardEl) {
    cardEl.classList.remove("disabled");
    cardEl.style.pointerEvents = "auto";
  }

  // Zusätzliche Prüfung nach Entfernen: Unbound-Button sperren/Deck-Validierung
  const archetypeCount = currentDeck.filter(c => c.Archetype !== "Unbound").length;
  const unboundCount = currentDeck.filter(c => c.Archetype === "Unbound").length;

  if (archetypeCount < 20) {
    unboundButton.disabled = true;
    unboundButton.classList.add('disabled');

    // Falls Unbound-Filter aktiv war → zurück zum Archetypen-Filter
    if (unboundButton.classList.contains("active")) {
      unboundButton.classList.remove("active");

      if (currentArchetype) {
        const filtered = cards.filter(card => card.Archetype === currentArchetype);
        renderCards(filtered);
      } else {
        renderCards(cards);
      }
    }
  }
  updateUnboundButtonState();
}


// =======================
// Karten laden
// =======================

fetch('assets/cards.json')
  .then(res => res.json())
  .then(data => {
    cards = data;

    cards.forEach(card => {
      const fileName = card.Image?.split("/").pop() || "placeholder.png";
      const folder = `0${getFolderNumber(card.Archetype)}_${card.Archetype}`;
      card.Image = `assets/cards/${folder}/${fileName}`;
    });

    renderCards(cards); // Alle anzeigen beim Laden
  })
  .catch(err => console.error("Fehler beim Laden der Karten:", err));



// Archetype Overlay

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.archetype-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.archetype;
      currentArchetype = selected;

      const img = btn.querySelector('img');
      const imgSrc = img.src;

      const overlay = document.getElementById('archetype-overlay');
      const filterButton = document.getElementById('archetype-button');
      const filterIcon = document.getElementById('archetype-icon');

      //  Filterbar-Icon aktualisieren
      if (filterIcon) {
        filterIcon.src = imgSrc;
        filterIcon.alt = selected;
      }

      //  Rechtes Icon im Deck aktualisieren (Desktop)
      const deckCounterIcon = document.getElementById("deck-archetype-icon");
      if (deckCounterIcon) {
        deckCounterIcon.src = imgSrc;
        deckCounterIcon.alt = selected;
      }

      //  Rechtes Icon im Deck aktualisieren (Mobile)
      const mobileIcon = document.getElementById("deck-icon");
      if (mobileIcon) {
        mobileIcon.src = imgSrc;
        mobileIcon.alt = selected;
      }

      // Filter-Button aktiv setzen
      if (filterButton) {
        filterButton.dataset.class = selected;
        filterButton.classList.add('active');
      }

      // Deck-Rahmen-Klasse setzen (statt Hintergrund)
      const deck = document.getElementById("current-deck");
      const mobileDeck = document.getElementById("mobile-current-deck");
      deck.className = "deck-border " + selected;
      mobileDeck.className = "deck-border " + selected;

      // Overlay schließen
      if (overlay) overlay.style.display = 'none';

      // Lade-Overlay starten
      const loadingOverlay = document.getElementById("loading-overlay");
      const loadingFill = document.getElementById("loading-fill");

      loadingOverlay.style.display = "block";
      loadingFill.style.width = "0%";
      loadingOverlay.style.opacity = 1;

      setTimeout(() => {
        loadingFill.style.width = "100%";
      }, 100);

      setTimeout(() => {
        loadingOverlay.style.opacity = 0;
        setTimeout(() => {
          loadingOverlay.style.display = "none";
        }, 1000);

        // Nach dem Ladevorgang Karten filtern und anzeigen
        const filtered = cards.filter(card => card.Archetype === selected);
        renderCards(filtered);
      }, 3000);
    });
  });
});


// =======================
// Button Filterbar - Archetype und Unbound
// =======================

const archetypeButton = document.getElementById('archetype-button');
const unboundButton = document.querySelector('button[data-class="Unbound"]');

if (unboundButton) {
  unboundButton.disabled = true;
  unboundButton.classList.add('disabled');
}

archetypeButton.addEventListener('click', () => {
  const selected = archetypeButton.dataset.class;
  if (!selected) return;

  currentArchetype = selected;  // 🟢 FIX: Immer sicherstellen, dass es gesetzt ist
  unboundButton.classList.remove('active');

  const filtered = cards.filter(card => card.Archetype === selected);
  renderCards(filtered);
});

unboundButton.addEventListener('click', () => {
  currentArchetype = null;  // 🟢 FIX: Archetype zurücksetzen
  unboundButton.classList.add('active');

  const filtered = cards.filter(card => card.Archetype === "Unbound");
  renderCards(filtered);
});

function filterCardsByClass(selected) {
  const filtered = cards.filter(card => card.Archetype === selected);
  renderCards(filtered);
}



// ==========================
// Dropdown-Filter-Logik
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  // Filterfunktion für alle Dropdowns
  function applyAllFilters() {
    const typeValue = document.getElementById('filter-type').value;
    const subtypeValue = document.getElementById('filter-subtype').value;
    const raceValue = document.getElementById('filter-race').value;
    const classValue = document.getElementById('filter-class').value;
    const atkValue = document.getElementById('filter-atk').value;
    const healthValue = document.getElementById('filter-health').value;
    const effectValue = document.getElementById('filter-effect').value.toLowerCase();
    const rarityValue = document.getElementById('filter-rarity').value;

    const archetypeCards = cards.filter(card => card.Archetype === currentArchetype);
    const unboundCards = cards.filter(card => card.Archetype === "Unbound");

    const archetypeCount = currentDeck.filter(c => c.Archetype !== "Unbound").length;
    const unboundUnlocked = archetypeCount >= 20;

    let relevantCards = [];

    if (unboundButton.classList.contains("active") && unboundUnlocked) {
      relevantCards = unboundCards;
    } else if (currentArchetype) {
      relevantCards = archetypeCards;
    } else {
      relevantCards = cards;
    }

const filtered = relevantCards.filter(card => {
  const typeMatch = !typeValue || card.Type === typeValue;
  const subtypeMatch = !subtypeValue || card.Subtype === subtypeValue;
  const raceMatch = !raceValue || card.Race === raceValue;
  const classMatch = !classValue || card.Class === classValue;

  const atkValueNum = parseInt(atkValue);
  const cardAtkNum = parseInt(card.ATK);
  const atkMatch = !atkValue || (!isNaN(cardAtkNum) && (atkValue === "4+" ? cardAtkNum >= 10 : cardAtkNum === atkValueNum));

  const healthValueNum = parseInt(healthValue);
  const cardHealthNum = parseInt(card.Health);
  const healthMatch = !healthValue || (!isNaN(cardHealthNum) && (healthValue === "4+" ? cardHealthNum >= 10 : cardHealthNum === healthValueNum));

  const effectMatch = !effectValue || (card.Effect && card.Effect.toLowerCase().includes(effectValue));
  const rarityMatch = !rarityValue || card.Rarity === rarityValue;

  return typeMatch && subtypeMatch && raceMatch && classMatch && atkMatch && healthMatch && effectMatch && rarityMatch;
});

    renderCards(filtered);
  }

  // Event Listener für alle Dropdowns und das Effektfeld
  document.querySelectorAll('#filter-type, #filter-subtype, #filter-race, #filter-class, #filter-atk, #filter-health, #filter-effect, #filter-rarity').forEach(select => {
    select.addEventListener('change', applyAllFilters);
    // Für Textfelder wie Effekt ggf. auch input-Event:
    if (select.tagName === "INPUT" || select.id === "filter-effect") {
      select.addEventListener('input', applyAllFilters);
    }
  });
});

// Prüfen ob 20 Karten 

function checkUnboundLock() {
  const archetypeCount = currentDeck.filter(c => c.Archetype !== "Unbound").length;

  if (archetypeCount < 20) {
    unboundButton.disabled = true;
    unboundButton.classList.add('disabled');

    // Falls Unbound-Filter aktiv war → zurück zum Archetypen-Filter
    if (unboundButton.classList.contains("active")) {
      unboundButton.classList.remove("active");

      if (currentArchetype) {
        const filtered = cards.filter(card => card.Archetype === currentArchetype);
        renderCards(filtered);
      } else {
        renderCards(cards);
      }
    }
  }
}

// Ab 20 Archetype Karten = Unbound unlocked

function updateUnboundButtonState() {
  const archetypeCount = currentDeck.filter(c => c.Archetype !== "Unbound").length;
  if (archetypeCount >= 25) {
    unboundButton.disabled = false;
    unboundButton.classList.remove('disabled');
  } else {
    unboundButton.disabled = true;
    unboundButton.classList.add('disabled');
  }
}






// Mana Graph (Desktop)

const openManaChartBtn = document.getElementById('open-mana-chart');
const manaChartSlideout = document.getElementById('mana-chart-slideout');
const manaChartCanvas = document.getElementById('manaChartCanvas');

let manaChartInstance = null;

openManaChartBtn.addEventListener('click', () => {
  const isOpening = !manaChartSlideout.classList.contains('open');
  manaChartSlideout.classList.toggle('open');
  
  if (isOpening) {
    drawManaChart();
  }
});

function drawManaChart() {
  console.log("drawManaChart wurde aufgerufen");

  if (!manaChartCanvas) {
    console.warn("Canvas nicht gefunden");
    return;
  }

  const manaCount = Array(11).fill(0);
  currentDeck.forEach(card => {
    const mana = parseInt(card.mana || card.Mana || card.manacost || '0', 10);
    console.log("Mana:", card.mana, "→", mana);
    if (!isNaN(mana)) {
      if (mana >= 10) manaCount[10]++;
      else manaCount[mana]++;
    }
  });

  console.log("manaCount Array:", manaCount);

  if (manaChartInstance) {
    manaChartInstance.destroy();
  }

  const ctx = manaChartCanvas.getContext('2d');
  manaChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'],
      datasets: [{
        label: 'Cards per Mana',
        data: manaCount,
        backgroundColor: '#e1b967',
        borderColor: '#8b5e3c',
        borderWidth: 1
      }]
    },
options: {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      max: 10,
      ticks: {
        color: '#eee'
      }
    },
    x: {
      ticks: {
        color: '#eee'
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: '#eee'
      }
    }
  }
}
  });
}


// Mobile Mana Chart

const openManaChartBtnMobile = document.getElementById('open-mana-chart-mobile');
const manaChartSlideoutMobile = document.getElementById('mana-chart-slideout-mobile');
const manaChartCanvasMobile = document.getElementById('manaChartCanvasMobile');

let manaChartInstanceMobile = null;

openManaChartBtnMobile.addEventListener('click', () => {
  const isOpening = !manaChartSlideoutMobile.classList.contains('open');
  manaChartSlideoutMobile.classList.toggle('open');
  
  if (isOpening) {
    drawManaChartMobile();
  } else {
    // Optional: Falls du das Chart-Objekt auch zerstören willst beim Schließen:
    if (manaChartInstanceMobile) {
      manaChartInstanceMobile.destroy();
      manaChartInstanceMobile = null;
    }
  }
});

function drawManaChartMobile() {
  if (!manaChartCanvasMobile) return;

  const manaCount = Array(11).fill(0);
  currentDeck.forEach(card => {
    const mana = parseInt(card.mana || card.Mana || card.manacost || '0', 10);
    if (!isNaN(mana)) {
      if (mana >= 10) manaCount[10]++;
      else manaCount[mana]++;
    }
  });

  if (manaChartInstanceMobile) {
    manaChartInstanceMobile.destroy();
  }

  const ctx = manaChartCanvasMobile.getContext('2d');
  manaChartInstanceMobile = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'],
      datasets: [{
        label: 'Cards per Mana',
        data: manaCount,
        backgroundColor: '#e1b967',
        borderColor: '#8b5e3c',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 10, ticks: { color: '#eee' } },
        x: { ticks: { color: '#eee' } }
      },
      plugins: {
        legend: { labels: { color: '#eee' } }
      }
    }
  });
}




// ==== Mana-Filter-Logik (D + M) ====

// Aktuell ausgewählter Mana-Wert (null = kein Filter aktiv)
let activeManaFilter = null;

function filterCardsByMana(manaValue) {
  if (activeManaFilter === manaValue) {
    activeManaFilter = null;

    // Relevanten Modus wiederherstellen
    if (unboundButton.classList.contains('active')) {
      renderCards(cards.filter(card => card.Archetype === 'Unbound'));
    } else if (currentArchetype) {
      renderCards(cards.filter(card => card.Archetype === currentArchetype));
    } else {
      renderCards(cards);
    }

  } else {
    activeManaFilter = manaValue;

    const filtered = cards.filter(card => {
      const mana = parseInt(card.Mana);
      const isMatchingMana = !isNaN(mana) && ((manaValue === 10 && mana >= 10) || mana === manaValue);

      if (unboundButton.classList.contains('active')) {
        return card.Archetype === 'Unbound' && isMatchingMana;
      } else if (currentArchetype) {
        return card.Archetype === currentArchetype && isMatchingMana;
      }

      return isMatchingMana;
    });

    renderCards(filtered);
  }
}



// Event Listener für alle Mana-Buttons (Desktop & Mobile)
document.querySelectorAll('.mana-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const span = btn.querySelector('span');
    if (!span) return;
    const manaValue = parseInt(span.textContent.trim());
    if (!isNaN(manaValue)) {
      filterCardsByMana(manaValue);
    }
  });
});



//Archetype Change Button ( D + M)

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("archetype-overlay");
  const button = document.getElementById("change-archetype-btn");

  if (overlay && button) {
    button.addEventListener("click", () => {
      // Deck zurücksetzen
      currentDeck = [];
      updateDeckDisplay();

      // Overlay anzeigen + Animation
      overlay.style.display = "flex";
      overlay.classList.add("animate-in");

      setTimeout(() => {
        overlay.classList.remove("animate-in");
      }, 600);
    });
  }
});



// Suchfeld (Desktop + Mobile)


const searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    const archetypeCards = cards.filter(card => card.Archetype === currentArchetype);
    const unboundCards = cards.filter(card => card.Archetype === "Unbound");

    const archetypeCount = currentDeck.filter(c => c.Archetype !== "Unbound").length;
    const unboundUnlocked = archetypeCount >= 20;

    let relevantCards = [];

    if (unboundButton.classList.contains("active") && unboundUnlocked) {
      relevantCards = unboundCards;
    } else if (currentArchetype) {
      relevantCards = archetypeCards;
    } else {
      relevantCards = cards;
    }

    if (query === "") {
      renderCards(relevantCards);
      return;
    }

    const filtered = relevantCards.filter(card => {
      const nameMatch = card.Name?.toLowerCase().includes(query);
      const effectMatch = card.Effect?.toLowerCase().includes(query);
      return nameMatch || effectMatch;
    });

    renderCards(filtered);

    if (unboundButton.classList.contains("active") && unboundUnlocked) {
      unboundButton.classList.add('active');
    } else {
      unboundButton.classList.remove('active');
    }
  });
}






// Decks speichern (Desktop) -- Supabase


async function saveCurrentDeck() {
  const deckName = prompt("Please Name your Deck:");
  if (!deckName || currentDeck.length === 0) return;

  const { data: { user }, error: sessionError } = await supabaseClient.auth.getUser();
  if (sessionError || !user) {
    alert("You must be logged in to save decks.");
    return;
  }

  // ➕ NEU: Bestehendes Deck aktualisieren
  if (openedDeckId) {
    const { error: updateError } = await supabaseClient
      .from('decks')
      .update({ deck_data: currentDeck })
      .eq('id', openedDeckId);

    if (updateError) {
      console.error("Failed to update deck:", updateError.message);
    } else {
      currentDeck.forEach(card => {
        const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
        if (cardEl) {
          cardEl.classList.add("disabled");
          cardEl.style.pointerEvents = "none";
        }
      });

      openedDeckId = null;
      currentDeck = [];
      updateDeckDisplay();
      showAnnouncement("Change saved.");
      loadSavedDecks();
    }
    return;
  }

  const { data: existingDecks, error: loadError } = await supabaseClient
    .from('decks')
    .select('*')
    .eq('user_id', user.id);

  if (loadError) {
    console.error("Failed to load decks:", loadError.message);
    return;
  }

  if (existingDecks.length >= 10) {
    alert("You already have 10 decks saved. Please delete one first.");
    return;
  }

  const { error: saveError } = await supabaseClient
    .from('decks')
    .insert([
      {
        user_id: user.id,
        deck_name: deckName,
        deck_data: currentDeck
      }
    ]);

  if (saveError) {
    console.error("Failed to save deck:", saveError.message);
  } else {
    showAnnouncement("Deck saved successfully!");
    currentDeck = [];
    updateDeckDisplay();
    currentDeck.forEach(card => {
      const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
      if (cardEl) {
        cardEl.classList.add("disabled");
        cardEl.style.pointerEvents = "none";
      }
    });
    loadSavedDecks();
  }
}


// Slideout gespeicherte Decks (Desktop)


const deckIcon = document.getElementById("deck-archetype-icon");
const myDecksSlideout = document.getElementById("my-decks-slideout");
const savedDecksContainer = document.getElementById("saved-decks-container");

deckIcon.addEventListener("click", () => {
  const isOpening = !myDecksSlideout.classList.contains("open");
  myDecksSlideout.classList.toggle("open");

  // Rotation aktivieren/deaktivieren
  if (isOpening) {
    deckIcon.classList.add("rotate");
    loadSavedDecks();
  } else {
    deckIcon.classList.remove("rotate");
  }
});

async function loadSavedDecks() {
  const containerDesktop = document.getElementById("saved-decks-container");
  const containerMobile = document.getElementById("saved-decks-container-mobile");

  const { data: { user }, error: sessionError } = await supabaseClient.auth.getUser();
  if (sessionError || !user) return;

  const { data: decks, error } = await supabaseClient
    .from('decks')
    .select('*')
    .eq('user_id', user.id);

  if (error || !decks) return;

  [containerDesktop, containerMobile].forEach(container => {
    if (!container) return;
    container.innerHTML = decks.length === 0 ? "<p>No saved decks yet.</p>" : "";

    decks.forEach(deck => {
      const entry = document.createElement("div");
      entry.className = "deck-entry";

      const preview = document.createElement("img");
      preview.className = "deck-preview";
      preview.src = deck.deck_data[0]?.Image || "assets/cards/placeholder.png";
      entry.appendChild(preview);

      const nameInput = document.createElement("input");
      nameInput.className = "deck-title-input";
      nameInput.value = deck.deck_name;
      nameInput.addEventListener("change", async () => {
        await supabaseClient
          .from('decks')
          .update({ deck_name: nameInput.value })
          .eq('id', deck.id);
      });

      currentDeck.forEach(card => {
  const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
  if (cardEl) {
    cardEl.classList.add("disabled");
    cardEl.style.pointerEvents = "none";
  }
});

      const openBtn = document.createElement("button");
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => {
        currentDeck = deck.deck_data;
        openedDeckId = deck.id;
        updateDeckDisplay();
        updateUnboundButtonState();

        // 🟢 Karten im Grid ausgrauen (nach Laden)
        currentDeck.forEach(card => {
          const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
          if (cardEl) {
            cardEl.classList.add("disabled");
            cardEl.style.pointerEvents = "none";
          }
        });
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async () => {
        await supabaseClient.from('decks').delete().eq('id', deck.id);
        loadSavedDecks();
      });

      const info = document.createElement("div");
      info.className = "deck-info";
      info.appendChild(nameInput);

      const buttonGroup = document.createElement("div");
      buttonGroup.style.display = "flex";
      buttonGroup.style.gap = "8px";
      buttonGroup.appendChild(openBtn);
      buttonGroup.appendChild(deleteBtn);

      info.appendChild(buttonGroup);
      entry.appendChild(info);
      container.appendChild(entry);
    });
  });
}



// Save Deck Button (Desktop)

document.addEventListener("DOMContentLoaded", () => {
  const saveDeckBtn = document.getElementById("save-deck-btn");
  if (!saveDeckBtn) {
    console.warn("Save Deck Button wurde nicht gefunden!");
    return;
  }

  saveDeckBtn.addEventListener("click", async () => {
    const deckName = prompt("Please Name your Deck:");
    if (!deckName || currentDeck.length === 0) return;

    const { data: { user }, error: sessionError } = await supabaseClient.auth.getUser();
    if (sessionError || !user) {
      alert("You must be logged in to save decks.");
      return;
    }

    const { data: existingDecks, error: loadError } = await supabaseClient
      .from('decks')
      .select('*')
      .eq('user_id', user.id);

    if (loadError) {
      console.error("Failed to load decks:", loadError.message);
      return;
    }

    // Limit: Max 10 Decks pro Benutzer
    if (existingDecks.length >= 10) {
      alert("You already have 10 decks saved. Please delete one first.");
      return;
    }

    const { error: saveError } = await supabaseClient
      .from('decks')
      .insert([
        {
          user_id: user.id,
          deck_name: deckName,
          deck_data: currentDeck
        }
      ]);

    if (saveError) {
      console.error("Failed to save deck:", saveError.message);
    } else {
      alert("Deck saved successfully!");
      currentDeck = [];
      updateDeckDisplay();
      loadSavedDecks();
    }
  });
});



// Deck speichern Mobile

document.addEventListener("DOMContentLoaded", () => {
  const mobileSaveBtn = document.getElementById("save-deck-btn-mobile");

  if (!mobileSaveBtn) {
    console.warn("Mobiler Save Deck Button wurde nicht gefunden!");
    return;
  }

  mobileSaveBtn.addEventListener("click", () => {
    let name = "";
    const decks = JSON.parse(localStorage.getItem("savedDecks")) || [];
    if (openedDeckId) {
      const existing = decks.find(d => d.id === openedDeckId);
      name = existing?.name || "";
    } else {
      name = prompt("Name for your deck:");
      if (!name || currentDeck.length === 0) return;
    }

    if (openedDeckId) {
      const index = decks.findIndex(d => d.id === openedDeckId);
      if (index !== -1) {
        decks[index] = {
          id: openedDeckId,
          name,
          cards: [...currentDeck]
        };
        localStorage.setItem("savedDecks", JSON.stringify(decks));
        showAnnouncement("Change saved.");
        openedDeckId = null;
        currentDeck = [];
        updateDeckDisplay();
        loadSavedDecks();
        return;
      }
    }

    if (currentDeck.length === 0) return;
    const newDeck = {
      id: Date.now(),
      name,
      cards: [...currentDeck]
    };

    decks.push(newDeck);
    localStorage.setItem("savedDecks", JSON.stringify(decks));

    console.log("Deck gespeichert (mobil):", newDeck); // ✅ Debug-Ausgabe
    currentDeck = [];
    updateDeckDisplay();
    loadSavedDecks();
  });
});


// Gespeicherte Decks (verknüofung)

function loadSavedDecksMobile() {
  const container = document.getElementById("saved-decks-container-mobile");
  container.innerHTML = "";

  const decks = JSON.parse(localStorage.getItem("savedDecks")) || [];

  if (decks.length === 0) {
    container.innerHTML = "<p>No saved decks yet.</p>";
    return;
  }

  decks.forEach((deck, index) => {
    const entry = document.createElement("div");
    entry.className = "deck-entry";

    // Deck-Vorschaubild hinzufügen
    const preview = document.createElement("img");
    preview.className = "deck-preview";
    preview.src = deck.cards[0]?.Image || "assets/cards/placeholder.png";
    preview.alt = deck.name;
    entry.appendChild(preview);

    // Deck-Info-Container
    const nameInput = document.createElement("input");
    nameInput.className = "deck-title-input";
    nameInput.value = deck.name;
    nameInput.addEventListener("change", () => {
      deck.name = nameInput.value;
      decks[index] = deck;
      localStorage.setItem("savedDecks", JSON.stringify(decks));
    });

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      currentDeck = deck.cards;
      updateDeckDisplay();
      updateUnboundButtonState();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      decks.splice(index, 1);
      localStorage.setItem("savedDecks", JSON.stringify(decks));
      loadSavedDecksMobile();
    });

    const info = document.createElement("div");
    info.className = "deck-info";
    info.appendChild(nameInput);
    info.appendChild(openBtn);
    info.appendChild(deleteBtn);
    entry.appendChild(info);
    container.appendChild(entry);
  });
}



// Decks speichern (Mobile) + Slideout


const mobileDecksBtn = document.getElementById("open-my-decks-mobile");
const mobileDecksSlideout = document.getElementById("my-decks-slideout-mobile");
const mobileDecksContainer = document.getElementById("saved-decks-container-mobile");

mobileDecksBtn?.addEventListener("click", () => {
  console.log("🟢 Button klick funktioniert.");
  mobileDecksSlideout.classList.toggle("open");
  loadSavedDecksMobile();
});

function loadSavedDecksMobile() {
  const decks = JSON.parse(localStorage.getItem("savedDecks")) || [];

  mobileDecksContainer.innerHTML = "";

  if (decks.length === 0) {
    mobileDecksContainer.innerHTML = "<p>No saved decks yet.</p>";
    return;
  }

  decks.forEach((deck, index) => {
    const entry = document.createElement("div");
    entry.className = "deck-entry";

    const nameInput = document.createElement("input");
    nameInput.className = "deck-title-input";
    nameInput.value = deck.name;
    nameInput.addEventListener("change", () => {
      deck.name = nameInput.value;
      decks[index] = deck;
      localStorage.setItem("savedDecks", JSON.stringify(decks));
    });

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      currentDeck = deck.cards;
      openedDeckId = deck.id;
      updateDeckDisplay();
      // Karten im Grid ausgrauen
      currentDeck.forEach(card => {
        const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
        if (cardEl) {
          cardEl.classList.add("disabled");
          cardEl.style.pointerEvents = "none";
        }
      });
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "";
    deleteBtn.addEventListener("click", () => {
      decks.splice(index, 1);
      localStorage.setItem("savedDecks", JSON.stringify(decks));
      loadSavedDecksMobile();
    });

    entry.appendChild(nameInput);
    entry.appendChild(openBtn);
    entry.appendChild(deleteBtn);
    mobileDecksContainer.appendChild(entry);
  });
}



function loadSavedDecksMobile() {
  const container = document.getElementById("saved-decks-container-mobile");
  container.innerHTML = "";

  const decks = JSON.parse(localStorage.getItem("savedDecks")) || [];

  if (decks.length === 0) {
    container.innerHTML = "<p>No saved decks yet.</p>";
    return;
  }

  decks.forEach((deck, index) => {
    const entry = document.createElement("div");
    entry.className = "deck-entry";



    // 🟢 Deck-Vorschaubild hinzufügen (NEU)
    const preview = document.createElement("img");
    preview.className = "deck-preview";
    preview.src = deck.cards[0]?.Image || "assets/cards/placeholder.png";
    preview.alt = deck.name;
    entry.appendChild(preview);

    

    // Deck Name
    const nameInput = document.createElement("input");
    nameInput.className = "deck-title-input";
    nameInput.value = deck.name;
    nameInput.addEventListener("change", () => {
      deck.name = nameInput.value;
      decks[index] = deck;
      localStorage.setItem("savedDecks", JSON.stringify(decks));
    });


    // Button
    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      currentDeck = deck.cards;
      openedDeckId = deck.id;
      updateDeckDisplay();
      updateUnboundButtonState();
      currentDeck.forEach(card => {
        const cardEl = document.querySelector(`.card[data-id="${card.ID}"]`);
        if (cardEl) {
          cardEl.classList.add("disabled");
          cardEl.style.pointerEvents = "none";
        }
      });
    });


    // Button

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      decks.splice(index, 1);
      localStorage.setItem("savedDecks", JSON.stringify(decks));
      loadSavedDecksMobile();
    });

    const info = document.createElement("div");
    info.className = "deck-info";
    info.appendChild(nameInput);

    const buttonGroup = document.createElement("div");
    buttonGroup.style.display = "flex";
    buttonGroup.style.gap = "8px";
    buttonGroup.appendChild(openBtn);
    buttonGroup.appendChild(deleteBtn);

    info.appendChild(buttonGroup);
    entry.appendChild(info);
    container.appendChild(entry);
  });
}


// Reset Deck Button

document.addEventListener("DOMContentLoaded", () => {
  const resetDeckBtn = document.getElementById("reset-deck-btn");
  if (resetDeckBtn) {
    resetDeckBtn.addEventListener("click", () => {
      // Deck leeren
      currentDeck = [];
      openedDeckId = null;

      // Anzeige aktualisieren + Ausgrauen im Grid entfernen
      updateDeckDisplay();
    });
  }
});

//Reset Deck Button mobile

document.addEventListener("DOMContentLoaded", () => {
  const resetDeckBtnMobile = document.getElementById("reset-deck-btn-mobile");

  if (resetDeckBtnMobile) {
    resetDeckBtnMobile.addEventListener("click", () => {
      currentDeck = [];
      openedDeckId = null;

      updateDeckDisplay();
      updateUnboundButtonState();

      // Optional: Falls du Filter zurücksetzen willst:
      // document.getElementById('search-input').value = "";
      // renderCards(cards);
    });
  }
});










// User Icon - Nav Bar

function toggleUserMenu() {
  const menu = document.getElementById("userDropdown");
  menu.classList.toggle("hidden");
}

// Menü schließen, wenn außerhalb geklickt
document.addEventListener("click", function (event) {
  const icon = document.getElementById("userIcon");
  const dropdown = document.getElementById("userDropdown");

  if (!icon.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.classList.add("hidden");
  }
});






// Registrierung-Button EventListener (nach handleRegister-Definition)
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("register-button");
  if (registerBtn) {
    registerBtn.addEventListener("click", handleRegister);
  }
});