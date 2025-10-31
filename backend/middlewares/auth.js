const ApiResponse = require("../utils/apiResponse");
const jwt = require("../utils/jwt");
const Admin = require("../models/Admin");
const User = require("../models/User");

exports.protectAdmin = async (req, res, next) => {
    try {
        let token;

        if (req?.headers?.authorization) {
            if (req.headers.authorization.startsWith("Bearer")) {
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
        }

        if (!token) {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }

        const decoded = jwt.verifyAccessToken(token);
        const admin = await Admin.findOne(decoded.id);

        if (!admin) {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }

        // Allow admin and director roles to access admin endpoints
        if (admin.role !== "admin" && admin.role !== "director") {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }

        if (admin.telegramId !== decoded.telegramId) {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }

        req.admin = admin;
        next();
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}


exports.protectUser = async (req, res, next) => {
    try {
        let token;
        
        if (req?.headers?.authorization) {
            if (req.headers.authorization.startsWith("Bearer")) {
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
        }

        if (!token) {
            return ApiResponse.unauthorized("You are not authorized to access this resource without a token").send(res);
        }

        const decoded = jwt.verifyAccessToken(token);
        const user = await User.findOne(decoded.id);

        if (!user) {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }

        if (user.role !== "user" && user.telegramId !== decoded.telegramId) {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }

        req.user = user;
        next();
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.protectUserOrAdmin = async (req, res, next) => {
    try {
        let token;

        if(req?.headers?.authorization) {
            if(req.headers.authorization.startsWith("Bearer")) {
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
        }

        if(!token) {
            return ApiResponse.unauthorized("You are not authorized to access this resource without a token").send(res);
        }
        
        const decoded = jwt.verifyAccessToken(token);
        const user = await User.findOne(decoded.id);
        const admin = await Admin.findOne(decoded.id);

        if(!user && !admin) {
            return ApiResponse.unauthorized("You are not authorized to access this resource").send(res);
        }
        
        if(user) {
            req.user = user;
        }

        if(admin) {
            req.admin = admin;
        }

        next();
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}