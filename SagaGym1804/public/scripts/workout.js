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

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

if (!userId) {
  console.error("🚨 No user ID in URL – nothing to load!");
  throw new Error("User ID missing from URL");
}

const logoutButton = document.getElementById("logout-btn");
const userAccWindow = document.getElementById("user-win-btn");

setInterval(() => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    logoutButton.classList.remove("hidden");
    userAccWindow.classList.remove("hidden");
  } else {
    userAccWindow.classList.add("hidden");
    logoutButton.classList.add("hidden");
  }
}, 100);

logoutButton.addEventListener("click", (e) => {
  console.log("Clicked");
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
  const addBtn = document.querySelector(".add-button-container button");
  const form = document.getElementById("training-form");
  console.log(form);
  const overlay =
    document.getElementById("modal-overlay") ||
    (() => {
      const ov = document.createElement("div");
      ov.id = "modal-overlay";
      ov.classList.add("hidden");
      document.body.appendChild(ov);
      return ov;
    })();

  function openModal() {
    form.classList.remove("hidden");
    form.classList.add("modal");
    console.log(form);
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    form.classList.add("hidden");
    form.classList.remove("modal");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
  addBtn.addEventListener("click", openModal);
  overlay.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !form.classList.contains("hidden")) {
      closeModal();
    }
  });

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "×";
  closeBtn.type = "button";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "15px";
  closeBtn.style.fontSize = "1.3rem";
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "none";
  closeBtn.style.cursor = "pointer";
  closeBtn.addEventListener("click", closeModal);
  form.appendChild(closeBtn);

  window.addEventListener("message", (e) => {
    if (e.data?.type === "generatedWorkouts") {
      const { workouts, purpose, name } = e.data;
      closeModal();
      showWorkoutPicker(workouts, purpose, name);
    }
  });

  function showWorkoutPicker(workouts, purpose, name) {
    if (!Array.isArray(workouts)) {
      console.error("Invalid workouts payload", workouts);
      return;
    }
    workouts.forEach((wk) => {
      if (!Array.isArray(wk)) {
        console.warn("Invalid workout entry", wk);
        return;
      }
      wk.totalDuration = Math.round(
        wk.reduce((sum, ex) => sum + ex.duration, 0) / 60
      );
      const sum = wk.reduce((acc, e) => acc + e.difficulty, 0);
      const count = wk.length;
      const avg = (count != 0 ? (sum * 1.0) / count : 0).toFixed(2);
      console.log(avg);
      wk.avg = avg;
    });
    const ov = document.createElement("div");
    ov.id = "picker-overlay";
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";

    ov.innerHTML = `
      <div class="picker-modal">
        ${workouts
          .map(
            (wk, i) => `
          <div class="picker-card-container">
            <div class="workout-total-duration">
              Total: ${wk.totalDuration} min
              <br/>
              Average Difficulty: ${wk.avg}
            </div>
            <div class="picker-card">
              ${wk
                .map(
                  (ex) => `
                <div class="exercise-item">
                  <h4>${ex.name}</h4>
                  <span>Targeted Muscles</span>
                  <div class="muscle-icons" style="display:inline-block">
                    ${ex.muscle_groups
                      .map(
                        (m) => `
                      <img src="assets/images/grupe_musculare/${m}.png"
                           alt="${m}" title="${m}"
                           class="muscle-icon">
                    `
                      )
                      .join("")}
                  </div>
                  <div class="exercise-info">
                    <p>${ex.sets.length} sets — ${Math.round(
                    ex.duration / 60
                  )} min</p>
                    <span>Difficulty : ${ex.difficulty.toFixed(1)}</span>
                  </div>
                </div>
              `
                )
                .join("")}
              <button data-choice="${i}">Select</button>
            </div>
          </div>
        `
          )
          .join("")}
          <div class="picker-actions">
          <button id="regenerate-btn">Regenerate</button>
        </div>
      </div>
    `;

    ov.querySelectorAll("button[data-choice]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = +btn.dataset.choice;
        await saveWorkout(workouts[idx], purpose, name);
        document.body.removeChild(ov);
        document.body.style.overflow = "";
        alert("Workout saved!");
      });
    });
    ov.querySelector("#regenerate-btn")?.addEventListener("click", () => {
      document.body.removeChild(ov);
      document.body.style.overflow = "";
      if (typeof onGenerate === "function") onGenerate();
    });
  }

  async function saveWorkout(exercisesArray, purpose, name) {
    const payload = {
      id_antrenament: Date.now(),
      exercitii: exercisesArray,
      id_user: userId,
      name: name,
    };
    await fetch("/admin/antrenamente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  loadAndRenderSavedWorkouts();

  async function loadAndRenderSavedWorkouts() {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/workouts/?id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      renderWorkoutTags(data);
      if (data.length) {
        const firstTag = document.querySelector(".workout-tag");
        firstTag.classList.add("active");
        displayWorkout(data[0].exercitii);
      }
    } catch (err) {
      console.error("Failed to load workouts:", err);
    }
  }

  let currentWorkoutId = null;

  function renderWorkoutTags(workouts) {
    const container = document.querySelector(".workout-tag-container");
    container.innerHTML = "";
    workouts.forEach((wk, idx) => {
      const tag = document.createElement("div");
      tag.className = "workout-tag";
      tag.textContent = `${wk.name}`;
      tag.dataset.index = idx;
      tag.addEventListener("click", async () => {
        document
          .querySelectorAll(".workout-tag")
          .forEach((el) => el.classList.remove("active"));
        tag.classList.add("active");

        const res = await fetch("/admin/exercitii");
        const exercise_data = await res.json();
        let ex = wk.exercitii;
        ex = ex
          .map((e) => {
            const exercise = exercise_data.find(
              (ee) => ee.id === e.exercise_id
            );
            if (!exercise) {
              console.warn("Missing exercise data for ID", e.exercise_id);
              return null;
            }
            return {
              ...e,
              name: exercise.name,
              muscle_groups: exercise.muscle_groups,
            };
          })
          .filter(Boolean);
        currentWorkoutId = wk.id_antrenament;
        displayWorkout(ex);
      });
      if (workouts.length) {
        currentWorkoutId = workouts[0].id_antrenament;
      }
      container.appendChild(tag);
    });
  }

  async function displayWorkout(exercises) {
    const res = await fetch("/admin/exercitii");
    const exercise_data = await res.json();

    exercises = exercises
      .map((e) => {
        const exercise = exercise_data.find((ee) => ee.id === e.exercise_id);
        if (!exercise) {
          console.warn("Missing exercise data for ID", e.exercise_id);
          return null;
        }
        return {
          ...e,
          name: exercise.name,
          muscle_groups: exercise.muscle_groups,
        };
      })
      .filter(Boolean);

    const section = document.querySelector(".workout-exercises-section");
    section.innerHTML = `<h2>Exercises</h2>`;
    console.log(exercises);
    exercises.forEach((ex) => {
      const muscleIcons = ex.muscle_groups
        .map(
          (m) => `
          <img
            src="assets/images/grupe_musculare/${m}.png"
            alt="${m}"
            title="${m}"
            class="muscle-icon"
          >
        `
        )
        .join("");

      const setsGrid = ex.sets
        .map(
          (s, i) => `
        <div class="set-item" data-timings='${JSON.stringify(
          s.timings
        )}' data-set-index="${i}">
          <div class="set-duration">${(s.duration / 60).toFixed(2)} min</div>
          <div class="set-reps">${s.repetitions.length} reps</div>
          <div class="set-weight">
            <select class="weight-type">
              <option value="kg">Kg</option>
              <option value="body_x">Body-weight ×</option>
            </select>
            <input class="weight-kicker" 
                   type="number" 
                   min="0" 
                   step="0.1" 
                   placeholder="e.g. 50 or 1.2" />
          </div>
        </div>
      `
        )
        .join("");

      const card = document.createElement("div");
      card.className = "exercise-card";
      card.innerHTML = `
        <div class="card-header">
          <h3>${ex.name}</h3>
          <div class="muscle-icons">${muscleIcons}</div>
        </div>
        <div class="card-body">
          <div class="exercise-meta">
            <span class="meta-item">
              <strong>Total:</strong> ${Math.round(ex.duration / 60)} min
            </span>
            <span class="meta-item">
              <strong>Sets:</strong> ${ex.sets.length}
            </span>
          </div>
          <div class="sets-list">
            ${setsGrid}
          </div>
        </div>
      `;

      const exNameNode = card.querySelector("h3");
      exNameNode.style = "cursor:pointer";
      exNameNode.addEventListener("mouseenter", (e) => {
        e.target.setAttribute("name", e.target.textContent);
        e.target.innerHTML =
          '<i class="fa-solid fa-arrow-right-long"></i> <span>Go to Exercise Page</span>';
      });
      exNameNode.addEventListener("mouseleave", (e) => {
        e.target.innerHTML = `${e.target.getAttribute("name")}`;
      });
      exNameNode.addEventListener("click", (e) => {
        const exName = e.target.parentNode.getAttribute("name");
        console.log(exName);
        window.location.href = `http://localhost:3000/exercitiu.html?exercise-name=${exName}`;
      });

      section.appendChild(card);
      const setItems = card.querySelectorAll(".set-item");
      setItems.forEach((item) => {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          const parent = item.parentNode;

          if (item.nextElementSibling?.classList.contains("set-info")) {
            item.nextElementSibling.remove();
            return;
          }
          parent.querySelectorAll(".set-info").forEach((el) => el.remove());
          const timings = JSON.parse(item.dataset.timings);
          const info = document.createElement("div");
          info.className = "set-info";
          info.innerHTML = `
        ${timings.map((t) => `<span>${t.name}:${t.time}s</span>`).join("")}
    `;
          parent.insertBefore(info, item.nextSibling);
        });
      });
    });

    const btns = document.createElement("div");
    btns.className = "workout-button-container";
    btns.innerHTML = `
      <button type="button" id="start-workout">Start Workout</button>
      <button type="button" id="end-workout">End Workout</button>
    `;
    section.appendChild(btns);
    console.log(section);
    const startBtn = document.getElementById("start-workout");
    const endBtn = document.getElementById("end-workout");
    startBtn.addEventListener("click", () => {
      section.querySelectorAll(".set-item").forEach((item) => {
        if (item.querySelector(".set-checkbox")) return;

        const sp = document.createElement("span");
        sp.textContent = "Mark as complete";
        sp.className = "mark-complete-text";
        sp.style = "font-size:0.80rem";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "set-checkbox";
        cb.addEventListener("click", (e) => {
          e.stopPropagation();
        });
        cb.addEventListener("change", () => {
          cb.disabled = true;
          const sel = item.querySelector(".weight-type");
          const kick = item.querySelector(".weight-kicker");
          if (sel) sel.disabled = true;
          if (kick) kick.disabled = true;
        });
        item.appendChild(sp);
        item.appendChild(cb);
      });
    });

    endBtn.addEventListener("click", async (e) => {
      const exRes = await fetch("/admin/exercitii");
      if (!exRes.ok) {
        console.error("Failed to load exercises");
        return;
      }
      const exercitii = await exRes.json();

      const exerciseCards = document.querySelectorAll(".exercise-card");

      for (const card of exerciseCards) {
        const titleEl = card.querySelector("h3");
        const exName = titleEl?.textContent.trim();
        const match = exercitii.find((e) => e.name === exName);
        console.log(match);
        if (!match) {
          console.warn("No matching exercise for", exName);
          continue;
        }
        const exId = match.id;

        const checkboxes = Array.from(
          card.querySelectorAll("input[type='checkbox']")
        );
        const activity_cnt = checkboxes.filter((cb) => cb.checked).length;

        const setItems = Array.from(card.querySelectorAll(".set-item"));
        const time = setItems.reduce((sum, item) => {
          const duration = item.querySelector(".set-duration");
          const input = item.querySelector("input");
          let d = 0;
          if (duration) {
            const dd = duration.textContent.slice(0, -4);
            if (input.checked) d = Number(dd);
          }
          return sum + d;
        }, 0);

        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const payload = {
          id_exercitiu: exId,
          id_user: userId,
          activity_cnt,
          time,
        };
        console.log("Payload: ", payload);

        try {
          const res = await fetch("/api/activities", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            console.error("Failed saving activity:", await res.text());
          } else {
            console.log("Activity saved for", exName);
          }
        } catch (err) {
          console.error("Network error:", err);
        }

        const allSetInfos = [];
        document.querySelectorAll(".exercise-card").forEach((card) => {
          const exName = card.querySelector("h3").textContent.trim();
          const ex = exercitii.find((e) => e.name === exName);
          if (!ex) return;
          const exId = ex.id;

          card.querySelectorAll(".set-item").forEach((item) => {
            const cb = item.querySelector("input[type=checkbox]");
            if (!cb || !cb.checked) return; // only for checked sets

            const weightType = item.querySelector(".weight-type")?.value;
            const kickerRaw = item.querySelector(".weight-kicker")?.value;
            const weightKicker = kickerRaw ? parseFloat(kickerRaw) : 0;

            allSetInfos.push({
              id_exercitiu: exId,
              weight_type: weightType,
              weight_kicker: weightKicker,
            });
          });
        });

        if (allSetInfos.length) {
          const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
          await fetch("/api/setinfo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(allSetInfos),
          });
          console.log("✓ Set weights saved");
        }
      }

      const allSets = Array.from(document.querySelectorAll(".set-item"));

      const completed = allSets.filter(
        (item) => item.querySelector("input[type='checkbox']")?.checked
      );
// 🔍 DEBUG – vezi fiecare set bifat + durata
completed.forEach((item, idx) => {
  const durText = item.querySelector(".set-duration")?.textContent || "0";
  const exerciseName = item.closest(".exercise-card")?.querySelector("h3")?.textContent || "??";
  console.log(`✔️ Set ${idx + 1} from ${exerciseName}: ${durText}`);
});

      const wk_cnt = completed.length;
      const duration = completed.reduce((sum, item) => {
        const dd = parseFloat(
          item.querySelector(".set-duration").textContent.slice(0, -4)
        );
        return sum + dd;
      }, 0);
      
console.log("🧮 Workout duration (minutes):", duration);
console.log("📌 currentWorkoutId:", currentWorkoutId);

      if (currentWorkoutId != null) {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        fetch("/api/workout-activities", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_workout: currentWorkoutId,
            wk_cnt: 1,
            duration,
          }),
        })
          .then((r) => r.ok || console.error("WorkoutActivity failed", r))
          .then(() =>
            console.log("✓ WorkoutActivity saved", { wk_cnt, duration })
          );
      }

      section
        .querySelectorAll(".weight-type")
        .forEach((t) => (t.disabled = false));
      section
        .querySelectorAll(".weight-kicker")
        .forEach((k) => (k.disabled = false));
      section.querySelectorAll(".set-checkbox").forEach((cb) => cb.remove());
      section.querySelectorAll(".set-info").forEach((info) => info.remove());
      section.querySelectorAll("span").forEach((sp) => sp.remove());
    });
  }
});

setTimeout(() => {
  const weightKickers = document.querySelectorAll(".weight-kicker");
  for (kicker of weightKickers) {
    kicker.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  const weightSets = document.querySelectorAll(".set-weight");
  for (set of weightSets) {
    set.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  const weightTypes = document.querySelectorAll(".weight-type");
  for (type of weightTypes) {
    type.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}, 500);
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
});
