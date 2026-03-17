import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import rateLimit from "express-rate-limit";
import { success } from "zod";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "TOO_MANY_REQUESTS",
    message: "Muitas requisições, tente novamente mais tarde.",
  },
});

app.use(globalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timeStamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.use((_req, res) => {
  res
    .status(404)
    .json({ success: false, error: "NOT_FOUND", message: "Route not found" });
});

app.use("/api/v1", router);

export default app;
