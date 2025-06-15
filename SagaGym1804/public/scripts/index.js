const workoutButton = document.querySelector(
  ".navbar .navbar-button:nth-child(4)"
);

workoutButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
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

document.querySelectorAll(".dual-slider").forEach((group) => {
  const minInput = group.querySelector(".thumb--left");
  const maxInput = group.querySelector(".thumb--right");
  const rangeDiv = group.querySelector(".slider-range");
  const display = group.querySelector(".slider-value");
  const minGap = 0.1;
  const maxValue = parseFloat(minInput.max);
  const minValue = parseFloat(minInput.min);

  function updateRange() {
    let minVal = parseFloat(minInput.value);
    let maxVal = parseFloat(maxInput.value);

    if (maxVal - minVal < minGap) {
      if (this === minInput) {
        minInput.value = maxVal - minGap;
        minVal = parseFloat(minInput.value);
      } else {
        maxInput.value = minVal + minGap;
        c;
        maxVal = parseFloat(maxInput.value);
      }
    }

    const leftPercent = ((minVal - minValue) / (maxValue - minValue)) * 100;
    const rightPercent = ((maxVal - minValue) / (maxValue - minValue)) * 100;

    rangeDiv.style.left = leftPercent + "%";
    rangeDiv.style.width = rightPercent - leftPercent + "%";

    display.textContent = minVal.toFixed(1) + " – " + maxVal.toFixed(1);
  }

  minInput.addEventListener("input", updateRange);
  maxInput.addEventListener("input", updateRange);
  updateRange.call(minInput);
});

document.querySelectorAll(".exercise-card").forEach((c) => {
  console.log("Do I even attack the event?");
  c.addEventListener("click", () => {
    console.log("Clicked on this shit");
    console.log(c);
    let title = c.querySelector("h3");
    console.log(title.textContent);
    window.location.href = `exercitiu.html?exercise-name=${title.textContent}`;
  });
});

document.querySelectorAll(".dual-slider").forEach((s) => {
  s.addEventListener("change", () => {
    applyAllFilters();
  });
});

function fillCard(cardEl, data) {
  const imgDiv = cardEl.querySelector(".img");
  imgDiv.style.backgroundImage = `url(${data.cover_image})`;
  imgDiv.style.backgroundSize = "cover";
  imgDiv.style.backgroundPosition = "center";
  cardEl.querySelector("h3").textContent = data.name;
  const stats = cardEl.querySelectorAll(".stats div");
  stats[0].innerHTML = `<i class="fa-solid fa-star"></i><span>${data.rating.toFixed(
    1
  )}</span>`;
  stats[1].innerHTML = `<i class="fa-solid fa-dumbbell"></i><span>${data.difficulty.toFixed(
    1
  )}</span>`;
  stats[2].innerHTML = `<i class="fa-solid fa-medal"></i><span>${data.rating.toFixed(
    1
  )}</span>`;
}
let exercises = [];
let exercisesToDisplay = [];

let currentPage = 1;
const pageSize = 4;

let currentSortField = null;
let currentSortOrder = null;

const selectedFilters = {
  muscleGroups: [],
  types: [],
};

const sortCriteria = [];

function updateSortCriteria(fieldName, isChecked) {
  const idx = sortCriteria.findIndex((c) => c.field === fieldName);
  if (isChecked) {
    if (idx === -1) {
      sortCriteria.push({ field: fieldName, order: "asc" });
    }
  } else {
    if (idx !== -1) sortCriteria.splice(idx, 1);
  }
}

document.getElementById("sort-score-up").addEventListener("click", () => {
  const idx = sortCriteria.findIndex((c) => c.field === "score");
  if (idx !== -1) sortCriteria[idx].order = "asc";
  else sortCriteria.push({ field: "score", order: "asc" });
  document.getElementById("sort-score-up").classList.add("selected");
  document.getElementById("sort-score-down").classList.remove("selected");
  document.getElementById("sort-score-checkbox").checked = true;
});

document.getElementById("sort-score-down").addEventListener("click", () => {
  const idx = sortCriteria.findIndex((c) => c.field === "score");
  if (idx !== -1) sortCriteria[idx].order = "asc";
  else sortCriteria.push({ field: "score", order: "asc" });
  document.getElementById("sort-score-down").classList.add("selected");
  document.getElementById("sort-score-up").classList.remove("selected");
  document.getElementById("sort-score-checkbox").checked = true;
});

