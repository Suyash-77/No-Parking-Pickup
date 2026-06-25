import jwt from "jsonwebtoken";
import { sendError, sendSuccess } from "../config/response.js";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return sendError(res, 401, 'Not authorized. Login again');
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        req.body = { ...req.body, userId: tokenDecode.id }
        req.body.role = tokenDecode.role;

        next();

    } catch (error) {
        return sendError(res, 401, error.message);
    }
};

export default userAuth;