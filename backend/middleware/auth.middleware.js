import jwt from "jsonwebtoken";
import { User } from "../models/usermodel.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetOrgId = req.headers["x-org-id"] || req.body.organizationId;

    if (!targetOrgId) {
      return res.status(400).json({ message: "Organization context is required." });
    }
    
    const currentMembership = user.memberships?.find(
      (m) => m.organizationId?.toString() === targetOrgId.toString()
    );

    if (!currentMembership) {
      return res.status(403).json({ message: "Access Denied: Not a member." });
    }

    req.user = {
      _id: user._id,
      username: user.username,
      activeOrgId: targetOrgId,
      role: currentMembership.role, 
      isAdmin: currentMembership.role === "admin", 
    };

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};