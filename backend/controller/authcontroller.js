import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModal from '../modal/userModal.js';
import transporter from '../config/nodemailer.js';
import { USER_ROLE, USER_STATUS } from '../config/constants.js';
import { STATUS_CODES } from '../config/statusCode.js'
import { sendError, sendSuccess } from '../config/response.js';

export const register = async (req, res) => {
    const { fullname, email, password, phone } = req.body;
    if (!fullname || !email || !password || !phone) {
        return sendError(res, 400, 'Missing Details')
    }

    try {
        const existingUser = await userModal.findByEmail(email)

        if (existingUser) {
            return sendError(res, 409, "User already Exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModal.createUser(fullname, email, hashedPassword, phone);

        const mailOptions = {
            from: `"No Parking Pickup" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Welcome to No Parking Pickup',
            html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2 style="color:#111;">Welcome, ${fullname}!</h2>
        <p style="color:#555;">Your account has been created successfully.</p>
        <p style="color:#555;">Release your vehicle from us — it only takes a few minutes.</p>
        <a href="${process.env.APP_URL}"
           style="display:inline-block;margin-top:16px;padding:12px 28px;
                  background:#6366f1;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:500;">
          Build My Resume
        </a>
        <p style="margin-top:32px;color:#999;font-size:12px;">
          If you did not create this account, you can ignore this email.
        </p>
      </div>
    `
        }

        await transporter.sendMail(mailOptions);

        return sendSuccess(res, 200,"", 'Successful Registration please wait for admin approval');

    } catch (error) {
        return sendError(res, 500, error.message)
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendError(res, 400, 'email and password are required')
    }

    try {
        const user = await userModal.findByEmail(email)

        if (!user) {
            return sendError( res, 401, 'Invalid Email' )
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return sendError(res, 401, 'Invalid Password' )
        }

        if (user.role === USER_ROLE.USER) {
            if (user.status === USER_STATUS.PENDING) {
                return sendError(res, 403, 'Account Status pending need approval from admin' )
            }

            if (user.status === USER_STATUS.REJECTED) {
                return sendError(res, 403, 'Account Status rejected by admin')
            }
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return sendSuccess(res, 200,"",{role: user.role, name: user.name });


    } catch (error) {
        return sendError(res, 500, error.message);
    }

}

export const logout = async (req, res) => {
    try {

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });

        return sendSuccess(res, 200,"", 'logged out' );

    }
    catch (error) {
        return sendError(res, 500,  error.message);
    }
}

export const sendVerifyOtp = async (req, res) => {
    try {

        const { userId } = req.body;

        const user = await userModal.findById(userId);

        if (user.is_verified) {
            return sendError(res, 400, "Account is already Verified" )
        }

        const optcode = String(Math.floor(Math.random() * 900000 + 100000));
        const expiresat = new Date(Date.now() + 15 * 60 * 1000);

        await userModal.updateOtp(userId, optcode, expiresat);

        const mailOptions = {
            from: `"No Parking Pickup" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: 'account verification otp',
            html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
                <h2 style="color:#111;">Verify Your Account</h2>
                <p style="color:#555;">Your verification code is below. It expires in 15 minutes.</p>
                <div style="background:#f4f4f5;padding:16px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1;border-radius:8px;margin:24px 0;">
                    ${optcode}
                </div>
                <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return sendSuccess(res, 200,"", "verification OTP sent to email")

    } catch (error) {
        return sendError(res, 500, error.message );
    }
}

export const verifyEmail = async (req, res) => {
    try {

        const { userId, optCode } = req.body;

        if (!userId || !optCode) {
            return sendError(res, 400, "Missing Details" );
        }

        const user = await userModal.findById(userId);

        if (!user) {
            return sendError(res, 404, "User not Found" );
        }

        const otpRecord = await userModal.findLatestOtp(userId);

        if (!otpRecord || otpRecord.otp_code !== optCode) {
            return sendError(res, 400, "Invalid OTP" );
        }

        if (new Date(Date.now()) > otpRecord.expires_at) {
            return sendError(res, 400, "OTP Expired" );
        }

        await userModal.markVerified(userId);
        await userModal.markOtpAsUsed(otpRecord.id);

        return sendSuccess(res, 200,"", "Email verified successfully" );
    } catch (error) {
        return sendError(res, 500, error.message );
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        return sendSuccess(res, 200,"",{ success: true });
    }
    catch (error) {
        sendError(res, 500, error.message );
    }
}

export const SendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return sendError(res, 400, 'Email is required' )
    }

    try {
        const user = await userModal.findByEmail(email);
        if (!user) {
            return sendError(res, 404, 'User not Found' );
        }

        const optcode = String(Math.floor(Math.random() * 900000 + 100000));
        const expiresat = new Date(Date.now() + 15 * 60 * 1000);

        await userModal.updateOtp(user.id, optcode, expiresat);

        const mailOptions = {
            from: `"No Parking Pickup" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: 'Password reset otp',
            html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
                <h2 style="color:#111;">Reset your password</h2>
                <p style="color:#555;">Your reset otp is below. It expires in 15 minutes.</p>
                <div style="background:#f4f4f5;padding:16px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1;border-radius:8px;margin:24px 0;">
                    ${optcode}
                </div>
                <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return sendSuccess(res, 200,"", 'Reset OTP sent successfully' );

    } catch (error) {
        return sendError(res, 500, error.message );
    }
}

export const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return sendError(res, 400, 'Email and OTP are required');
    }

    try {
        const user = await userModal.findByEmail(email);
        if (!user) {
            return sendError(res, 404, 'User not Found');
        }

        const otpRecord = await userModal.findLatestOtp(user.id);

        if (!otpRecord || otpRecord.otp_code !== otp) {
            return sendError(res, 400, 'Invalid OTP');
        }

        if (new Date(Date.now()) > otpRecord.expires_at) {
            return sendError(res, 400, 'OTP Expired');
        }

        return sendSuccess(res, 200,"", 'OTP verified');
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return sendError(res, 400, 'Email, OTP, and new Password are required' );
    }

    try {

        const user = await userModal.findByEmail(email);
        if (!user) {
            return sendError(res, 404, 'User not Found' );
        }

        const otpRecord = await userModal.findLatestOtp(user.id);

        if (!otpRecord || otpRecord.otp_code !== otp) {
            return sendError(res, 400, "Invalid OTP" );
        }

        if (new Date(Date.now()) > otpRecord.expires_at) {
            return sendError(res, 400, "OTP Expired" );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModal.updatePassword(user.id, hashedPassword);
        await userModal.markOtpAsUsed(otpRecord.id);

        return sendSuccess(res, 200,"", 'Password has been reset' );
    } catch (error) {
        return sendError(res, 500, error.message );
    }
}
