import mongoose from "mongoose";
import fs from "fs";
import path from "path";

if (!process.env.SERVER_MONGODB_CONNECTION_URI) throw "Missing MongoDB connection URI";

mongoose.connect("mongodb://localhost:27017/tasks-to-do", {
  useNewUrlParser: true,
  useFindAndModify: true,
  haInterval: 5000,
  useUnifiedTopology: true,
  poolSize: 25,
  acceptableLatencyMS: 25,
  secondaryAcceptableLatencyMS: 100
})
  .then(db => console.info(`Connected to ${db.connection.name} database successfully!`))
  .catch(console.error);

if (process.env.NODE_ENV === "development") mongoose.set("debug", true);

// Registering models
fs.readdirSync(path.resolve(__dirname, "models"))
  .filter(path => path.split('.')[1] === "js")
  .forEach(async modelPath => {
    const model = await import(path.resolve(__dirname, "models", modelPath));

    if (model.default) {
      model.default.on("index", (err: string) => {
        if (err) console.error("Indexing error:", model.default.modelName, err);
        else console.info("Created index:", model.default.modelName)
      });
    }
  });

export default mongoose.connection;
