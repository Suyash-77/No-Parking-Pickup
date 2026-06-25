import { createContext, useEffect, useState } from "react";
import axios from "axios";

const AppContent = createContext()

export const AppContextProvider = (props) => {

   const backendUrl = import.meta.env.VITE_BACKEND_URL
   const [isLoggedin, setIsLoggedin] = useState(false)
   const [userData, setUserData] = useState(false)

   const getUserData = async () => {
      try {
         axios.defaults.withCredentials = true
         const { data } = await axios.get(backendUrl + '/api/user/data')
         if (data.success) {
            setUserData(data.userdata)
            console.log(data.userData)
         } else {
            setUserData(null)
         }
      } catch (error) {
         console.log(error)
         setUserData(null)
      }
   }

   useEffect(() => {
      let active = true;

      const initializeAuth = async () => {
         try {
            axios.defaults.withCredentials = true
            const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`)
            if (data.success && active) {
               setIsLoggedin(true);
               const { data: userDataResult } = await axios.get(`${backendUrl}/api/user/data`)
               if (userDataResult.success && active) {
                  setUserData(userDataResult.userdata);
               }
            }
         } catch (err) {
            if (active && err.response?.status !== 401) {
               console.log(err.response?.data?.message || err.message);
            }
         }
      };

      initializeAuth();
      return () => {
         active = false;
      };
   }, [backendUrl]);

   const value = {
      backendUrl,
      isLoggedin, setIsLoggedin,
      userData, setUserData,
      getUserData
   }

   return (
      <AppContent.Provider value={value}>
         {props.children}
      </AppContent.Provider>
   )
}

export { AppContent }