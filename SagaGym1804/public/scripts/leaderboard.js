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
      if (item.value === "female") btn.classList.add("selected");
      btn.addEventListener("click", () => {
        if (key !== "muscle") selected[key] = item.value;
        else selected[key] = item.label;
        optionsContainer
          .querySelectorAll(".option")
          .forEach((o) => o.classList.remove("selected"));
        btn.classList.add("selected");
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

  console.log(selected);
  renderLeaderboard();

  if (menuSpans[0]) menuSpans[0].click();

  async function renderLeaderboard() {
    const active = document.querySelector(".lead-criterias .active");
    if (!active) return;
    const key = active.dataset.key;
    const value = selected[key];
    if (!value) return;

    const params = new URLSearchParams();
    params.set(key, value);

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/leaderboard?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rows = await res.json();
    console.log("🏆 leaderboard rows for", key, value, rows);

    const table = document.querySelector(".leaderboard");
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

      const tableEl = document.querySelector(".leaderboard");
      const prevHeight = tableEl.style.height;
      tableEl.style.height = "auto";

      const canvas = await html2canvas(tableEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      tableEl.style.height = prevHeight;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const titleY = 30;

      pdf.setFontSize(18);
      pdf.text("Leaderboard", margin, titleY);

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let positionY = margin + 20; // leave space under title

      pdf.addImage(imgData, "PNG", margin, positionY, imgWidth, imgHeight);
      remainingHeight -= pageHeight - positionY - margin;

      while (remainingHeight > 0) {
        pdf.addPage();
        positionY = margin;
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          positionY,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
          0,
          -(imgHeight - remainingHeight)
        );
        remainingHeight -= pageHeight - margin * 2;
      }

      pdf.save("leaderboard.pdf");
    });
})();
