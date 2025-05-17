const http = require("http");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/sagagym", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/admin/users") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const user = new User(data);

        user
          .save()
          .then(() => {
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Utilizator salvat cu succes" }));
          })
          .catch((err) => {
            console.error("Eroare la salvare:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Eroare la salvare utilizator" }));
          });
      } catch (err) {
        console.error("JSON invalid:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Date trimise greșit (JSON invalid)" })
        );
      }
    });

    return;
  }

  if (req.method === "GET" && req.url === "/admin/users") {
    User.find()
      .then((users) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(users));
      })
      .catch((err) => {
        console.error("Eroare la citire:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Eroare la interogare utilizatori" }));
      });

    return;
  }

  // Servire fișiere statice
  const filePath = path.join(
    __dirname,
    "../public",
    req.url === "/" ? "admin.html" : req.url
  );
  const ext = path.extname(filePath);
  const contentType =
    {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
    }[ext] || "text/plain";

  if (fs.existsSync(filePath)) {
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${PORT}`);
});
