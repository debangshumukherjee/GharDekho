import express from "express";
import {
  login,
  logout,
  register,
  verifyEmail,
  forgotUsername,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/logout", logout);

router.post("/forgot-username", forgotUsername);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
