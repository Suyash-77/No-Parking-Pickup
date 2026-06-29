import express from 'express';
import userAuth from '../middleware/userauth.js';
import { getFaceStatus, getMyVehicles, getUserData, saveFaceDescriptor, updateUserProfile } from '../controller/usercontroller.js';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);
userRouter.get('/my-vehicles', userAuth, getMyVehicles);
userRouter.put('/update-profile', userAuth, updateUserProfile);
userRouter.post('/save-face', userAuth, saveFaceDescriptor);
userRouter.get('/face-status', userAuth, getFaceStatus)

export default userRouter;