document.getElementById("sort-difficulty-up").addEventListener("click", () => {
  const idx = sortCriteria.findIndex((c) => c.field === "difficulty");
  if (idx !== -1) {
    sortCriteria[idx].order = "desc";
  } else {
    sortCriteria.push({ field: "difficulty", order: "desc" });
  }
  document.getElementById("sort-difficulty-up").classList.add("selected");
  document.getElementById("sort-difficulty-down").classList.remove("selected");
  document.getElementById("sort-difficulty-checkbox").checked = true;
});

document
  .getElementById("sort-difficulty-down")
  .addEventListener("click", () => {
    const idx = sortCriteria.findIndex((c) => c.field === "difficulty");
    if (idx !== -1) {
      sortCriteria[idx].order = "desc";
    } else {
      sortCriteria.push({ field: "difficulty", order: "desc" });
    }
    document.getElementById("sort-difficulty-down").classList.add("selected");
    document.getElementById("sort-difficulty-up").classList.remove("selected");
    document.getElementById("sort-difficulty-checkbox").checked = true;
  });

document.getElementById("sort-alpha-up").addEventListener("click", () => {
  const idx = sortCriteria.findIndex((c) => c.field === "alpha");
  if (idx !== -1) {
    sortCriteria[idx].order = "asc";
  } else {
    sortCriteria.push({ field: "alpha", order: "asc" });
  }
  document.getElementById("sort-alpha-up").classList.add("selected");
  document.getElementById("sort-alpha-down").classList.remove("selected");
  document.getElementById("sort-alpha-checkbox").checked = true;
});

document.getElementById("sort-alpha-down").addEventListener("click", () => {
  const idx = sortCriteria.findIndex((c) => c.field === "alpha");
  if (idx !== -1) {
    sortCriteria[idx].order = "asc";
  } else {
    sortCriteria.push({ field: "alpha", order: "asc" });
  }
  document.getElementById("sort-alpha-down").classList.add("selected");
  document.getElementById("sort-alpha-up").classList.remove("selected");
  document.getElementById("sort-alpha-checkbox").checked = true;
});

document
  .getElementById("sort-score-checkbox")
  .addEventListener("change", (e) => {
    updateSortCriteria("score", e.target.checked);
    if (!e.target.checked) {
      document.getElementById("sort-score-up").classList.remove("selected");
      document.getElementById("sort-score-down").classList.remove("selected");
    }
  });

document
  .getElementById("sort-difficulty-checkbox")
  .addEventListener("change", (e) => {
    updateSortCriteria("difficulty", e.target.checked);
    if (!e.target.checked) {
      document
        .getElementById("sort-difficulty-up")
        .classList.remove("selected");
      document
        .getElementById("sort-difficulty-down")
        .classList.remove("selected");
    }
  });

document
  .getElementById("sort-score-checkbox")
  .addEventListener("change", (e) => {
    updateSortCriteria("score", e.target.checked);
    if (!e.target.checked) {
      document.getElementById("sort-score-up").classList.remove("selected");
      document.getElementById("sort-score-down").classList.remove("selected");
    }
  });

function sortCurrentArray() {
  if (exercisesToDisplay.length === 0) return;
  let arr = exercisesToDisplay;
  const sorted = [...arr];
  console.log(arr);
  if (sortCriteria.length === 0) {
    if (exercisesToDisplay.length > 0) {
      renderFiltered();
    } else {
      render();
    }
    return;
  }

  sorted.sort((a, b) => {
    for (const crit of sortCriteria) {
      let diff = 0;
      if (crit.field === "score") {
        diff = parseFloat(a.rating) - parseFloat(b.rating);
      } else if (crit.field === "difficulty") {
        diff = parseFloat(a.difficulty) - parseFloat(b.difficulty);
      } else if (crit.field === "alpha") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) diff = -1;
        else if (nameA > nameB) diff = 1;
        else diff = 0;
      }
      if (diff !== 0) {
        return crit.order === "asc" ? diff : -diff;
      }
    }
    return 0;
  });

  if (exercisesToDisplay.length > 0) {
    exercisesToDisplay = [...sorted];
    currentPage = 1;
    renderFiltered();
  } else {
    exercises = [...sorted];
    currentPage = 1;
    render();
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("show");
  document.body.style.overflow = "";
}

