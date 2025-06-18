// 1) Preia token-ul din localStorage și pregătește header-ul
const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in to see your statistics.");
  window.location.href = "/login.html";
}
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

// 2) Încarcă și afișează secțiunea Favorites
async function loadFavorites() {
  const res = await fetch("/api/favorites-summary", { headers });
  if (!res.ok) throw new Error("Could not fetch favorites summary");
  const data = await res.json();

  // A) Favorite Exercises count
  document.querySelector(".favorite-exercises .fav-count").textContent =
    data.favCount;

  // B) Favorite Types — construire dinamică
  const typesContainer = document.querySelector(
    ".favorite-types .types-container"
  );
  typesContainer.innerHTML = "";
  data.favTypes.forEach((t) => {
    const pct = data.favCount ? Math.round((t.value / data.favCount) * 100) : 0;
    const div = document.createElement("div");
    div.className = "type-row";
    div.innerHTML = `
      <span class="label">${t.label}</span>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <span class="percent">${pct}%</span>
    `;
    typesContainer.appendChild(div);
  });

  // C) All Liked Exercises — dinamic
  const ol = document.querySelector(".all-liked ol");
  ol.innerHTML = data.likedExercises.map((name) => `<li>${name}</li>`).join("");

  // D) Favorite Muscle Groups — doughnut chart + legend
  const mCtx = document.getElementById("muscleChart").getContext("2d");
  const labels = data.muscleGroups.map((m) => m.label);
  const values = data.muscleGroups.map((m) => m.value);
  new Chart(mCtx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ["#e63946", "#2a9d8f", "#f06292", "#6a4c93"],
        },
      ],
    },
    options: {
      cutout: "70%",
      plugins: { legend: { display: false } },
      maintainAspectRatio: false,
      responsive: true,
    },
  });
  // legend text
  const legend = document.querySelector(".muscle-groups .legend");
  legend.innerHTML = data.muscleGroups
    .map(
      (m, i) => `
    <span>
      <i class="fas fa-circle" style="color:${
        ["#e63946", "#2a9d8f", "#f06292", "#6a4c93"][i]
      }"></i>
      ${m.label} ${Math.round(
        (m.value / values.reduce((a, b) => a + b, 0)) * 100
      )}%
    </span>
  `
    )
    .join("");

  // E) Average Difficulty
  document.querySelector(".avg-difficulty .avg-score").firstChild.textContent =
    data.avgDifficulty.toFixed(1) + " ";
  // —— dynamically colour the dumbbells —— //
  const score = data.avgDifficulty;
  const icons = document.querySelectorAll(".avg-difficulty .dumbbells i");

  // reset
  icons.forEach((i) => i.classList.remove("filled", "half"));

  // fill in
  const full = Math.floor(score);
  const frac = score - full;

  icons.forEach((icon, idx) => {
    if (idx < full) {
      icon.classList.add("filled");
    } else if (idx === full && frac >= 0.5) {
      icon.classList.add("half");
    }
  });
}

async function loadReviews() {
  headers.saga = "Saga";
  console.log(headers);
  const res = await fetch("/api/reviews-summary", { headers });
  if (!res.ok) throw new Error("Could not fetch reviews summary");
  const d = await res.json();

  document.querySelector(".review-count .value").textContent = d.reviewCount;
  document.querySelector(".review-average .value").textContent =
    d.avgRating.toFixed(1) + " / 5";
  document.querySelector(".total-likes .value").textContent = d.totalLikes;
  document.querySelector(".likes-per-review .value").textContent =
    d.likesPerReview.toFixed(1);
  document.getElementById("minLikesVal").textContent = d.minLikes;
  document.getElementById("maxLikesVal").textContent = d.maxLikes;
}

async function loadActivity() {
  const res = await fetch("/api/activity-summary", { headers });
  if (!res.ok) throw new Error("Could not fetch activity summary");
  const a = await res.json();

  document.querySelector(".total-workouts .value").textContent =
    a.totalWorkouts;
  document.querySelector(".total-sets .value").textContent = a.totalSets;
  document.querySelector(".total-exercises .value").textContent =
    a.totalExercises;
  document.querySelector(".total-weight .value").textContent =
    a.totalWeight + " kg";
  document.querySelector(".total-km .value").textContent = a.totalKm + " km";
  document.querySelector(".total-time .value").textContent = a.totalTime;
  document.querySelector(".avg-duration .value").textContent = a.avgDuration;
  const stretchEl = document.querySelector(".total-stretching .value");
  if (stretchEl && a.totalStretching != null) {
    stretchEl.textContent = a.totalStretching;
  }

  // Weekly Comparison
  const tbody = document.querySelector(".week-comparison tbody");
  const { thisWeek, lastWeek, kmThisWeek, kmLastWeek } = a.weekly;
  tbody.innerHTML = `
    <tr>
      <td>Workouts</td>
      <td>${thisWeek}</td>
      <td>${lastWeek}</td>
      <td class="${thisWeek >= lastWeek ? "positive" : "negative"}">
        ${
          lastWeek
            ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) + "%"
            : "—"
        }
      </td>
    </tr>
    <tr>
      <td>km Ran</td>
      <td>${kmThisWeek} km</td>
      <td>${kmLastWeek} km</td>
      <td class="${kmThisWeek >= kmLastWeek ? "positive" : "negative"}">
        ${
          kmLastWeek
            ? Math.round(((kmThisWeek - kmLastWeek) / kmLastWeek) * 100) + "%"
            : "—"
        }
      </td>
    </tr>
  `;

  // Progress Chart
  const pCtx = document.getElementById("progressChart").getContext("2d");
  new Chart(pCtx, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Workouts this week",
          data: a.weekly.dailyWorkouts || [0, 0, 0, 0, 0, 0, 0],
          tension: 0.3,
          borderColor: "#6a0dad",
          pointBackgroundColor: "#6a0dad",
          fill: false,
        },
      ],
    },
    options: {
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
      maintainAspectRatio: false,
      responsive: true,
    },
  });
}

// 5) Tab switching
document.querySelectorAll(".sidebar a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar li")
      .forEach((li) => li.classList.remove("active"));
    link.parentElement.classList.add("active");
    document
      .querySelectorAll(".tab-content")
      .forEach((sec) => (sec.style.display = "none"));
    document.getElementById(link.dataset.tab).style.display = "block";
  });
});

// 6) Highlight on "View them"
const viewLink = document.querySelector(".favorite-exercises .view-link");
if (viewLink) {
  viewLink.addEventListener("click", (e) => {
    e.preventDefault();
    const allLiked = document.querySelector(".all-liked");
    allLiked.classList.add("highlight");
    setTimeout(() => allLiked.classList.remove("highlight"), 2000);
  });
}

// 7) La load, rulează toate funcțiile
window.addEventListener("DOMContentLoaded", () => {
  loadFavorites().catch((err) => console.error(err));
  loadReviews().catch((err) => console.error(err));
  loadActivity().catch((err) => console.error(err));
});
