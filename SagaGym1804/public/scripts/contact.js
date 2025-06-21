const workoutButton = document.getElementById("workout-btn");

workoutButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    console.log("Access denied!");
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

const token = localStorage.getItem("token") || sessionStorage.getItem("token");

async () => {
  const res = await fetch("/user/gettoken", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 200) {
    logoutButton.classList.remove("hidden");
    userAccWindow.classList.remove("hidden");
  } else {
    logoutButton.classList.add("hidden");
    userAccWindow.classList.add("hidden");
  }
};

logoutButton.addEventListener("click", (e) => {
  localStorage.clear();
  sessionStorage.clear();
  e.target.classList.add("hidden");
  location.reload(true);
});

userAccWindow.addEventListener("click", () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) window.location.href = "Account.html";
  else window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form form");
  const phoneInput = form.phone;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    phoneInput.setCustomValidity("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const raw = phoneInput.value.trim();
    if (raw && !/^[0-9]{10}$/.test(raw)) {
      phoneInput.setCustomValidity(
        "Please enter exactly 10 digits (no letters or symbols)."
      );
      phoneInput.reportValidity();
      return;
    }

    const data = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: raw,
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch(form.action, {
        method: form.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Your message was sent successfully!");
        form.reset();
      } else {
        const { error } = await res.json();
        alert(error || "Server error. Please try again.");
      }
    } catch {
      alert("Network error. Please try later.");
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
});
