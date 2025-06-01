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

    groups.forEach((groupObj) => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input
          type="checkbox"
          value="${groupObj.name}"
          ${
            selectedFilters.muscleGroups.includes(groupObj.name)
              ? "checked"
              : ""
          }
        />
        <span>${groupObj.name}</span>
      `;
      const cb = label.querySelector("input[type='checkbox']");
      cb.addEventListener("change", (e) => {
        const val = e.target.value;
        if (e.target.checked) {
          if (!selectedFilters.muscleGroups.includes(val)) {
            selectedFilters.muscleGroups.push(val);
          }
        } else {
          selectedFilters.muscleGroups = selectedFilters.muscleGroups.filter(
            (m) => m !== val
          );
        }
      });
      container.appendChild(label);
    });
  } catch (err) {
    console.error("Failed to load muscle‐groups:", err);
    container.innerHTML = `<p style="color:red;">Eroare la încărcare</p>`;
  }
}

async function populateTypesModal() {
  const container = document.getElementById("modal-list-types");
  container.innerHTML = "";

  try {
    const resp = await fetch("/admin/tip");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const types = await resp.json();

    types.forEach((typeObj) => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input
          type="checkbox"
          value="${typeObj.name}"
          ${selectedFilters.types.includes(typeObj.name) ? "checked" : ""}
        />
        <span>${typeObj.name}</span>
      `;
      const cb = label.querySelector("input[type='checkbox']");
      cb.addEventListener("change", (e) => {
        const val = e.target.value;
        if (e.target.checked) {
          if (!selectedFilters.types.includes(val)) {
            selectedFilters.types.push(val);
          }
        } else {
          selectedFilters.types = selectedFilters.types.filter(
            (t) => t !== val
          );
        }
      });
      container.appendChild(label);
    });
  } catch (err) {
    console.error("Failed to load types:", err);
    container.innerHTML = `<p style="color:red;">Eroare la încărcare</p>`;
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
      console.log(ex.muscle_groups);
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

  exercisesToDisplay = [...baseArray];
  currentPage = 1;
  renderFiltered();
}

