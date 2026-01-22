import React, { useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import { categories } from "../category";
import CategoryCard from "./CategoryCard";
import { FaCircleChevronLeft } from "react-icons/fa6";
import { FaCircleChevronRight } from "react-icons/fa6";
import { useSelector } from "react-redux";
import FoodCard from "./FoodCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";


const UserDashboard = () => {
  const { currentCity, shopInMyCity, itemsInMyCity, searchItems} = useSelector((state) => state.user);

  const cateScrollRef = useRef();
  const shopScrollRef = useRef();
  const navigate = useNavigate()

  const [showLeftCateButton, setShowLeftCateButton] = useState(false);
  const [showRightCateButton, setShowRightCateButton] = useState(false);

  const [showLeftShopButton, setShowLeftShopButton] = useState(false);
  const [showRightShopButton, setShowRightShopButton] = useState(false);
  const [updatedItemsList, setUpdatedItemsList] = useState([])

  const handleFilterByCategory = (category) => {
    if(category=="All"){
      setUpdatedItemsList(itemsInMyCity)
    }
    else{
      const filteredList = itemsInMyCity?.filter(i=>i.category===category)
      setUpdatedItemsList(filteredList)
    }
  }

  useEffect(() => {
    setUpdatedItemsList(itemsInMyCity)
  }, [itemsInMyCity])
  

  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current;
    if (element) {
      
      console.log(element.scrollLeft);
      setLeftButton(element.scrollLeft > 0);

      console.log(
        "full width ",
        element.scrollWidth,
        "visible width ",
        element.clientWidth
      );
      setRightButton(
        element.scrollLeft + element.clientWidth < element.scrollWidth
      );
    }
  };

  const scrollHandler = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction == "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  // useEffect(() => {
  //   if (cateScrollRef.current) {
  //     updateButton(
  //         cateScrollRef,
  //         setShowLeftCateButton,
  //         setShowRightCateButton
  //       );
  //     cateScrollRef.current.addEventListener("scroll", () => {
  //       updateButton(
  //         cateScrollRef,
  //         setShowLeftCateButton,
  //         setShowRightCateButton
  //       );
  //     });
  //   }
  //   return () =>
  //     cateScrollRef.current.removeEventListener("scroll", () => {
  //       updateButton(
  //         cateScrollRef,
  //         setShowLeftCateButton,
  //         setShowRightCateButton
  //       );
  //     });
  // }, []);
  const handleScroll = () => {
    updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton);
  };
  const handleShopScroll = () => {
    updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton);
  };

  

  useEffect(() => {
    const cateElement = cateScrollRef.current;
    const shopElement = shopScrollRef.current;

    if (cateElement) {
      updateButton(
        cateScrollRef,
        setShowLeftCateButton,
        setShowRightCateButton
      );
      cateElement.addEventListener("scroll", handleScroll);
    }

    if (shopElement) {
      updateButton(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton
      );
      shopElement.addEventListener("scroll", handleShopScroll);
    }

    return () => {
      if (cateElement) {
        cateElement.removeEventListener("scroll", handleScroll);
      }
      if (shopElement) {
        shopElement.removeEventListener("scroll", handleShopScroll);
      }
    };
  }, []);

  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto">
      <Nav />

      {searchItems && searchItems.length > 0 && (
        <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4">
          <h1 className="text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2">Search Result</h1>
          <div className="w-full h-auto flex flex-wrap gap-6 justify-center">
            {searchItems.map((item) => (
              <FoodCard data={item} key={item._id}/>
            ))}
          </div>
        </div>
      )}

      {/* Mapping Categories */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Inspiration for your first order
        </h1>

        <div className="w-full relative">
          {showLeftCateButton && (
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#ff4d2d] z-10 cursor-pointer"
              onClick={() => scrollHandler(cateScrollRef, "left")}
            >
              <FaCircleChevronLeft />
            </button>
          )}

          <div
            className="w-full flex overflow-x-auto gap-4 pb-2 cursor-pointer"
            ref={cateScrollRef}
          >
            {categories?.map((cate, index) => (
              <CategoryCard
                name={cate.category}
                image={cate.image}
                key={index}
                onClick={()=>handleFilterByCategory(cate.category)}
              />
            ))}
          </div>

          {showRightCateButton && (
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#ff4d2d] z-10 cursor-pointer"
              onClick={() => scrollHandler(cateScrollRef, "right")}
            >
              <FaCircleChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Mapping Shops */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Best Shop in {currentCity}
        </h1>
        <div className="w-full relative">
          {showLeftShopButton && (
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#ff4d2d] z-10"
              onClick={() => scrollHandler(shopScrollRef, "left")}
            >
              <FaCircleChevronLeft />
            </button>
          )}

          <div
            className="w-full flex overflow-x-auto gap-4 pb-2 cursor-pointer"
            ref={shopScrollRef}
          >
            {shopInMyCity?.map((shop, index) => (
              <CategoryCard name={shop.name} image={shop.image} key={index} onClick={()=>navigate(`/shop/${shop._id}`)} />
            ))}
          </div>

          {showRightShopButton && (
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#ff4d2d] z-10"
              onClick={() => scrollHandler(shopScrollRef, "right")}
            >
              <FaCircleChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Mapping all Products */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
          <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Suggested Food Items
        </h1>

        <div className="w-full h-auto flex flex-wrap gap-[20px] justify-center">
            {updatedItemsList?.map((item,index) => (
              <FoodCard key={index} data={item}/>
            ))}
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
