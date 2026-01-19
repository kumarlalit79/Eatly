import React, { useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity, setShopsInMyCity, setUserData } from "../redux/userSlice";

const useGetItemsByCity = () => {
  const dispatch = useDispatch();
  const { currentCity } = useSelector((state) => state.user);
  useEffect(() => {
    if (!currentCity?.trim()) return;
    const fetchItems = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/get-by-city/${currentCity}`,
          {
            withCredentials: true,
          }
        );
        dispatch(setItemsInMyCity(result.data));
        console.log("Items In My City", result.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchItems();
  }, [currentCity]);
};

export default useGetItemsByCity;
