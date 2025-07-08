// Supabase Client
const supabaseUrl = 'https://duzgjnjivzbcyhecltui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emdqbmppdnpiY3loZWNsdHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODgyNzgsImV4cCI6MjA2NzM2NDI3OH0.vwkSSBiufzea9PQ_sN2r0ET4xWQqmE8F54VTnBgpTsc';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Toggle Slideouts
function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');

  if (submenu.classList.contains('hidden')) {
    submenu.classList.remove('hidden');
    submenu.classList.add('open');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  } else {
    submenu.classList.add('hidden');
    submenu.classList.remove('open');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
}

// Tabs wechseln
function showTab(tabName) {
  const tabs = document.querySelectorAll('.account-section');
  const buttons = document.querySelectorAll('.account-nav button');

  tabs.forEach(tab => tab.classList.add('hidden'));
  buttons.forEach(btn => btn.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  const activeButton = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(tabName));
  if (activeButton) activeButton.classList.add('active');
}

showTab('info');

// Toggle Password
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    button.textContent = "🙈";
  } else {
    input.type = "password";
    button.textContent = "👁️";
  }
}

// Daten laden
document.addEventListener('DOMContentLoaded', async () => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData) {
    alert("Du bist nicht eingeloggt.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById('acc-email').innerText = userData.email || '-';
  document.getElementById('acc-username').innerText = userData.username || '-';
  document.getElementById('newsletterToggle').checked = userData.newsletter || false;
  document.getElementById('privacyToggle').checked = userData.privacy || false;
});

// Account-Daten ändern
async function updateAccount() {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData) return;

  const newEmail = document.getElementById('newEmail')?.value.trim();
  const confirmEmail = document.getElementById('confirmEmail')?.value.trim();
  const newUsername = document.getElementById('newUsername')?.value.trim();
  const newPassword = document.getElementById('newPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (newEmail && newEmail === confirmEmail) {
    const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
    if (error) return alert('Fehler beim Ändern der E-Mail: ' + error.message);
    alert('E-Mail geändert. Bitte neue Adresse bestätigen.');
    userData.email = newEmail;
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  if (newPassword && newPassword === confirmPassword) {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) return alert('Fehler beim Ändern des Passworts: ' + error.message);
    alert('Passwort geändert.');
  }

  if (newUsername) {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', userData.id);

    if (error) return alert('Fehler beim Ändern des Usernames: ' + error.message);
    alert('Username geändert.');
    userData.username = newUsername;
    localStorage.setItem('userData', JSON.stringify(userData));
  }
}

// Einstellungen speichern
async function saveSettings() {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData) return;

  const newsletter = document.getElementById('newsletterToggle').checked;
  const privacy = document.getElementById('privacyToggle').checked;

  const { error } = await supabaseClient
    .from('profiles')
    .update({ newsletter: newsletter, privacy: privacy })
    .eq('id', userData.id);

  if (error) {
    alert('Fehler beim Speichern der Einstellungen: ' + error.message);
  } else {
    alert('Einstellungen gespeichert.');
  }
}

// Logout
async function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userData");
  await supabaseClient.auth.signOut();
  location.reload();
}



// Logout Nav Icon

async function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userData");
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";  // Zurück zur Startseite oder Login
}




// Toggle Tabs
function showTab(tabName) {
  const tabs = document.querySelectorAll('.account-section');
  const buttons = document.querySelectorAll('.account-nav button');

  tabs.forEach(tab => {
    tab.classList.add('hidden');
  });

  buttons.forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  const activeButton = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(tabName));
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

// Toggle Submenu Slideout
function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');

  if (submenu.classList.contains('hidden')) {
    submenu.classList.remove('hidden');
    submenu.classList.add('open');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  } else {
    submenu.classList.add('hidden');
    submenu.classList.remove('open');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
} 

// Optional: Initialize first tab
showTab('info');