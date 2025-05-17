document.addEventListener("DOMContentLoaded", () => {
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
  const formular = document.getElementById("form-utilizator");
  const btn = document.getElementById("add-util-btn");

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

function resetFormularUtilizator() {
  document.getElementById("utilizator-id").value = "";
  document.getElementById("nume").value = "";
  document.getElementById("email").value = "";
  document.getElementById("parola").value = "";
  document.getElementById("gen").value = "";
  document.getElementById("form-titlu").innerText = "Adaugă Utilizator";
}

function anuleaza() {
  document.getElementById("form-utilizator").classList.add("hidden");
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
    anuleaza();
    incarcaUtilizatori();
  } else {
    alert("Eroare la salvare.");
  }
}

async function editeazaUtilizator(id) {
  const res = await fetch(`/admin/users/${id}`);
  const user = await res.json();

  document.getElementById("form-titlu").innerText = "Editează Utilizator";
  document.getElementById("form-utilizator").classList.remove("hidden");

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
  const formular = document.getElementById("form-exercitiu");
  const btn = document.getElementById("add-exercitii-btn"); // <-- asigură-te că butonul are acest ID

  if (!formular || !btn) {
    console.error("Formularul sau butonul (exercitiu) lipsesc");
    return;
  }

  const esteAscuns = formular.classList.contains("hidden");

  if (esteAscuns) {
    formular.classList.remove("hidden");
    btn.textContent = "❌ Închide formular";
    resetFormularExercitiu();
  } else {
    formular.classList.add("hidden");
    btn.textContent = "➕ Adaugă Exercițiu";
    resetFormularExercitiu();
  }
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
  document.getElementById("form-exercitiu").classList.add("hidden");
}

async function salveazaExercitiu() {
  const id = document.getElementById("exercitiu-id").value;
  const exercitiu = {
    name: document.getElementById("ex-nume").value,
    type: document.getElementById("ex-tip").value,
    muscle_groups: document
      .getElementById("ex-grupe")
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
    anuleazaExercitiu();
    incarcaExercitii();
  } else {
    alert("Eroare la salvare exercițiu.");
  }
}

async function editeazaExercitiu(id) {
  const res = await fetch(`/admin/exercitii/${id}`);
  const ex = await res.json();

  document.getElementById("form-exercitiu-titlu").innerText =
    "Editează Exercițiu";
  document.getElementById("form-exercitiu").classList.remove("hidden");

  document.getElementById("exercitiu-id").value = ex._id;
  document.getElementById("ex-nume").value = ex.name;
  document.getElementById("ex-tip").value = ex.type;
  document.getElementById("ex-grupe").value = ex.muscle_groups.join(", ");
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
        <td>${an.name}</td>
        <td>${an.type}</td>
        <td>
          <button onclick="editeazaAntrenament('${an._id}')">✏️</button>
          <button onclick="stergeAntrenament('${an._id}')">🗑️</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

window.showAntrenamentForm = function () {
  const formular = document.getElementById("form-antrenament");
  const btn = document.getElementById("add-antrenamente-btn");

  if (!formular || !btn) {
    console.error("Formularul sau butonul (antrenament) lipsesc");
    return;
  }

  const esteAscuns = formular.classList.contains("hidden");

  if (esteAscuns) {
    formular.classList.remove("hidden");
    btn.textContent = "❌ Închide formular";
    resetFormularAntrenament();
  } else {
    formular.classList.add("hidden");
    btn.textContent = "➕ Adaugă Antrenament";
    resetFormularAntrenament();
  }
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
  document.getElementById("form-antrenament").classList.add("hidden");
}

async function salveazaAntrenament() {
  const id = document.getElementById("antrenament-id").value;
  const antrenament = {
    name: document.getElementById("an-nume").value,
    type: document.getElementById("an-tip").value,
  };

  const url = id ? `/admin/antrenamente/${id}` : "/admin/antrenamente";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(antrenament),
  });

  if (res.ok) {
    anuleazaAntrenament();
    incarcaAntrenamente();
  } else {
    alert("Eroare la salvare antrenament.");
  }
}

async function editeazaAntrenament(id) {
  const res = await fetch(`/admin/antrenamente/${id}`);
  const an = await res.json();

  document.getElementById("form-antrenament-titlu").innerText =
    "Editează Antrenament";
  document.getElementById("form-antrenament").classList.remove("hidden");

  document.getElementById("antrenament-id").value = an._id;
  document.getElementById("an-nume").value = an.name;
  document.getElementById("an-tip").value = an.type;
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
  const formular = document.getElementById("form-grupa");
  const btn = document.getElementById("add-grupa-btn");

  if (!formular || !btn) {
    console.error("Formularul sau butonul (grupă) lipsesc");
    return;
  }

  const esteAscuns = formular.classList.contains("hidden");

  if (esteAscuns) {
    formular.classList.remove("hidden");
    btn.textContent = "❌ Închide formular";
    resetFormularGrupa();
  } else {
    formular.classList.add("hidden");
    btn.textContent = "➕ Adaugă Grupă";
    resetFormularGrupa();
  }
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
  document.getElementById("form-grupa").classList.add("hidden");
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
    anuleazaGrupa();
    incarcaGrupe();
  } else {
    alert("Eroare la salvare grupă musculară.");
  }
}

async function editeazaGrupa(id) {
  const res = await fetch(`/admin/grupe/${id}`);
  const gr = await res.json();

  document.getElementById("form-grupa-titlu").innerText = "Editează Grupă";
  document.getElementById("form-grupa").classList.remove("hidden");

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
