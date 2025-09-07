const Roles = require("../models/Roles");
const ApiResponse = require("../utils/apiResponse");

exports.getAllRoles = async (req, res, next) => {
    try {
        const roles = await Roles.findAll();
        if (!roles) {
            return ApiResponse.badRequest("Roles not found").send(res);
        }

        return ApiResponse.success(roles, "Roles fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}


exports.getRole = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const role = await Roles.findOne(roleId);
        if (!role) {
            return ApiResponse.badRequest("Role not found").send(res);
        }

        return ApiResponse.success(role, "Role fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}



exports.createRole = async (req, res, next) => {
    try {
        const { name } = req.body;
        const role = await Roles.create({ name });
        if (!role) {
            return ApiResponse.error("Failed to create role").send(res);
        }

        return ApiResponse.success(role, "Role created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updateRole = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const { name } = req.body;
        const role = await Roles.findByIdAndUpdate(roleId, { name });
        if (!role) {
            return ApiResponse.badRequest("Role not found").send(res);
        }

        return ApiResponse.success(role, "Role updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.deleteRole = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const role = await Roles.findByIdAndDelete(roleId);
        if (!role) {
            return ApiResponse.badRequest("Role not found").send(res);
        }
        return ApiResponse.success(role, "Role deleted successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}