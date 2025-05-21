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
// admin.js - Refactorizat generic

document.addEventListener("DOMContentLoaded", () => {
  afiseazaSectiune("utilizatori");
});

function afiseazaSectiune(nume) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const sectiune = document.getElementById(`sectiune-${nume}`);
  if (sectiune) sectiune.classList.add("active");
  if (entityConfig[nume]) incarcaEntitate(nume);
}

// CONFIGURARE GENERICĂ PENTRU FIECARE ENTITATE
const entityConfig = {
  utilizatori: {
    url: "/admin/users",
    tableId: "tabel-utilizatori",
    formId: "form-utilizator",
    buttonId: "add-utilizator-btn",
    fields: ["name", "email", "password", "gender", "interval_varsta", "body_type", "phone_number", "height", "weight", "nivel_fitness"],
    titleId: "form-titlu",
    resetFunc: resetFormularUtilizator
  },
  exercitii: {
    url: "/admin/exercitii",
    tableId: "tabel-exercitii",
    formId: "form-exercitiu",
    buttonId: "add-exercitii-btn",
    fields: ["id_exercitiu", "name", "type", "cover_image", "rating", "muscle_groups", "images"],
    titleId: "form-exercitiu-titlu",
    resetFunc: resetFormularGeneric("exercitiu")
  },
  antrenamente: {
    url: "/admin/antrenamente",
    tableId: "tabel-antrenamente",
    formId: "form-antrenament",
    buttonId: "add-antrenamente-btn",
    fields: ["id_antrenament", "name", "type", "user_email", "created_at"],
    titleId: "form-antrenament-titlu",
    resetFunc: resetFormularGeneric("antrenament")
  },
  grupe: {
    url: "/admin/grupe",
    tableId: "tabel-grupe",
    formId: "form-grupa",
    buttonId: "add-grupa-btn",
    fields: ["name", "image", "descriere"],
    titleId: "form-grupa-titlu",
    resetFunc: resetFormularGeneric("grupa")
  },
  corespondente: {
    url: "/admin/corespondente",
    tableId: "tabel-corespondente",
    formId: "form-corespondenta",
    buttonId: "add-corespondenta-btn",
    fields: ["id_antrenament", "id_exercitiu", "ordine", "repetari", "pauza_secunde"],
    titleId: "form-corespondenta-titlu",
    resetFunc: resetFormularGeneric("corespondenta")
  }
};

function resetFormularUtilizator() {
  entityConfig.utilizatori.fields.forEach(f => {
    const el = document.getElementById(f.replace("_", "-"));
    if (el) el.value = "";
  });
  document.getElementById("form-titlu").innerText = "Adaugă Utilizator";
}

function resetFormularGeneric(nume) {
  return function () {
    const config = entityConfig[nume];
    config.fields.forEach(f => {
      const el = document.getElementById(`${nume}-${f}`);
      if (el) el.value = "";
    });
    document.getElementById(config.titleId).innerText = `Adaugă ${capitalize(nume)}`;
  };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toggleFormular(nume) {
  const { formId, buttonId, titleId, resetFunc } = entityConfig[nume];
  const form = document.getElementById(formId);
  const btn = document.getElementById(buttonId);

  const esteAscuns = form.classList.contains("hidden");

  if (esteAscuns) {
    // Dacă deschidem formularul, resetăm tot
    form.classList.remove("hidden");
    btn.textContent = "❌ Închide formular";

    // 🧽 Resetăm și câmpul ascuns cu ID-ul
    const idField = document.getElementById(`${nume}-id`);
    if (idField) idField.value = "";

    // 📝 Resetăm titlul formularului
    const titleEl = document.getElementById(titleId);
    if (titleEl) titleEl.innerText = `Adaugă ${capitalize(nume)}`;

    if (resetFunc) resetFunc();
  } else {
    // Dacă îl închidem
    form.classList.add("hidden");
    btn.textContent = `➕ Adaugă ${capitalize(nume)}`;
  }
}


function deschideFormular(nume) {
  const { formId, buttonId } = entityConfig[nume];
  document.getElementById(formId).classList.remove("hidden");
  document.getElementById(buttonId).textContent = "❌ Închide formular";
}

function inchideFormular(nume) {
  const { formId, buttonId } = entityConfig[nume];
  document.getElementById(formId).classList.add("hidden");
  document.getElementById(buttonId).textContent = `➕ Adaugă ${capitalize(nume)}`;
}

async function incarcaEntitate(nume) {
  const config = entityConfig[nume];
  const res = await fetch(config.url);
  const data = await res.json();
  const tbody = document.querySelector(`#${config.tableId} tbody`);
  tbody.innerHTML = "";
  data.forEach(item => {
    const tr = document.createElement("tr");
    const cells = config.fields.map(f => `<td>${item[f] || ""}</td>`).join("");
    tr.innerHTML = `${cells}<td><button onclick="editeazaEntitate('${nume}', '${item._id}')">✏️</button><button onclick="stergeEntitate('${nume}', '${item._id}')">🗑️</button></td>`;
    tbody.appendChild(tr);
  });
}

async function salveazaEntitate(nume) {
  const config = entityConfig[nume];
  const idField = document.getElementById(`${nume}-id`);
  const id = idField ? idField.value : null;

  const item = {};
  config.fields.forEach(f => {
    const input = document.getElementById(`${nume}-${f}`) || document.getElementById(f.replace("_", "-"));
    item[f] = input ? input.value : "";
  });

  const method = id ? "PUT" : "POST";
  const url = id ? `${config.url}/${id}` : config.url;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });

  if (res.ok) {
    inchideFormular(nume);
    incarcaEntitate(nume);
  } else {
    alert("Eroare la salvare.");
  }
}

async function editeazaEntitate(nume, id) {
  const config = entityConfig[nume];
  const res = await fetch(`${config.url}/${id}`);
  const data = await res.json();
  document.getElementById(`${nume}-id`).value = data._id;
  config.fields.forEach(f => {
    const input = document.getElementById(`${nume}-${f}`) || document.getElementById(f.replace("_", "-"));
    if (input) input.value = data[f] || "";
  });
  document.getElementById(config.titleId).innerText = `Editează ${capitalize(nume)}`;
  deschideFormular(nume);
}

async function stergeEntitate(nume, id) {
  const config = entityConfig[nume];
  if (!confirm("Sigur vrei să ștergi?")) return;
  const res = await fetch(`${config.url}/${id}`, { method: "DELETE" });
  if (res.ok) incarcaEntitate(nume);
  else alert("Eroare la ștergere.");
}
