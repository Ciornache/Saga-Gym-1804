const http = require("http");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Modele
const models = {
  users: require("./models/User"),
  exercitii: require("./models/Exercitiu"),
  antrenamente: require("./models/Antrenament"),
  grupe: require("./models/Grupa"),
  corespondente: require("./models/Corespondenta")
};

mongoose.connect("mongodb://127.0.0.1:27017/sagagym", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = http.createServer(async (req, res) => {
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
    req.on("data", chunk => body += chunk);
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

  // Servire fișiere statice
  const filePath = path.join(__dirname, "../public", req.url === "/" ? "admin.html" : req.url);
  const ext = path.extname(filePath);
  const contentType = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
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

server.listen(3000, () => {
  console.log("✅ Serverul rulează pe http://localhost:3000");
});
