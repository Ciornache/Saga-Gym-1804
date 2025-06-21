// 1) Preia token-ul din localStorage și pregătește header-ul
const token = localStorage.getItem("token") || sessionStorage.getItem("token");
if (!token) {
  alert("Please log in to see your statistics.");
  window.location.href = "/login.html";
}
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

async function loadFavorites() {
  const res = await fetch("/api/favorites-summary", { headers });
  if (!res.ok) throw new Error("Could not fetch favorites summary");
  const data = await res.json();

  document.querySelector(".favorite-exercises .fav-count").textContent =
    data.favCount;

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

  const ol = document.querySelector(".all-liked ol");
  ol.innerHTML = data.likedExercises.map((name) => `<li>${name}</li>`).join("");

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

  document.querySelector(".avg-difficulty .avg-score").firstChild.textContent =
    data.avgDifficulty.toFixed(1) + " ";
  const score = data.avgDifficulty;
  const icons = document.querySelectorAll(".avg-difficulty .dumbbells i");

  icons.forEach((i) => i.classList.remove("filled", "half"));

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
  const endpoints = {
    totalWorkouts:   "/api/activity/total-workouts",
    totalSets:       "/api/activity/total-sets",
    uniqueExercises: "/api/activity/unique-exercises", 
    totalExercises:  "/api/activity/total-exercises",
    totalWeight:     "/api/activity/total-weight",
    avgWeightSet:    "/api/activity/avg-weight-set",
    time:            "/api/activity/time",
  };

  // 1) fetch everything in parallel
  const paths = Object.values(endpoints);
  const raw = await Promise.all(paths.map(p => fetch(p, { headers })));

  // 2) log raw responses
  raw.forEach((r,i) => {
    console.log(`🔹 [${paths[i]}] status:`, r.status, r.statusText);
  });

  // 3) parse JSON bodies
  const bodies = await Promise.all(raw.map(r => r.json()));

  // 4) log parsed payloads
  Object.keys(endpoints).forEach((key, i) => {
    console.log(`🔸 ${key}:`, bodies[i]);
  });

  // 5) destructure into variables
  const [
  { totalWorkouts },
  { totalSets },
  { totalUniqueExercises }, // 🟢 <- mută-l aici
  { totalExercises },       // 🔴 <- după
  { totalWeight },
  { avgWeightSet },
  { totalTime, avgDuration }
] = bodies;


  // 6) now update the DOM
  document.querySelector(".total-workouts .value").textContent   = totalWorkouts;
  document.querySelector(".total-sets .value").textContent       = totalSets;
  document.querySelector(".total-exercises .value").textContent  = totalExercises;
  document.querySelector(".unique-exercises .value").textContent = totalUniqueExercises;
  document.querySelector(".total-weight .value").textContent     = totalWeight + " kg";
  document.querySelector(".avg-weight-set .value").textContent   = avgWeightSet + " kg";
  document.querySelector(".total-time .value").textContent       = totalTime;
  document.querySelector(".avg-duration .value").textContent     = avgDuration;
}

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

const viewLink = document.querySelector(".favorite-exercises .view-link");
if (viewLink) {
  viewLink.addEventListener("click", (e) => {
    e.preventDefault();
    const allLiked = document.querySelector(".all-liked");
    allLiked.classList.add("highlight");
    setTimeout(() => allLiked.classList.remove("highlight"), 2000);
  });
}
async function loadProgressChart() {
  const res = await fetch("/api/activity/weekly-progress", { headers });
  const data = await res.json();

  const ctx = document.getElementById("progressChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: "Weight Lifted (kg)",
        data: data.map(d => d.total),
        borderColor: "#3b82f6",       // albastru
        backgroundColor: "rgba(59, 130, 246, 0.2)", // umplutură
        fill: true,
        tension: 0.4,                 // face linia curbată
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} kg`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "kg"
          }
        }
      }
    },
  });
}
async function loadWeeklySummary() {
  const res = await fetch("/api/activity/weekly-summary", { headers });
  const data = await res.json();

  const rows = [
    ["Workouts", data.workouts],
    ["Time (min)", data.duration],
    ["Weight (kg)", data.weight],
    ["Sets", data.sets],
  ];

  const table = document.querySelector(".week-comparison tbody");
  table.innerHTML = "";

  rows.forEach(([label, obj]) => {
  const { thisWeek, lastWeek } = obj;
  const diff = thisWeek - lastWeek;
  const sign = diff >= 0 ? "+" : "";
  const percent = lastWeek === 0 ? "∞%" : ((diff / lastWeek) * 100).toFixed(0) + "%";

  const row = `
    <tr>
      <td>${label}</td>
      <td>${thisWeek}</td>
      <td>${lastWeek}</td>
      <td>${sign}${percent}</td>
    </tr>
  `;
  table.innerHTML += row;
});

}
// 7) La load, rulează toate funcțiile
window.addEventListener("DOMContentLoaded", () => {
  loadFavorites().catch((err) => console.error(err));
  loadReviews().catch((err) => console.error(err));
  loadActivity().catch((err) => console.error(err));
  loadWeeklySummary().catch(console.error);
  loadProgressChart().catch(console.error);
});
