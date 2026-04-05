import express from "express";
import dotenv from "dotenv";
import {connectdb} from "../backend/lib/db.js"
import authRoutes from "./routes/auth.route.js"
import cookieParser from "cookie-parser";
import Troutes from "./routes/transaction.route.js"
import UMroutes from "./routes/user.management.route.js"
import Droutes from "./routes/dashboard.route.js"

dotenv.config()
const app = express();

const PORT = process.env.PORT

app.use(express.json());
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/record", Troutes)
app.use("/api/usermanagement", UMroutes)
app.use("/api/user", Droutes)

app.listen(PORT, () => {
    console.log("runnisng");
    connectdb();
})