function sortCurrentArray() {
  let arr = exercisesToDisplay.length > 0 ? exercisesToDisplay : exercises;
  const sorted = [...arr];

  sorted.sort((a, b) => {
    if (currentSortField === "score") {
      const diff = parseFloat(a.rating) - parseFloat(b.rating);
      return currentSortOrder === "asc" ? diff : -diff;
    }
    if (currentSortField === "difficulty") {
      const diff = parseFloat(a.difficulty) - parseFloat(b.difficulty);
      return currentSortOrder === "asc" ? diff : -diff;
    }
    if (currentSortField === "alpha") {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return currentSortOrder === "asc" ? -1 : 1;
      if (nameA > nameB) return currentSortOrder === "asc" ? 1 : -1;
      return 0;
    }
    return 0;
  });

  if (exercisesToDisplay.length > 0) {
    exercisesToDisplay = [...sorted];
  } else {
    exercises = [...sorted];
  }

  currentPage = 1;
  if (exercisesToDisplay.length > 0) {
    renderFiltered();
  } else {
    render();
  }
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
  const searchInput = document.querySelector(".search-bar");
  const term = searchInput.value.trim().toLowerCase();
  if (term === "") {
    console.log(exercisesToDisplay);
    currentPage = 1;
    renderFiltered();
    return;
  }
  const filtered = exercisesToDisplay.filter((ex) => {
    return (
      ex.name.toLowerCase().includes(term) ||
      (ex.description && ex.description.toLowerCase().includes(term))
    );
  });

  exercisesToDisplay = [...filtered];
  currentPage = 1;
  renderFiltered();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const resp = await fetch("/admin/exercitii");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    exercises = await resp.json();
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
      if (arrowIndex + 4 < exercisesToDisplay.length) {
        arrowIndex += 4;
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

  function uncheckOtherSortCheckbox(chosenId) {
    const allCheckboxes = [
      "sort-score-checkbox",
      "sort-difficulty-checkbox",
      "sort-alpha-checkbox",
    ];
    allCheckboxes.forEach((id) => {
      if (id !== chosenId) {
        const c = document.getElementById(id);
        if (c) c.checked = false;
        const upId = id.replace("-checkbox", "-up");
        const downId = id.replace("-checkbox", "-down");
        document.getElementById(upId).classList.remove("asc");
        document.getElementById(downId).classList.remove("desc");
        document.getElementById(upId).style.opacity = "0.3";
        document.getElementById(downId).style.opacity = "0.3";
      }
    });
  }

  document
    .getElementById("sort-score-checkbox")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        uncheckOtherSortCheckbox("sort-score-checkbox");
        currentSortField = "score";
        currentSortOrder = null;
        document.getElementById("sort-score-up").style.opacity = "0.7";
        document.getElementById("sort-score-down").style.opacity = "0.7";
      } else {
        if (currentSortField === "score") {
          currentSortField = null;
          currentSortOrder = null;
          document.getElementById("sort-score-up").style.opacity = "0.3";
          document.getElementById("sort-score-down").style.opacity = "0.3";
        }
      }
    });

  document
    .getElementById("sort-difficulty-checkbox")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        uncheckOtherSortCheckbox("sort-difficulty-checkbox");
        currentSortField = "difficulty";
        currentSortOrder = null;
        document.getElementById("sort-difficulty-up").style.opacity = "0.7";
        document.getElementById("sort-difficulty-down").style.opacity = "0.7";
      } else {
        if (currentSortField === "difficulty") {
          currentSortField = null;
          currentSortOrder = null;
          document.getElementById("sort-difficulty-up").style.opacity = "0.3";
          document.getElementById("sort-difficulty-down").style.opacity = "0.3";
        }
      }
    });

  document
    .getElementById("sort-alpha-checkbox")
    .addEventListener("change", (e) => {
      if (e.target.checked) {
        uncheckOtherSortCheckbox("sort-alpha-checkbox");
        currentSortField = "alpha";
        currentSortOrder = null;
        document.getElementById("sort-alpha-up").style.opacity = "0.7";
        document.getElementById("sort-alpha-down").style.opacity = "0.7";
      } else {
        if (currentSortField === "alpha") {
          currentSortField = null;
          currentSortOrder = null;
          document.getElementById("sort-alpha-up").style.opacity = "0.3";
          document.getElementById("sort-alpha-down").style.opacity = "0.3";
        }
      }
    });

  document.getElementById("sort-score-up").addEventListener("click", () => {
    if (currentSortField === "score") {
      currentSortOrder = "asc";
      sortCurrentArray();
      document.getElementById("sort-score-up").classList.add("asc");
      document.getElementById("sort-score-down").classList.remove("desc");
    }
  });
  document.getElementById("sort-score-down").addEventListener("click", () => {
    if (currentSortField === "score") {
      currentSortOrder = "desc";
      sortCurrentArray();
      document.getElementById("sort-score-down").classList.add("desc");
      document.getElementById("sort-score-up").classList.remove("asc");
    }
  });

  document
    .getElementById("sort-difficulty-up")
    .addEventListener("click", () => {
      if (currentSortField === "difficulty") {
        currentSortOrder = "asc";
        sortCurrentArray();
        document.getElementById("sort-difficulty-up").classList.add("asc");
        document
          .getElementById("sort-difficulty-down")
          .classList.remove("desc");
      }
    });
  document
    .getElementById("sort-difficulty-down")
    .addEventListener("click", () => {
      if (currentSortField === "difficulty") {
        currentSortOrder = "desc";
        sortCurrentArray();
        document.getElementById("sort-difficulty-down").classList.add("desc");
        document.getElementById("sort-difficulty-up").classList.remove("asc");
      }
    });

  document.getElementById("sort-alpha-up").addEventListener("click", () => {
    if (currentSortField === "alpha") {
      currentSortOrder = "asc";
      sortCurrentArray();
      document.getElementById("sort-alpha-up").classList.add("asc");
      document.getElementById("sort-alpha-down").classList.remove("desc");
    }
  });
  document.getElementById("sort-alpha-down").addEventListener("click", () => {
    if (currentSortField === "alpha") {
      currentSortOrder = "desc";
      sortCurrentArray();
      document.getElementById("sort-alpha-down").classList.add("desc");
      document.getElementById("sort-alpha-up").classList.remove("asc");
    }
  });

  document.getElementById("btn-apply-sort").addEventListener("click", () => {
    sortCurrentArray();
  });
  const searchInput = document.querySelector(".search-bar");
  console.log(searchInput);
  if (searchInput) {
    searchInput.addEventListener("input", applySearch);
    searchInput.addEventListener("keyup", (e) => {
      applyAllFilters();
      applySearch();
      sortCurrentArray();
    });
  }
  render();
});
