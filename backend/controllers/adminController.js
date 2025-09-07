const Admin = require("../models/Admin");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const jwt = require("../utils/jwt");

exports.register = async (req, res, next) => {
    try {
        const { name, telegramId, password, status } = req.body;
        if (!name || !telegramId || !password || !status) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const existingAdmin = await Admin.findByTelegramId(telegramId);

        if (existingAdmin) {
            return ApiResponse.badRequest("Admin already exists").send(res);
        }

        const admin = await Admin.create({ name, telegramId, password, status, role: "admin" });

        if (!admin) {
            return ApiResponse.error("Failed to create admin").send(res);
        }

        const accessToken = jwt.generateAccessToken({ id: admin.id, telegramId: admin.telegramId, role: "admin" });
        const refreshToken = jwt.generateRefreshToken({ id: admin.id, telegramId: admin.telegramId, role: "admin" });

        return ApiResponse.success({ accessToken:accessToken, refreshToken:refreshToken }, "Admin created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.login = async (req, res, next) => {
    try {
        const { telegramId, password } = req.body;

        if (!telegramId || !password) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const admin = await Admin.findByTelegramId(telegramId);

        if (!admin) {
            return ApiResponse.badRequest("Admin not found").send(res);
        }

        const isPasswordCorrect = await Admin.comparePassword(password, admin.password);

        if (!isPasswordCorrect) {
            return ApiResponse.badRequest("Invalid password").send(res);
        }

        const accessToken = jwt.generateAccessToken({ id: admin.id, telegramId: admin.telegramId, role: "admin" });
        const refreshToken = jwt.generateRefreshToken({ id: admin.id, telegramId: admin.telegramId, role: "admin" });

        return ApiResponse.success({ accessToken:accessToken, refreshToken:refreshToken }, "Admin logged in successfully").send(res);
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
        const admin = await Admin.findOne(decoded.id);

        if (!admin) {
            return ApiResponse.badRequest("Admin not found").send(res);
        }

        if (admin.role !== "admin" && admin.telegramId !== decoded.telegramId) {
            return ApiResponse.badRequest("Admin not found").send(res);
        }

        const newAccessToken = jwt.generateAccessToken({ id: admin.id, telegramId: admin.telegramId, role: "admin" });
        const newRefreshToken = jwt.generateRefreshToken({ id: admin.id, telegramId: admin.telegramId, role: "admin" });

        return ApiResponse.success({ accessToken:newAccessToken, refreshToken:newRefreshToken }, "Admin refreshed token successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            name,
            telegramId,
            groupId,
            status
        } = req.query;

        const filters = {};

        if (name) filters.name = name;

        if (telegramId) filters.telegramId = telegramId;

        if (groupId) {
            const groupIdNum = parseInt(groupId);
            if (isNaN(groupIdNum)) {
                return ApiResponse.badRequest("Invalid group ID").send(res);
            }
            filters.groupId = groupIdNum;
        }

        if (status !== undefined && status !== '') {
            if (status === 'true' || status === '1') {
                filters.status = true;
            } else if (status === 'false' || status === '0') {
                filters.status = false;
            } else {
                return ApiResponse.badRequest("Invalid status value (true/false)").send(res);
            }
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        filters.offset = (pageNum - 1) * limitNum;
        filters.limit = limitNum;

        const [users, totalCount] = await Promise.all([
            User.searchUsers(filters),
            User.countUsersWithFilters(filters)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            users,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Users fetched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return ApiResponse.badRequest("User ID is required").send(res);
        }

        const user = await User.findOne(userId);

        if (!user) {
            return ApiResponse.badRequest("User not found").send(res);
        }

        return ApiResponse.success(user, "User fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.createUser = async (req, res, next) => {
    try {
        const { name, telegramId, password, groupId } = req.body;
        let status = req.body.status;

        if (!name || !telegramId || !password || !groupId) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const existingUser = await User.findByTelegramId(telegramId);

        if (existingUser) {
            return ApiResponse.badRequest("User already exists").send(res);
        }

        const user = await User.create({ name, telegramId, password, status, role: "user" });

        if (!user) {
            return ApiResponse.error("Failed to create user").send(res);
        }

        const userGroup = await User.assignToGroup(user.id, groupId);
        if (!userGroup) {
            return ApiResponse.error("Failed to assign user to group").send(res);
        }

        const accessToken = jwt.generateAccessToken({ id: user.id, telegramId: user.telegramId, role: "user" });
        const refreshToken = jwt.generateRefreshToken({ id: user.id, telegramId: user.telegramId, role: "user" });

        return ApiResponse.success({ accessToken:accessToken, refreshToken:refreshToken }, "User created successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { name, telegramId, password, groupId } = req.body;

        let status = req.body.status;

        if (!userId) {
            return ApiResponse.badRequest("User ID is required").send(res);
        }

        if (!name || !telegramId || !groupId) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { name, telegramId, password, status, groupId });

        if (!updatedUser) {
            return ApiResponse.badRequest("User not found").send(res);
        }

        return ApiResponse.success(updatedUser, "User updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return ApiResponse.badRequest("User ID is required").send(res);
        }

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return ApiResponse.badRequest("User not found").send(res);
        }

        return ApiResponse.success(deletedUser, "User deleted successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.searchUsers = async (req, res, next) => {
    try {
        const {
            name,
            telegramId,
            groupId,
            status,
            page = 1,
            limit = 10
        } = req.query;

        const filters = {};

        if (name) filters.name = name;

        if (telegramId) filters.telegramId = telegramId;

        if (groupId) {
            const groupIdNum = parseInt(groupId);
            if (isNaN(groupIdNum)) {
                return ApiResponse.badRequest("Invalid group ID").send(res);
            }
            filters.groupId = groupIdNum;
        }

        if (status !== undefined && status !== '') {
            if (status === 'true' || status === '1') {
                filters.status = true;
            } else if (status === 'false' || status === '0') {
                filters.status = false;
            } else {
                return ApiResponse.badRequest("Invalid status value (true/false)").send(res);
            }
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        filters.offset = (pageNum - 1) * limitNum;
        filters.limit = limitNum;

        const [users, totalCount] = await Promise.all([
            User.searchUsers(filters),
            User.countUsersWithFilters(filters)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            users,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Users searched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.searchDocuments = async (req, res, next) => {
    try {
        const {
            title,
            year,
            month,
            date,
            startDate,
            endDate,
            groupId,
            uploaderId,
            uploaderName,
            page = 1,
            limit = 10
        } = req.query;

        const { isValidDate, isValidYear, isValidMonth, isValidDateRange } = require("../utils/dateUtils");

        if (year && !isValidYear(year)) {
            return ApiResponse.badRequest("Invalid year format").send(res);
        }

        if (month && !isValidMonth(month)) {
            return ApiResponse.badRequest("Invalid month format (1-12)").send(res);
        }

        if (date && !isValidDate(date)) {
            return ApiResponse.badRequest("Invalid date format (YYYY-MM-DD)").send(res);
        }

        if (startDate && !isValidDate(startDate)) {
            return ApiResponse.badRequest("Invalid start date format (YYYY-MM-DD)").send(res);
        }

        if (endDate && !isValidDate(endDate)) {
            return ApiResponse.badRequest("Invalid end date format (YYYY-MM-DD)").send(res);
        }

        if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
            return ApiResponse.badRequest("Invalid date range: start date must be before end date").send(res);
        }

        const filters = {};

        if (title) filters.title = title;

        if (year) filters.year = parseInt(year);
        if (month) filters.month = parseInt(month);
        if (date) filters.date = date;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        if (groupId) {
            const groupIdNum = parseInt(groupId);
            if (isNaN(groupIdNum)) {
                return ApiResponse.badRequest("Invalid group ID").send(res);
            }
            filters.groupId = groupIdNum;
        }

        if (uploaderId) {
            const uploaderIdNum = parseInt(uploaderId);
            if (isNaN(uploaderIdNum)) {
                return ApiResponse.badRequest("Invalid uploader ID").send(res);
            }
            filters.uploaderId = uploaderIdNum;
        }
        if (uploaderName) filters.uploaderName = uploaderName;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        filters.offset = (pageNum - 1) * limitNum;
        filters.limit = limitNum;

        const [documents, totalCount] = await Promise.all([
            Document.findWithFilters(filters),
            Document.countWithFilters(filters)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            documents,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Documents searched successfully").send(res);

    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updateAdmin = async (req, res, next) => {
    try {
        const { id } = req.admin;
        const { name, telegramId, password } = req.body;

        if (!name || !telegramId) {
            return ApiResponse.badRequest("All fields are required").send(res);
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(id, { name, telegramId, password });
        if (!updatedAdmin) {
            return ApiResponse.badRequest("Admin not found").send(res);
        }
        return ApiResponse.success(updatedAdmin, "Admin updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getAdmin = async (req, res, next) => {
    try {
        const { id } = req.admin;
        const admin = await Admin.findOne(id);
        if (!admin) {
            return ApiResponse.badRequest("Admin not found").send(res);
        }
        return ApiResponse.success(admin, "Admin fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}
