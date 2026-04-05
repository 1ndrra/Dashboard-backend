import { User } from "../models/usermodel.js";

export const addUserToWorkspace = async (req, res) => {
    const { targetUsername, role } = req.body; 
    const { activeOrgId, isAdmin } = req.user; 

    try {

        if (!isAdmin) {
            return res.status(403).json({ message: "Forbidden: Only workspace admins can add members." });
        }

        const allowedRoles = ["admin", "analyst", "viewer"];
        const finalRole = allowedRoles.includes(role) ? role : "viewer";

        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const isAlreadyMember = targetUser.memberships.some(
            (m) => m.organizationId.toString() === activeOrgId.toString()
        );

        if (isAlreadyMember) {
            return res.status(400).json({ message: "User is already a member of this workspace." });
        }

        targetUser.memberships.push({
            organizationId: activeOrgId,
            role: finalRole
        });

        await targetUser.save();

        res.status(200).json({ 
            message: `Successfully added ${targetUsername} to the workspace as ${finalRole}.` 
        });

    } catch (error) {
        console.error("Add User Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const promoteUser = async (req, res) => {
    const { targetUsername, newRole } = req.body;
    const { activeOrgId, isAdmin, _id: adminId } = req.user;

    if (!isAdmin) return res.status(403).json({ message: "Only admins can promote users." });

    const allowedRoles = ["admin", "analyst", "viewer"];
    if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({ message: "Invalid role specified." });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { 
                username: targetUsername, 
                "memberships.organizationId": activeOrgId 
            },
            { 
                $set: { "memberships.$.role": newRole } 
            },
            { 
                returnDocument: 'after', 
                runValidators: true 
            }
        );

        if (!updatedUser) {
            const userExists = await User.findOne({ username: targetUsername });
            if (!userExists) {
                return res.status(404).json({ message: `User '${targetUsername}' not found.` });
            }
            return res.status(403).json({ 
                message: `User '${targetUsername}' is not a member of this workspace.` 
            });
        }

        res.json({ 
            message: `Successfully updated ${targetUsername} to ${newRole} in this workspace.` 
        });

    } catch (error) {
        console.error("Promotion Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

