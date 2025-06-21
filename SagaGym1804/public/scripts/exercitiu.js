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
    console.log("HERE");
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
    const instrObj = allInstr.find((i) => i.name === ex.name);
    if (instrObj) populateInstructions(instrObj.description);

    const allTips = await fetchJSON("data/tips-and-tricks.json");
    const tipsObj = allTips.find((t) => t.name === ex.name);
    if (tipsObj) populateTips(tipsObj.description);

    document.getElementById("exercise-title").dataset.id = ex.id;
    console.log("EXX");
    await incarcaReviewuriExercitiu();
  } catch (err) {
    console.error(err);
    showError(err.message);
    return;
  }

  const viewMoreEl = document.getElementById("view-more");
  const detailsEl = document.querySelector(".exercise-details");
  viewMoreEl?.addEventListener("click", () => {
    const hidden = detailsEl.classList.toggle("hidden");
    viewMoreEl.textContent = hidden ? "View More" : "View Less";
  });
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

  const imgModeBtn = document.querySelector(".image-toggle");
  const vidModeBtn = document.querySelector(".video-toggle");
  const videoWrapper = document.querySelector(".video-mode");

  imgModeBtn.addEventListener("click", () => {
    imageWrapper.classList.add("active");
    videoWrapper.classList.remove("active");
    imgModeBtn.classList.add("active");
    vidModeBtn.classList.remove("active");
  });

  vidModeBtn.addEventListener("click", () => {
    videoWrapper.classList.add("active");
    imageWrapper.classList.remove("active");
    vidModeBtn.classList.add("active");
    imgModeBtn.classList.remove("active");
  });

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
  document.querySelector(
    "main"
  ).innerHTML = `<p class="error">Eroare: ${msg}</p>`;
}

async function incarcaReviewuriExercitiu() {
  const container = document.getElementById("reviews-list");
  const exerciseId = document.getElementById("exercise-title").dataset.id;
  if (!container || !exerciseId) return;

  let currentUserEmail = null;
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserEmail = payload.email;
    } catch {}
  }

  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch(`/api/reviews?exerciseId=${exerciseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const list = await res.json();
    console.log("Lista", list);
    container.innerHTML = "";

    list.forEach((r) => {
      const div = document.createElement("div");
      div.className = "review-item";
      const starHtml = Array(5)
        .fill()
        .map(
          (_, i) =>
            `<i class="fa-solid fa-medal" style="color:${
              i < r.rating ? "#e76f66" : "#ccc"
            }"></i>`
        )
        .join("");

      div.innerHTML = `
        <div class="stars">${starHtml}</div>
        <p class="review-meta">
          <strong>${r.userEmail || "Anonim"}</strong>
          ${
            r.userEmail === currentUserEmail
              ? `<button class="btn-delete" data-id="${r._id}">🗑️</button>`
              : ""
          }
        </p>
        <p>${r.comment.replace(/\n/g, "<br>")}</p>
        <small>${new Date(r.createdAt).toLocaleString("ro-RO", {
          dateStyle: "medium",
          timeStyle: "short",
        })}</small>
      `;

      const likeBtn = document.createElement("button");
      likeBtn.className = "like-btn";
      likeBtn.textContent = "👍";
      likeBtn.style.marginLeft = "1rem";
      likeBtn.title = "Apreciază recenzia";

      (async () => {
        try {
          console.log("Here", r, r._id);
          const token =
            sessionStorage.getItem("token") || localStoage.getItem("token");
          const likeRes = await fetch(`/api/review-likes/${r._id.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
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
          const res = await fetch(`/api/review-likes/${r._id.toString()}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
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
                Authorization: `Bearer ${token}`,
              },
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
    console.log(err);
    container.innerHTML =
      "<p style='color:red'>Eroare la încărcarea recenziilor</p>";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
});
