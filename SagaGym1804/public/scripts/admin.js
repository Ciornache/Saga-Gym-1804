document.addEventListener("DOMContentLoaded", () => {
  const username = prompt("🔐 Nume utilizator:");
  const password = prompt("🔑 Parolă:");

  if (username !== "admin" || password !== "1234") {
    alert("Acces interzis. Reîncarcă pagina.");
    document.body.innerHTML = "<h1 style='color:red;text-align:center'>❌ Acces refuzat</h1>";
    return;
  }

  afiseazaSectiune("utilizatori");
});
function afiseazaSectiune(nume) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  const sectiune = document.getElementById(`sectiune-${nume}`);
  if (sectiune) sectiune.classList.add("active");

  switch (nume) {
    case "utilizatori":
      incarcaUtilizatori();
      break;

    case "exercitii":
      incarcaExercitii();
      break;

    case "antrenamente":
      incarcaAntrenamente();
      break;

    case "grupe":
      incarcaGrupe();
      break;

    case "corespondente":
      incarcaCorespondente();
      break;
  }
}

// ============ UTILIZATORI ============

async function incarcaUtilizatori() {
  const res = await fetch("/admin/users");
  const users = await res.json();

  const tbody = document.querySelector("#tabel-utilizatori tbody");
  tbody.innerHTML = "";

  users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.gender}</td>
        <td>
          <button onclick="editeazaUtilizator('${user._id}')">✏️</button>
          <button onclick="stergeUtilizator('${user._id}')">🗑️</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

window.showAddForm = function () {
  toggle("corespondenta", resetFormularCorespondenta);
};

function resetFormularUtilizator() {
  document.getElementById("utilizator-id").value = "";
  document.getElementById("nume").value = "";
  document.getElementById("email").value = "";
  document.getElementById("parola").value = "";
  document.getElementById("gen").value = "";
  document.getElementById("form-titlu").innerText = "Adaugă Utilizator";
}

function anuleaza() {
  inchide("utilizator");
}

async function salveazaUtilizator() {
  const id = document.getElementById("utilizator-id").value;
  const user = {
    name: document.getElementById("nume").value,
    email: document.getElementById("email").value,
    password: document.getElementById("parola").value,
    gender: document.getElementById("gen").value,
  };

  const url = id ? `/admin/users/${id}` : "/admin/users";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (res.ok) {
inchide("utilizator");
    incarcaUtilizatori();
  } else {
    alert("Eroare la salvare.");
  }
}

async function editeazaUtilizator(id) {
  console.log("Apăsat pe ✏️ cu id:", id)
  const res = await fetch(`/admin/users/${id}`);
  const user = await res.json();

  document.getElementById("form-titlu").innerText = "Editează Utilizator";
  deschideFormular("utilizator");

  document.getElementById("utilizator-id").value = user._id;
  document.getElementById("nume").value = user.name;
  document.getElementById("email").value = user.email;
  document.getElementById("parola").value = "";
  document.getElementById("gen").value = user.gender;
}

