require("dotenv").config();
const formidable = require("formidable");
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
const Contact = require("./models/Contact");
const Review = require("./models/Review");
const ReviewLike = require("./models/ReviewLike");
const SetInfo = require("./models/SetInfo");
const WorkoutActivity = require("./models/WorkoutActivity");

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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "icmtproducts@gmail.com",
    pass: "yjkdwkmiichjlslc",
  },
});
const CONTACT_EMAIL = "icmtproducts@gmail.com";
const { MongoClient, ObjectId } = require("mongodb");

mongoose.connect(
  "mongodb+srv://varunax424:RsiRPVBTxJItTu6c@sagacluster.ybauvs6.mongodb.net/sagaDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  if (req.method === "POST" && pathname === "/api/setinfo") {
    const user = requireAuth();
    if (!user) return;

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const arr = JSON.parse(body);
        const docs = arr.map((item) => ({
          ...item,
          id_user: user.id,
        }));
        await SetInfo.insertMany(docs);
        return send(res, 200, { success: true });
      } catch (err) {
        return send(res, 500, { error: "Could not save set info" });
      }
    });
    return;
  }

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
    if (!user) return send(res, 404, { error: "User not found" });

    return send(res, 200, {
      user_id: payload.id,
      interval_varsta: user.interval_varsta,
    });
  }

  if (req.method === "POST" && pathname === "/api/upload/avatar") {
    const payload = requireAuth();
    if (!payload) return;

    const uploadDir =
      "F:/Saga-Gym-1804/SagaGym1804/public/assets/images/profile_pictures";
    const form = new formidable.IncomingForm({
      uploadDir:
        "F:/Saga-Gym-1804/SagaGym1804/public/assets/images/profile_pictures",
      keepExtensions: true,
    });

    return form.parse(req, async (err, fields, files) => {
      if (err) {
        return send(res, 500, { error: "Upload error" });
      }
      const arr = files.avatar;
      const file = Array.isArray(arr) ? arr[0] : arr;
      if (!file) return send(res, 400, { error: "No file provided" });

      const ext = path.extname(file.originalFilename);
      const newName = `avatar-${payload.id}${ext}`;
      const newPath = path.join(uploadDir, newName);
      await fsp.rename(file.filepath, newPath);

      const relUrl = `/assets/images/profile_pictures/${newName}`;
      await models.users.findByIdAndUpdate(payload.id, { pfp_picture: relUrl });

      return send(res, 200, { success: true, avatar_url: relUrl });
    });
  }

  if (req.method === "GET" && pathname === "/api/workouts/") {
    const user = await requireAuth();
    if (!user) return;
    const filter = {};
    if (query.id) {
      filter.id_user = query.id;
    }
    let workouts;
    try {
      workouts = await models.antrenamente.find(filter);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Database error" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(workouts));
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

  if (
    req.method === "GET" &&
    pathname === "/favourites" &&
    req.headers.exercise
  ) {
    let favs = await models.favourites.find({});
    if (favs) {
      favs = favs.filter((fav) => fav.id_exercitiu === req.headers.exercise);
      return send(res, 200, {
        count: favs.length,
      });
    } else {
      return send(res, 404, { error: "No favourites found" });
    }
    return;
  }

  if (
    req.method === "GET" &&
    pathname === "/favourites"
  ) {
    const favs = await models.favourites.find();
    if (favs) {
      const favExercises = [...new Set(favs)];
      const favsWithDetails = favExercises.map((fav) => {
        const favCount = favs.filter(
          (f) => f.id_exercitiu === fav.id_exercitiu
        );
        return {
          cnt: favCount,
          id_exercitiu: fav.id_exercitiu,
        };
      });

      return send(res, 200, {
        favourites: favsWithDetails,
      });
    } else {
      return send(res, 404, { error: "No favourites found" });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/favourites") {
    const payload = requireAuth();
    if (!payload) return;
    const user = await models.users.findById(payload.id);
    if (!user) {
      return send(res, 404, { error: "User not found" });
    }
    const favourites = await models.favourites.find({
      id_user: user._id.toString(),
    });
    return send(res, 200, {
      favourites: favourites,
    });
  }

  if (req.method === "GET" && pathname === "/api/workouts/") {
    const user = await requireAuth();
    if (!user) {
      return;
    }
    const filter = {};
    if (query.id) {
      filter.id_user = query.id;
    }
    let workouts;
    try {
      workouts = await models.antrenamente.find(filter);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Database error" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(workouts));
  }

  if (req.method === "GET" && pathname === "/api/check-workout-name") {
    const user = requireAuth();
    if (!user) return;

    const nameToCheck = query.name?.trim();
    if (!nameToCheck) return send(res, 400, { error: "Workout name required" });

    try {
      const exists = await models.antrenamente.findOne({
        id_user: user.id,
        name: nameToCheck,
      });
      return send(res, 200, { exists: !!exists });
    } catch (err) {
      return send(res, 500, { error: "Internal error" });
    }
  }

  if (req.method === "PUT" && pathname === "/api/update/user/") {
    const payload = requireAuth();
    if (!payload) return;

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const field = query.field;
        const allowed = [
          "email",
          "name",
          "phone_number",
          "gender",
          "weight",
          "height",
          "body_type",
          "password",
          "interval_varsta",
        ];

        const interval_varsta_mappings = [
          { str: "<18", v: 18 },
          { str: "18-25", v: 26 },
          { str: "26-35", v: 36 },
          { str: "36-45", v: 46 },
          { str: "60+", v: 1000 },
        ];

        if (!allowed.includes(field)) {
          return send(res, 400, { error: "Invalid field" });
        }

        const data = JSON.parse(body);
        const newVal = data[field];
        if (newVal == null || newVal === "") {
          return send(res, 400, { error: "No value provided" });
        }

        if (["email", "name"].includes(field)) {
          const existing = await models.users.findOne({ [field]: newVal });
          if (existing && existing._id.toString() !== payload.id) {
            return send(res, 409, { error: `${field} already in use` });
          }
        }

        const update = {};
        if (field === "password") {
          update.password = hashPassword(newVal);
        } else {
          update[field] = newVal;
        }

        if (field === "interval_varsta") {
          for (mapping of interval_varsta_mappings) {
            if (mapping.v > newVal) {
              update.interval_varsta = mapping.str;
              break;
            }
          }
        }

        await models.users.findByIdAndUpdate(payload.id, update);

        return send(res, 200, {
          success: true,
          [field]: field === "password" ? "********" : newVal,
        });
      } catch (err) {
        return send(res, 500, { error: "Server error" });
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
        return send(res, 500, { error: "Database error" });
      }
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/leaderboard") {
    const { gender, workoutType, age, muscle, weight } = query || {};
    const userFilter = {};
    if (gender) {
      userFilter.gender = String(gender[0]).toUpperCase() + gender.slice(1);
    }
    if (age) {
      userFilter.interval_varsta = age;
    }
    if (weight) {
      if (weight.endsWith("+")) {
        let min = weight.split("-")[0];
        userFilter.weight = { $gte: Number(min) };
      } else if (weight.includes("-")) {
        const [min, max] = weight.split("-").map(Number);
        userFilter.weight = { $gte: min, $lt: max };
      } else if (weight.startsWith("<")) {
        userFilter.weight = { $lt: Number(weight.slice(1)) };
      }
    }

    const users = await models.users.find(userFilter);
    const userIds = users.map((u) => u._id.toString());
    const activities = await Activity.find({ id_user: { $in: userIds } });

    const exFilter = {};
    if (workoutType) {
      exFilter.type = workoutType;
    }

    let exList = await models.exercitii.find(exFilter);
    if (muscle)
      exList = exList.filter((e) =>
        e.muscle_groups.includes(muscle.toLowerCase())
      );
    exList = exList.map((e) => e.id);
    const exIds = exList.map((e) => String(e));
    const board = users
      .map((u) => {
        const acts = activities.filter(
          (a) =>
            a.id_user === u._id.toString() && exIds.includes(a.id_exercitiu)
        );
        const totalCnt = acts.reduce((s, a) => s + a.activity_cnt, 0);
        const totalTime = acts.reduce((s, a) => s + a.time, 0);
        const score = 0.6 * totalCnt + 0.4 * totalTime;
        return {
          username: u.name,
          score,
          joinDate: u.createdAt,
        };
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);

    return send(res, 200, board);
  }

  if (req.method === "PUT" && pathname === "/api/workout-activities") {
    const user = requireAuth();
    if (!user) return;

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { id_workout, wk_cnt, duration } = JSON.parse(body);
        const id_user = user.id;

        const filter = { id_user, id_workout };
        const update = { wk_cnt, duration };
        const options = { new: true, upsert: true, setDefaultsOnInsert: true };

        const rec = await WorkoutActivity.findOneAndUpdate(
          filter,
          update,
          options
        );
        return send(res, 200, { success: true, workoutActivity: rec });
      } catch (err) {
        return send(res, 500, { error: "Could not save workout activity" });
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
        return send(res, 500, { error: "Database error" });
      }
    });
    return;
  }
if (req.method === "GET" && pathname === "/api/activity/unique-exercises") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;

  const ids = await Activity.distinct("id_exercitiu", { id_user: userId });
  const totalUniqueExercises = ids.length;

  return send(res, 200, { totalUniqueExercises });
}

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

      Contact.create({ firstName, lastName, email, phone, message }).catch(
        (err) => console.error("DB save error:", err)
      );

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

  if (req.method === "GET" && pathname === "/api/contacts") {
    try {
      const list = await Contact.find().sort({ createdAt: -1 });
      return send(res, 200, list);
    } catch {
      return send(res, 500, { error: "Could not fetch contacts." });
    }
  }
  if (req.method === "GET" && pathname === "/api/reviews-summary") {
  const payload = requireAuth();
  if (!payload) return;
  const reviews = await Review.find({ userEmail: payload.email });
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((s,r)=>s + r.rating, 0) / reviewCount
    : 0;
  const likeCounts = await Promise.all(
    reviews.map(r => ReviewLike.countDocuments({ reviewId: r._id }))
  );
  const totalLikes = likeCounts.reduce((s,c)=>s+c, 0);
  const likesPerReview = reviewCount ? totalLikes / reviewCount : 0;
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
if (req.method === "POST" && pathname === "/api/setinfo") {
  const user = requireAuth();
  if (!user) return;

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const list = JSON.parse(body);
      if (!Array.isArray(list)) {
        console.warn("❌ Nu am primit un array:", list);
        return send(res, 400, { error: "Expected array" });
      }

      const docs = list.map((s) => ({
        id_user: user.id,
        id_exercitiu: s.id_exercitiu,
        weight_type: s.weight_type,
        weight_kicker: s.weight_kicker,
      }));

      console.log("📥 Received SetInfo:", docs);

      await SetInfo.insertMany(docs);

      console.log(`✅ ${docs.length} seturi au fost salvate în SetInfo.`);

      return send(res, 201, {
        message: "SetInfo saved",
        count: docs.length,
      });
    } catch (err) {
      console.error("🔥 Eroare la salvarea în SetInfo:", err);
      return send(res, 500, { error: "Server error" });
    }
  });
  return;
}
if (req.method === "GET" && pathname === "/api/workout-activities-debug") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  const list = await WorkoutActivity.find({ id_user: userId });
  return send(res, 200, list);
}

