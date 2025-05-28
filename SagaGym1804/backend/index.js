const http = require("http");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");
const fsp = require("fs/promises");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Modele
const models = {
  users: require("./models/User"),
  exercitii: require("./models/Exercitiu"),
  antrenamente: require("./models/Antrenament"),
  grupe: require("./models/Grupa"),
  corespondente: require("./models/Corespondenta"),
};

mongoose.connect("mongodb://127.0.0.1:27017/sagagym", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/validation/getUserByEmail") {
    const user = await models.users.findOne({ email: req.headers.email });
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Utilizatorul nu a fost găsit" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
      console.log(user);
    }
    return;
  }

  if (req.method === "GET" && req.url === "/validation/getUserByName") {
    const user = await models.users.findOne({ name: req.headers.name });
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Utilizatorul nu a fost găsit" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    }
    return;
  }

  if (req.method === "GET" && req.url === "/validation/getUserByPhoneNumber") {
    const user = await models.users.findOne({
      phone_number: req.headers.phonenumber,
    });
    console.log(req.headers.phonenumber);
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Utilizatorul nu a fost găsit" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/register") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        console.log("Received data:", data);
        data.password = hashPassword(data.password);

        const model = models["users"];
        const user = model.create(data);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Utilizator salvat cu succes" }));
      } catch (err) {
        console.error("Eroare la salvare:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Eroare la salvarea utilizatorului" }));
      }
    });

    return;
  }

  const match = req.url.match(/^\/admin\/(\w+)(?:\/(.*))?$/);
  if (match) {
    const [, entity, id] = match;
    const model = models[entity];
    if (!model) return send(res, 404, { error: "Entitate invalidă" });

    if (req.method === "GET" && !id) {
      const data = await model.find();
      return send(res, 200, data);
    }

    if (req.method === "GET" && id) {
      const item = await model.findById(id);
      return send(res, 200, item);
    }

    if (req.method === "DELETE" && id) {
      await model.findByIdAndDelete(id);
      return send(res, 200, { message: "Șters" });
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        if (req.method === "POST") {
          await model.create(data);
          return send(res, 201, { message: "Creat" });
        }
        if (req.method === "PUT" && id) {
          await model.findByIdAndUpdate(id, data);
          return send(res, 200, { message: "Actualizat" });
        }
        return send(res, 400, { error: "Cerere invalidă" });
      } catch (e) {
        return send(res, 400, { error: "JSON invalid" });
      }
    });
    return;
  }

  const filePath = path.join(
    __dirname,
    "../public",
    req.url === "/" ? "index.html" : req.url
  );
  const ext = path.extname(filePath);
  const contentType =
    {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    }[ext] || "text/plain";

  if (fs.existsSync(filePath)) {
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    send(res, 404, "Not Found");
  }
});

const send = (res, code, payload) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
};

async function insertExercisesIntoDB(json_path) {
  const data = await fsp.readFile(json_path, "utf-8");
  const json = JSON.parse(data);
  console.log(json);
  for (exercise of json) {
    try {
      console.log(exercise);
      const response = await fetch("/http://localhost:3000/admin/exercitii", {
        method: "Post",
        header: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exercise),
      });
      console.log(response.status);
    } catch (err) {
      console.error("Failed to insert");
    }
  }
}

server.listen(3000, () => {
  insertExercisesIntoDB("public/assets/translated_exercises.json");
  console.log("✅ Serverul rulează pe http://localhost:3000");
});
