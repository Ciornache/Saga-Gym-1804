async function fetchExercise(exerciseName) {
  const resp = await fetch("/exercise/getExerciseByName", {
    method: "GET",
    headers: { name: exerciseName },
  });
  console.log("fetchExercise resp:", resp);
  if (!resp.ok) {
    throw new Error(`Server returned ${resp.status} for "${exerciseName}"`);
  }
  return resp.json();
}

async function fetchJSON(path) {
  const resp = await fetch(path);
  if (!resp.ok) {
    throw new Error(`Could not load ${path}: ${resp.status}`);
  }
  return resp.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("exercise-name");
    console.log("Param exercise-name:", name);
    if (!name) throw new Error("Parametrul 'exercise-name' lipsește.");

    const ex = await fetchExercise(name);
    console.log("Exercise data:", ex);

    populatePage(ex);

    const allInstr = await fetchJSON("data/instructions.json");
    const instrObj = allInstr.find((i) => i.name === ex.name);
    if (instrObj) {
      populateInstructions(instrObj.description);
    } else {
      console.warn("No instructions found for", ex.name);
    }

    const allTips = await fetchJSON("data/tips-and-tricks.json");
    const tipsObj = allTips.find((t) => t.name === ex.name);
    if (tipsObj) {
      populateTips(tipsObj.description);
    } else {
      console.warn("No tips found for", ex.name);
    }
  } catch (err) {
    console.error(err);
    showError(err.message);
  }

  const viewMoreEl = document.getElementById("view-more");
  const detailsEl = document.querySelector(".exercise-details");

  viewMoreEl.addEventListener("click", () => {
    const isHidden = detailsEl.classList.toggle("hidden");
    viewMoreEl.textContent = isHidden ? "View More" : "View Less";
  });
});

function populatePage(data) {
  document.getElementById("exercise-title").textContent = data.name;
  document.getElementById("score").textContent = data.score;
  document.getElementById("difficulty").textContent = data.difficulty;
  document.getElementById("risk").textContent = data.risk;
  document.getElementById("short-desc").textContent = data.description;
  const musclesEl = document.getElementById("targeted-muscles");
  musclesEl.innerHTML = "";

  (data.muscle_groups || []).forEach((src) => {
    console.log(src);
    const img = document.createElement("img");
    img.src = `assets/images/grupe_musculare/${src}.png`;
    img.alt = "muscle icon";
    img.classList.add("muscle-icon");
    musclesEl.appendChild(img);
  });

  const imageWrapper = document.querySelector(".image-mode");
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

  const imgEl = document.getElementById("exercise-image");
  let idx = 0;
  let imgs = [data.cover_image];
  imgs.push(imgs[0]);
  console.log(imgs);
  if (imgs.length) {
    imgEl.src = `${imgs[0]}`;
    document.querySelector(".next-image").onclick = () => {
      const nextIdx = (idx + 1) % imgs.length;
      slideTo(nextIdx, "next");
    };

    document.querySelector(".prev-image").onclick = () => {
      const prevIdx = (idx - 1 + imgs.length) % imgs.length;
      slideTo(prevIdx, "prev");
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
  const isYouTubeUrl = (url) => /youtu(?:\.be|be\.com)\/.+/.test(url);

  if (isYouTubeUrl(data.video)) {
    let videoId = data.video.split("v=")[1] || data.video.split("/").pop();
    videoId = videoId.split("&")[0];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    iframeEl.src = embedUrl;
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
  tipsArr.forEach(({ index, tip }) => {
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
