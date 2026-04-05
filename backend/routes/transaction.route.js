import express, { Router } from "express";
import {createTransaction, getTransactions, updateTransaction, deleteTransaction, softDeleteTransaction, restoreTransaction} from "../controllers/transaction.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js";
import { apiLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

router.post("/create",apiLimiter, protectRoute, createTransaction);

router.get("/fetch", protectRoute, getTransactions);

router.put("/update/:id",apiLimiter, protectRoute, updateTransaction);

router.patch("/delete/:id",apiLimiter, protectRoute, softDeleteTransaction);

router.patch("/restore/:id",apiLimiter, protectRoute, restoreTransaction);

export default router;