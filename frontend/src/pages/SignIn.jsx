import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase.js";
import { ClipLoader } from "react-spinners"
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

const SignIn = () => {
  const primaryColor = "#ff4d2d";
  const hoverColor = "#e64323";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()

  const handleSignin = async () => {
    setLoading(true)
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { withCredentials: true }
      );
      console.log(result);
      dispatch(setUserData(result.data))
      setErr("")
      setLoading(false)
    } catch (error) {
      setErr(error?.response?.data?.message)
      setLoading(false)
    }
  };

  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log(result);

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          email: result.user.email,
        },
        { withCredentials: true }
      );
      console.log(data);
      dispatch(setUserData(data))
      setErr("")
    } catch (error) {
      setErr(error.response.data.message)
    }
  };
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px]`}
        style={{ border: `1px solid ${borderColor}` }}
      >
        <h1
          className={`text-3xl font-bold mb-2 `}
          style={{ color: primaryColor }}
        >
          Eatly
        </h1>
        <p className="text-gray-600 mb-8">
          Sign In to your account to get started with delicious food deliveries
        </p>

        <div className="mb-4">
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

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 font-medium mb-1"
          >
            Password
          </label>

          <div className="relative ">
            <input
              type={`${showPassword ? "text" : "password"}`}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
              placeholder="Enter your password"
              style={{ border: `1px solid ${borderColor}` }}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="absolute cursor-pointer right-3 top-[14px] text-gray-500 "
              onClick={() => setShowPassword(!showPassword)}
            >
              {!showPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
        </div>

        <div
          className="text-right mb-4 text-[#ff4d2d] cursor-pointer"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password
        </div>

        <button
          className={`w-full font-semibold py-2 rounded-lg transition duration-200 cursor-pointer hover:bg-[#e64323]`}
          style={{ backgroundColor: primaryColor, color: "white" }}
          onClick={handleSignin}
          disabled={loading}
        >
        {loading ? <ClipLoader color="white" size={20}/> : "Sign In"}
          
        </button>

        <p className="text-red-500 text-center my-[10px]">{err}</p>

        <button
          className="w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition duration-200 border-gray-400 hover:bg-gray-100 cursor-pointer"
          onClick={handleGoogleAuth}
        >
          <FcGoogle size={20} />
          <span>Sign In with Google</span>
        </button>

        <p className="text-center mt-6" onClick={() => navigate("/signup")}>
          Want to create an account?{" "}
          <span className="text-[#ff4d2d] cursor-pointer">Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
