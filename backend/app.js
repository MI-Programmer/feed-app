import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import mongoose from "mongoose";
import { createHandler } from "graphql-http/lib/use/express";
import { altairExpress } from "altair-express-middleware";
import multer from "multer";
import { v4 as uuid } from "uuid";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";

import graphqlSchema from "./graphql/schema.js";
import graphqlResolver from "./graphql/resolvers.js";
import auth from "./middleware/auth.js";
import { deleteFileImage } from "./utils/helper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${uuid()}-${file.originalname}`);
  },
});
const fileFilter = (req, file, cb) => {
  const type = file.mimetype;
  // if (type === "image/png" || type === "image/jpg" || type === "image/jpeg") {
  //   cb(null, true);
  // } else cb(null, false);
  cb(null, false);
};

const app = express();
dotenv.config();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(multer({ storage, fileFilter }).single("image"));
app.use(helmet());
app.use(compression());
app.use(morgan("common"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put("/post-image", (req, res) => {
  if (!req.isAuth) {
    const error = new Error("Not authenticated.");
    error.status = 401;
    // console.log(error);
    throw error;
  }

  // if (!req.file) return res.status(200).json({ message: "Not file provided!" });

  // if (req.body.oldPath) deleteFileImage(req.body.oldPath);
  res.status(201).json({
    message: "File stored.",
    filePath:
      "images/a35021e4-1e0a-40b6-a85a-1edbb9a6ebb8-blake-wisz-TcgASSD5G04-unsplash.jpg",
  });
});

app.use(
  "/graphql",
  createHandler({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    context: (req, res) => ({
      isAuth: req.raw.isAuth,
      userId: req.raw.userId,
    }),
    formatError(error) {
      const { message, originalError } = error;
      const data = originalError.data || null;
      const status = originalError.status || 500;

      // console.log(error);
      return { message, data, status };
    },
  })
);

app.use(
  "/altair",
  altairExpress({
    endpointURL: "/graphql",
  })
);

app.use((error, req, res, next) => {
  const { status = 500, message, data } = error;
  console.log(error);
  res.status(status).json({ message, data });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to mongo database");
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
  });
