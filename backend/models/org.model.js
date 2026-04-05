import mongoose from "mongoose";
import {User} from "../models/usermodel.js";

const orgSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true
    },
    inviteCode: {
        type: String,
        required: true,
        unique:true
    },
    adminUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps:true})

export const Organization = mongoose.model("Organization",orgSchema);