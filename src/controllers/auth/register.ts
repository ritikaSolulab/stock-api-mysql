import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { error } from "winston";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import lodash from "lodash";
import { logger } from "../../logger";
import {db} from '../../index'

const SECRET_TOKEN = "Ritika123";

export const register = async (req: Request, res: Response) => {
  logger.info("Inside register");
  try {
    const { email, password } = req.body;
    if (lodash.isEmpty(email) || lodash.isEmpty(password)) {
      logger.error(`Provide all the details: ${(error as any).message}`);
      return res.status(400).json({
        success: false,
        message: "Provide all the details",
      });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const findQuery = `SELECT * FROM USER WHERE EMAIL='${email}'`
    db.query(findQuery, async(error,rows) =>{
      if(error){
        return res.status(400).json({message:error.message})
      } else {
        if(rows.length) return res.status(409).json({message:'email already exist'})
        else {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(password, salt);

          await sendOTPVerificationEmail(email)
          const saveUser = `INSERT INTO USER (email,password) VALUES (?,?)`
          db.query(saveUser,[email,hash], (error) => {
            if(error) return res.status(400).json({message:error.message})
            else return res.status(202).json({status: "PENDING",message: "Verification otp email sent"})
          })

        }
      }
    })
  } catch (err) {
        console.log(err);
        return res.status(400).json("Server error");
      }
}


export const sendOTPVerificationEmail = async (email: string) => {
  logger.info("Inside OTP Verification");
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
          user: 'freddy.jacobi@ethereal.email',
          pass: '8xrqNUHbDJK9trfK61'
      }
    });
    let message = {
      from: "freddy.jacobi@ethereal.email",
      to: email,
      subject: "Verify your email",
      text: `<p>Enter <b> ${otp}</b></p><p>This code <b>expires in 5 min</b>.</p>`,
    };
    const saveOtp = `INSERT INTO userotpverification (email,otp,expiresAt) VALUES (?,?,?)`
    db.query(saveOtp,[email,otp,Date.now() + 1000 * 60 * 5])
    await transporter.sendMail(message);
  } catch (err) {
    console.log(err);
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  logger.info("Inside verifyOTP");
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Provide valid details" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const UserOTPVerificationRecords = `SELECT * FROM USEROTPVERIFICATION WHERE EMAIL='${email}'`
    db.query(UserOTPVerificationRecords,async(error,rows)=> {
      if(error) return res.status(400).json({message:error.message})
      if(!rows.length) return res.status(400).json({message:'User has not registered'})
      const dbOTP = rows[rows.length-1].otp
      const dbExpires = rows[rows.length-1].expiresAt
      console.log(dbOTP)
      console.log(dbExpires)
      if (dbOTP != otp || (dbExpires as number < Date.now())){
        return res.status(401).json({ message: "code has expired. Please request again" });
      }
      const bearerToken = Jwt.sign(
          {
            email: email,
          },
          SECRET_TOKEN as string,
          {
            expiresIn: "5h",
          }
        );
        logger.info("Access successfully generated");
        const updateQuery = `UPDATE USER SET isVerified='1' WHERE EMAIL='${email}'`
        db.query(updateQuery, (error) => {
          if(error) return res.status(400).json({message:error.message})
          else {
            const deleteQuery = `DELETE FROM USEROTPVERIFICATION WHERE EMAIL='${email}'`
            db.query(deleteQuery, (error) => {
              if(error) return res.status(400).json({message:error.message})
              return res.status(201).json({
                status: "VERIFIED",
                message: "Your otp has been verified",
                bearerToken,
              });
            })
          }
        })
      })
      
  } catch (err) {
    console.log(err);
    return res.status(400).json("Server Error");
  }
};

