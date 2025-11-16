require("dotenv").config();
const express = require("express");
const {validateAdminSignUpData, validateSignUpData} = require("../utils/helperValidator");
const RefreshTokenModel = require("../models/refreshToken");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authorizeRole = require("../middlewares/authorizeRole");
const { userAuth } = require("../middlewares/auth");
const validator = require("validator");

const accessTokenKey = process.env.JWT_PRIVATE_KEY;
const refreshTokenKey = process.env.REFRESH_PRIVATE_KEY;

const authRouter = express.Router();

authRouter.post("/createAdmin", async (req,res)=>{

    try {
        validateAdminSignUpData(req);

        const {adminId,firstName,lastName,email,password}=req.body;

        const adminExists = await User.find({adminId:adminId});
        if(adminExists){
            throw new Error("Invalid adminId.");
        }

        const passwordHash = await bcrypt.hash(password,10);

        const user = new User({
            adminId,
            firstName,
            lastName,
            email,
            password:passwordHash

        });
        const newUserData= await user.save(); //saving the User instance to our DB //this function returns a promise
        const userObj = newUserData.toObject();
        delete userObj.password;
        delete userObj.adminId;

        res.status(201).json({
            message : "admin created successfully!",
            userObj
        });
    } catch (error) {
        res.status(400).send("Failed: "+error.message);
    }
});

authRouter.post("/signup",async(req,res)=>{
    try {
        const {firstName,lastName,email,password} = req.body;

        validateSignUpData(req);

        const passwordHash= await bcrypt.hash(password,10);

        const user = new User({
            firstName,
            lastName,
            email,
            password:passwordHash
        });

        const newUserData = await user.save();
        const userObj = newUserData.toObject();
        delete userObj.password;

        res.status(201).json({
            message : "User created successfully!",
            userObj
        });

    } catch (error) {
         res.status(400).send("Failed.\n"+error.message);
    }
});

authRouter.post("/login",async(req,res)=>{
    try {
        const {email, password, keepMeSignedIn} = req.body;

        if (!email || !validator.isEmail(email)) {
            throw new Error("Invalid Credentials.");
        }

        const userData = await User.findOne({email});
        if(!userData){
            throw new Error("Invalid Credentials.");
        }

        const isPasswordValid = await userData.validatePassword(password);

        if(!isPasswordValid){
            throw new Error("Invalid Credentials.");
        }
        else{
            const accessToken = jwt.sign(
                {_id : userData._id}, 
                accessTokenKey,
                {expiresIn:"3h"}
            );

            const refreshTokenExpiry = keepMeSignedIn ? "15d":"1d";

            const refreshToken = jwt.sign(
                {_id : userData._id}, 
                refreshTokenKey, 
                {expiresIn:refreshTokenExpiry}
            );

            const decodedPayload = jwt.decode(refreshToken);

            await RefreshTokenModel.deleteMany({ userId: userData._id });//delete any pre-existing tokens for the same user

            await RefreshTokenModel.create({
                token:refreshToken,
                userId:userData._id,
                expiresAt:new Date(decodedPayload.exp*1000)

            })

            res.cookie("refreshToken",refreshToken, {
                expires:new Date(decodedPayload.exp*1000)
            });
                    
            const {_id,role,firstName,lastName,email,designation,createdAt}= userData;
            
                    
            res.status(200).json({
               data:{ _id,role,firstName,lastName,email,designation,createdAt},
               tokens : {
                accessToken,
                refreshToken
               }
            });
        }

        
                    
        

    } catch (error) {
        res.status(400).send("Invalid Credentials "+error.message);
    }
})

authRouter.post("/logout", async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await RefreshTokenModel.deleteOne({ token: refreshToken });
  }
  res.clearCookie("refreshToken").json({ message: "Logout successful" });
});


authRouter.post("/getAccessToken", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  const stored = await RefreshTokenModel.findOne({ token: refreshToken });
  if (!stored)
    return res.status(403).json({ message: "Invalid refresh token" });

  try {
    //this verifies the token's signature , decodes payload and checks if the token is expired (exp field)
    const payload = jwt.verify(refreshToken, refreshTokenKey);
    const accessToken = jwt.sign(
      { _id: payload._id },
      accessTokenKey,
      { expiresIn: "30m" }
    );
    res.json({ accessToken : accessToken });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Delete only if refresh token is expired
      await RefreshTokenModel.deleteOne({ token: refreshToken });
      return res.status(403).json({ message: "Refresh token expired" });
    }

    // For other errors, don't delete immediately — possible tampering or malformed token
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports=authRouter;