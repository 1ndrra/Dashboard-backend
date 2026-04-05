import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required : true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    memberships: [{ 
     organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
     },
     role: {
        type: String,
        enum: ["admin", "analyst", "viewer"],
        default: "viewer"
     }
}],
},{timestamps:true})

export const User = mongoose.model("User",userSchema);