async function stergeUtilizator(id) {
  if (confirm("Sigur vrei să ștergi acest utilizator?")) {
    const res = await fetch(`/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      incarcaUtilizatori();
    } else {
      alert("Eroare la ștergere.");
    }
  }
}

// ============ EXERCITII ============

async function incarcaExercitii() {
  const res = await fetch("/admin/exercitii");
  const exercitii = await res.json();

  const tbody = document.querySelector("#tabel-exercitii tbody");
  tbody.innerHTML = "";

  exercitii.forEach((ex) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${ex.name}</td>
        <td>${ex.type}</td>
        <td>${ex.muscle_groups.join(", ")}</td>
        <td>
          <button onclick="editeazaExercitiu('${ex._id}')">✏️</button>
          <button onclick="stergeExercitiu('${ex._id}')">🗑️</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

window.showAddForm = function () {
  const formular = document.getElementById("form-utilizator");
  const btn = document.getElementById("add-utilizator-btn");

  console.log("Formular:", formular);
  console.log("Buton:", btn);
  if (!formular || !btn) {
    console.error("Formularul sau butonul nu a fost găsit în DOM!");
    return;
  }

  const esteAscuns = formular.classList.contains("hidden");

  console.log("Este ascuns:", esteAscuns);
  if (esteAscuns) {
    formular.classList.remove("hidden");
    formular.classList.add("active");
    btn.textContent = "❌ Închide formular";
    resetFormularUtilizator();
  } else {
    formular.classList.remove("active");
    formular.classList.add("hidden");
    btn.textContent = "➕ Adaugă Utilizator";
    resetFormularUtilizator();
  }
};

window.showExercitiuForm = function () {
    toggle("exercitiu", resetFormularExercitiu);
};

function resetFormularExercitiu() {
  document.getElementById("exercitiu-id").value = "";
  document.getElementById("ex-nume").value = "";
  document.getElementById("ex-tip").value = "";
  document.getElementById("ex-grupe").value = "";
  document.getElementById("form-exercitiu-titlu").innerText =
    "Adaugă Exercițiu";
}

window.showExercitiuForm = showExercitiuForm;

function anuleazaExercitiu() {
  inchide("exercitiu");
}

async function salveazaExercitiu() {
  const id = document.getElementById("exercitiu-id").value;
  const exercitiu = {
    id_exercitiu: parseInt(document.getElementById("ex-id").value),
    name: document.getElementById("ex-nume").value,
    type: document.getElementById("ex-tip").value,
    cover_image: document.getElementById("ex-cover").value,
    rating: parseFloat(document.getElementById("ex-rating").value),
    muscle_groups: document
      .getElementById("ex-grupe")
      .value.split(",")
      .map((s) => s.trim()),
    images: document
      .getElementById("ex-images")
      .value.split(",")
      .map((s) => s.trim()),
  };

  const url = id ? `/admin/exercitii/${id}` : "/admin/exercitii";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercitiu),
  });

  if (res.ok) {
    inchide("exercitiu");
    incarcaExercitii();
  } else {
    alert("Eroare la salvare exercițiu.");
  }
}

async function editeazaExercitiu(id) {
  try {
    const res = await fetch(`/admin/exercitii/${id}`);
    const ex = await res.json();
    document.getElementById("ex-id").value = ex.id_exercitiu || "";

    document.getElementById("form-exercitiu-titlu").innerText = "Editează Exercițiu";
    deschideFormular("exercitiu");
    document.getElementById("exercitiu-id").value = ex._id;
    document.getElementById("ex-nume").value = ex.name;
    document.getElementById("ex-tip").value = ex.type;
    document.getElementById("ex-cover").value = ex.cover_image || "";
    document.getElementById("ex-rating").value = ex.rating || "";
    document.getElementById("ex-grupe").value = (ex.muscle_groups || []).join(", ");
    document.getElementById("ex-images").value = (ex.images || []).join(", ");
  } catch (err) {
    console.error("Eroare la încărcare exercițiu:", err);
    alert("Eroare la încărcarea exercițiului.");
  }
}

async function stergeExercitiu(id) {
  if (confirm("Sigur vrei să ștergi acest exercițiu?")) {
    const res = await fetch(`/admin/exercitii/${id}`, { method: "DELETE" });
    if (res.ok) {
      incarcaExercitii();
    } else {
      alert("Eroare la ștergere exercițiu.");
    }
  }
}

async function incarcaAntrenamente() {
  const res = await fetch("/admin/antrenamente");
  const antrenamente = await res.json();

  const tbody = document.querySelector("#tabel-antrenamente tbody");
  tbody.innerHTML = "";

  antrenamente.forEach((an) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${an.id_antrenament || ""}</td>
      <td>${an.name}</td>
      <td>${an.type}</td>
      <td>${an.user_email || ""}</td>
      <td>${an.created_at ? new Date(an.created_at).toLocaleString() : ""}</td>
      <td>
        <button onclick="editeazaAntrenament('${an._id}')">✏️</button>
        <button onclick="stergeAntrenament('${an._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.showAntrenamentForm = function () {
  toggle("antrenament", resetFormularAntrenament);
};

function resetFormularAntrenament() {
  document.getElementById("antrenament-id").value = "";
  document.getElementById("an-nume").value = "";
  document.getElementById("an-tip").value = "";
  document.getElementById("form-antrenament-titlu").innerText =
    "Adaugă Antrenament";
}

window.showAntrenamentForm = showAntrenamentForm;

function anuleazaAntrenament() {
  inchide("antrenament");
}

async function salveazaAntrenament() {
  const id = document.getElementById("antrenament-id").value;

  const antrenament = {
    id_antrenament: parseInt(document.getElementById("antrenament-custom-id").value),
    name: document.getElementById("an-nume").value,
    type: document.getElementById("an-tip").value,
    user_email: document.getElementById("an-user-email").value,
    created_at: new Date(document.getElementById("an-created-at").value),
  };

  const url = id ? `/admin/antrenamente/${id}` : "/admin/antrenamente";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(antrenament),
  });

  if (res.ok) {
    inchide("antrenament");
    incarcaAntrenamente();
  } else {
    alert("Eroare la salvare antrenament.");
  }
}

async function editeazaAntrenament(id) {
  const res = await fetch(`/admin/antrenamente/${id}`);
  const an = await res.json();

  document.getElementById("form-antrenament-titlu").innerText = "Editează Antrenament";
  deschideFormular("antrenament");


  document.getElementById("antrenament-id").value = an._id;
  document.getElementById("antrenament-custom-id").value = an.id_antrenament || "";
  document.getElementById("an-nume").value = an.name || "";
  document.getElementById("an-tip").value = an.type || "";
  document.getElementById("an-user-email").value = an.user_email || "";
  document.getElementById("an-created-at").value = an.created_at
    ? new Date(an.created_at).toISOString().slice(0, 16)
    : "";
}

async function stergeAntrenament(id) {
  if (confirm("Ștergi acest antrenament?")) {
    const res = await fetch(`/admin/antrenamente/${id}`, {
      method: "DELETE",
    });
    if (res.ok) incarcaAntrenamente();
    else alert("Eroare la ștergere.");
  }
}

// ============ GRUPE MUSCULARE ============

async function incarcaGrupe() {
  const res = await fetch("/admin/grupe");
  const grupe = await res.json();

  const tbody = document.querySelector("#tabel-grupe tbody");
  tbody.innerHTML = "";

  grupe.forEach((gr) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${gr.name}</td>
        <td><img src="${gr.image}" alt="" width="50"></td>
        <td>${gr.descriere}</td>
        <td>
          <button onclick="editeazaGrupa('${gr._id}')">✏️</button>
          <button onclick="stergeGrupa('${gr._id}')">🗑️</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

window.showGrupaForm = function () {
  toggle("grupa", resetFormularGrupa);
};

function resetFormularGrupa() {
  document.getElementById("grupa-id").value = "";
  document.getElementById("gr-nume").value = "";
  document.getElementById("gr-img").value = "";
  document.getElementById("gr-desc").value = "";
  document.getElementById("form-grupa-titlu").innerText = "Adaugă Grupă";
}

window.showGrupaForm = showGrupaForm;

function anuleazaGrupa() {
  inchide("grupa");
}

async function salveazaGrupa() {
  const id = document.getElementById("grupa-id").value;

  const grupa = {
    name: document.getElementById("gr-nume").value,
    image: document.getElementById("gr-img").value,
    descriere: document.getElementById("gr-desc").value,
  };

  const url = id ? `/admin/grupe/${id}` : "/admin/grupe";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(grupa),
  });

  if (res.ok) {
    inchide("grupa");
    incarcaGrupe();
  } else {
    alert("Eroare la salvare grupă musculară.");
  }
}


async function editeazaGrupa(id) {
  const res = await fetch(`/admin/grupe/${id}`);
  const gr = await res.json();

  document.getElementById("form-grupa-titlu").innerText = "Editează Grupă";
  deschideFormular("grupa");

  document.getElementById("grupa-id").value = gr._id;
  document.getElementById("gr-nume").value = gr.name;
  document.getElementById("gr-img").value = gr.image;
  document.getElementById("gr-desc").value = gr.descriere;
}

async function stergeGrupa(id) {
  if (confirm("Ștergi această grupă musculară?")) {
    const res = await fetch(`/admin/grupe/${id}`, { method: "DELETE" });
    if (res.ok) incarcaGrupe();
    else alert("Eroare la ștergere.");
  }
}
function showCorespondentaForm() {
  toggle("corespondenta", resetFormularCorespondenta);
}
function resetFormularCorespondenta() {
  document.getElementById("corespondenta-id").value = "";
  document.getElementById("core-antrenament").value = "";
  document.getElementById("core-exercitiu").value = "";
  document.getElementById("core-ordine").value = "";
  document.getElementById("core-repetari").value = "";
  document.getElementById("core-pauza").value = "";
  document.getElementById("form-corespondenta-titlu").innerText = "Adaugă Corespondență";
}
function anuleazaCorespondenta() {
  inchide("corespondenta");
}
async function salveazaCorespondenta() {
  const id = document.getElementById("corespondenta-id").value;

  const data = {
    id_antrenament: parseInt(document.getElementById("core-antrenament").value),
    id_exercitiu: parseInt(document.getElementById("core-exercitiu").value),
    ordine: parseInt(document.getElementById("core-ordine").value),
    repetari: parseInt(document.getElementById("core-repetari").value),
    pauza_secunde: parseInt(document.getElementById("core-pauza").value),
  };

  const url = id ? `/admin/corespondente/${id}` : "/admin/corespondente";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    inchide("corespondenta");
    incarcaCorespondente();
  } else {
    alert("Eroare la salvare.");
  }
}
async function editeazaCorespondenta(id) {
  const res = await fetch(`/admin/corespondente/${id}`);
  const row = await res.json();

  document.getElementById("form-corespondenta-titlu").innerText = "Editează Corespondență";
  deschideFormular("corespondenta");

  document.getElementById("corespondenta-id").value = row._id;
  document.getElementById("core-antrenament").value = row.id_antrenament;
  document.getElementById("core-exercitiu").value = row.id_exercitiu;
  document.getElementById("core-ordine").value = row.ordine;
  document.getElementById("core-repetari").value = row.repetari;
  document.getElementById("core-pauza").value = row.pauza_secunde;
}
async function stergeCorespondenta(id) {
  if (confirm("Ștergi această corespondență?")) {
    const res = await fetch(`/admin/corespondente/${id}`, { method: "DELETE" });

    if (res.ok) {
      incarcaCorespondente();
    } else {
      alert("Eroare la ștergere corespondență.");
    }
  }
}

async function incarcaCorespondente() {
  const res = await fetch("/admin/corespondente");
  const rows = await res.json();

  const tbody = document.querySelector("#tabel-corespondente tbody");
  tbody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id_antrenament}</td>
      <td>${row.id_exercitiu}</td>
      <td>${row.ordine}</td>
      <td>${row.repetari}</td>
      <td>${row.pauza_secunde}</td>
      <td>
        <button onclick="editeazaCorespondenta('${row._id}')">✏️</button>
        <button onclick="stergeCorespondenta('${row._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
function inchideFormular(formId, buttonId, textImplicit) {
  const form = document.getElementById(formId);
  const btn = document.getElementById(buttonId);

  if (form) form.classList.add("hidden");
  if (btn) btn.textContent = textImplicit;
}

function toggleFormular(formId, buttonId, textAdauga, resetCallback) {
  const form = document.getElementById(formId);
  const btn = document.getElementById(buttonId);

  if (!form || !btn) return;

  const esteAscuns = form.classList.contains("hidden");

  if (esteAscuns) {
    form.classList.remove("hidden");
    btn.textContent = "❌ Închide formular";
    if (resetCallback) resetCallback();
  } else {
    form.classList.add("hidden");
    btn.textContent = textAdauga;
    if (resetCallback) resetCallback();
  }
}
const formMap = {
  utilizator: {
    formId: "form-utilizator",
    buttonId: "add-utilizator-btn",
    text: "➕ Adaugă Utilizator",
  },
  exercitiu: {
    formId: "form-exercitiu",
    buttonId: "add-exercitii-btn",
    text: "➕ Adaugă Exercițiu",
  },
  antrenament: {
    formId: "form-antrenament",
    buttonId: "add-antrenamente-btn",
    text: "➕ Adaugă Antrenament",
  },
  grupa: {
    formId: "form-grupa",
    buttonId: "add-grupa-btn",
    text: "➕ Adaugă Grupă",
  },
  corespondenta: {
    formId: "form-corespondenta",
    buttonId: "add-corespondenta-btn",
    text: "➕ Adaugă Corespondență",
  },
};
function inchide(nume) {
  const map = formMap[nume];
  if (map) {
    inchideFormular(map.formId, map.buttonId, map.text);
  }
}

function toggle(nume, resetCallback) {
  const map = formMap[nume];
  if (map) {
    toggleFormular(map.formId, map.buttonId, map.text, resetCallback);
  }
}
function deschideFormular(nume) {
  const map = formMap[nume];
  if (!map) return;

  const form = document.getElementById(map.formId);
  const btn = document.getElementById(map.buttonId);

  if (form) form.classList.remove("hidden");
  if (btn) btn.textContent = "❌ Închide formular";
}

const entityConfig = {
  statistica: {
    url: "/admin/statistici",
    tableId: "tabel-statistica",
    formId: "form-statistica",
    buttonId: "add-statistica-btn",
    fields: ["user_email", "data", "durata", "numar_exercitii", "calorii_arse"],
    resetFunc: resetFormularStatistica,
    titleId: "form-statistica-titlu",
  },
  clasament: {
    url: "/admin/clasamente",
    tableId: "tabel-clasament",
    formId: "form-clasament",
    buttonId: "add-clasament-btn",
    fields: ["user_email", "perioada", "punctaj", "categorie_varsta"],
    resetFunc: resetFormularClasament,
    titleId: "form-clasament-titlu",
  },
};
async function incarcaEntitate(nume) {
  const config = entityConfig[nume];
  const res = await fetch(config.url);
  const items = await res.json();

  const tbody = document.querySelector(`#${config.tableId} tbody`);
  tbody.innerHTML = "";

  items.forEach((item) => {
    const tr = document.createElement("tr");

    const cells = config.fields.map((f) => `<td>${item[f] || ""}</td>`).join("");

    tr.innerHTML = `
      ${cells}
      <td>
        <button onclick="editeazaEntitate('${nume}', '${item._id}')">✏️</button>
        <button onclick="stergeEntitate('${nume}', '${item._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
async function salveazaEntitate(nume) {
  const config = entityConfig[nume];
  const id = document.getElementById(`${nume}-id`).value;

  const item = {};
  config.fields.forEach((f) => {
    item[f] = document.getElementById(`${nume}-${f}`).value;
  });

  const url = id ? `${config.url}/${id}` : config.url;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (res.ok) {
    inchide(nume);
    incarcaEntitate(nume);
  } else {
    alert("Eroare la salvare.");
  }
}
async function editeazaEntitate(nume, id) {
  const config = entityConfig[nume];
  const res = await fetch(`${config.url}/${id}`);
  const item = await res.json();

  document.getElementById(config.titleId).innerText = `Editează ${capitalize(nume)}`;
  deschideFormular(nume);
  document.getElementById(`${nume}-id`).value = item._id;

  config.fields.forEach((f) => {
    document.getElementById(`${nume}-${f}`).value = item[f] || "";
  });
}
async function stergeEntitate(nume, id) {
  const config = entityConfig[nume];
  if (confirm("Ștergi această înregistrare?")) {
    const res = await fetch(`${config.url}/${id}`, { method: "DELETE" });

    if (res.ok) {
      incarcaEntitate(nume);
    } else {
      alert("Eroare la ștergere.");
    }
  }
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
