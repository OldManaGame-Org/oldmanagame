// Supabase Client
const supabaseUrl = 'https://duzgjnjivzbcyhecltui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emdqbmppdnpiY3loZWNsdHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODgyNzgsImV4cCI6MjA2NzM2NDI3OH0.vwkSSBiufzea9PQ_sN2r0ET4xWQqmE8F54VTnBgpTsc';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


function toggleEdit(field) {
  const editDiv = document.getElementById(`edit-${field}`);
  if (editDiv.classList.contains("hidden")) {
    editDiv.classList.remove("hidden");
  } else {
    editDiv.classList.add("hidden");
  }
}


// Password

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


// Account Bereich

function showAccount() {
  const email = localStorage.getItem("loggedInUser");
  if (email) {
    document.getElementById("user-email-display").innerText = "Eingeloggt als: " + email;
    document.getElementById("account-page").classList.remove("hidden");
  }
}

async function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userData");
  await supabaseClient.auth.signOut();
  location.reload();
}


// Supabase abruf

document.addEventListener('DOMContentLoaded', async () => {
  const userData = JSON.parse(localStorage.getItem('userData'));

  if (!userData) {
    alert("Du bist nicht eingeloggt.");
    window.location.href = "index.html";  // oder wo dein Login liegt
    return;
  }

  // Daten in Felder eintragen:
  document.getElementById('acc-email').innerText = userData.email || '-';
  document.getElementById('acc-username').innerText = userData.username || '-';
  document.getElementById('newsletterToggle').checked = userData.newsletter || false;
  document.getElementById('privacyToggle').checked = userData.privacy || false;
});


// Daten ändern

async function updateAccount() {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData) return;

  const newEmail = document.getElementById('newEmail').value.trim();
  const confirmEmail = document.getElementById('confirmEmail').value.trim();
  const newUsername = document.getElementById('newUsername').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // E-Mail ändern
  if (newEmail && newEmail === confirmEmail) {
    const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
    if (error) return alert('Fehler beim Ändern der E-Mail: ' + error.message);
    alert('E-Mail geändert. Bitte neue Adresse bestätigen.');
    userData.email = newEmail;
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Passwort ändern
  if (newPassword && newPassword === confirmPassword) {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) return alert('Fehler beim Ändern des Passworts: ' + error.message);
    alert('Passwort geändert.');
  }

  // Username ändern
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
 // Speichern

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



// Logout Nav Icon

async function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userData");
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";  // Zurück zur Startseite oder Login
}