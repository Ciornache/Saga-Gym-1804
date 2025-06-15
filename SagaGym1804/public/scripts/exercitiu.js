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

    document.getElementById("exercise-title").dataset.id = ex._id;
    await incarcaReviewuriExercitiu();
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

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Trebuie să fii autentificat pentru a trimite un review.");
    return;
  }

  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ exerciseId, rating, comment: comentariu })
    });

    if (!res.ok) throw new Error(await res.text());
    await incarcaReviewuriExercitiu();
    alert("✅ Review salvat (nou sau înlocuit)");
    document.getElementById("reviewuri-rating").value = "";
    document.getElementById("reviewuri-comentariu").value = "";
  } catch (err) {
    alert("Eroare la trimitere: " + err.message);
  }
}

async function incarcaReviewuriExercitiu() {
  const container = document.getElementById("reviews-list");
  const exerciseId = document.getElementById("exercise-title").dataset.id;
  if (!container || !exerciseId) return;

  let currentUserEmail = null;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserEmail = payload.email;
    } catch {}
  }

  try {
    const res = await fetch(`/api/reviews?exerciseId=${exerciseId}`);
    const list = await res.json();
    container.innerHTML = "";

    list.forEach(r => {
      const div = document.createElement("div");
      div.className = "review-item";
      const starHtml = Array(5).fill().map((_, i) =>
        `<i class="fa-solid fa-medal" style="color:${i < r.rating ? '#e76f66' : '#ccc'}"></i>`).join("");

      div.innerHTML = `
        <div class="stars">${starHtml}</div>
        <p class="review-meta">
          <strong>${r.userEmail || 'Anonim'}</strong>
          ${r.userEmail === currentUserEmail ? `<button class="btn-delete" data-id="${r._id}">🗑️</button>` : ""}
        </p>
        <p>${r.comment.replace(/\n/g, '<br>')}</p>
        <small>${new Date(r.createdAt).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })}</small>
      `;

      // 🔥 LIKE button pentru toate review-urile
      const likeBtn = document.createElement("button");
      likeBtn.className = "like-btn";
      likeBtn.textContent = "👍";
      likeBtn.style.marginLeft = "1rem";
      likeBtn.title = "Apreciază recenzia";

      (async () => {
        try {
          const likeRes = await fetch(`/api/review-likes/${r._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await likeRes.json();
          likeBtn.textContent = `👍 ${data.count}`;
          if (data.liked) likeBtn.classList.add("liked");
        } catch {
          likeBtn.textContent = "👍 0";
        }
      })();

      likeBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(`/api/review-likes/${r._id}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Like nereușit");
          await incarcaReviewuriExercitiu();
        } catch (err) {
          alert("Eroare la like: " + err.message);
        }
      });

      div.appendChild(likeBtn);

      const btn = div.querySelector(".btn-delete");
      if (btn) {
        btn.addEventListener("click", async () => {
          if (!confirm("Sigur vrei să ștergi această recenzie?")) return;
          try {
            const res = await fetch(`/api/reviews/${r._id}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            if (!res.ok) throw new Error();
            await incarcaReviewuriExercitiu();
            alert("Review șters!");
          } catch {
            alert("Eroare la ștergere.");
          }
        });
      }

      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "<p style='color:red'>Eroare la încărcarea recenziilor</p>";
  }
}