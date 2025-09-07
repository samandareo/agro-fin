const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const jwt = require("../utils/jwt");

exports.login = async (req, res, next) => {
    try {
        const { telegramId, password } = req.body;

        if (!telegramId || !password) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const user = await User.findByTelegramId(telegramId);

        if (!user) {
            return ApiResponse.badRequest("User not found").send(res);
        }

        const isPasswordCorrect = await User.comparePassword(password, user.password);

        if (!isPasswordCorrect) {
            return ApiResponse.badRequest("Invalid password").send(res);
        }

        const accessToken = jwt.generateAccessToken({ id: user.id, telegramId: user.telegramId, role: "user" });
        const refreshToken = jwt.generateRefreshToken({ id: user.id, telegramId: user.telegramId, role: "user" });  

        return ApiResponse.success({ accessToken:accessToken, refreshToken:refreshToken }, "User logged in successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return ApiResponse.badRequest("Refresh token is required").send(res);
        }

        const decoded = jwt.verifyRefreshToken(refreshToken);
        const user = await User.findOne(decoded.id);

        if (!user) {
            return ApiResponse.badRequest("User not found").send(res);
        }

        if (user.role !== "user" && user.telegramId !== decoded.telegramId) {
            return ApiResponse.badRequest("User not found").send(res);
        }

        const newAccessToken = jwt.generateAccessToken({ id: user.id, telegramId: user.telegramId, role: "user" });
        const newRefreshToken = jwt.generateRefreshToken({ id: user.id, telegramId: user.telegramId, role: "user" });

        return ApiResponse.success({ accessToken:newAccessToken, refreshToken:newRefreshToken }, "User refreshed token successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}
