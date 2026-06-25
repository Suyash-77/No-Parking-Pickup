import express from 'express';
import userAuth from '../middleware/userauth.js';
import { getMyVehicles, getUserData, updateUserProfile } from '../controller/usercontroller.js';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);
userRouter.get('/my-vehicles', userAuth, getMyVehicles);
userRouter.put('/update-profile', userAuth, updateUserProfile);

export default userRouter;