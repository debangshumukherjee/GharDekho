import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { sendOTPEmail } from "../lib/mailer.js";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};

// Helper function to generate a 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// New function to send OTP for email update
export const sendUpdateEmailOtp = async (req, res) => {
  const { newEmail } = req.body;
  const tokenUserId = req.userId;

  try {
    // Check if the new email is already in use by another verified user
    const emailInUse = await prisma.user.findFirst({
      where: { email: newEmail, verified: true, NOT: { id: tokenUserId } },
    });

    if (emailInUse) {
      return res
        .status(400)
        .json({ message: "This email is already in use by another account." });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000);

    // Store the OTP on the current user's record
    await prisma.user.update({
      where: { id: tokenUserId },
      data: {
        otp: hashedOtp,
        otpExpires,
      },
    });

    // Send OTP to the NEW email address
    await sendOTPEmail(newEmail, otp);

    res.status(200).json({ message: "OTP sent to the new email address." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send OTP." });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, email, otp, ...inputs } = req.body;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  let updatedPassword = null;
  let updatedEmail = {};

  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    // If an email is being updated, it must be verified with an OTP
    if (email) {
      const user = await prisma.user.findUnique({ where: { id: tokenUserId } });

      if (!otp) {
        return res
          .status(400)
          .json({ message: "OTP is required to update email." });
      }
      if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
        return res
          .status(400)
          .json({ message: "OTP has expired or is invalid." });
      }

      const isOtpValid = await bcrypt.compare(otp, user.otp);
      if (!isOtpValid) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      updatedEmail = { email: email };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...updatedEmail,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
        // Clear OTP fields after successful update
        otp: null,
        otpExpires: null,
      },
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).json(rest);
    console.log("User's Data Updated");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update user!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete users!" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: "Post removed from saved list" });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      res.status(200).json({ message: "Post saved" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete users!" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserId },
    });
    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserId },
      include: {
        post: true,
      },
    });

    const savedPosts = saved.map((item) => item.post);
    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const number = await prisma.chat.count({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
        NOT: {
          seenBy: {
            hasSome: [tokenUserId],
          },
        },
      },
    });
    res.status(200).json(number);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};
