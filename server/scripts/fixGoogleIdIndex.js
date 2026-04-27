const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: "linksphere" });

  const users = mongoose.connection.collection("users");

  const unsetResult = await users.updateMany(
    { googleId: null },
    { $unset: { googleId: "" } }
  );

  const indexes = await users.indexes();
  const googleIdIndex = indexes.find((index) => index.name === "googleId_1");

  if (googleIdIndex) {
    await users.dropIndex("googleId_1");
  }

  await users.createIndex(
    { googleId: 1 },
    {
      name: "googleId_1",
      unique: true,
      partialFilterExpression: { googleId: { $type: "string" } },
    }
  );

  console.log(`Unset googleId on ${unsetResult.modifiedCount} user(s).`);
  console.log("Recreated googleId_1 as a partial unique index.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
