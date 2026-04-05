import express, { Router } from "express";
import {login, logout, signup} from "../controllers/auth.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

router.post("/signup", authLimiter, signup)

router.post("/signin", authLimiter, login)

router.post("/logout", logout)

export default router;

