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
const nodemailer = require("nodemailer");
const Contact = require("./models/Contact"); // <— new
const Review = require("./models/Review");
const ReviewLike = require("./models/ReviewLike");

const models = {
  users: require("./models/User"),
  exercitii: Exercitiu,
  antrenamente: require("./models/Antrenament"),
  grupe: Grupa,
  corespondente: require("./models/Corespondenta"),
  tip: require("./models/Tip"),
  contact: Contact,
  favourites: require("./models/Favourites"),
};
models.reviews = Review;
const url = require("url");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// — configure nodemailer to send via Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "icmtproducts@gmail.com",
    pass: "yjkdwkmiichjlslc", // ← your App Password
  },
});
const CONTACT_EMAIL = "icmtproducts@gmail.com";
const { MongoClient, ObjectId } = require("mongodb");

mongoose.connect("mongodb://127.0.0.1:27017/sagagym", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);
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
  // ————————— EXISTING ROUTES —————————

  // GET /exercise/getExerciseByName

  if (req.method === "GET" && pathname === "/exercise/getExerciseByName") {
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

  // GET validation routes
  if (req.method === "GET" && pathname.startsWith("/validation/")) {
    let user, field, headerKey;
    if (pathname === "/validation/getUserByEmail") {
      field = "email";
      headerKey = "email";
    } else if (pathname === "/validation/getUserByName") {
      field = "name";
      headerKey = "name";
    } else if (pathname === "/validation/getUserByPhoneNumber") {
      field = "phone_number";
      headerKey = "phonenumber";
    }
    if (field) {
      user = await models.users.findOne({ [field]: req.headers[headerKey] });
      if (user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Utilizatorul nu a fost găsit" }));
      }
      return;
    }
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

  if (req.method === "GET" && req.url === "/token/getuser") {
    const payload = requireAuth();
    if (!payload) return;
    console.log("AICI", payload);
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

  // POST /api/auth/login
  if (req.method === "POST" && pathname === "/api/auth/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = await models.users.findOne({ email });
        if (!user) return send(res, 400, { msg: "Email inexistent" });
        if (user.password !== hashPassword(password)) {
          return send(res, 400, { msg: "Parolă greșită" });
        }
        const token = jwt.sign(
          { id: user._id.toString(), email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
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
        return send(res, 500, { msg: "Server error" });
      }
    });
    return;
  }

  // POST /api/register
  if (req.method === "POST" && pathname === "/api/register") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        data.password = hashPassword(data.password);
        await models.users.create(data);
        return send(res, 201, { message: "Utilizator salvat cu succes" });
      } catch (err) {
        return send(res, 500, { error: "Eroare la salvarea utilizatorului" });
      }
    });
    return;
  }

  // ————— CONTACT FORM ENDPOINT —————
  if (req.method === "POST" && pathname === "/api/contact") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        return send(res, 400, { error: "Invalid JSON." });
      }
      const { firstName, lastName, email, phone, message } = data;
      if (!firstName || !lastName || !email || !message) {
        return send(res, 400, { error: "Missing required fields." });
      }

      // save to MongoDB
      Contact.create({ firstName, lastName, email, phone, message }).catch(
        (err) => console.error("DB save error:", err)
      );

      // send email
      const mailOptions = {
        from: `"Gym Saga Contact" <icmtproducts@gmail.com>`,
        to: CONTACT_EMAIL,
        replyTo: email,
        subject: `New contact from ${firstName} ${lastName}`,
        text: `
Name:    ${firstName} ${lastName}
Email:   ${email}
Phone:   ${phone || "(none)"}
Message:
${message}
        `,
      };
      transporter
        .sendMail(mailOptions)
        .then(() =>
          send(res, 200, { message: "Your message was sent successfully!" })
        )
        .catch((err) => {
          console.error("Mailer error:", err);
          send(res, 500, { error: "Could not send email." });
        });
    });
    return;
  }

  // ————— GET ALL CONTACTS —————
  if (req.method === "GET" && pathname === "/api/contacts") {
    try {
      const list = await Contact.find().sort({ createdAt: -1 });
      return send(res, 200, list);
    } catch {
      return send(res, 500, { error: "Could not fetch contacts." });
    }
  }

  // ————— EXISTING ADMIN & CRUD ROUTES —————
  const match = pathname.match(/^\/admin\/(\w+)(?:\/(.*))?$/);
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
      } catch {
        return send(res, 400, { error: "JSON invalid" });
      }
    });
    return;
  }
   // Reviews summary
  if (req.method === "GET" && pathname === "/api/reviews-summary") {
    const payload = requireAuth();
    if (!payload) return;
    const reviews = await Review.find({ userEmail: payload.email });
    const reviewCount = reviews.length;
    const avgRating = reviewCount
      ? reviews.reduce((s,r)=>s+r.rating,0)/reviewCount
      : 0;
    const likeCounts = await Promise.all(
      reviews.map(r => ReviewLike.countDocuments({ reviewId: r._id }))
    );
    const totalLikes = likeCounts.reduce((s,c)=>s+c,0);
    const likesPerReview = reviewCount ? totalLikes/reviewCount : 0;
    const minLikes = likeCounts.length ? Math.min(...likeCounts) : 0;
    const maxLikes = likeCounts.length ? Math.max(...likeCounts) : 0;
    return send(res, 200, {
      reviewCount,
      avgRating,
      totalLikes,
      likesPerReview,
      minLikes,
      maxLikes
    });
  }

 
