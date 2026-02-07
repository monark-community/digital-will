import express from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { loadEnvironment, validateEnvironment } from "./config/env";
import { config } from "./config/config";
import router from "./routes/router";
import { errorHandler } from "./middlewares/errorMiddleware";
import { NotFoundError } from "./utils/errors";
import { ROUTES } from "./utils/constants";

// Load environment variables
loadEnvironment();

try {
  validateEnvironment();
} catch (error) {
  console.error("Environment validation failed:", error);
  process.exit(1);
}

const app = express();

// CORS configuration
app.use(
  cors({
    origin: config.api.corsOrigin,
    credentials: true,
  }),
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use(ROUTES.BASE, router);

app.get("/", (_req, res) => {
  res.status(StatusCodes.OK).json({
    message: "Express API is running",
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.status(StatusCodes.OK).json({
    status: "ok",
    environment: config.env,
    uptime: process.uptime(),
  });
});

// 404 handler - must be after all routes
app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

// Global error handler - must be last
app.use(errorHandler);

app.listen(config.port, config.hostname, () => {
  console.log(`\n✓ API Server Started`);
  console.log(`  URL: http://${config.hostname}:${config.port}`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Database: ${config.database.host}:${config.database.port}`);
  console.log(`  Log Level: ${config.logLevel}\n`);
});