if (
    req.method === "GET" &&
    pathname === "/api/reviews" &&
    !query.exerciseId
  ) {
    const reviews = await Review.find({});
    if (!reviews) {
      return send(res, 400, {
        Error: 'Couldn"t fetch the exercises',
      });
    } else {
      return send(res, 200, {
        reviews: reviews,
      });
    }
  }
  // POST /api/reviews → salvează un review
  if (req.method === "POST" && pathname === "/api/reviews") {
    const userData = requireAuth();
    if (!userData) return;

    let body = "";
    req.on("data", (c) => (body += c));
    return req.on("end", async () => {
      try {
        const { exerciseId, rating, comment } = JSON.parse(body);
        if (!exerciseId || !rating || !comment) {
          return send(res, 400, { error: "Missing fields." });
        }

        const existing = await Review.findOne({
          exerciseId,
          userEmail: userData.email,
        });
        if (existing) {
          existing.rating = rating;
          existing.comment = comment;
          existing.updatedAt = new Date();
          await existing.save();
          return send(res, 200, existing);
        } else {
          const newReview = await Review.create({
            exerciseId,
            rating,
            comment,
            userEmail: userData.email,
          });
          return send(res, 201, newReview);
        }
      } catch (err) {
        return send(res, 500, { error: "Server error." });
      }
    });
  }
  // GET /api/reviews?exerciseId=xxx → aduce toate review-urile
  if (req.method === "GET" && pathname.startsWith("/api/reviews")) {
    const qs = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const exerciseId = qs.get("exerciseId");
    if (!exerciseId) {
      return send(res, 400, { error: "exerciseId required" });
    }
    try {
      const list = await Review.find({ exerciseId }).sort({ createdAt: -1 });
      return send(res, 200, list);
    } catch (err) {
      console.error(err);
      return send(res, 500, { error: "Server error." });
    }
  }
  // DELETE /api/reviews/:id → doar dacă review-ul aparține utilizatorului
  if (req.method === "DELETE" && pathname.startsWith("/api/reviews/")) {
    const user = requireAuth();
    if (!user) return;

    const reviewId = pathname.split("/")[3];
    try {
      const review = await Review.findById(reviewId);
      if (!review) return send(res, 404, { error: "Review not found" });

      if (review.userEmail !== user.email) {
        return send(res, 403, { error: "Forbidden" });
      }

      await Review.findByIdAndDelete(reviewId);
      return send(res, 200, { message: "Review șters cu succes" });
    } catch (err) {
      return send(res, 500, { error: "Server error" });
    }
  }
  if (req.method === "GET" && pathname.startsWith("/api/review-likes/")) {
    const user = requireAuth();
    if (!user) return;

    const reviewId = pathname.split("/")[3];
    try {
      const count = await ReviewLike.countDocuments({ reviewId });
      const alreadyLiked = await ReviewLike.exists({
        reviewId,
        userEmail: user.email,
      });
      return send(res, 200, { count, liked: !!alreadyLiked });
    } catch (err) {
      return send(res, 500, { error: "Server error" });
    }
  }
  if (req.method === "POST" && pathname.startsWith("/api/review-likes/")) {
    const user = requireAuth();
    if (!user) return;

    const reviewId = pathname.split("/")[3];
    try {
      const existing = await ReviewLike.findOne({
        reviewId,
        userEmail: user.email,
      });
      if (existing) {
        await ReviewLike.deleteOne({ _id: existing._id });
        return send(res, 200, { liked: false });
      } else {
        await ReviewLike.create({ reviewId, userEmail: user.email });
        return send(res, 201, { liked: true });
      }
    } catch (err) {
      return send(res, 500, { error: "Server error" });
    }
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
  if (req.method === "GET" && pathname === "/api/favorites-summary") {
  const payload = requireAuth();
  if (!payload) return;
  const favs = await Favourites.find({ id_user: payload.id });
  const favCount = favs.length;
  const ids = favs.map(f => Number(f.id_exercitiu));
  const exs = await Exercitiu.find({ id: { $in: ids } });
  const typeCounts = {};
  exs.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1 });
  const favTypes = Object.entries(typeCounts).map(([l,v])=>({ label:l, value:v }));
  const mgCounts = {};
  exs.forEach(e => e.muscle_groups.forEach(m => {
    mgCounts[m] = (mgCounts[m] || 0) + 1;
  }));
  const muscleGroups = Object.entries(mgCounts).map(([l,v])=>({ label:l, value:v }));
  const avgDifficulty = favCount
    ? exs.reduce((s,e)=>s+e.difficulty,0) / favCount
    : 0;
  return send(res, 200, {
    favCount,
    favTypes,
    likedExercises: exs.map(e=>e.name),
    muscleGroups,
    avgDifficulty
  });
}
async function getPayloadOr401() {
    const payload = requireAuth();
    if (!payload) throw "401";
    return payload;
  }
  if (req.method === "GET" && pathname === "/api/activity/weekly-summary") {
  const user = requireAuth();
  if (!user) return;

  const userId = user.id;
  const now = new Date();
  const day = now.getDay(); // 0 (duminică) - 6 (sâmbătă)

  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - day);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const endOfLastWeek = new Date(startOfThisWeek);

  // Helper pt query
  const between = (start, end) => ({ $gte: start, $lt: end });

  // WorkoutActivity
  const [waThis, waLast] = await Promise.all([
    WorkoutActivity.find({ id_user: userId, createdAt: between(startOfThisWeek, now) }),
    WorkoutActivity.find({ id_user: userId, createdAt: between(startOfLastWeek, endOfLastWeek) }),
  ]);

  // SetInfo
  const [siThis, siLast] = await Promise.all([
    SetInfo.find({ id_user: userId, createdAt: between(startOfThisWeek, now) }),
    SetInfo.find({ id_user: userId, createdAt: between(startOfLastWeek, endOfLastWeek) }),
  ]);

  // Final response
  const response = {
    workouts: {
      thisWeek: waThis.length,
      lastWeek: waLast.length,
    },
    duration: {
      thisWeek: waThis.reduce((sum, w) => sum + w.duration, 0),
      lastWeek: waLast.reduce((sum, w) => sum + w.duration, 0),
    },
    weight: {
      thisWeek: siThis.reduce((sum, s) => sum + s.weight_kicker, 0),
      lastWeek: siLast.reduce((sum, s) => sum + s.weight_kicker, 0),
    },
    sets: {
      thisWeek: siThis.length,
      lastWeek: siLast.length,
    },
  };

  return send(res, 200, response);
}

