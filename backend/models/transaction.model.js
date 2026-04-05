import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["income", "expense"]
    },
    category: {
        type: String,
        required: true,
        enum: ["food", "rent", "salary", "entertainment", "transport", "health", "other"]
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
    deletedAt: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

transactionSchema.virtual('amountInDecimal').get(function() {
    return this.amount / 100;
});

transactionSchema.index({ organizationId: 1, isDeleted: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
