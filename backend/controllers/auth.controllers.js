import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password, mobile, role } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User Already exists",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "password must be at least 6 characters.",
      });
    }

    if (mobile.length < 10) {
      return res.status(400).json({
        message: "mobile number must be at least 10 digits.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      mobile,
      role,
      location: {
        type: "Point",
        coordinates: [0, 0], // dummy but valid
      },
    });

    const token = await genToken(user._id);

    // passing this token to our cookies
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("SIGNUP ERROR ", error);

    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User does not exists",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    const token = await genToken(user._id);

    // passing this token to our cookies
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json(`Sign in error ${error}`);
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "Log out successfully",
    });
  } catch (error) {
    return res.status(500).json(`Logout error ${error}`);
  }
};

// controller to send opt
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User does not exist.",
      });
    }

    // generate otp -- 9000 4 digit
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();

    // send otp to users mail, sendOtpMail - ye 2 cheeze leta tha, to and otp
    await sendOtpMail(user.email, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json(`Send otp error ${error}`);
  }
};

// verify opt
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    let user = await User.findOne({ email });

    if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "Invalid/expired otp.",
      });
    }
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;

    await user.save();
    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json(`Verify otp error ${error}`);
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    let user = await User.findOne({ email });

    if (!user || !user.isOtpVerified) {
      return res.status(400).json({
        message: "OTP verification required.",
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isOtpVerified = false;
    await user.save();

    return res.status(200).json({
      message: "password reset successfully",
    });
  } catch (error) {
    return res.status(500).json(`Reset password error ${error}`);
  }
};

// google auth - for both signin/signup
export const googleAuth = async (req, res) => {
  try {
    const { fullName, email, mobile, role } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ fullName, email, mobile, role, location: {
          type: "Point",
          coordinates: [0, 0], // 🔥 THIS WAS MISSING
        },
 });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json(`Google Auth Error ${error}`);
  }
};
