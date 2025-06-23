const mongoose = require("mongoose");

(async function () {
  console.log("Attempting to connect...");

  const t0 = Date.now();

  try {
    await mongoose.connect(
      "mongodb+srv://varunax424:RsiRPVBTxJItTu6c@sagacluster.ybauvs6.mongodb.net/sagaDB?retryWrites=true&w=majority&appName=SagaCluster",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 8000, // 8 seconds timeout
      }
    );
    const t1 = Date.now();
    console.log(`✅ Connected successfully in ${(t1 - t0) / 1000}s`);
  } catch (err) {
    console.error("❌ Connection error:", err.message);
  }

  process.exit(0);
})();
