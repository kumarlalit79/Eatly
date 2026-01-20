import React, { useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaUtensils } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { ClipLoader } from "react-spinners";

const AddItem = () => {
  const navigate = useNavigate();

  const { myShopData } = useSelector((state) => state.owner);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);

  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("veg");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState(""); // New error state

  const [loading, setSetloading] = useState(false);

  const categories = [
    "Snacks",
    "Main Course",
    "Desserts",
    "Pizza",
    "Burgers",
    "Sandwiches",
    "South Indian",
    "North Indian",
    "Chinese",
    "Fast Food",
    "Pahadi",
    "Others",
  ];

  const dispatch = useDispatch();

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);

    setFrontendImage(URL.createObjectURL(file));
  };

  const handleGenerateDescription = async () => {
    setAiError(""); // Reset error
    if (!name || !category) {
      setAiError("Please enter Item Name and Select Category first!");
      return;
    }
    setGenerating(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/ai/generate-description`,
        { itemName: name, category },
        { withCredentials: true }
      );
      setDescription(result.data.description);
      setGenerating(false);
    } catch (error) {
      console.log("AI error", error);
      setGenerating(false);
      setAiError(error.response?.data?.details || "Failed to generate description. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSetloading(true)

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("foodType", foodType);
      formData.append("price", price);
      formData.append("description", description);

      if (backendImage) {
        formData.append("image", backendImage);
      }

      // calling api now
      const result = await axios.post(
        `${serverUrl}/api/item/add-item`,
        formData,
        { withCredentials: true }
      );

      console.log("add items data=", result.data);
      dispatch(setMyShopData(result.data));
      navigate("/")
      setSetloading(false)

    } catch (error) {
      console.log("frontend error", error.response?.data);
      setSetloading(false)
    }
  };

  return (
    <div className="flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 relative to-white min-h-screen">
      <div
        className="absolute cursor-pointer top-[20px] left-[20px] z-[10] mb-[10px]"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
      </div>
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <FaUtensils className="text-[#ff4d2d] w-16 h-16" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">Add Food</div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Enter Food Name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Food Image
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onChange={handleImage}
            />
            {frontendImage && (
              <div className="mt-4">
                <img
                  src={frontendImage}
                  alt="shopImage"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <div className="relative">
              <textarea
                placeholder="Enter or Generate Description"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 bottom-2 bg-gradient-to-r from-[#ff4d2d] to-orange-600 text-white text-xs px-3 py-1.5 rounded-md shadow-sm hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-1"
                onClick={handleGenerateDescription}
                disabled={generating}
              >
                {generating ? (
                  <ClipLoader size={12} color="white" />
                ) : (
                  <>✨ Generate with AI</>
                )}
              </button>
            </div>
            {aiError && <p className="text-red-500 text-sm mt-1">{aiError}</p>} 
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Category
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cate, index) => (
                <option value={cate} key={index}>
                  {cate}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Food Type
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
            >
              <option value="veg">veg</option>
              <option value="non veg">non veg</option>
            </select>
          </div>

          <button className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200 cursor-pointer" disabled={loading}>
            {loading ? <ClipLoader size={20} color="white"/> : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
