import { Transaction } from "../models/transaction.model.js";
import { Organization } from "../models/org.model.js";
import { User } from "../models/usermodel.js";

const convertToCents = (amount) => Math.round(parseFloat(amount) * 100);

export const createTransaction = async (req, res) => {
    const { title, amount, type, category, description, date } = req.body;
    
    const { _id: userId, activeOrgId, role } = req.user;

    try {
        
        if (!title || !amount || !type || !category) {
            return res.status(400).json({ message: "Required fields are missing." });
        }

        if (role === "viewer") {
            return res.status(403).json({ message: "Forbidden: Viewers cannot create transactions." });
        }

        const newTransaction = new Transaction({
            userId,
            organizationId: activeOrgId, 
            title,
            amount: convertToCents(amount), 
            type,
            category,
            description,
            date: date || new Date()
        });

        await newTransaction.save();

        res.status(201).json(newTransaction);

    } catch (error) {
        console.error("Error in createTransaction:", error.message);
        res.status(500).json({ message: "Error in transaction creation" });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { activeOrgId } = req.user;
    
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { title, type, category } = req.query;

       
        let query = { organizationId: activeOrgId,
                      isDeleted: false
         };
        if (title) query.title = { $regex: title, $options: "i" };
        if (type) query.type = type;
        if (category) query.category = category;

        const [transactions, totalTransactions] = await Promise.all([
            Transaction.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .select("-__v"),
            Transaction.countDocuments(query)
        ]);

        res.status(200).json({
            transactions,
            pagination: {
                total: totalTransactions,
                currentPage: page,
                totalPages: Math.ceil(totalTransactions / limit),
                hasNextPage: skip + transactions.length < totalTransactions,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Error in getTransactions:", error.message);
        res.status(500).json({ message: "Error retrieving transactions" });
    }
};

export const updateTransaction = async (req, res) => {
    const { id } = req.params; 
    const { _id: userId, activeOrgId, isAdmin } = req.user; 

    try {
        const transaction = await Transaction.findById(id);
        
        if (!transaction) {
            return res.status(404).json({ message: "Record not found." });
        }

        if (transaction.organizationId.toString() !== activeOrgId.toString()) {
            return res.status(403).json({ message: "Access denied: This record belongs to another workspace." });
        }

        const isOwner = transaction.userId.toString() === userId.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Forbidden: You can only edit your own records." });
        }

        let updateData = { ...req.body };

        delete updateData.organizationId;
        delete updateData.userId;

        if (updateData.amount) {
            updateData.amount = convertToCents(updateData.amount);
        }

        const updatedTx = await Transaction.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json(updatedTx);

    } catch (error) {
        console.error("Error in updateTransaction:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const { activeOrgId, isAdmin } = req.user; 

    try {
      
        if (!isAdmin) {
            return res.status(403).json({ 
                message: "Forbidden: Only workspace admins can delete records." 
            });
        }

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found." });
        }

        if (transaction.organizationId.toString() !== activeOrgId.toString()) {
            return res.status(403).json({ 
                message: "Access denied: You cannot delete records from another workspace." 
            });
        }

        await Transaction.findByIdAndDelete(id);

        res.status(200).json({ message: "Transaction deleted successfully." });

    } catch (error) {
        console.error("Error in deleteTransaction:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const softDeleteTransaction = async (req, res) => {
    const { id } = req.params;
    const { activeOrgId, isAdmin } = req.user;

    try {
        if (!isAdmin) {
            return res.status(403).json({ message: "Only admins can delete records." });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { 
                _id: id, 
                organizationId: activeOrgId, 
                isDeleted: false 
            }, 
            { 
                $set: { 
                    isDeleted: true, 
                    deletedAt: new Date() 
                } 
            },
            { returnDocument: 'after' } 
        );

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found." });
        }

        res.status(200).json({ message: "Transaction moved to trash." });

    } catch (error) {
        res.status(500).json({ message: "Error during soft delete." });
    }
};

export const restoreTransaction = async (req, res) => {
    const { id } = req.params;
    const { activeOrgId, isAdmin } = req.user;

    if (!isAdmin) return res.status(403).json({ message: "Admins only." });

    const restored = await Transaction.findOneAndUpdate(
        { _id: id, organizationId: activeOrgId },
        { $set: { isDeleted: false, deletedAt: null } },
        { returnDocument: 'after' }
    );

    res.status(200).json({ message: "Transaction restored successfully." });
};