// 1) Total Sets
if (req.method === "GET" && pathname === "/api/activity/total-sets") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  const totalSets = await SetInfo.countDocuments({ id_user: userId });
  return send(res, 200, { totalSets });
}

// 2) Total Exercises (distinct)
if (req.method === "GET" && pathname === "/api/activity/total-exercises") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  const activities = await Activity.find({ id_user: userId });
const totalExercises = activities.reduce((sum, a) => sum + (a.activity_cnt || 0), 0);
return send(res, 200, { totalExercises });
}

// 3) Total Weight Lifted
if (req.method === "GET" && pathname === "/api/activity/total-weight") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  // agregare sumă, with a default empty object to guard against no docs
  const [{ totalWeight = 0 } = {}] = await SetInfo.aggregate([
    { $match: { id_user: userId } },
    { $group: { _id: null, totalWeight: { $sum: "$weight_kicker" } } }
  ]);
  return send(res, 200, { totalWeight });
}

// 4) Avg Weight/Set
if (req.method === "GET" && pathname === "/api/activity/avg-weight-set") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  const [{ totalWeight = 0, count = 0 } = {}] = await SetInfo.aggregate([
    { $match: { id_user: userId } },
    { $group: { _id: null, totalWeight: { $sum: "$weight_kicker" }, count: { $sum: 1 } } }
  ]);
  const avgWeightSet = count ? totalWeight / count : 0;
  return send(res, 200, { avgWeightSet: Number(avgWeightSet.toFixed(1)) });
}

