import nodemailer from "nodemailer";

// Configure the transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: "Your OTP for GharDekho Verification",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to GharDekho!</h2>
        <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your registration:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007BFF;">${otp}</p>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr/>
        <p>Best Regards,<br/>The GharDekho Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Could not send OTP email.");
  }
};

// --- FORGOT USERNAME ---
export const sendUsernameEmail = async (to, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: "Your GharDekho Username Reminder",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>GharDekho Username Reminder</h2>
        <p>You requested a reminder of your username.</p>
        <p>Your username is: <strong style="font-size: 18px;">${username}</strong></p>
        <p>You can now use this username to log in.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr/>
        <p>Best Regards,<br/>The GharDekho Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Username reminder email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending username email:", error);
    throw new Error("Could not send username email.");
  }
};

// --- PASSWORD RESET ---
export const sendPasswordResetEmail = async (to, token) => {
  // This URL points to your frontend application's reset password page
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: "GharDekho Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>GharDekho Password Reset</h2>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the button below to choose a new password:</p>
        <a href="${resetUrl}" style="background-color: #007BFF; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 16px;">Reset Password</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>This link is valid for 1 hour.</p>
        <hr/>
        <p>Best Regards,<br/>The GharDekho Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Could not send password reset email.");
  }
};
