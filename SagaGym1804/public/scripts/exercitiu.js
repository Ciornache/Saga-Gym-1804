// public/scripts/exercitiu.js

async function fetchExercise(exerciseName) {
  const resp = await fetch("/exercise/getExerciseByName", {
    method: "GET",
    headers: { name: exerciseName },
  });
  if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
  return resp.json();
}

async function fetchJSON(path) {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Could not load ${path}: ${resp.status}`);
  return resp.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("exercise-name");
    if (!name) throw new Error("Parametrul 'exercise-name' lipsește.");

    const ex = await fetchExercise(name);
    populatePage(ex);

    const allInstr = await fetchJSON("data/instructions.json");
    const instrObj = allInstr.find(i => i.name === ex.name);
    if (instrObj) populateInstructions(instrObj.description);

    const allTips = await fetchJSON("data/tips-and-tricks.json");
    const tipsObj = allTips.find(t => t.name === ex.name);
    if (tipsObj) populateTips(tipsObj.description);

    // setează ID exercițiu pentru review
    document.getElementById("exercise-title").dataset.id = ex._id;
    incarcaReviewuriExercitiu();
  } catch (err) {
    console.error(err);
    showError(err.message);
    return;
  }

  const viewMoreEl = document.getElementById("view-more");
  const detailsEl  = document.querySelector(".exercise-details");
  viewMoreEl?.addEventListener("click", () => {
    const hidden = detailsEl.classList.toggle("hidden");
    viewMoreEl.textContent = hidden ? "View More" : "View Less";
  });

  document.getElementById("submit-review")?.addEventListener("click", handleReviewSubmit);
});

function populatePage(data) {
  const titleEl = document.getElementById("exercise-title");
  titleEl.textContent = data.name;
  document.getElementById("difficulty").textContent = data.difficulty;
  document.getElementById("risk").textContent = data.risk;
  document.getElementById("short-desc").textContent = data.description;
  document.getElementById("score").textContent = data.score;

  const musclesEl = document.getElementById("targeted-muscles");
  musclesEl.innerHTML = "";
  (data.muscle_groups || []).forEach((src) => {
    const img = document.createElement("img");
    img.src = `assets/images/grupe_musculare/${src}.png`;
    img.alt = "muscle icon";
    img.classList.add("muscle-icon");
    musclesEl.appendChild(img);
  });

  const imageWrapper = document.querySelector(".image-mode");
  const imgEl = document.getElementById("exercise-image");
  let idx = 0;
  let imgs = [data.cover_image, ...(data.images || [])];

  function slideTo(newIdx) {
    imageWrapper.classList.add("animate-out");
    imageWrapper.addEventListener("animationend", function handleOut(e) {
      if (e.animationName !== "slide-out-left") return;
      imageWrapper.removeEventListener("animationend", handleOut);
      imageWrapper.classList.remove("animate-out");

      idx = newIdx;
      imgEl.src = `${imgs[idx]}`;

      imageWrapper.classList.add("animate-in");
      imageWrapper.addEventListener("animationend", function handleIn(e2) {
        if (e2.animationName !== "slide-in-right") return;
        imageWrapper.removeEventListener("animationend", handleIn);
        imageWrapper.classList.remove("animate-in");
      });
    });
  }

  if (imgs.length) {
    imgEl.src = imgs[0];
    document.querySelector(".next-image").onclick = () => {
      const nextIdx = (idx + 1) % imgs.length;
      slideTo(nextIdx);
    };
    document.querySelector(".prev-image").onclick = () => {
      const prevIdx = (idx - 1 + imgs.length) % imgs.length;
      slideTo(prevIdx);
    };
  }

  const iframeEl = document.getElementById("exercise-iframe");
  if (/youtu(?:\.be|be\.com)\/.+/.test(data.video)) {
    let videoId = data.video.split("v=")[1] || data.video.split("/").pop();
    videoId = videoId.split("&")[0];
    iframeEl.src = `https://www.youtube.com/embed/${videoId}`;
    iframeEl.style.display = "block";
  }
}

function populateInstructions(text) {
  const container = document.getElementById("instructions-container");
  container.innerHTML = "";
  text.split("\n").forEach((para) => {
    const p = document.createElement("p");
    p.textContent = para.trim();
    container.appendChild(p);
  });
}

function populateTips(tipsArr) {
  const ol = document.getElementById("tips-list");
  ol.innerHTML = "";
  tipsArr.forEach(({ tip }) => {
    const li = document.createElement("li");
    li.textContent = tip;
    ol.appendChild(li);
  });
}

function showError(msg) {
  document.querySelector("main").innerHTML = `<p class="error">Eroare: ${msg}</p>`;
}

async function handleReviewSubmit() {
  const exerciseId = document.getElementById("exercise-title").dataset.id;
  const rating = parseInt(document.getElementById("reviewuri-rating").value);
  const comentariu = document.getElementById("reviewuri-comentariu").value.trim();

  if (!exerciseId || !rating || !comentariu) {
    alert("Completează toate câmpurile!");
    return;
  }

  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
  exerciseId,
  rating,
  comment: comentariu
})

    });
    if (!res.ok) throw new Error(await res.text());
    alert("✅ Review adăugat cu succes!");
    document.getElementById("reviewuri-rating").value = "";
    document.getElementById("reviewuri-comentariu").value = "";
    await incarcaReviewuriExercitiu();
  } catch (err) {
    alert("Eroare la trimitere: " + err.message);
  }
}

async function incarcaReviewuriExercitiu() {
  const exerciseId = document.getElementById("exercise-title").dataset.id;
  const container = document.getElementById("reviews-list");
  if (!exerciseId || !container) return;

  try {
    const res = await fetch(`/api/reviews?exerciseId=${exerciseId}`);
    const list = await res.json();

    container.innerHTML = "";
   list.forEach(r => {
  const div = document.createElement("div");
  div.className = "review-item";
  div.innerHTML = `
    <div class="stars">
      ${Array(5).fill().map((_, i) =>
        `<i class="fa-solid fa-medal" style="color:${i < r.rating ? '#e76f66' : '#ccc'}"></i>`).join("")}
    </div>
    <p>${r.comment.replace(/\n/g, "<br>")}</p>
    <small>${new Date(r.createdAt).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })}</small>
  `;
  container.appendChild(div);
});
  } catch (err) {
    container.innerHTML = "<p style='color:red'>Eroare la încărcarea recenziilor</p>";
  }
}
