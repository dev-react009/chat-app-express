import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "../models/user.js";
import { sendWelcomeEmail } from "../utils/mail.js";
import { generateOTP, sendOTPEmail } from "../utils/sendOtp.js";
import mongoose from "mongoose";
import { log } from "../utils/logger";

const JWT = process.env.JWT_SECRET;

if (!JWT) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}
export const registerUser  =async(req:Request,res:Response)=>{
    const {username,email,password,mobile} = req.body;
    log(req.body)
    if(!username||!email|| !password ||!mobile){
        return res.status(400).json({status:false,statusCode:400,error:"All fields are Required"});
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({message:"Invalid Email"});
    }

    if (password.length < 6) {
    return res
      .status(400)
      .json({
        status: false,
        statusCode: 400,
        error: "Password must be at least 6 characters long",
      });
    }
    try{
        const existingUser = await user.findOne({email});
            if(existingUser){
                return res
                  .status(400)
                  .json({
                    status: false,
                    statusCode: 400,
                    error: "User with this email already exists",
                  });
            }
        
    const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new user({ username, email, password:hashedPassword, mobile });
        log(newUser)
        await newUser.save();
            await sendWelcomeEmail(email, username);
        res.status(201).json({status:true,statusCode:201,message:"User created successfully"});
    }
    catch(error){
        if(error instanceof Error){ log(error.message);res.status(500).json({error:error.message as string}) }
        else{res.status(500).json({error:"Internal server error"})}
    }
}; 

export const loginUser = async(req:Request,res:Response)=>{
    const {email,password} = req.body;
    if(!email||!password){
      return res.status(400).json({status:false,statusCode:400,error:"All Fields Are Required"}); 
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ status: false, statusCode: 400, error: "Invalid Email" });
      };
      try{
        const userObj = await user.findOne({email});
      
        if(!userObj){
            return res.status(404).json({status:false,statusCode:404,error:"Invalid Email or Password"})
        };

        const isMatch = await bcrypt.compare(password,userObj.password);
        log(isMatch);
        if(!isMatch){
            return res
              .status(404)
              .json({
                status: false,
                statusCode: 404,
                error: "Invalid Email or Password",
              });
        }
        const token = jwt.sign({ userId: userObj._id }, JWT, {
          expiresIn: "24h",
        });
        res.status(200).json({
          status: true,
          statusCode: 200,
          message: "login successful",
          token: token,
          data: {
            userId: userObj._id,
            username: userObj.username,
            email: userObj.email,
          },
        });
    }
    catch(error){
if (error instanceof Error) {
  log(error.message);
  res.status(500).json({ error: error.message as string });
} else {
  res.status(500).json({ error: "Internal server error" });
}
    }
};

export const requestPasswordReset = async(req:Request,res:Response)=>{
const {email} = req.body;
try{
  const userVerify = await user.findOne({email});
  if(!userVerify){
    return res
      .status(404)
      .json({ status: false, statusCode: 404, error: "User not found" });
  };
  const otp = generateOTP();
   const hashedOTP = await bcrypt.hash(otp, 10);
  userVerify.resetOtp = hashedOTP;
  userVerify.resetOtpExpire = Date.now() + 15 * 60 * 1000;
  await userVerify.save();

    await sendOTPEmail(email, otp);
  res.status(200).json({status:true,statusCode:200,message:" OTP Sent Successfully To Your Mail"})
}catch(error){
  if(error instanceof Error){
  res
    .status(500)
    .json({ status: false, statusCode: 500, error:error.message });
  }
  else{
  res.status(500).json({status:false,statusCode:500,error:"Internal Server Error"})
  }
}
}

export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    const findExistingUser = await user.findOne({ email });
    log(email, otp, newPassword);
    if (!findExistingUser) {
      return res
        .status(404)
        .json({ status: false, statusCode: 404, error: "User Not Found" });
    }

    if (findExistingUser.resetOtpUsed) {
      return res
        .status(400)
        .json({
          status: false,
          statusCode: 404,
          error: "OTP has already been used",
        });
    }
    const isOtpValid = await bcrypt.compare(otp, findExistingUser.resetOtp!);
    if (
      !isOtpValid ||
      Date.now() > findExistingUser?.resetOtpExpire!
    ) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        error: "Invalid OTP or Expired OTP",
      });
    }
    findExistingUser.password = await bcrypt.hash(newPassword, 10);
    findExistingUser.resetOtp = undefined;
    findExistingUser.resetOtpExpire = undefined;
    log(findExistingUser);
    await findExistingUser.save();
    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ status: false, statusCode: 500, error: error.message });
    } else {
      res
        .status(500)
        .json({
          status: false,
          statusCode: 500,
          error: "Internal Server Error ",
        });
    }
  }
};

export const addFriends = async (req: Request, res: Response) => {
  try {
    log("curr", req.body);
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        error: "User ID and Friend ID are required",
      });
    }
    const currentUser = await user.findOne({ _id:userId });
    if (!currentUser) {
      return res
      .status(404)
      .json({ status: false, statusCode: 404, error: "User not found" });
    }
    if (currentUser.friends.includes(friendId)) {
      return res
      .status(400)
      .json({
        status: false,
        statusCode: 400,
        error: "Friend already added",
      });
    }
    currentUser.friends.push(friendId);
    
    
    await currentUser.save();
    log("curr", currentUser);

    const friendUser = await user.findOne({ friendId });
    if (friendUser && !friendUser.friends.includes(userId)) {
      friendUser.friends.push(userId);
      await friendUser.save();
    }

    return res
      .status(200)
      .json({
        status:true,
        statusCode:200,
        message: "Friend added successfully",
        friends: currentUser.friends,
      });
  } catch (error:any) {
   
      error(error.message);
      res.status(500).json({ error: "Internal server error" });
  }
};

export const getFriendsList = async (req: Request, res: Response) => {
  try {
    const {userId} = req.query;
    if (!userId) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "Missing userId parameter",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        error: "Invalid userId format",
      });
    }
    const userWithFriends = await user
      .findById({_id:userId})
      .populate("friends", "username email");
  
    if (!userWithFriends) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "No Mutual Friends",
      });
    }

    return res
      .status(200)
      .json({
        status: true,
        statusCode: 200,
        allFriends: userWithFriends.friends,
      });
  } catch (error:any) {
    
      error(error.message);
      res.status(500).json({ error: "Internal server error" });
    
  }
};

export const getSearchUsers=async(req:Request,res:Response)=>{
  const currentUserId = req.userId; 
  try {
    const { query, limit = 10, offset = 0 } = req.query;
    log( typeof query);
    if (!query || typeof query !== "string") {
      return res.status(400).json({status:false,statusCode:404, message: "Invalid query parameter" });
    }

    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    

    const users = await user.find({
      _id: { $ne: currentUserId }, // Exclude current user if needed
      $or: [
        { username: { $regex: sanitizedQuery, $options: "i" } },
        { email: { $regex: sanitizedQuery, $options: "i" } },
      ],
    })
      .skip(Number(offset))
      .limit(Number(limit))
      .select("username email");

    if (users.length === 0) {
      return res.status(404).json({status:false,statusCode:404, message: "No users found" });
    }
    res.status(200).json({status:true,statusCode:200, users:users});
  } catch (error:any) {
    error("Search error:", error);
    res.status(500).json({status:false,statusCode:500, message: "Server error" });
  }

}

