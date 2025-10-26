import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import {
  sendOTPEmail,
  sendUsernameEmail,
  sendPasswordResetEmail,
} from "../lib/mailer.js";
import crypto from "crypto";

// Helper function to generate a 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  const { firstname, middlename, lastname, username, email, password } =
    req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser && existingUser.verified) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        username,
        password: hashedPassword,
        firstname,
        middlename,
        lastname,
        otp: hashedOtp,
        otpExpires,
        verified: false,
      },
      create: {
        email,
        username,
        password: hashedPassword,
        firstname,
        middlename,
        lastname,
        otp: hashedOtp,
        otpExpires,
        verified: false,
      },
    });

    await sendOTPEmail(email, otp);

    res.status(201).json({ message: "OTP sent to your email. Please verify." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to register user!" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
      return res
        .status(400)
        .json({ message: "OTP has expired or is invalid. Please try again." });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    await prisma.user.update({
      where: { email },
      data: {
        verified: true,
        otp: null,
        otpExpires: null,
      },
    });

    res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to verify email!" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    if (!user.verified) {
      return res
        .status(403)
        .json({
          message: "Account not verified. Please check your email for an OTP.",
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid Credentials!" });

    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      { id: user.id, isAdmin: false },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};

export const forgotUsername = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // To prevent email enumeration, we send a generic success message whether the user exists or not.
    if (user) {
      await sendUsernameEmail(user.email, user.username);
    }
    res
      .status(200)
      .json({
        message:
          "If a user with that email exists, the username has been sent.",
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error processing request." });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString("hex");
      // Hash the token before saving it to the database for security
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      // Set token expiry to 1 hour from now
      const passwordResetTokenExpires = new Date(
        new Date().getTime() + 60 * 60 * 1000
      );

      await prisma.user.update({
        where: { email },
        data: { passwordResetToken, passwordResetTokenExpires },
      });

      // Send the UNHASHED token in the email link
      await sendPasswordResetEmail(user.email, resetToken);
    }
    res
      .status(200)
      .json({
        message:
          "If a user with that email exists, a password reset link has been sent.",
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error processing request." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res
      .status(400)
      .json({ message: "Token and new password are required." });
  }

  try {
    // Hash the incoming token to match the one stored in the DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { gt: new Date() }, // Check if token has not expired
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired." });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      },
    });

    res
      .status(200)
      .json({
        message: "Password has been reset successfully. You can now log in.",
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to reset password." });
  }
};
