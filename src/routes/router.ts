import express from "express";
import { stockApi,getSymbolData } from "../controllers/stock";
import { register, verifyOTP} from "../controllers/auth/register"; 
import { verifyToken,verificationOtp } from "../utils/verifyToken"; //verificationOtp


export const router = express.Router();

router.post("/api/v1/auth/register", register);
router.post("/api/v1/verifyOTP", verifyOTP);
router.get("/api/v1/stockPrice", verifyToken, verificationOtp, stockApi); 
router.get("/api/v1/get-symbol", getSymbolData)

export default router;
