import express from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { apiLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

router.get("/summary",apiLimiter, protectRoute, getDashboardSummary);

export default router;