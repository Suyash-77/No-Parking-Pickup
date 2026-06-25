export const sendError = (res, statusCode, message, extra = {}) => {
  return res.status(statusCode).json({ success: false, message, ...extra })
}

export const sendSuccess = (res, statusCode, message, extra = {}) => {
  return res.status(statusCode).json({ success: true, message, ...extra })
}