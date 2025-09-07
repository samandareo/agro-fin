const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRE } = require("../config/config");
const { JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRE } = require("../config/config");

module.exports = {
    generateAccessToken: (payload) => {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    },
    generateRefreshToken: (payload) => {
        return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
    },
    verifyAccessToken: (token) => {
        return jwt.verify(token, JWT_SECRET);
    },
    verifyRefreshToken: (token) => {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    },
}