// ─── API: Reviews, Review-Likes & Summaries ─────────────────────────────────
  // NOTE: Place this block immediately before your "static files" code, and delete any duplicate handlers.

  // Reviews CRUD
  if (pathname.startsWith("/api/reviews")) {
    if (req.method === "GET") {
      const qs = new URL(req.url, `http://${req.headers.host}`).searchParams;
      const exerciseId = Number(qs.get("exerciseId"));
      if (!exerciseId) return send(res, 400, { error: "exerciseId required" });
      const list = await Review.find({ exerciseId }).sort({ createdAt: -1 });
      return send(res, 200, list);
    }
    if (req.method === "POST") {
      const payload = requireAuth();
      if (!payload) return;
      let body = "";
      req.on("data", c => body += c);
      req.on("end", async () => {
        const { exerciseId, rating, comment } = JSON.parse(body);
        if (!Number.isInteger(exerciseId) || !rating || !comment) {
          return send(res, 400, { error: "Missing or invalid fields." });
        }
        let review = await Review.findOne({ exerciseId, userEmail: payload.email });
        if (review) {
          review.rating = rating;
          review.comment = comment;
          review.updatedAt = new Date();
          await review.save();
          return send(res, 200, review);
        } else {
          const newR = await Review.create({ exerciseId, rating, comment, userEmail: payload.email });
          return send(res, 201, newR);
        }
      });
      return;
    }
  }

  // Review-likes
  if (pathname.startsWith("/api/review-likes/")) {
    const payload = requireAuth();
    if (!payload) return;
    const reviewId = pathname.split("/")[3];
    if (req.method === "GET") {
      const count = await ReviewLike.countDocuments({ reviewId });
      const liked = await ReviewLike.exists({ reviewId, userEmail: payload.email });
      return send(res, 200, { count, liked: !!liked });
    }
    if (req.method === "POST") {
      const exists = await ReviewLike.findOne({ reviewId, userEmail: payload.email });
      if (exists) {
        await ReviewLike.deleteOne({ _id: exists._id });
        return send(res, 200, { liked: false });
      } else {
        await ReviewLike.create({ reviewId, userEmail: payload.email });
        return send(res, 201, { liked: true });
      }
    }
  }

  // Favorites summary
  if (req.method === "GET" && pathname === "/api/favorites-summary") {
    const payload = requireAuth();
    if (!payload) return;
    const favs = await Favourites.find({ id_user: payload.id });
    const favCount = favs.length;
    const ids = favs.map(f => Number(f.id_exercitiu));
    const exs = await Exercitiu.find({ id: { $in: ids } });
    const typeCounts = {}, mgCounts = {};
    exs.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type]||0)+1;
      e.muscle_groups.forEach(m=> mgCounts[m]=(mgCounts[m]||0)+1);
    });
    const favTypes = Object.entries(typeCounts).map(([l,v])=>({label:l,value:v}));
    const muscleGroups = Object.entries(mgCounts).map(([l,v])=>({label:l,value:v}));
    const avgDifficulty = favCount
      ? exs.reduce((s,e)=>s+e.difficulty,0)/favCount
      : 0;
    return send(res, 200, {
      favCount,
      favTypes,
      likedExercises: exs.map(e=>e.name),
      muscleGroups,
      avgDifficulty
    });
  }

 
  // Activity summary
  if (req.method === "GET" && pathname === "/api/activity-summary") {
    const payload = requireAuth();
    if (!payload) return;
    const acts = await Activity.find({ id_user: payload.id });
    const totalWorkouts = acts.length;
    const totalSets = acts.reduce((s,a)=>s+(a.activity_cnt||0),0);
    const totalTimeNum = acts.reduce((s,a)=>s+(a.time||0),0);
    const hours = Math.floor(totalTimeNum/60), mins = totalTimeNum%60;
    const totalTime = `${hours} h ${mins} m`;
    const avgDuration = totalWorkouts
      ? Math.round(totalTimeNum/totalWorkouts)
      : 0;
    return send(res, 200, {
      totalWorkouts,
      totalSets,
      totalExercises: acts.length,
      totalWeight: 12500,
      totalKm: 85,
      totalTime,
      avgDuration: `${avgDuration} m`,
      totalStretching: 40,
      weekly: {
        thisWeek: 5,
        lastWeek: 3,
        kmThisWeek: 20,
        kmLastWeek: 10,
        dailyWorkouts: [1,1,1,1,1,0,0]
      }
    });
  }
  // ————— STATIC FILES —————
  const filePath = path.join(
    __dirname,
    "../public",
    pathname === "/" ? "index.html" : pathname
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
