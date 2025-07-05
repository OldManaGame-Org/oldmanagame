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

function logout() {
  localStorage.removeItem("loggedInUser");
  location.reload(); // Seite neu laden, zurück zum Login
}
