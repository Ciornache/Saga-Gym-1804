/* Repetitive code for workout button, logout button, and user account window */

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
  if (token) window.location.href = "account.html";
  else window.location.href = "login.html";
});

let exercises = [];
let exercisesToDisplay = [];

let currentPage = 1;
const pageSize = 4;

let currentSortField = null;
let currentSortOrder = null;
let favourites = [];

const selectedFilters = {
  muscleGroups: [],
  types: [],
};

let groups = [];
let types = [];
const sortCriteria = [];
let isLoggedIn = false;
let id_user = null;

let loadStuff = async () => {
  let resp = await fetch("/admin/grupe");
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  groups = await resp.json();

  resp = await fetch("/admin/tip");
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  types = await resp.json();
};

loadStuff();

/* Dual Slider Functionality */
/* The code checks that the range between the two sliders is valid. If not, it adjusts the min / max. It also updates the highlighted range on the screen */

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

/* Redirect to the exercise page when clicking an exercise card */

document.querySelectorAll(".exercise-card").forEach((c) => {
  c.addEventListener("click", () => {
    let title = c.querySelector("h3");
    window.location.href = `exercitiu.html?exercise-name=${title.textContent}`;
  });
});

document.querySelectorAll(".dual-slider").forEach((s) => {
  s.addEventListener("change", () => {
    applyAllFilters();
  });
});

function counterToString(counter) {
  if (counter < 1000) return counter.toString();
  if (counter < 1000000) return (counter / 1000).toFixed(1) + "K";
  return (counter / 1000000).toFixed(1) + "M";
}

/* Fills the exercise card with data every time a change is happening, like filtering, sorting or pagination */

function fillCard(cardEl, data) {
  const imgDiv = cardEl.querySelector(".img");
  imgDiv.style.backgroundImage = `url(${data.cover_image})`;
  imgDiv.style.backgroundSize = "cover";
  imgDiv.style.backgroundPosition = "center";
  cardEl.querySelector("h3").textContent = data.name;
  const star = cardEl.querySelector(".fa-star");
  const stats = cardEl.querySelectorAll(".stats div");
  getStarCounter(star).then((count) => {
    stats[0].innerHTML = `<i class="fa-solid fa-star"></i><span>${
      counterToString(count) || 0
    }</span>`;
  });
  stats[1].innerHTML = `<i class="fa-solid fa-dumbbell"></i><span>${data.difficulty.toFixed(
    1
  )}</span>`;
  stats[2].innerHTML = `<i class="fa-solid fa-medal"></i><span>${data.rating.toFixed(
    1
  )}</span>`;
}

/* Utility function to get for an exercise how many times it has been likes by users */

async function getStarCounter(star) {
  const cardEl = star.closest(".exercise-card");
  if (!cardEl) {
    console.error("Cannot find exercise card");
    return;
  }
  const nameEl = cardEl.querySelector("h3");
  const name = nameEl?.textContent.trim().toLowerCase();
  const id_exercitiu = exercises.find((e) => e.name.toLowerCase() === name)?.id;
  const cnt = favourites.filter(
    (f) => f.id_exercitiu === id_exercitiu.toString()
  )[0].cnt;
  return cnt;
}

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

/* Event Listeners for sorting buttons and checkboxed */

const sortFields = ["score", "difficulty", "alpha"];
for (const field of sortFields) {
  const element1 = document.getElementById(`sort-${field}-up`);
  const element2 = document.getElementById(`sort-${field}-down`);
  const elements = [element1, element2];
  for (const element of elements) {
    if (!element) continue;
    element.addEventListener(
      "click",
      ((fieldCopy, elementCopy) => {
        return () => {
          const idx = sortCriteria.findIndex((c) => c.field === fieldCopy);
          if (idx !== -1) {
            sortCriteria[idx].order = elementCopy.id.includes("up")
              ? "asc"
              : "desc";
          } else {
            sortCriteria.push({
              field: fieldCopy,
              order: elementCopy.id.includes("up") ? "asc" : "desc",
            });
          }
          elements.forEach((el) => el.classList.remove("selected"));
          elementCopy.classList.add("selected");
          document.getElementById(`sort-${fieldCopy}-checkbox`).checked = true;
        };
      })(field, element)
    );
  }

  const checkbox = document.getElementById(`sort-${field}-checkbox`);
  checkbox.addEventListener(
    "change",
    ((fieldCopy) => {
      return (e) => {
        updateSortCriteria(fieldCopy, e.target.checked);
        if (!e.target.checked) {
          document
            .getElementById(`sort-${fieldCopy}-up`)
            .classList.remove("selected");
          document
            .getElementById(`sort-${fieldCopy}-down`)
            .classList.remove("selected");
        }
      };
    })(field)
  );
}

