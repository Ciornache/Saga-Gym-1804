require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");
const fsp = require("fs/promises");
const Exercitiu = require("./models/Exercitiu");
const Favourites = require("./models/Favourites");
const Activity = require("./models/Activity");
const Grupa = require("./models/Grupa");
const jwt = require("jsonwebtoken");
const url = require("url");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const { MongoClient, ObjectId } = require("mongodb");

const models = {
  users: require("./models/User"),
  exercitii: require("./models/Exercitiu"),
  antrenamente: require("./models/Antrenament"),
  grupe: require("./models/Grupa"),
  corespondente: require("./models/Corespondenta"),
  tip: require("./models/Tip"),
  favourites: require("./models/Favourites"),
};

mongoose.connect("mongodb://127.0.0.1:27017/sagagym", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  if (req.method === "GET" && req.url === "/exercise/getExerciseByName") {
    console.log("Request sent");
    const exercise = await models.exercitii.findOne({ name: req.headers.name });
    if (exercise) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(exercise));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Exercitiul nu a fost gasit" }));
    }
    return;
  }
  if (req.method === "GET" && req.url === "/validation/getUserByEmail") {
    const user = await models.users.findOne({ email: req.headers.email });
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Utilizatorul nu a fost găsit" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
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

  if (req.method === "GET" && req.url === "/token/getuser") {
    const payload = requireAuth();
    if (!payload) return;
    const user = await models.users.findById(payload.id);
    if (!user) {
      return send(res, 404, { error: "User not found" });
    }
    return send(res, 200, {
      user_id: payload.id,
      interval_varsta: user.interval_varsta,
    });
  }

  if (req.method === "GET" && pathname === "/favourites") {
    const payload = requireAuth();
    if (!payload) return;
    const user = await models.users.findById(payload.id);
    if (!user) {
      return send(res, 404, { error: "User not found" });
    }
    console.log("User id", user._id.toString());
    const favourites = await models.favourites.find({
      id_user: user._id.toString(),
    });
    return send(res, 200, {
      favourites: favourites,
    });
  }

  if (req.method === "GET" && pathname === "/api/workouts/") {
    const user = await requireAuth();
    if (!user) return;
    const filter = {};
    console.log(query);
    if (query.id) {
      filter.id_user = query.id;
    }
    console.log(filter);
    let workouts;
    try {
      workouts = await models.antrenamente.find(filter);
    } catch (err) {
      console.error("Eroare");
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Database error" }));
    }
    console.log("Antrenamente", workouts);

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(workouts));
  }

  if (req.method === "PUT" && pathname === "/api/activities") {
    const user = requireAuth();

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { id_exercitiu, activity_cnt, time } = JSON.parse(body);
        const id_user = user.id;

        const filter = { id_exercitiu, id_user };
        const update = { $inc: { activity_cnt, time } };
        const options = { new: true, upsert: true, setDefaultsOnInsert: true };

        const activity = await Activity.findOneAndUpdate(
          filter,
          update,
          options
        );

        return send(res, 200, { success: true, activity });
      } catch (err) {
        console.error("Activity upsert error:", err);
        return send(res, 500, { error: "Database error" });
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/auth/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = await models.users.findOne({ email });
        if (!user) {
          return send(res, 400, { msg: "Email inexistent" });
        }
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
          return send(res, 400, { msg: "Parolă greșită" });
        }
        const payload = { id: user._id.toString(), email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        return send(res, 200, { token });
      } catch (err) {
        return send(res, 500, { msg: err.message });
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/favourites/toggle") {
    const userData = requireAuth();
    if (!userData) return;

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { id_exercitiu } = JSON.parse(body);
        console.log(id_exercitiu);
        const filter = {
          id_user: new ObjectId(userData.id),
          id_exercitiu,
        };

        const existing = await Favourites.findOne(filter);
        if (existing) {
          await Favourites.deleteOne({ _id: existing.id });
          return send(res, 200, { msg: "Removed from favourites" });
        } else {
          await Favourites.create(filter);
          return send(res, 201, { msg: "Added to favourites" });
        }
      } catch (err) {
        console.error(err);
        return send(res, 500, { msg: "Server error" });
      }
    });
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
        const newUser = await model.create(data);
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

  function requireAuth() {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return null;
    }
    try {
      return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid token" }));
      return null;
    }
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
        console.log(data);
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

  req.url = req.url.split("?")[0];

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

const exercises_json_path = "public/assets/exercises.json";
const grupe_json_path = "public/assets/grupe_musculare.json";

async function updateDb() {
  await Exercitiu.deleteMany({});
  await Grupa.deleteMany({});
  let data = await fsp.readFile(exercises_json_path, "utf-8");
  const exercises_array = JSON.parse(data);
  await Exercitiu.insertMany(exercises_array);
  data = await fsp.readFile(grupe_json_path, "utf-8");
  const muscles_array = JSON.parse(data);
  await Grupa.insertMany(muscles_array);
}

server.listen(3000, () => {
  updateDb();
  console.log("✅ Serverul rulează pe http://localhost:3000");
});
