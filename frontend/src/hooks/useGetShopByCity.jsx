import React, { useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setShopsInMyCity, setUserData } from "../redux/userSlice";

const useGetShopByCity = () => {
  const dispatch = useDispatch();
  const { currentCity } = useSelector((state) => state.user);
  useEffect(() => {
    if (!currentCity?.trim()) return;
    const fetchShop = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${currentCity}`,
          {
            withCredentials: true,
          }
        );
        dispatch(setShopsInMyCity(result.data));
        console.log("current shop", result.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchShop();
  }, [currentCity]);
};

export default useGetShopByCity;
