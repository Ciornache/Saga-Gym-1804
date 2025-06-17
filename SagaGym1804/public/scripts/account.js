function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

document.addEventListener("DOMContentLoaded", async () => {
  let activeRow = null;

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return (window.location.href = "login.html");

  function authFetch(url) {
    return fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  try {
    let res = await authFetch("/token/getuser");
    if (!res.ok) throw new Error();
    const { user_id } = await res.json();

    res = await fetch(`/admin/users/${user_id}`);
    const user = await (res.ok ? res.json() : {});
    document.getElementById("username-display").textContent = user.name;
    document.getElementById("username-value").textContent = user.name;
    document.getElementById("email-value").textContent = user.email;
    document.getElementById("phone-value").textContent = user.phone_number;
    document.getElementById("gender-value").textContent = user.gender;
    document.getElementById("weight-value").textContent = `${user.weight} kg`;
    document.getElementById("height-value").textContent = `${user.height} cm`;
    document.getElementById("password-value").textContent = "********";
    document
      .getElementById("bodytype-img")
      .querySelector("img")
      .setAttribute("src", `assets/${user.body_type}.png`);

    function cancelEdit(row) {
      const input = row.querySelector("input");
      if (!input) return;
      const btn = row.querySelector(".btn.edit");
      const val = row.querySelector(".value");
      input.remove();
      val.style.display = "";
      btn.textContent = "Edit";
      btn.onclick = null;
      activeRow = null;
    }

    document.addEventListener("click", (e) => {
      if (activeRow && !activeRow.contains(e.target)) {
        cancelEdit(activeRow);
      }
    });

    document.querySelectorAll(".detail-row").forEach((row) => {
      console.log(row, row.dataset.field);
      const field = row.dataset.field;
      const btn = row.querySelector(".btn.edit");
      const valEl = row.querySelector(".value");

      btn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        if (activeRow && activeRow !== row) cancelEdit(activeRow);
        if (row.querySelector("input")) return;
        activeRow = row;

        const old = user[field] || "";
        const input = document.createElement("input");
        input.type = field === "password" ? "password" : "text";
        input.value = field === "password" ? "" : old;
        input.style.flex = "1";
        row.insertBefore(input, btn);
        valEl.style.display = "none";

        btn.textContent = "Save";

        btn.onclick = async () => {
          const newVal = input.value.trim();
          if (!newVal) return alert("Cannot be empty.");

          if (["email", "name"].includes(field)) {
            const q = `${field}=${encodeURIComponent(newVal)}`;
            const chk = await fetch(`/admin/users?${q}`, { headers });
            const exists = (await chk.json()).length > 0;
            if (exists && newVal !== old) {
              return alert(`${field} already in use.`);
            }
          }

          if (!confirm(`Are you sure you want to update ${field}?`)) return;

          const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
          console.log("Token", token);
          const resp = await fetch("/token/getuser", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (resp.status === 200) {
            const data = await resp.json();
            const userId = data.user_id;
            const body = { [field]: newVal };
            const res = await fetch(`/api/update/user/?field=${field}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(body),
            });
            if (!res.ok) return alert("Update failed.");

            user[field] = newVal;
            valEl.textContent = field === "password" ? "********" : newVal;
            valEl.style.display = "";
            input.remove();
            btn.textContent = "Edit";
            btn.onclick = null;
            activeRow = null;
          }
        };
      });
    });

    const avatarCircle = document.querySelector(".avatar-circle");
    const avatarInput = document.getElementById("avatar-input");

    if (user.pfp_picture) {
      avatarCircle.style.backgroundImage = `url(${user.pfp_picture})`;
      avatarCircle.textContent = "";
    }

    avatarCircle.addEventListener("click", () => avatarInput.click());

    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("avatar", file);

      const resp = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await resp.json();
      if (result.success) {
        avatarCircle.style.backgroundImage = `url(${result.avatar_url})`;
        avatarCircle.textContent = "";
      } else {
        alert("Upload failed");
      }
    });
  } catch (err) {
    console.error(err);
  }
});
