const Groups = require("../models/Groups");
const ApiResponse = require("../utils/apiResponse");

exports.getAllGroups = async (req, res, next) => {
    try {
        const groups = await Groups.findAll();

        if (!groups) {
            return ApiResponse.badRequest("Groups not found").send(res);
        }

        return ApiResponse.success(groups, "Groups fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.getGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return ApiResponse.badRequest("Group ID is required").send(res);
        }

        const group = await Groups.findOne(groupId);
        
        if (!group) {
            return ApiResponse.badRequest("Group not found").send(res);
        }

        return ApiResponse.success(group, "Group fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}


exports.getGroupByParentId = async (req, res, next) => {
    try {
        let { parentId } = req.params;

        if (!parentId) {
            return ApiResponse.badRequest("Parent ID is required").send(res);
        }

        if (isNaN(parentId)) {
            return ApiResponse.badRequest("Parent ID must be a number").send(res);
        }

        const groups = await Groups.findByParentId(parentId);

        if (!groups) {
            return ApiResponse.badRequest("Groups not found").send(res);
        }

        return ApiResponse.success(groups, "Groups fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.createGroup = async (req, res, next) => {
    try {
        const { name, parentId } = req.body;

        if (!name) {
            return ApiResponse.badRequest("Group name is required").send(res);
        }

        const group = await Groups.create({ name, parentId });
        if (!group) {
            return ApiResponse.error("Failed to create group").send(res);
        }

        return ApiResponse.success(group, "Group created successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.updateGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { name, parentId } = req.body;
        
        if (!name) {
            return ApiResponse.badRequest("Group name is required").send(res);
        }

        const group = await Groups.findByIdAndUpdate(groupId, { name, parentId });
        if (!group) {
            return ApiResponse.badRequest("Group not found").send(res);
        }

        return ApiResponse.success(group, "Group updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}

exports.deleteGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return ApiResponse.badRequest("Group ID is required").send(res);
        }

        const deletedGroup = await Groups.findByIdAndDelete(groupId);
        if (!deletedGroup) {
            return ApiResponse.badRequest("Group not found").send(res);
        }

        return ApiResponse.success(deletedGroup, "Group deleted successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
}