// 5) Total Workouts
if (req.method === "GET" && pathname === "/api/activity/total-workouts") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  const totalWorkouts = await WorkoutActivity.countDocuments({ id_user: userId });
  return send(res, 200, { totalWorkouts });
}
if (req.method === "GET" && pathname === "/api/activity/total-weight-all") {
  // nu mai requireAuth, că vrem tot  
  const [{ totalWeight = 0 }] = await SetInfo.aggregate([
    // { $match: { /* removed */ } },
    { $group: { _id: null, totalWeight: { $sum: "$weight_kicker" } } }
  ]);
  return send(res, 200, { totalWeight });
}
// 6) Total Time & Avg Duration
if (req.method === "GET" && pathname === "/api/activity/time") {
  const payload = requireAuth(); if (!payload) return;
  const userId = payload.id;
  const docs = await WorkoutActivity.find({ id_user: userId }).select("duration").lean();
  const total = docs.reduce((sum, w) => sum + (w.duration||0), 0);
  const totalWorkouts = docs.length;
  const avgDuration = totalWorkouts ? Math.round(total/totalWorkouts) : 0;
  const hours = Math.floor(total/60), mins = Math.round(total%60);
  return send(res, 200, {
    totalTime: `${hours} h ${mins} m`,
    avgDuration: `${avgDuration} m`
  });
}
// 1) Total Sets (all users)
if (req.method === "GET" && pathname === "/api/activity/total-sets-all") {
  const [{ totalSets = 0 } = {}] = await SetInfo.aggregate([
    { $group: { _id: null, totalSets: { $sum: 1 } } }
  ]);
  return send(res, 200, { totalSets });
}
if (req.method === "GET" && pathname === "/api/activity/weekly-progress") {
  const user = requireAuth(); if (!user) return;

  const userId = user.id;
  const today = new Date();
  const weeksBack = 6;

  const weeks = Array.from({ length: weeksBack }).map((_, i) => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end, label: `${start.getMonth() + 1}/${start.getDate()}` };
  }).reverse();

  const results = await Promise.all(
    weeks.map(({ start, end }) =>
      SetInfo.aggregate([
        { $match: { id_user: userId, createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$weight_kicker" } } },
      ])
    )
  );

  const payload = weeks.map((w, i) => ({
    label: w.label,
    total: results[i][0]?.total || 0,
  }));

  return send(res, 200, payload);
}


// 2) Total Exercises (distinct, all users)
if (req.method === "GET" && pathname === "/api/activity/total-exercises-all") {
  const docs = await SetInfo.find().select("id_exercitiu").lean();
  const totalExercises = new Set(docs.map(d => d.id_exercitiu)).size;
  return send(res, 200, { totalExercises });
}

// 3) Total Weight Lifted (all users)
if (req.method === "GET" && pathname === "/api/activity/total-weight-all") {
  const [{ totalWeight = 0 } = {}] = await SetInfo.aggregate([
    { $group: { _id: null, totalWeight: { $sum: "$weight_kicker" } } }
  ]);
  return send(res, 200, { totalWeight });
}

// 4) Avg Weight/Set (all users)
if (req.method === "GET" && pathname === "/api/activity/avg-weight-set-all") {
  const [{ totalWeight = 0, count = 0 } = {}] = await SetInfo.aggregate([
    { $group: {
        _id: null,
        totalWeight: { $sum: "$weight_kicker" },
        count:       { $sum: 1 }
    }}
  ]);
  const avgWeightSet = count ? totalWeight / count : 0;
  return send(res, 200, { avgWeightSet: Number(avgWeightSet.toFixed(1)) });
}

// 5) Total Workouts (all users)
if (req.method === "GET" && pathname === "/api/activity/total-workouts-all") {
  const [{ totalWorkouts = 0 } = {}] = await WorkoutActivity.aggregate([
    { $group: { _id: null, totalWorkouts: { $sum: "$wk_cnt" } } }
  ]);
  // if you want to count documents instead of sum of wk_cnt:
  // const totalWorkouts = await WorkoutActivity.countDocuments();
  return send(res, 200, { totalWorkouts });
}

// 6) Total Time & Avg Duration (all users)
if (req.method === "GET" && pathname === "/api/activity/time-all") {
  const docs = await WorkoutActivity.find().select("duration").lean();
  const total     = docs.reduce((sum, w) => sum + (w.duration||0), 0);
  const count     = docs.length;
  const avgDuration = count ? Math.round(total/count) : 0;
  const hours     = Math.floor(total/60);
  const mins      = Math.round(total%60);
  return send(res, 200, {
    totalTime:   `${hours} h ${mins} m`,
    avgDuration: `${avgDuration} m`
  });
}




  // ————— STATIC FILES —————
  if (req.method === "GET" && pathname === "/api/reviews-summary") {
    const payload = requireAuth();
    if (!payload) return;
    const reviews = await Review.find({ userEmail: payload.email });
    const reviewCount = reviews.length;
    const avgRating = reviewCount
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
    const likeCounts = await Promise.all(
      reviews.map((r) => ReviewLike.countDocuments({ reviewId: r._id }))
    );
    const totalLikes = likeCounts.reduce((s, c) => s + c, 0);
    const likesPerReview = reviewCount ? totalLikes / reviewCount : 0;
    const minLikes = likeCounts.length ? Math.min(...likeCounts) : 0;
    const maxLikes = likeCounts.length ? Math.max(...likeCounts) : 0;
    return send(res, 200, {
      reviewCount,
      avgRating,
      totalLikes,
      likesPerReview,
      minLikes,
      maxLikes,
    });
    return;
  }
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
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        const { exerciseId, rating, comment } = JSON.parse(body);
        if (!Number.isInteger(exerciseId) || !rating || !comment) {
          return send(res, 400, { error: "Missing or invalid fields." });
        }
        let review = await Review.findOne({
          exerciseId,
          userEmail: payload.email,
        });
        if (review) {
          review.rating = rating;
          review.comment = comment;
          review.updatedAt = new Date();
          await review.save();
          return send(res, 200, review);
        } else {
          const newR = await Review.create({
            exerciseId,
            rating,
            comment,
            userEmail: payload.email,
          });
          return send(res, 201, newR);
        }
      });
      return;
    }
  }

  if (pathname.startsWith("/api/review-likes/")) {
    const payload = requireAuth();
    if (!payload) return;
    const reviewId = pathname.split("/")[3];
    if (req.method === "GET") {
      const count = await ReviewLike.countDocuments({ reviewId });
      const liked = await ReviewLike.exists({
        reviewId,
        userEmail: payload.email,
      });
      return send(res, 200, { count, liked: !!liked });
    }
    if (req.method === "POST") {
      const exists = await ReviewLike.findOne({
        reviewId,
        userEmail: payload.email,
      });
      if (exists) {
        await ReviewLike.deleteOne({ _id: exists._id });
        return send(res, 200, { liked: false });
      } else {
        await ReviewLike.create({ reviewId, userEmail: payload.email });
        return send(res, 201, { liked: true });
      }
    }
  }

  if (req.method === "GET" && pathname === "/api/favorites-summary") {
    const payload = requireAuth();
    if (!payload) return;
    const favs = await Favourites.find({ id_user: payload.id });
    const favCount = favs.length;
    const ids = favs.map((f) => Number(f.id_exercitiu));
    const exs = await Exercitiu.find({ id: { $in: ids } });
    const typeCounts = {},
      mgCounts = {};
    exs.forEach((e) => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
      e.muscle_groups.forEach((m) => (mgCounts[m] = (mgCounts[m] || 0) + 1));
    });
    const favTypes = Object.entries(typeCounts).map(([l, v]) => ({
      label: l,
      value: v,
    }));
    const muscleGroups = Object.entries(mgCounts).map(([l, v]) => ({
      label: l,
      value: v,
    }));
    const avgDifficulty = favCount
      ? exs.reduce((s, e) => s + e.difficulty, 0) / favCount
      : 0;
    return send(res, 200, {
      favCount,
      favTypes,
      likedExercises: exs.map((e) => e.name),
      muscleGroups,
      avgDifficulty,
    });
  }

  if (req.method === "GET" && pathname === "/api/activity-summary") {
    const payload = requireAuth();
    if (!payload) return;
    const acts = await Activity.find({ id_user: payload.id });
    const totalWorkouts = acts.length;
    const totalSets = acts.reduce((s, a) => s + (a.activity_cnt || 0), 0);
    const totalTimeNum = acts.reduce((s, a) => s + (a.time || 0), 0);
    const hours = Math.floor(totalTimeNum / 60),
      mins = totalTimeNum % 60;
    const totalTime = `${hours} h ${mins} m`;
    const avgDuration = totalWorkouts
      ? Math.round(totalTimeNum / totalWorkouts)
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
        dailyWorkouts: [1, 1, 1, 1, 1, 0, 0],
      },
    });
  }
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
});
