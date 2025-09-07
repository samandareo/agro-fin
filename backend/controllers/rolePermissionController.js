const RolePermission = require("../models/RolePermission");
const ApiResponse = require("../utils/apiResponse");

exports.getPermissionByRole = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const rolePermissions = await RolePermission.findPermissionByRole(roleId);
        if (!rolePermissions) {
            return ApiResponse.badRequest("Role permissions not found").send(res);
        }
        return ApiResponse.success(rolePermissions, "Role permissions fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.addPermissionToRole = async (req, res, next) => {
    try {
        const { roleId, permissionId } = req.body;

        const duplicatePermission = await RolePermission.checkDuplicatePermission(roleId, permissionId);

        if (duplicatePermission) {
            return ApiResponse.badRequest("Permission already exists in role").send(res);
        }

        const rolePermission = await RolePermission.addPermissionToRole(roleId, permissionId);
        if (!rolePermission) {
            return ApiResponse.error("Failed to add permission to role").send(res);
        }
        return ApiResponse.success(rolePermission, "Permission added to role successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.removePermissionFromRole = async (req, res, next) => {
    try {
        const { roleId, permissionId } = req.body;
        const rolePermission = await RolePermission.removePermissionFromRole(roleId, permissionId);
        if (!rolePermission) {
            return ApiResponse.error("Failed to remove permission from role").send(res);
        }
        return ApiResponse.success(rolePermission, "Permission removed from role successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}
