import express from "express";
import { addUserToWorkspace, promoteUser } from "../controllers/user.mana.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { apiLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

router.post("/add-member", apiLimiter, protectRoute, addUserToWorkspace);

router.patch("/promote", protectRoute, promoteUser);

export default router;