import React, { useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setCurrentAddress, setCurrentCity, setCurrentState, setUserData } from "../redux/userSlice";
import { useSelector } from "react-redux";
import { setAddress, setLocation } from "../redux/mapSlice";

const useGetCity = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      console.log("Current position : ", position);
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // for map
      dispatch(setLocation({lat:latitude,lon:longitude}))

      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`
      );

      console.log(result);
      console.log("City=", result.data.results[0].city);
      console.log("state=", result?.data.results[0].state);
      console.log("address=", result?.data.results[0].address_line2);

      dispatch(setCurrentCity(result?.data.results[0].city));
      dispatch(setCurrentState(result?.data.results[0].state))
      dispatch(setCurrentAddress(result?.data.results[0].address_line2 || result?.data.results[0].address_line1))

      // for map
      dispatch(setAddress(result?.data.results[0].address_line2)) 
      
    });
  }, [userData]);
};

export default useGetCity;
