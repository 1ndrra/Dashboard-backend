import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";


export const getDashboardSummary = async (req, res) => {
    try {
        const { activeOrgId } = req.user;
        const { startDate, endDate } = req.query;

        const match = {
            organizationId: new mongoose.Types.ObjectId(activeOrgId),
            isDeleted: false
        };

        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                match.date.$lte = end;
            }
        }

        const [totals, categories, trends] = await Promise.all([
            Transaction.aggregate([
                { $match: match },
                { $group: {
                    _id: null,
                    income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                    expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                }}
            ]),

            Transaction.aggregate([
                { $match: match },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } }
            ]),

            Transaction.aggregate([
                { $match: match },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                    income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                    expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                }},
                { $sort: { "_id": 1 } }
            ])
        ]);

        const summary = totals[0] || { income: 0, expenses: 0 };
        
        res.status(200).json({
            summary: {
                totalIncome: summary.income / 100,
                totalExpenses: summary.expenses / 100,
                netBalance: (summary.income - summary.expenses) / 100
            },
            categoryBreakdown: categories.map(c => ({
                category: c._id,
                amount: c.total / 100
            })),
            monthlyTrends: trends.map(t => ({
                month: t._id,
                income: t.income / 100,
                expenses: t.expenses / 100
            }))
        });

    } catch (error) {
        console.error("Dashboard Summary Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};