async function populateMuscleGroupsModal() {
  const container = document.getElementById("modal-list-muscle-groups");
  container.innerHTML = "";

  try {
    const resp = await fetch("/admin/grupe");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const groups = await resp.json();

    const grid = document.createElement("div");
    grid.classList.add("modal-image-grid");
    container.appendChild(grid);

    groups.forEach((groupObj) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("image-checkbox-wrapper");

      const cb = document.createElement("input");
      cb.setAttribute("type", "checkbox");
      cb.setAttribute("value", groupObj.name);
      cb.classList.add("modal-image-checkbox");
      if (selectedFilters.muscleGroups.includes(groupObj.name)) {
        cb.checked = true;
      }
      wrapper.appendChild(cb);

      const img = document.createElement("img");
      img.setAttribute("src", groupObj.image);
      img.setAttribute("alt", groupObj.name);
      img.classList.add("modal-select-image");
      wrapper.appendChild(img);

      const overlay = document.createElement("div");
      overlay.classList.add("checkmark-overlay");
      overlay.innerHTML = "✔";
      if (cb.checked) {
        overlay.classList.add("selected");
      }
      wrapper.appendChild(overlay);

      cb.addEventListener("change", (e) => {
        const val = e.target.value;
        if (e.target.checked) {
          if (!selectedFilters.muscleGroups.includes(val)) {
            selectedFilters.muscleGroups.push(val);
          }
          overlay.classList.add("selected");
        } else {
          selectedFilters.muscleGroups = selectedFilters.muscleGroups.filter(
            (m) => m !== val
          );
          overlay.classList.remove("selected");
        }
      });

      img.addEventListener("click", (e) => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change")); // manually fire "change"
      });
      overlay.addEventListener("click", (e) => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });

      grid.appendChild(wrapper);
    });
  } catch (err) {
    console.error("Failed to load muscle‐groups:", err);
    container.innerHTML = `<p style="color:red;">Error loading muscle groups</p>`;
  }
}

async function populateTypesModal() {
  const container = document.getElementById("modal-list-types");
  container.innerHTML = "";

  try {
    const resp = await fetch("/admin/tip");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const types = await resp.json();

    const grid = document.createElement("div");
    grid.classList.add("modal-image-grid");
    container.appendChild(grid);

    types.forEach((typeObj) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("image-checkbox-wrapper");

      const cb = document.createElement("input");
      cb.setAttribute("type", "checkbox");
      cb.setAttribute("value", typeObj.name);
      cb.classList.add("modal-image-checkbox");
      if (selectedFilters.types.includes(typeObj.name)) {
        cb.checked = true;
      }
      wrapper.appendChild(cb);

      const img = document.createElement("img");
      img.setAttribute("src", typeObj.image);
      img.setAttribute("alt", typeObj.name);
      img.classList.add("modal-select-image");
      wrapper.appendChild(img);

      const overlay = document.createElement("div");
      overlay.classList.add("checkmark-overlay");
      overlay.innerHTML = "✔";
      if (cb.checked) {
        overlay.classList.add("selected");
      }
      wrapper.appendChild(overlay);

      cb.addEventListener("change", (e) => {
        const val = e.target.value;
        if (e.target.checked) {
          if (!selectedFilters.types.includes(val)) {
            selectedFilters.types.push(val);
          }
          overlay.classList.add("selected");
        } else {
          selectedFilters.types = selectedFilters.types.filter(
            (t) => t !== val
          );
          overlay.classList.remove("selected");
        }
      });

      img.addEventListener("click", () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });
      overlay.addEventListener("click", () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });

      grid.appendChild(wrapper);
    });
  } catch (err) {
    console.error("Failed to load types:", err);
    container.innerHTML = `<p style="color:red;">Error loading types</p>`;
  }
}

function populateSummaryModal() {
  const summaryContainer = document.getElementById("modal-list-summary");
  summaryContainer.innerHTML = "";
  let anyFilter = false;

  if (selectedFilters.muscleGroups.length > 0) {
    anyFilter = true;
    const ul1 = document.createElement("ul");
    ul1.innerHTML = `<li><strong>Muscle Groups:</strong> ${selectedFilters.muscleGroups.join(
      ", "
    )}</li>`;
    summaryContainer.appendChild(ul1);
  }
  if (selectedFilters.types.length > 0) {
    anyFilter = true;
    const ul2 = document.createElement("ul");
    ul2.innerHTML = `<li><strong>Types:</strong> ${selectedFilters.types.join(
      ", "
    )}</li>`;
    summaryContainer.appendChild(ul2);
  }
  if (!anyFilter) {
    summaryContainer.innerHTML = "<p>No filters selected.</p>";
  }
}

