import express from 'express'
import { isAuthenticated, login, logout, register, resetPassword, SendResetOtp, sendVerifyOtp, verifyEmail, verifyResetOtp } from '../controller/authcontroller.js';
import userAuth from '../middleware/userauth.js';
const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.get('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-otp', SendResetOtp);
authRouter.post('/verify-reset-otp', verifyResetOtp);
authRouter.post('/reset-password', resetPassword);


export default authRouter;


