const Permissions = require("../models/Permissions");
const ApiResponse = require("../utils/apiResponse");

exports.getAllPermissions = async (req, res, next) => {
    try {
        const permissions = await Permissions.findAll();
        if (!permissions) {
            return ApiResponse.badRequest("Permissions not found").send(res);
        }

        return ApiResponse.success(permissions, "Permissions fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getPermission = async (req, res, next) => {
    try {
        const { permissionId } = req.params;
        const permission = await Permissions.findOne(permissionId);
        if (!permission) {
            return ApiResponse.badRequest("Permission not found").send(res);
        }

        return ApiResponse.success(permission, "Permission fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.createPermission = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const permission = await Permissions.create({ name, description });
        if (!permission) {
            return ApiResponse.error("Failed to create permission").send(res);
        }
        return ApiResponse.success(permission, "Permission created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updatePermission = async (req, res, next) => {
    try {
        const { permissionId } = req.params;
        const { name, description } = req.body;
        const permission = await Permissions.findByIdAndUpdate(permissionId, { name, description });
        if (!permission) {
            return ApiResponse.badRequest("Permission not found").send(res);
        }
        return ApiResponse.success(permission, "Permission updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.deletePermission = async (req, res, next) => {
    try {
        const { permissionId } = req.params;
        const permission = await Permissions.findByIdAndDelete(permissionId);
        if (!permission) {
            return ApiResponse.badRequest("Permission not found").send(res);
        }
        return ApiResponse.success(permission, "Permission deleted successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}