function applyAllFilters() {
  let baseArray = exercises;
  if (selectedFilters.muscleGroups.length > 0) {
    baseArray = baseArray.filter((ex) => {
      return selectedFilters.muscleGroups.some((mg) =>
        ex.muscle_groups.includes(mg.toLowerCase())
      );
    });
  }

  if (selectedFilters.types.length > 0) {
    let copyArray = selectedFilters.types;
    copyArray = copyArray.map((t) => t.toUpperCase());
    baseArray = baseArray.filter((ex) =>
      copyArray.includes(ex.type.toUpperCase())
    );
  }

  const sliders = document.querySelectorAll(".dual-slider");
  const scoreSlider = sliders[0];
  const difficultySlider = sliders[1];

  // const minScore = scoreSlider.querySelector(".thumb--left").value;
  // const maxScore = scoreSlider.querySelector(".thumb--right").value;

  const minDiff = difficultySlider.querySelector(".thumb--left").value;
  const maxDiff = difficultySlider.querySelector(".thumb--right").value;

  // baseArray = baseArray.filter((ex) => {
  //     ex.score >= minScore && ex.score <= maxScore
  // });

  baseArray = baseArray.filter((ex) => {
    return (
      ex.difficulty >= parseFloat(minDiff) &&
      ex.difficulty <= parseFloat(maxDiff)
    );
  });

  console.log("After filter", baseArray);

  exercisesToDisplay = [...baseArray];
  currentPage = 1;
  renderFiltered();
}

const cards = document.querySelectorAll(".exercise-card");
const pagination = document.querySelector(".pagination");

function makeBtn(text, disabled, onClick, isActive = false) {
  const b = document.createElement("button");
  b.textContent = text;
  if (disabled) b.disabled = true;
  if (isActive) b.classList.add("active");
  b.addEventListener("click", onClick);
  return b;
}

function render() {
  const start = (currentPage - 1) * pageSize;
  cards.forEach((cardEl, idx) => {
    const ex = exercises[start + idx];
    if (ex) {
      cardEl.style.display = "";
      fillCard(cardEl, ex);
    } else {
      cardEl.style.display = "none";
    }
  });
  renderPagination(exercises.length);
}

function renderFiltered() {
  const start = (currentPage - 1) * pageSize;
  cards.forEach((cardEl, idx) => {
    const ex = exercisesToDisplay[start + idx];
    if (ex) {
      cardEl.style.display = "";
      fillCard(cardEl, ex);
    } else {
      cardEl.style.display = "none";
    }
  });
  renderPagination(exercisesToDisplay.length);
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / pageSize);
  pagination.innerHTML = "";

  const prevBtn = makeBtn("«", currentPage === 1, () => {
    if (currentPage > 1) {
      currentPage--;
      if (exercisesToDisplay.length > 0) renderFiltered();
      else render();
    }
  });
  pagination.appendChild(prevBtn);

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  if (startPage > 1) {
    const firstBtn = makeBtn(
      "1",
      false,
      () => {
        currentPage = 1;
        if (exercisesToDisplay.length > 0) renderFiltered();
        else render();
      },
      currentPage === 1
    );
    pagination.appendChild(firstBtn);

    if (startPage > 2) {
      const ell = document.createElement("span");
      ell.textContent = "…";
      ell.className = "ellipsis";
      pagination.appendChild(ell);
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    pagination.appendChild(
      makeBtn(
        p,
        false,
        () => {
          currentPage = p;
          if (exercisesToDisplay.length > 0) renderFiltered();
          else render();
        },
        p === currentPage
      )
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ell = document.createElement("span");
      ell.textContent = "…";
      ell.className = "ellipsis";
      pagination.appendChild(ell);
    }
    const lastBtn = makeBtn(
      totalPages,
      false,
      () => {
        currentPage = totalPages;
        if (exercisesToDisplay.length > 0) renderFiltered();
        else render();
      },
      currentPage === totalPages
    );
    pagination.appendChild(lastBtn);
  }

  const nextBtn = makeBtn("»", currentPage === totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      if (exercisesToDisplay.length > 0) renderFiltered();
      else render();
    }
  });
  pagination.appendChild(nextBtn);
}

