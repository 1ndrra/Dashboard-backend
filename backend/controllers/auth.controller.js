import express from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import {User} from "../models/usermodel.js";
import {Organization} from "../models/org.model.js";
import crypto from "crypto";

const app = express();

export const signup = async (req,res) => {
    const {username,password} = req.body;
    try{

        if(!username || !password ){
          return res.status(400).json({ message: "Must fill all the fields"});
        }
       
        if(password.length < 8 ){
            return res.status(400).json({ message: "Password must be atleast 8 characters"});
        }

    const user = await User.findOne({username});

    if(user) return res.status(400).json({ message: "Username must be unique"});

    let uniqueOrgCode;
    let isUnique = false;

        while (!isUnique) {
            uniqueOrgCode = `ORG-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
            const existingOrg = await Organization.findOne({ inviteCode: uniqueOrgCode });
            if (!existingOrg) {
                isUnique = true;
            }
        }
        
    const newOrg = new Organization({
            name: `${username}'s Workspace`,
            inviteCode: uniqueOrgCode,
        });
    await newOrg.save();

    const salt = await bcrypt.genSalt(10);
    const Hashedpassword = await bcrypt.hash(password,salt);

    const newUser = new User({
      username,
      password: Hashedpassword,
      memberships: [{
                organizationId: newOrg._id,
                role: "admin" 
            }]
    })

    if(newUser){

      generateToken(newUser._id,res)
      await newUser.save();

      res.status(201).json({
        _id : newUser._id,
        username : newUser.username,
        memberships: [{
                organizationId: newOrg._id,
                role: "admin" 
            }]
      });

    }else{
        res.status(400).json({ message: "invalid user data"});
    }
    
    newOrg.adminUser = newUser._id;
    await newOrg.save();

    }catch(error){
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: "Internal server error"}); 
    }
};

export const login = async (req,res) => {
  const { username,password } = req.body;

  try{
  const user = await User.findOne({username});

  if(!user){
    return res.status(400).json({message: "Invalid credentials"})
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password)
  if(!isPasswordCorrect){
    return res.status(400).json({message: "Invalid credentials"})
  }

  generateToken(user._id,res)

  res.status(200).json({
    _id:user._id,
    username:user.username,
    role:user.role
  });

  }catch(error){
    console.log("Error in login controller", error.message);
    res.status(500).json({message: "Internal Server Error"});
  }

};

export const logout = (req,res) => {
  try{
    res.cookie("jwt","",{maxAge:0})
    res.status(200).json({message: "Logged out successfully"})
  }catch(error){
    console.log("Error in logout contoller",error.message);
    res.stauts(500).json({message: "Internal Server Error"})
  }
};

