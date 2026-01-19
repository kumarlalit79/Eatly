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

const SignUp = () => {
  const primaryColor = "#ff4d2d";
  const hoverColor = "#e64323";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");

  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()

  const handleSignup = async () => {

    setLoading(true)

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { fullName, email, password, mobile, role },
        { withCredentials: true }
      );
      console.log(result);
      dispatch(setUserData(result.data))
      setErr("");
      setLoading(false)
    } catch (error) {
      setErr(error?.response?.data?.message);
      setLoading(false)
    }
  };

  const handleGoogleAuth = async () => {
    if (!mobile) {
      return setErr("Mobile number is required");
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log(result);

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          fullName: result.user.displayName,
          email: result.user.email,
          role,
          mobile,
        },
        { withCredentials: true }
      );
      console.log(data);
      dispatch(setUserData(data))
    } catch (error) {
      console.log(error);
    }
  };

  const navigate = useNavigate();

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
          Create your account to get started with delicious food deliveries
        </p>

        <div className="mb-4">
          <label
            htmlFor="fullName"
            className="block text-gray-700 font-medium mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
            placeholder="Enter your full name"
            style={{ border: `1px solid ${borderColor}` }}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

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
            htmlFor="mobile"
            className="block text-gray-700 font-medium mb-1"
          >
            Mobile
          </label>

          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
            placeholder="Enter your mobile number"
            style={{ border: `1px solid ${borderColor}` }}
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
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

        <div className="mb-4">
          <label
            htmlFor="role"
            className="block text-gray-700 font-medium mb-1"
          >
            Role
          </label>

          <div className="flex gap-2 ">
            {["user", "owner", "deliveryBoy"].map((r) => (
              <button
                key={r} // is r ki value phele user hogi, then owner then delivaryboy and so on
                className="flex-1 cursor-pointer border rounded-lg px-3 py-2 text-center font-medium transition-colors"
                onClick={() => setRole(r)}
                style={
                  role == r
                    ? { backgroundColor: primaryColor, color: "white" }
                    : {
                        border: `1px solid ${primaryColor}`,
                        color: primaryColor,
                      }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button
          className={`w-full font-semibold py-2 rounded-lg transition duration-200 cursor-pointer hover:bg-[#e64323]`}
          style={{ backgroundColor: primaryColor, color: "white" }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? <ClipLoader color="white" size={20}/> : "Sign Up"}
          
        </button>

        <p className="text-red-500 text-center my-[10px]">{err}</p>

        <button
          className="w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition duration-200 border-gray-400 hover:bg-gray-100 cursor-pointer"
          onClick={handleGoogleAuth}
        >
          <FcGoogle size={20} />
          <span>Sign up with Google</span>
        </button>

        <p className="text-center mt-6" onClick={() => navigate("/signin")}>
          Already have an account?{" "}
          <span className="text-[#ff4d2d] cursor-pointer">Sign In</span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
