const workoutButton = document.getElementById("workout-btn");

workoutButton.addEventListener("click", async (e) => {
  e.preventDefault();
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    alert("Access denied! Please log in to continue.");
    window.location.href = "login.html";
    return;
  }

  const res = await fetch("/token/getuser", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200) {
    const data = await res.json();
    window.location.href = `workout.html?id=${data.user_id}`;
  } else {
    console.error("Unauthorized access");
    window.location.href = "login.html";
  }
});

const logoutButton = document.getElementById("logout-btn");
const userAccWindow = document.getElementById("user-win-btn");

document.addEventListener("DOMContentLoaded", async () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const res = await fetch("/token/getuser", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log(res);
  if (res.status === 200) {
    logoutButton.classList.remove("hidden");
    userAccWindow.classList.remove("hidden");
  } else {
    logoutButton.classList.add("hidden");
    userAccWindow.classList.add("hidden");
  }
});

logoutButton.addEventListener("click", (e) => {
  localStorage.clear();
  sessionStorage.clear();
  e.target.classList.add("hidden");
  location.reload(true);
});

userAccWindow.addEventListener("click", () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) window.location.href = "account.html";
  else window.location.href = "login.html";
});

const form = document.querySelector("form");

form.addEventListener("submit", async (event) => {
  console.log("Submit button clicked");
  event.preventDefault();

  const input_wrapper = document.querySelector(".input-wrapper");
  const input_elements = input_wrapper.querySelectorAll("input");
  const email_input = input_elements[0];
  const password_input = input_elements[1];

  const response = await fetch("/validation/getUserByEmail", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      email: email_input.value,
    },
  });

  if (response.status !== 200) {
    showErrorMessage(
      email_input,
      "Adresa de email nu este validă sau nu există"
    );
    return;
  }

  const user = await response.json();
  const hashedPassword = await hashPassword(password_input.value);

  if (hashedPassword !== user.password) {
    showErrorMessage(password_input, "Parola este greșită");
    return;
  }

  const resp = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email_input.value.trim(),
      password: password_input.value,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    showErrorMessage(email_input, data.msg || "Autentificare eșuată");
    return;
  }
  const checked = document.getElementById("remember-me").checked;
  if (checked) {
    sessionStorage.clear();
    localStorage.setItem("token", data.token);
  } else {
    localStorage.clear();
    sessionStorage.setItem("token", data.token);
  }
  showValidMessage(email_input);
  showValidMessage(password_input);
  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
});

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function showErrorMessage(inputElement, message) {
  const parentContainer = inputElement.parentElement.parentElement;
  parentContainer.classList.remove("input-correct");
  parentContainer.classList.add("input-error");
  const spanElements = parentContainer.querySelectorAll("span");
  const spanErrorMessage = spanElements[spanElements.length - 1];
  spanErrorMessage.textContent = message;
}

function showValidMessage(inputElement) {
  const parentContainer = inputElement.parentElement.parentElement;
  parentContainer.classList.remove("input-error");
  parentContainer.classList.add("input-correct");
  const spanElements = parentContainer.querySelectorAll("span");
  const spanErrorMessage = spanElements[spanElements.length - 1];
  spanErrorMessage.textContent = "";
}

function togglePasswordVisibility(element_id) {
  const passwordInput = document.getElementById(element_id);
  if (!passwordInput) {
    console.error(`Element with id ${element_id} not found`);
    return;
  }
  const index = element_id === "password" ? 0 : 1;
  const passwordToggle =
    document.getElementsByClassName("toggle-password")[index];
  if (!passwordToggle) {
    console.error(`Element with class toggle-password not found`);
    return;
  }
  const passwordType =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", passwordType);
  passwordToggle.classList.toggle("toggle-password-visible");
}
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
});