function applySearch() {
  const searchInput = document.getElementById("search-input");
  const term = searchInput.value.trim().toLowerCase();
  if (term === "") {
    console.log(exercisesToDisplay);
    currentPage = 1;
    renderFiltered();
    return;
  }
  console.log(term);
  const filtered = exercisesToDisplay.filter((ex) => {
    return (
      ex.name.toLowerCase().includes(term) ||
      (ex.description && ex.description.toLowerCase().includes(term))
    );
  });

  console.log("After Search Bar", filtered);

  exercisesToDisplay = [...filtered];
  currentPage = 1;
  renderFiltered();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const resp = await fetch("/admin/exercitii");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    exercises = await resp.json();
    exercisesToDisplay = exercises;
  } catch (err) {
    console.error("Nu am putut încărca exercițiile:", err);
  }

  let arrowIndex = 0;

  const cardEls = document.querySelectorAll(".exercise-card");

  function renderArrow() {
    cardEls.forEach((cardEl, idx) => {
      const ex = exercisesToDisplay[arrowIndex + idx];
      if (ex) {
        cardEl.style.display = "";
        fillCard(cardEl, ex);
      } else {
        cardEl.style.display = "none";
      }
    });
  }

  const btnLeft = document.querySelector(".slider-angles-left");
  const btnRight = document.querySelector(".slider-angles-right");

  if (btnRight) {
    btnRight.addEventListener("click", () => {
      console.log(exercisesToDisplay);
      if (arrowIndex + 4 < exercisesToDisplay.length) {
        arrowIndex += 4;
        console.log(arrowIndex);
        renderArrow();
      }
    });
  }

  if (btnLeft) {
    btnLeft.addEventListener("click", () => {
      if (arrowIndex >= 4) {
        arrowIndex -= 4;
        renderArrow();
      }
    });
  }

  arrowIndex = 0;
  renderArrow();

  const btnOpenMuscle = document.getElementById("btn-open-muscle-modal");
  const btnCloseMuscle = document.getElementById("btn-close-muscle-modal");
  const btnApplyMuscle = document.getElementById("btn-apply-muscle-modal");
  btnOpenMuscle.addEventListener("click", async () => {
    await populateMuscleGroupsModal();
    openModal("modal-muscle-groups");
  });
  btnCloseMuscle.addEventListener("click", () =>
    closeModal("modal-muscle-groups")
  );
  btnApplyMuscle.addEventListener("click", () => {
    closeModal("modal-muscle-groups");
    applyAllFilters();
  });

  const btnOpenType = document.getElementById("btn-open-type-modal");
  const btnCloseType = document.getElementById("btn-close-type-modal");
  const btnApplyType = document.getElementById("btn-apply-type-modal");
  btnOpenType.addEventListener("click", async () => {
    await populateTypesModal();
    openModal("modal-types");
  });
  btnCloseType.addEventListener("click", () => closeModal("modal-types"));
  btnApplyType.addEventListener("click", () => {
    closeModal("modal-types");
    applyAllFilters();
  });

  const btnOpenSummary = document.getElementById("btn-open-summary-modal");
  const btnCloseSummary = document.getElementById("btn-close-summary-modal");
  btnOpenSummary.addEventListener("click", () => {
    populateSummaryModal();
    openModal("modal-summary");
  });
  btnCloseSummary.addEventListener("click", () => closeModal("modal-summary"));

  document.getElementById("btn-apply-sort").addEventListener("click", () => {
    sortCurrentArray();
  });
  const searchInput = document.getElementById("search-input");
  console.log(searchInput);
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyAllFilters();
      applySearch();
      sortCurrentArray();
    });
    searchInput.addEventListener("keyup", (e) => {
      applyAllFilters();
      applySearch();
      sortCurrentArray();
    });
  }
  render();

  const toggleBtn = document.getElementById("toggle-search-btn");
  const searchContainer = document.getElementById("search-container");
  const searchInput2 = document.getElementById("search-input");

  if (!toggleBtn || !searchContainer) return;

  toggleBtn.addEventListener("click", () => {
    searchContainer.classList.toggle("show");
    if (searchContainer.classList.contains("show")) {
      searchInput2.focus();
    }
  });

  searchInput2.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchContainer.classList.remove("show");
    }
  });

  function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    options.headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, options);
  }

  async function toggleFavourite(star) {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
    const card = star.closest(".exercise-card");
    if (!card) {
      console.error("Cannot find exercise card");
      return;
    }
    const nameEl = card.querySelector("h3");
    const name = nameEl?.textContent.trim();
    if (!name) {
      console.error("Cannot find exercise name");
      return;
    }
    console.log(name);
    const exer = exercises.find((e) => e.name === name);
    if (!exer) {
      console.error("Exercise not found in array:", name);
      return;
    }
    console.log(exer);
    console.log("HERE?");
    const exercitiuId = exer._id;
    try {
      const resp = await authFetch("/api/favourites/toggle", {
        method: "POST",
        body: JSON.stringify({ id_exercitiu: exercitiuId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        window.location.href = "login.html";
        return;
      }
    } catch (err) {
      alert("Eroare: " + err.message);
    }
  }

  document.querySelectorAll(".fa-star").forEach((star) => {
    star.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleFavourite(star);
      star.classList.toggle("star-selected");
    });
  });
});
