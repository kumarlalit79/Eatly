import React, { useState } from "react";
import { IoMdArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const primaryColor = "#ff4d2d";
  const hoverColor = "#e64323";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/send-otp`,
        { email },
        { withCredentials: true }
      );
      console.log(result);
      setErr("");
      setStep(2);
      setLoading(false);
    } catch (error) {
      setErr(error?.response?.data?.message);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/verify-otp`,
        { email, otp },
        { withCredentials: true }
      );
      console.log(result);
      setErr("");
      setStep(3);
      setLoading(false);
    } catch (error) {
      setErr(error?.response?.data?.message);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword != confirmPassword) {
      return null;
    }
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/reset-password`,
        { email, newPassword },
        { withCredentials: true }
      );
      console.log(result);
      setErr("");
      navigate("/signin");
      setLoading(false);
    } catch (error) {
      setErr(error?.response?.data?.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 "
      style={{ backgroundColor: bgColor }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center gap-4 mb-4">
          <IoMdArrowBack
            size={30}
            className="text-[#ff4d2d] cursor-pointer"
            onClick={() => navigate("/signin")}
          />
          <h1 className="text-2xl font-bold text-center text-[#ff4d2d]">
            Forget Password
          </h1>
        </div>

        {step == 1 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-1"
              >
                Email
              </label>

              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Enter your email"
                style={{ border: `1px solid ${borderColor}` }}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 cursor-pointer hover:bg-[#e64323]`}
              style={{ backgroundColor: primaryColor, color: "white" }}
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white"/> : " Send OTP"}
            </button>
            <p className="text-red-500 text-center my-[10px]">{err}</p>
          </div>
        )}

        {step == 2 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="block text-gray-700 font-medium mb-1"
              >
                OTP
              </label>

              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Enter OTP"
                style={{ border: `1px solid ${borderColor}` }}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 cursor-pointer hover:bg-[#e64323]`}
              style={{ backgroundColor: primaryColor, color: "white" }}
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white"/> : " Verify"}
            </button>
            <p className="text-red-500 text-center my-[10px]">{err}</p>
          </div>
        )}

        {step == 3 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-medium mb-1"
              >
                New Password
              </label>

              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Enter New Password"
                style={{ border: `1px solid ${borderColor}` }}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-medium mb-1"
              >
                Confirm Password
              </label>

              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="Confirm your Password"
                style={{ border: `1px solid ${borderColor}` }}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 cursor-pointer hover:bg-[#e64323]`}
              style={{ backgroundColor: primaryColor, color: "white" }}
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "  Reset Password"}
            </button>
            <p className="text-red-500 text-center my-[10px]">{err}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
