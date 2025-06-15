require("dotenv").config();
const http       = require("http");
const fs         = require("fs");
const path       = require("path");
const mongoose   = require("mongoose");
const crypto     = require("crypto");
const fsp        = require("fs/promises");
const Exercitiu  = require("./models/Exercitiu");
const Favourites = require("./models/Favourites");
const Grupa      = require("./models/Grupa");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Contact    = require("./models/Contact");      // <— new
const Review = require('./models/Review');
const ReviewLike = require('./models/ReviewLike');
const { MongoClient, ObjectId } = require("mongodb");

const models = {
  users:         require("./models/User"),
  exercitii:     Exercitiu,
  antrenamente:  require("./models/Antrenament"),
  grupe:         Grupa,
  corespondente: require("./models/Corespondenta"),
  tip:           require("./models/Tip"),
  contact:       Contact                         // <— new
};
models.reviews = Review;

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// — configure nodemailer to send via Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "icmtproducts@gmail.com",
    pass: "yjkdwkmiichjlslc"  // ← your App Password
  }
});
const CONTACT_EMAIL = "icmtproducts@gmail.com";

mongoose.connect("mongodb://127.0.0.1:27017/sagagym", {
  useNewUrlParser:    true,
  useUnifiedTopology: true
});

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  // ————————— EXISTING ROUTES —————————

  // GET /exercise/getExerciseByName
  if (req.method === "GET" && url === "/exercise/getExerciseByName") {
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
  if (req.method === "GET" && url.startsWith("/validation/")) {
    let user, field, headerKey;
    if (url === "/validation/getUserByEmail") {
      field = "email"; headerKey = "email";
    } else if (url === "/validation/getUserByName") {
      field = "name"; headerKey = "name";
    } else if (url === "/validation/getUserByPhoneNumber") {
      field = "phone_number"; headerKey = "phonenumber";
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

  // POST /api/auth/login
  if (req.method === "POST" && url === "/api/auth/login") {
    let body = "";
    req.on("data", chunk => body += chunk);
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

  // POST /api/favourites/toggle
  if (req.method === "POST" && url === "/api/favourites/toggle") {
    const userData = requireAuth(req, res);
    if (!userData) return;
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { id_exercitiu } = JSON.parse(body);
        const filter = {
          id_user: new ObjectId(userData.id),
          id_exercitiu
        };
        const existing = await Favourites.findOne(filter);
        if (existing) {
          await Favourites.deleteOne({ _id: existing._id });
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
  if (req.method === "POST" && url === "/api/register") {
    let body = "";
    req.on("data", chunk => body += chunk);
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
  if (req.method === "POST" && url === "/api/contact") {
    let body = "";
    req.on("data", chunk => body += chunk);
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
      Contact.create({ firstName, lastName, email, phone, message })
        .catch(err => console.error("DB save error:", err));

      // send email
      const mailOptions = {
        from:    `"Gym Saga Contact" <icmtproducts@gmail.com>`,
        to:      CONTACT_EMAIL,
        replyTo: email,
        subject: `New contact from ${firstName} ${lastName}`,
        text:    `
Name:    ${firstName} ${lastName}
Email:   ${email}
Phone:   ${phone || '(none)'}
Message:
${message}
        `
      };
      transporter.sendMail(mailOptions)
        .then(() => send(res, 200, { message: "Your message was sent successfully!" }))
        .catch(err => {
          console.error("Mailer error:", err);
          send(res, 500, { error: "Could not send email." });
        });
    });
    return;
  }

  // ————— GET ALL CONTACTS —————
  if (req.method === "GET" && url === "/api/contacts") {
    try {
      const list = await Contact.find().sort({ createdAt: -1 });
      return send(res, 200, list);
    } catch {
      return send(res, 500, { error: "Could not fetch contacts." });
    }
  }
  // POST /api/reviews → salvează un review
if (req.method === 'POST' && url === '/api/reviews') {
  const userData = requireAuth(req, res);
  if (!userData) return;

  let body = '';
  req.on('data', c => body += c);
  return req.on('end', async () => {
    try {
      const { exerciseId, rating, comment } = JSON.parse(body);
      if (!exerciseId || !rating || !comment) {
        return send(res, 400, { error: 'Missing fields.' });
      }

      const existing = await Review.findOne({ exerciseId, userEmail: userData.email });
      if (existing) {
        existing.rating = rating;
        existing.comment = comment;
        existing.updatedAt = new Date();
        await existing.save();
        return send(res, 200, existing);
      } else {
        const newReview = await Review.create({ exerciseId, rating, comment, userEmail: userData.email });
        return send(res, 201, newReview);
      }
    } catch (err) {
      console.error(err);
      return send(res, 500, { error: 'Server error.' });
    }
  });
}
// GET /api/reviews?exerciseId=xxx → aduce toate review-urile
if (req.method === 'GET' && url.startsWith('/api/reviews')) {
  const qs = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const exerciseId = qs.get('exerciseId');
  if (!exerciseId) {
    return send(res, 400, { error: 'exerciseId required' });
  }
  try {
    const list = await Review.find({ exerciseId })
                             .sort({ createdAt: -1 });
    return send(res, 200, list);
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: 'Server error.' });
  }
}
// DELETE /api/reviews/:id → doar dacă review-ul aparține utilizatorului
if (req.method === "DELETE" && url.startsWith("/api/reviews/")) {
  const user = requireAuth(req, res);
  if (!user) return;

  const reviewId = url.split("/")[3];
  try {
    const review = await Review.findById(reviewId);
    if (!review) return send(res, 404, { error: "Review not found" });

    if (review.userEmail !== user.email) {
      return send(res, 403, { error: "Forbidden" });
    }

    await Review.findByIdAndDelete(reviewId);
    return send(res, 200, { message: "Review șters cu succes" });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Server error" });
  }
}
if (req.method === 'GET' && url.startsWith('/api/review-likes/')) {
  const user = requireAuth(req, res);
  if (!user) return;

  const reviewId = url.split('/')[3];
  try {
    const count = await ReviewLike.countDocuments({ reviewId });
    const alreadyLiked = await ReviewLike.exists({ reviewId, userEmail: user.email });
    return send(res, 200, { count, liked: !!alreadyLiked });
  } catch (err) {
    return send(res, 500, { error: 'Server error' });
  }
}
if (req.method === 'POST' && url.startsWith('/api/review-likes/')) {
  const user = requireAuth(req, res);
  if (!user) return;

  const reviewId = url.split('/')[3];
  try {
    const existing = await ReviewLike.findOne({ reviewId, userEmail: user.email });
    if (existing) {
      await ReviewLike.deleteOne({ _id: existing._id });
      return send(res, 200, { liked: false });
    } else {
      await ReviewLike.create({ reviewId, userEmail: user.email });
      return send(res, 201, { liked: true });
    }
  } catch (err) {
    return send(res, 500, { error: 'Server error' });
  }
}


  // ————— EXISTING ADMIN & CRUD ROUTES —————
  const match = url.match(/^\/admin\/(\w+)(?:\/(.*))?$/);
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
      } catch {
        return send(res, 400, { error: "JSON invalid" });
      }
    });
    return;
  }

  // ————— STATIC FILES —————
  const filePath = path.join(
    __dirname,
    "../public",
    url === "/" ? "index.html" : url
  );
  const ext = path.extname(filePath);
  const contentType = {
    ".html": "text/html", ".css": "text/css",
    ".js":   "application/javascript", ".json": "application/json",
    ".jpg":  "image/jpeg", ".jpeg": "image/jpeg",
    ".png":  "image/png", ".svg": "image/svg+xml"
  }[ext] || "text/plain";

  if (fs.existsSync(filePath)) {
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    send(res, 404, "Not Found");
  }
});

function requireAuth(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    send(res, 401, { error: "Unauthorized" });
    return null;
  }
  try {
    return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    send(res, 401, { error: "Invalid token" });
    return null;
  }
}

const send = (res, code, payload) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
};

const exercises_json_path = "public/assets/exercises.json";
const grupe_json_path     = "public/assets/grupe_musculare.json";

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