/* Sorts the exercisesToDisplay array everytime apply sort is pressed */

function sortCurrentArray() {
  if (exercisesToDisplay.length === 0) return;
  let arr = exercisesToDisplay;
  const sorted = [...arr];
  if (sortCriteria.length === 0) {
    if (exercisesToDisplay.length > 0) {
      renderFiltered();
    } else if (exercises.length === 0) {
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

/* Utility functions to open and close filtering modals */

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

/* Function that populates the muscle groups modal. It insert data dynmically such as images, checkboxes and overlays */

async function populateMuscleGroupsModal(groups) {
  const container = document.getElementById("modal-list-muscle-groups");
  container.innerHTML = "";
  try {
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

      img.addEventListener("click", () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });

      grid.appendChild(wrapper);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Error loading muscle groups</p>`;
  }
}

async function populateTypesModal() {
  const container = document.getElementById("modal-list-types");
  container.innerHTML = "";

  try {
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

/* ApplyAllFilters is called whenever a new filter is selected */

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
  //   ex.score >= minScore && ex.score <= maxScore;
  // });

  baseArray = baseArray.filter((ex) => {
    return (
      ex.difficulty >= parseFloat(minDiff) &&
      ex.difficulty <= parseFloat(maxDiff)
    );
  });

  exercisesToDisplay = [...baseArray];
  currentPage = 1;

  applySearch();
  sortCurrentArray();
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

/* Is called only one time when the page is loaded. Intial fetching */

async function render() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const res = await fetch("/api/reviews", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  let reviews = await res.json();
  reviews = reviews.reviews;
  const exercisesWithRatings = exercises.map((ex) => {
    const ratings = reviews.filter((r) => r.exerciseId === ex.id);
    const sum = ratings.reduce((a, b) => a + b.rating, 0);
    const avg = ratings.length ? (sum / ratings.length).toFixed(2) : 0;
    return { ...ex, rating: Number(avg) };
  });
  /////
  exercises = exercisesToDisplay = exercisesWithRatings;
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
  updateStars();
}

/* Updates the stars. If the user is not logged in, it does nothing. */

async function updateStars() {
  if (!isLoggedIn) return;
  const stars = Array.from(document.querySelectorAll(".fa-star"));
  for (star of stars) star.classList.remove("star-selected");
  for (fav of favourites) {
    const exName = exercises.find((e) => e.id.toString() === fav.id_exercitiu);
    const exerciseNames = Array.from(document.querySelectorAll("h3"));
    const exNode = exerciseNames.find((e) => {
      return e.textContent.toLowerCase() === exName.name.toLowerCase();
    });
    console.log(id_user, fav.id_user, fav);
    if (exNode && id_user === fav.id_user) {
      const icon = exNode.previousSibling.previousSibling.querySelector("i");
      icon.classList.toggle("star-selected");
    }
  }
}

/* Same as render, but is rendering from exercisesToDisplay array */

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
  updateStars();
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / pageSize);
  pagination.innerHTML = "";

  const prevBtn = makeBtn("«", currentPage === 1, () => {
    if (currentPage > 1) {
      currentPage--;
      if (exercisesToDisplay.length > 0) renderFiltered();
      else if (exercises.length === 0) render();
    }
  });

  pagination.appendChild(prevBtn);
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 5);
  if (endPage - startPage <= 4) {
    startPage = Math.max(1, endPage - 5);
  }
  if (endPage - startPage >= 5) endPage--;

  const func = (p) => {
    currentPage = p;
    if (exercisesToDisplay.length > 0) renderFiltered();
    else if (exercises.length === 0) render();
  };

  if (startPage > 1) {
    const firstBtn = makeBtn("1", false, () => func(1), currentPage === 1);
    pagination.appendChild(firstBtn);

    if (startPage > 2) {
      const ell = document.createElement("span");
      ell.textContent = "…";
      ell.className = "ellipsis";
      pagination.appendChild(ell);
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    pagination.appendChild(makeBtn(p, false, () => func(p), p === currentPage));
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
      () => func(totalPages),
      currentPage === totalPages
    );
    pagination.appendChild(lastBtn);
  }

  const nextBtn = makeBtn("»", currentPage === totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      if (exercisesToDisplay.length > 0) renderFiltered();
      else if (exercises.length === 0) render();
    }
  });
  pagination.appendChild(nextBtn);
}

/* Filters the content based on the search bar */

function applySearch() {
  const searchInput = document.getElementById("search-input");
  const term = searchInput.value.trim().toLowerCase();
  if (term === "") {
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
  const navbar = document.querySelector(".navbar");
  const btn = document.querySelector(".hamburger");
  btn.addEventListener("click", () => {
    navbar.classList.toggle("open");
  });
  try {
    const resp = await fetch("/api/exercitii");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    exercises = await resp.json();
    exercisesToDisplay = exercises;

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch("/favourites", {
      method: "GET",
      headers: {
        Authorization: ` Bearer ${token}`,
      },
    });
    const data = await res.json();
    favourites = Array.isArray(data.favourites) ? data.favourites : [];

    if (token) {
      const res3 = await fetch("/token/getuser", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res3.ok) {
        isLoggedIn = true;
        const data = await res3.json();
        const res2 = await fetch(`/api/user/_id/?id_user=${data.user_id}`, {
          method: "GET",
        });
        const data2 = await res2.json();
        id_user = data2.user_id;
      }
    }
  } catch (err) {
    console.error("Nu am putut încărca exercițiile:", err);
  }

  render();

  const btnLeft = document.querySelector(".slider-angles-left");
  const btnRight = document.querySelector(".slider-angles-right");

  if (btnRight) {
    btnRight.addEventListener("click", () => {
      const totalPages = Math.ceil(exercisesToDisplay.length / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        renderFiltered();
      }
    });
  }

  if (btnLeft) {
    btnLeft.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderFiltered();
      }
    });
  }

  const btnOpenMuscle = document.getElementById("btn-open-muscle-modal");
  const btnCloseMuscle = document.getElementById("btn-close-muscle-modal");
  const btnApplyMuscle = document.getElementById("btn-apply-muscle-modal");
  btnOpenMuscle.addEventListener("click", async () => {
    populateMuscleGroupsModal(groups);
    openModal("modal-muscle-groups");
  });
  btnCloseMuscle.addEventListener("click", () => {
    populateTypesModal(types);
    closeModal("modal-muscle-groups");
  });
  btnApplyMuscle.addEventListener("click", () => {
    closeModal("modal-muscle-groups");
    applyAllFilters();
  });

  const btnOpenType = document.getElementById("btn-open-type-modal");
  const btnCloseType = document.getElementById("btn-close-type-modal");
  const btnApplyType = document.getElementById("btn-apply-type-modal");
  btnOpenType.addEventListener("click", async () => {
    await populateTypesModal(types);
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
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyAllFilters();
    });
    searchInput.addEventListener("keyup", (e) => {
      applyAllFilters();
    });
  }

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
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    options.headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, options);
  }

  /* Every time the star is clicked, the function toggleFavourite is called. */

  async function toggleFavourite(star) {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      alert("You must have an account! Login or create an account");
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
    const exer = exercises.find((e) => e.name === name);
    if (!exer) {
      console.error("Exercise not found in array:", name);
      return;
    }

    const exercitiuId = exer.id;
    try {
      const resp = await authFetch("/api/favourites/toggle", {
        method: "POST",
        body: JSON.stringify({ id_exercitiu: exercitiuId }),
      });
      if (!resp.ok) {
        window.location.href = "login.html";
        return;
      }
    } catch (err) {
      alert("Eroare: " + err.message);
    }
    return 1;
  }

  async function updateStarCounter(star) {
    const cardEl = star.closest(".exercise-card");
    if (!cardEl) {
      console.error("Cannot find exercise card");
      return;
    }
    const ex_name = cardEl.querySelector("h3").textContent;
    const ex_id = exercises
      .find((e) => e.name.toLowerCase() === ex_name.toLowerCase())
      .id.toString();
    let upd = star.classList.contains("star-selected") ? 1 : -1;
    favourites = favourites.map((f) => {
      if (f.id_exercitiu !== ex_id) return f;
      else
        return {
          ...f,
          cnt: f.cnt + upd,
        };
    });
    return getStarCounter(star).then((starCount) => {
      const stats = cardEl.querySelectorAll(".stats div")[0];
      const starSpan = stats.querySelector("span");
      starSpan.textContent = starCount ? counterToString(starCount) : "0";
    });
  }

  /* Toggles and updates ui after if toggle was succesful */

  document.querySelectorAll(".fa-star").forEach((star) => {
    star.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await toggleFavourite(star);
      if (ok) {
        star.classList.toggle("star-selected");
        updateStarCounter(star)
          .then(() => {
            console.log("Star counter updated");
          })
          .catch((err) => {
            console.error("Failed to update star counter:", err);
          });
      }
    });
  });
});
