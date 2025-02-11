import { Request, Response , NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {User} from "../models/userModel";


export const signUp = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
        const {name,email,password,career} = req.body;

        let user = await User.findOne({email});
        if (user){
            return res.status(400).json({message:"User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const verificationToken = jwt.sign({email},process.env.JWT_SECRET!,{expiresIn:"24h"});

        user = new User({
            name,
            email,
            password:hashedPassword,
            career,
            emailVerified:false,
            emailVerficationToken:verificationToken,
        });
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: "Email Verification",
            html: `<p>Click <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">here</a> to verify your email.</p>`,
        };

        await transporter.sendMail(mailOptions);

       return res.status(201).json({ message: "User registered successfully!"});
    } catch (error) {
       return res.status(500).json({ message: "Server error", error});
    }
}

export const login = async (req:Request,res:Response,next: NextFunction):Promise<Response> => {
    try {
        const {email,password} = req.body;

        const user = await User.findOne({email});
        if (!user){
            return res.status(400).json({ message: "Invalid email or password"});
        }

        const verifyPassword = await bcrypt.compare(password,user.password);
        if(!verifyPassword){
            return res.status(400).json({ message: "Invalid email or password"});
        }

        const token = jwt.sign({
            id:user._id,
            career:user.career
        },
        process.env.JWT_SECRET!,
        {
            expiresIn:"1h"
        }
    );

    return res.status(200).json({ message: "Login successful", token, user});
    } catch (error) {
        return res.status(500).json({ message: "Server error",error});
    }
};

export const forgetPassword = async(req:Request,res:Response) => {
    try {
        const {email} = req.body;

        const user = await User.findOne({
            email,
        });

        if (!user){
            return res.status(404).json({ message: "User not found" });
        } 

        const resetToken = jwt.sign({id:user._id},process.env.JWT_SECRET!,{expiresIn: "1h"});

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);// 1hour expiry
        await user.save();

        const transporter = nodemailer.createTransport({
            service:"gmail",
            auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_PASS},
        });

        const mailOptions = {
            to:user.email,
            from:process.env.EMAIL_USER,
            subject:"Password Reset Request",
            html:`<p>Click <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">here</a> to reset your password. This link expires in 1 hour."></p>`
        };
        await transporter.sendMail(mailOptions);

        res.json({ message: "Password reset link sent to your email"});
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const resetPassowrd = async(req:Request,res:Response) => {
    try {
        const {token,newPassword} = req.body;

        const verifyToken = jwt.verify(token,process.env.JWT_SECRET!) as jwt.JwtPayload;
        const user = await User.findOne(verifyToken.id);

        if(!user || user.resetPasswordToken !== token || user.resetPasswordExpires! < new Date()){
            return res.status(400).json({ message: "Invalid or expired token"});
        }

        user.password = await bcrypt.hash(newPassword,10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        return user.save();

        res.json({ message: "Password successfully reset" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};