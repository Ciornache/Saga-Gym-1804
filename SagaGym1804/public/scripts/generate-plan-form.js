function updateMuscleGroupSelects() {
  const allSelects = document.querySelectorAll('select[name="muscle-group[]"]');
  const selectedValues = Array.from(allSelects)
    .map((select) => select.value)
    .filter((value) => value !== "select");

  allSelects.forEach((select) => {
    Array.from(select.options).forEach((option) => {
      if (
        option.value !== select.value &&
        selectedValues.includes(option.value)
      ) {
        option.disabled = true;
      } else {
        option.disabled = false;
      }
    });
  });
}

document
  .getElementById("difficulty-level")
  .addEventListener("input", function () {
    document.getElementById("difficulty-value").textContent = this.value;
  });

document
  .getElementById("muscle-group-1")
  .addEventListener("change", updateMuscleGroupSelects);

document
  .getElementById("add-muscle-group")
  .addEventListener("click", function () {
    const container = document.getElementById("muscle-group-container");
    const existingSelects = container.querySelectorAll(
      'select[name="muscle-group[]"]'
    );

    if (existingSelects.length >= 7) {
      return;
    }

    const groups = [
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "legs",
      "abs",
    ];
    const currentSelections = Array.from(existingSelects)
      .map((s) => s.value)
      .filter((value) => value !== "select");

    const defaultValue =
      groups.find((g) => !currentSelections.includes(g)) || "select";

    const count = existingSelects.length + 1;
    const wrapper = document.createElement("div");
    wrapper.className = "additional-muscle-group";

    const label = document.createElement("label");
    label.setAttribute("for", "muscle-group-" + count);
    label.textContent = "Muscle Group:";

    const select = document.createElement("select");
    select.id = "muscle-group-" + count;
    select.name = "muscle-group[]";

    const promptOption = document.createElement("option");
    promptOption.value = "select";
    promptOption.textContent = "Select A Muscle Group";
    select.appendChild(promptOption);

    groups.forEach(function (group) {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group.charAt(0).toUpperCase() + group.slice(1);
      select.appendChild(option);
    });

    select.value = defaultValue;

    select.addEventListener("change", updateMuscleGroupSelects);

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    container.appendChild(wrapper);

    updateMuscleGroupSelects();

    if (
      container.querySelectorAll('select[name="muscle-group[]"]').length >= 7
    ) {
      document.getElementById("add-muscle-group").disabled = true;
    }
  });

