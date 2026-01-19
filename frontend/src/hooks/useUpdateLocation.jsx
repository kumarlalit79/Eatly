// import React, { useEffect } from "react";
// import axios from "axios";
// import { serverUrl } from "../App";
// import { useDispatch } from "react-redux";
// import {
//   setCurrentAddress,
//   setCurrentCity,
//   setCurrentState,
//   setUserData,
// } from "../redux/userSlice";
// import { useSelector } from "react-redux";
// import { setAddress, setLocation } from "../redux/mapSlice";

// const useUpdateLocation = () => {
//   const dispatch = useDispatch();
//   const { userData } = useSelector((state) => state.user);

//   useEffect(() => {
//     const updateLocation = async (lat, lon) => {
//       const result = await axios.post(
//         `${serverUrl}/api/user/update-location`,
//         { lat, lon },
//         { withCredentials: true }
//       );
//       console.log("updateLocation",result.data);

//       navigator.geolocation.watchPosition((pos) => {
//         updateLocation(pos.coords.latitude, pos.coords.longitude)
//       })

//     };
//   }, [userData]);
// };

// export default useUpdateLocation;

import { useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useSelector } from "react-redux";

const useUpdateLocation = () => {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData) return;

    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    const watcherId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          await axios.post(
            `${serverUrl}/api/user/update-location`,
            { lat, lon },
            { withCredentials: true }
          );
        } catch (err) {
          console.log("location update failed", err);
        }
      },
      (err) => console.log("Geo error", err),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watcherId);
  }, [userData]);
};

export default useUpdateLocation;
