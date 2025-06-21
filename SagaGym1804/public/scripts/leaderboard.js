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
  if (token) window.location.href = "Account.html";
  else window.location.href = "login.html";
});

(async function () {
  const genderData = [
    { value: "male", label: "Male", icon: "fa-mars" },
    { value: "female", label: "Female", icon: "fa-venus" },
  ];

  const muscleGroups = await fetch("assets/grupe_musculare.json").then((r) =>
    r.json()
  );
  const muscleData = muscleGroups.map((m) => ({ value: m.id, label: m.name }));

  const exercitii = await fetch("/admin/exercitii").then((r) => r.json());
  const typeSet = new Set(exercitii.map((e) => e.type));
  const workoutTypeData = Array.from(typeSet).map((t) => ({
    value: t,
    label: t,
  }));

  const signupText = await fetch("signup.html").then((r) => r.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(signupText, "text/html");
  const ageInputs = doc.querySelectorAll('input[name="age"]');
  const ageData = Array.from(ageInputs).map((input) => {
    const lbl = doc.querySelector(`label[for="${input.id}"]`);
    return {
      value: input.value,
      label: lbl ? lbl.textContent.trim() : input.value,
    };
  });

  const weightIntervals = [
    "<60",
    "60-70",
    "70-80",
    "80-90",
    "90-100",
    "100-110",
    "110-120",
    "120-130",
    "130-140+",
  ];
  const weightData = weightIntervals.map((w) => ({ value: w, label: w }));

  const criteriaKeys = ["gender", "workoutType", "age", "muscle", "weight"];
  const criteriaData = {
    gender: genderData,
    workoutType: workoutTypeData,
    age: ageData,
    muscle: muscleData,
    weight: weightData,
  };

  const selected = { gender: "female" };

  const menuSpans = document.querySelectorAll(".lead-criterias span");
  const optionsContainer = document.querySelector(".criteria-options");
  let isFirst = true;

  function renderOptions(key) {
    optionsContainer.innerHTML = "";
    const list = criteriaData[key] || [];
    list.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      if (item.icon) {
        const i = document.createElement("i");
        i.className = `fas ${item.icon}`;
        btn.append(i, " ");
      }
      btn.append(item.label);
      btn.dataset.value = item.value;
      if (isFirst && item.value === "female") {
        btn.classList.add("selected");
        isFirst = false;
      }
      btn.addEventListener("click", () => {
        const isAlreadySelected = btn.classList.contains("selected");

        optionsContainer
          .querySelectorAll(".option")
          .forEach((o) => o.classList.remove("selected"));

        if (isAlreadySelected) {
          btn.classList.remove("selected");
          selected[key] = undefined;
        } else {
          btn.classList.add("selected");

          if (key !== "muscle") selected[key] = item.value;
          else selected[key] = item.label;
        }
        console.log("Rendering");
        renderLeaderboard();
      });
      optionsContainer.append(btn);
    });
  }

  menuSpans.forEach((span, idx) => {
    const key = criteriaKeys[idx];
    if (key === "gender") span.classList.add("active");
    span.dataset.key = key;
    span.addEventListener("click", () => {
      menuSpans.forEach((s) => s.classList.remove("active"));
      span.classList.add("active");
      renderOptions(key);
    });
  });

  renderLeaderboard();

  if (menuSpans[0]) menuSpans[0].click();

  async function renderLeaderboard() {
    const params = new URLSearchParams();
    Object.entries(selected).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    const rows = await res.json();

    const table = document.querySelector(".leaderboard");
    const filterInfo = document.getElementById("filter-info");
    const filterCriterias = Object.entries(selected)
      .filter(([key, value]) => value)
      .map(([key, value]) => {
        if (value)
          return (
            String(key).charAt(0).toUpperCase() +
            String(key).slice(1) +
            ": " +
            value
          );
      })
      .join(", ");
    filterInfo.textContent = `Filtered by: ${filterCriterias || "None"}`;

    table.innerHTML =
      "<tr><th>Username</th><th>Score</th><th>Join Date</th></tr>";
    rows.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${u.score.toFixed(2)}</td>
        <td>${new Date(u.joinDate).toLocaleDateString()}</td>
      `;
      table.appendChild(tr);
    });
  }

  document.getElementById("download-json").style.fontFamily =
    "Goldman, sans-serif";
  document.getElementById("download-pdf").style.fontFamily =
    "Goldman, sans-serif";

  document.getElementById("download-json").addEventListener("click", () => {
    const data = Array.from(
      document.querySelectorAll(".leaderboard tr:not(:first-child)")
    ).map((tr) => {
      const [u, s, d] = tr.querySelectorAll("td");
      return {
        username: u.textContent,
        score: parseFloat(s.textContent),
        joinDate: d.textContent,
      };
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leaderboard.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document
    .getElementById("download-pdf")
    .addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const container = document.querySelector(".table-container");

      const prevHeight = container.style.height;
      const fullCanvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });

      container.style.height = prevHeight;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 20;

      pdf.setFontSize(18);

      const yStart = margin + 30;
      const availH = ph - yStart - margin;
      const availW = pw - margin * 2;

      const pxPerPt = fullCanvas.width / availW;
      const slicePx = Math.floor(availH * pxPerPt);

      let page = 0;
      while (page * slicePx < fullCanvas.height) {
        const thisSliceH = Math.min(
          slicePx,
          fullCanvas.height - page * slicePx
        );

        const slice = document.createElement("canvas");
        slice.width = fullCanvas.width;
        slice.height = thisSliceH;
        slice
          .getContext("2d")
          .drawImage(
            fullCanvas,
            0,
            page * slicePx,
            fullCanvas.width,
            thisSliceH,
            0,
            0,
            fullCanvas.width,
            thisSliceH
          );

        const imgData = slice.toDataURL("image/png");
        const imgH = thisSliceH / pxPerPt;
        const posY = page === 0 ? yStart : margin;

        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, posY, availW, imgH);

        page++;
      }

      pdf.save("leaderboard.pdf");
    });
})();
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
});