document.addEventListener("DOMContentLoaded", async () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return;

  const res = await fetch("/token/getuser", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const { interval_varsta } = await res.json();
  console.log(interval_varsta);

  const maxByInterval = {
    "18-25": 5,
    "26-35": 4.5,
    "36-45": 3.6,
    "60+": 2.5,
  };
  const maxDiff = maxByInterval[interval_varsta] ?? 5;

  const diffInput = document.getElementById("difficulty-level");
  const diffValueSpan = document.getElementById("difficulty-value");
  diffInput.max = maxDiff;
  if (parseFloat(diffInput.value) > maxDiff) {
    diffInput.value = maxDiff;
    diffValueSpan.textContent = maxDiff;
  }

  const label = document.querySelector('label[for="difficulty-level"]');
  label.insertAdjacentHTML(
    "beforeend",
    `<small style="margin-left:.5em;color:#666">
       Max difficulty for your age (${interval_varsta})
     </small>`
  );
  async function workoutNameExists(name) {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch(
      `/api/check-workout-name?name=${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    return data.exists;
  }

  const form = document.getElementById("training-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.querySelector("#workout-name");
    const workoutName = nameInput?.value.trim();

    if (!workoutName) {
      alert("Please enter a workout name.");
      return;
    }
    if (await workoutNameExists(workoutName)) {
      alert(
        "You already have a workout with that name. Please choose another."
      );
      return;
    }
    onGenerate(e);
  });
  document.getElementById("difficulty-level").addEventListener("input", (e) => {
    document.getElementById("difficulty-value").textContent = e.target.value;
  });
});

async function onGenerate(e) {
  const purpose = document.getElementById("training-type").value;
  const name = document.getElementById("workout-name").value;
  console.log(name);
  const targetDiff = parseFloat(
    document.getElementById("difficulty-level").value
  );

  const all = await fetch("/admin/exercitii").then((r) => r.json());

  const muscleGroups = Array.from(document.getElementsByName("muscle-group[]"))
    .map((sel) => sel.value)
    .filter((v) => v !== "select");

  const filtered = all.filter((ex) =>
    muscleGroups.some((m) => ex.muscle_groups.includes(m))
  );

  const workouts = [4, 5, 6].map((count) =>
    makeWorkout(filtered, targetDiff, count, purpose, name, muscleGroups)
  );

  window.parent.postMessage(
    {
      type: "generatedWorkouts",
      workouts,
      purpose,
      name,
    },
    "*"
  );
}

function makeWorkout(exs, targetDiff, count, purpose, name, muscleGroups) {
  const weightsMap = {};
  muscleGroups.forEach((mg, i) => {
    weightsMap[mg] = muscleGroups.length - i;
  });

  const purposeMapping = {
    "gain muscle": [
      { name: "strength", difficulty: 5 },
      { name: "calisthenics", difficulty: 5 },
    ],
    "lose weight": [
      { name: "cardio", difficulty: 5 },
      { name: "calisthenics", difficulty: 3 },
    ],
    "gain strength": [
      { name: "strength", difficulty: 3.5 },
      { name: "calisthenics", difficulty: 4 },
    ],
    "well being & mantainance": [
      { name: "cardio", difficulty: 3 },
      { name: "calisthenics", difficulty: 2.5 },
      { name: "kinetotherapy", difficulty: 4 },
      { name: "strength", difficulty: 2.5 },
    ],
  };

  const mapping = purposeMapping[purpose];
  let candidates = exs.filter((e) =>
    mapping.some((m) => e.type === m.name && e.difficulty <= m.difficulty)
  );

  const scored = candidates.map((ex) => {
    const muscleScore = ex.muscle_groups.reduce(
      (sum, mg) => sum + (weightsMap[mg] || 0),
      0
    );
    const diffScore = 1 / (1 + Math.abs(ex.difficulty - targetDiff));
    return { ex, weight: muscleScore * diffScore };
  });

  function weightedSample(arr, k) {
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < k && copy.length; i++) {
      const total = copy.reduce((s, it) => s + it.weight, 0);
      let r = Math.random() * total;
      for (let j = 0; j < copy.length; j++) {
        r -= copy[j].weight;
        if (r <= 0) {
          out.push(copy[j].ex);
          copy.splice(j, 1);
          break;
        }
      }
    }
    return out;
  }

  const pick = weightedSample(scored, count);
  return pick.map((ex, idx) => {
    const setsCount = getRandomInt(3, 5);
    let totalExDur = 0;

    const sets = Array.from({ length: setsCount }, (_, si) => {
      totalExDur = 0;
      const reps = getRandomInt(12, 15);
      let setDur = 0;
      const repetitions = [];
      for (let ri = 0; ri < reps; ri++) {
        const timings = splitPhases(ex.rep_duration);
        setDur += ex.rep_duration;
        repetitions.push({ id: ri + 1, duration: ex.rep_duration, timings });
      }
      const pause = getRandomInt(60, 75);
      totalExDur += (setDur + pause) * setsCount;
      const timingArray = [
        { name: "isolated", time: repetitions[0].timings[0] },
        { name: "excentric", time: repetitions[0].timings[1] },
        { name: "concentric", time: repetitions[0].timings[2] },
      ];
      console.log("Set duration", setDur);
      return {
        id: si + 1,
        repetitions,
        pause,
        duration: setDur,
        timings: timingArray,
      };
    });
    console.log(sets);
    return {
      id: idx + 1,
      exercise_id: ex.id,
      name: ex.name,
      difficulty: ex.difficulty,
      sets,
      duration: totalExDur,
      muscle_groups: ex.muscle_groups,
    };
  });
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function splitPhases(repDur) {
  const a = Math.random() * repDur,
    b = Math.random() * repDur;
  const [c1, c2] = [a, b].sort((x, y) => x - y);
  return [+c1.toFixed(2), +(c2 - c1).toFixed(2), +(repDur - c2).toFixed(2)];
}
