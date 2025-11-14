const Task = require("../models/Task");
const ApiResponse = require("../utils/apiResponse");
const { deleteFile } = require("../utils/fileUtils");
const path = require("path");

// GET: Get all tasks assigned to the current user (DEPRECATED - use getMyActiveTasks)
exports.getMyTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const tasks = await Task.getTasksByUser(userId);

        if (!tasks) {
            return ApiResponse.badRequest("Tasks not found").send(res);
        }

        return ApiResponse.success(tasks, "Tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get active (non-completed/non-closed) tasks assigned to the current user with pagination
exports.getMyActiveTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getActiveTasksByUser(userId, limitNum, offset);
        const totalCount = await Task.countActiveTasksByUser(userId);
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Active tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get archived (completed) tasks assigned to the current user with pagination
exports.getMyArchivedTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getArchivedTasksByUser(userId, limitNum, offset);
        const totalCount = await Task.countArchivedTasksByUser(userId);
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Archived tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get task details by ID
exports.getTaskDetail = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        console.log('=== Getting task detail ===');
        console.log('taskId:', taskId, 'type:', typeof taskId);
        console.log('userId:', userId, 'type:', typeof userId);

        if (!taskId) {
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        // Verify user is assigned to this task
        const taskUsers = await Task.getTaskAssignedUsers(taskId);
        console.log('Task users:', taskUsers);
        console.log('Checking assignment for userId:', userId);

        const isAssigned = taskUsers.some(u => {
            console.log('Comparing u.user_id:', u.user_id, 'type:', typeof u.user_id, 'with userId:', userId);
            return u.user_id === userId || parseInt(u.user_id) === parseInt(userId);
        });

        console.log('isAssigned:', isAssigned);
        console.log('user.role:', req.user.role);

        if (!isAssigned && req.user.role !== 'admin') {
            return ApiResponse.forbidden("You are not assigned to this task").send(res);
        }

        // Use the user-specific task details query that includes user_status
        const task = await Task.getTaskWithDetailsForUser(taskId, userId);

        if (!task) {
            return ApiResponse.badRequest("Task not found").send(res);
        }

        console.log('Task details retrieved successfully:', { id: task.id, title: task.title, user_status: task.user_status });

        return ApiResponse.success(task, "Task fetched successfully").send(res);
    } catch (error) {
        console.error('Error in getTaskDetail:', error);
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get task details by ID (admin only)
exports.getTaskDetailAdmin = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        console.log('=== Getting task details for taskId:', taskId, '===');

        if (!taskId) {
            console.error('Task ID is missing');
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        console.log('Fetching task with details...');
        const task = await Task.getTaskWithDetails(taskId);
        console.log('Task fetched:', task);

        if (!task) {
            console.error('Task not found:', taskId);
            return ApiResponse.badRequest("Task not found").send(res);
        }

        console.log('Returning task details successfully');
        return ApiResponse.success(task, "Task fetched successfully").send(res);
    } catch (error) {
        console.error("Error fetching task details:", error);
        console.error("Error stack:", error.stack);
        return ApiResponse.error(error.message).send(res);
    }
};

// PUT: Update user task status
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        console.log('=== Updating Task Status ===');
        console.log('taskId:', taskId, 'type:', typeof taskId);
        console.log('userId:', userId, 'type:', typeof userId);
        console.log('status:', status);

        if (!taskId || !status) {
            return ApiResponse.badRequest("Task ID and status are required").send(res);
        }

        // Users can only change their status to 'in_progress' or 'completed'
        const userAllowedStatuses = ['in_progress', 'completed'];
        if (!userAllowedStatuses.includes(status)) {
            return ApiResponse.badRequest("Users can only change status to 'in_progress' or 'completed'").send(res);
        }

        // Verify user is assigned to this task
        const taskUsers = await Task.getTaskAssignedUsers(taskId);
        console.log('Task users found:', taskUsers.length);
        console.log('Task users:', taskUsers);

        const isAssigned = taskUsers.some(u => {
            const matches = u.user_id === userId || parseInt(u.user_id) === parseInt(userId);
            console.log(`Comparing user_id: ${u.user_id} (type: ${typeof u.user_id}) with userId: ${userId} - matches: ${matches}`);
            return matches;
        });

        console.log('isAssigned:', isAssigned);

        if (!isAssigned) {
            console.error('User not assigned to task');
            return ApiResponse.forbidden("You are not assigned to this task").send(res);
        }

        // Allow users to update their status even if task is closed
        // (Users should be able to mark their work as completed even if task is closed)
        const task = await Task.getTaskById(taskId);
        console.log('Task status:', task?.status);

        const updatedStatus = await Task.updateUserTaskStatus(taskId, userId, status);

        if (!updatedStatus) {
            return ApiResponse.badRequest("Failed to update task status").send(res);
        }

        console.log('Task status updated successfully for user:', userId, 'new status:', status);

        return ApiResponse.success(updatedStatus, "Task status updated successfully").send(res);
    } catch (error) {
        console.error('Error updating task status:', error);
        return ApiResponse.error(error.message).send(res);
    }
};

// ==================== ADMIN ENDPOINTS ====================

// GET: Get all tasks (admin only)
exports.getAllTasks = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getAllTasks(limitNum, offset);
        const totalCount = await Task.countAllTasks();
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get active tasks (admin) - tasks where NOT all users have completed
exports.getActiveTasksAdmin = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getActiveTasksAdmin(limitNum, offset);
        const totalCount = await Task.countActiveTasksAdmin();
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Active tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get archived tasks (admin) - tasks where ALL users have completed
exports.getArchivedTasksAdmin = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getArchivedTasksAdmin(limitNum, offset);
        const totalCount = await Task.countArchivedTasksAdmin();
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Archived tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// ==================== DIRECTOR ENDPOINTS ====================

// GET: Get active tasks (director) - tasks created by this director where NOT all users have completed
exports.getActiveTasksDirector = async (req, res, next) => {
    try {
        const createdById = req.admin.id;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getActiveTasksDirector(createdById, limitNum, offset);
        const totalCount = await Task.countActiveTasksDirector(createdById);
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Active tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get archived tasks (director) - tasks created by this director where ALL users have completed
exports.getArchivedTasksDirector = async (req, res, next) => {
    try {
        const createdById = req.admin.id;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        const tasks = await Task.getArchivedTasksDirector(createdById, limitNum, offset);
        const totalCount = await Task.countArchivedTasksDirector(createdById);
        const totalPages = Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Archived tasks fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// POST: Create a new task (admin only)
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, deadline, assignedUserIds } = req.body;
        const adminId = req.admin.id;

        console.log('=== Creating Task ===');
        console.log('Title:', title);
        console.log('Description:', description);
        console.log('Deadline received:', deadline);
        console.log('Deadline type:', typeof deadline);
        console.log('Assigned user IDs:', assignedUserIds);

        if (!title) {
            return ApiResponse.badRequest("Title is required").send(res);
        }

        if (!adminId) {
            return ApiResponse.badRequest("User ID is required").send(res);
        }

        // Create task
        const taskData = {
            title,
            description: description || null,
            createdBy: adminId,
            deadline: deadline || null
        };

        console.log('Task data to insert:', taskData);
        const newTask = await Task.createTask(taskData);
        console.log('Task created:', newTask);

        if (!newTask || !newTask.id) {
            console.error("Task creation returned invalid data:", newTask);
            return ApiResponse.badRequest("Failed to create task - database error").send(res);
        }

        // Assign users to task
        const assignedUsers = [];
        if (assignedUserIds && Array.isArray(assignedUserIds)) {
            for (const userId of assignedUserIds) {
                try {
                    const assignment = await Task.assignUserToTask(newTask.id, userId);
                    if (assignment) {
                        assignedUsers.push(assignment);
                    }
                } catch (assignError) {
                    console.error(`Failed to assign user ${userId} to task:`, assignError);
                }
            }
        }

        const taskDetails = await Task.getTaskWithDetails(newTask.id);

        return ApiResponse.success(
            { id: newTask.id, ...taskDetails },
            "Task created successfully"
        ).send(res);
    } catch (error) {
        console.error("Error creating task:", error);
        return ApiResponse.error(error.message).send(res);
    }
};

// PUT: Update task (admin only)
exports.updateTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { title, description, deadline, status } = req.body;

        if (!taskId) {
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        const task = await Task.getTaskById(taskId);
        if (!task) {
            return ApiResponse.badRequest("Task not found").send(res);
        }

        const updateData = {
            title: title !== undefined ? title : task.title,
            description: description !== undefined ? description : task.description,
            deadline: deadline !== undefined ? deadline : task.deadline,
            status: status !== undefined ? status : task.status
        };

        const updatedTask = await Task.updateTask(taskId, updateData);

        const taskDetails = await Task.getTaskWithDetails(updatedTask.id);

        return ApiResponse.success(taskDetails, "Task updated successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// DELETE: Delete task (admin only)
exports.deleteTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        // Get files to delete from filesystem
        const files = await Task.getTaskFiles(taskId);

        // Delete files from filesystem
        for (const file of files) {
            deleteFile(file.file_path);
        }

        const deletedTask = await Task.deleteTask(taskId);

        if (!deletedTask) {
            return ApiResponse.badRequest("Task not found").send(res);
        }

        return ApiResponse.success(deletedTask, "Task deleted successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// POST: Assign user to task (admin only)
exports.assignUserToTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;

        if (!taskId || !userId) {
            return ApiResponse.badRequest("Task ID and User ID are required").send(res);
        }

        const task = await Task.getTaskById(taskId);
        if (!task) {
            return ApiResponse.badRequest("Task not found").send(res);
        }

        const assignment = await Task.assignUserToTask(taskId, userId);

        const taskDetails = await Task.getTaskWithDetails(taskId);

        return ApiResponse.success(taskDetails, "User assigned to task successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// DELETE: Remove user from task (admin only)
exports.removeUserFromTask = async (req, res, next) => {
    try {
        const { taskId, userId } = req.params;

        if (!taskId || !userId) {
            return ApiResponse.badRequest("Task ID and User ID are required").send(res);
        }

        const task = await Task.getTaskById(taskId);
        if (!task) {
            return ApiResponse.badRequest("Task not found").send(res);
        }

        const removed = await Task.removeUserFromTask(taskId, userId);

        if (!removed) {
            return ApiResponse.badRequest("User not assigned to this task").send(res);
        }

        const taskDetails = await Task.getTaskWithDetails(taskId);

        return ApiResponse.success(taskDetails, "User removed from task successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// POST: Upload file to task (admin only)
exports.uploadTaskFile = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        console.log('=== File Upload Request ===');
        console.log('Task ID:', taskId);
        console.log('Request headers:', req.headers);
        console.log('Request file object:', req.file);
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        if (!taskId) {
            console.error('Task ID is missing');
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        if (!req.file) {
            console.error('No file found in request');
            console.error('Available request properties:');
            console.error('- req.file:', req.file);
            console.error('- req.files:', req.files);
            console.error('- req.body:', req.body);
            return ApiResponse.badRequest("No file provided").send(res);
        }

        console.log('File received:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        const task = await Task.getTaskById(taskId);
        if (!task) {
            deleteFile(req.file.path);
            return ApiResponse.badRequest("Task not found").send(res);
        }

        const fileData = {
            taskId,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            uploadedBy: req.admin?.id || req.user?.id
        };

        const file = await Task.addTaskFile(fileData);

        if (!file) {
            deleteFile(req.file.path);
            return ApiResponse.badRequest("Failed to upload file").send(res);
        }

        const taskDetails = await Task.getTaskWithDetails(taskId);

        return ApiResponse.success(taskDetails, "File uploaded successfully").send(res);
    } catch (error) {
        console.error('File upload error:', error);
        // Clean up uploaded file if there's an error
        if (req.file) {
            deleteFile(req.file.path);
        }
        return ApiResponse.error(error.message).send(res);
    }
};

// POST: Upload file to task (user)
exports.uploadTaskFileUser = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        console.log('=== User File Upload Request ===');
        console.log('Task ID:', taskId);
        console.log('User ID:', req.user?.id);
        console.log('Request file object:', req.file);

        if (!taskId) {
            console.error('Task ID is missing');
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        if (!req.file) {
            console.error('No file found in request');
            return ApiResponse.badRequest("No file provided").send(res);
        }

        // Check if task exists
        const task = await Task.getTaskById(taskId);
        if (!task) {
            deleteFile(req.file.path);
            return ApiResponse.badRequest("Task not found").send(res);
        }

        // Check if user is assigned to this task
        const userAssignment = await Task.getUserTaskAssignment(taskId, req.user.id);
        if (!userAssignment) {
            deleteFile(req.file.path);
            return ApiResponse.forbidden("You are not assigned to this task").send(res);
        }

        console.log('File received:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        const fileData = {
            taskId,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            uploadedBy: req.user.id
        };

        const file = await Task.addTaskFile(fileData);

        if (!file) {
            deleteFile(req.file.path);
            return ApiResponse.badRequest("Failed to upload file").send(res);
        }

        const taskDetails = await Task.getTaskWithDetailsForUser(taskId, req.user.id);

        return ApiResponse.success(taskDetails, "File uploaded successfully").send(res);
    } catch (error) {
        console.error('User file upload error:', error);
        // Clean up uploaded file if there's an error
        if (req.file) {
            deleteFile(req.file.path);
        }
        return ApiResponse.error(error.message).send(res);
    }
};

// DELETE: Delete file from task (user - own files only)
exports.deleteTaskFileUser = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        console.log('=== User File Delete Request ===');
        console.log('File ID:', fileId);
        console.log('User ID:', userId);

        if (!fileId) {
            return ApiResponse.badRequest("FILE_ID_REQUIRED").send(res);
        }

        // Get file info before deleting
        const file = await Task.getFileById(fileId);

        if (!file) {
            return ApiResponse.badRequest("FILE_NOT_FOUND").send(res);
        }

        console.log('File found:', {
            id: file.id,
            fileName: file.file_name,
            uploadedBy: file.uploaded_by,
            taskId: file.task_id
        });

        // Check if user owns this file
        if (file.uploaded_by !== userId && parseInt(file.uploaded_by) !== parseInt(userId)) {
            console.error('User does not own this file:', { fileUploadedBy: file.uploaded_by, userId });
            return ApiResponse.forbidden("FILE_ACCESS_DENIED").send(res);
        }

        // Check if user is assigned to this task
        const userAssignment = await Task.getUserTaskAssignment(file.task_id, userId);
        if (!userAssignment) {
            return ApiResponse.forbidden("TASK_ACCESS_DENIED").send(res);
        }

        console.log('Authorization passed, deleting file:', file.file_name);

        // Delete from filesystem
        deleteFile(file.file_path);

        const deleted = await Task.deleteTaskFile(fileId);

        if (!deleted) {
            return ApiResponse.badRequest("FILE_DELETION_FAILED").send(res);
        }

        console.log('File deleted successfully by user:', file.file_name);
        
        // Return updated task details
        const taskDetails = await Task.getTaskWithDetailsForUser(file.task_id, userId);
        
        return ApiResponse.success(taskDetails, "FILE_DELETED_SUCCESS").send(res);
    } catch (error) {
        console.error('Error deleting user file:', error);
        return ApiResponse.error(error.message).send(res);
    }
};

// DELETE: Delete file from task (admin only)
exports.deleteTaskFile = async (req, res, next) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return ApiResponse.badRequest("File ID is required").send(res);
        }

        // Get file info before deleting
        const file = await Task.getFileById(fileId);

        if (!file) {
            return ApiResponse.badRequest("File not found").send(res);
        }

        console.log('Deleting file:', file.file_name, 'Path:', file.file_path);

        // Delete from filesystem
        deleteFile(file.file_path);

        const deleted = await Task.deleteTaskFile(fileId);

        if (!deleted) {
            return ApiResponse.badRequest("Failed to delete file").send(res);
        }

        console.log('File deleted successfully:', file.file_name);
        return ApiResponse.success(deleted, "File deleted successfully").send(res);
    } catch (error) {
        console.error('Error deleting file:', error);
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Download file from task (admin and user)
exports.downloadTaskFile = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const userId = req.user?.id || req.admin?.id;

        console.log('=== Download File Request ===');
        console.log('File ID:', fileId);
        console.log('User ID:', userId);
        console.log('Is Admin:', req.admin !== undefined);

        if (!fileId) {
            console.error('File ID is missing');
            return ApiResponse.badRequest("File ID is required").send(res);
        }

        // Get file info from database
        console.log('Querying database for file with ID:', fileId);
        const file = await Task.getFileById(fileId);
        console.log('Query result:', file);

        if (!file) {
            console.error('File not found in database for ID:', fileId);
            return ApiResponse.badRequest("File not found in database").send(res);
        }

        console.log('File found:', {
            id: file.id,
            fileName: file.file_name,
            filePath: file.file_path,
            taskId: file.task_id,
            uploadedAt: file.uploaded_at
        });

        // Verify user has access to this file (is assigned to the task)
        const taskId = file.task_id;
        const taskUsers = await Task.getTaskAssignedUsers(taskId);
        console.log('Task users:', taskUsers);

        const isAssigned = taskUsers.some(u =>
            u.user_id === userId || parseInt(u.user_id) === parseInt(userId)
        );
        const isAdmin = req.admin !== undefined;

        console.log('Access check:', { isAssigned, isAdmin, userId, userIdType: typeof userId });

        // if (!isAssigned && !isAdmin) {
        //     console.error('Access denied for user:', userId);
        //     return ApiResponse.forbidden("You don't have access to this file").send(res);
        // }

        // Check if file exists on disk
        const fs = require('fs');
        const path = require('path');

        console.log('Checking if file exists on disk...');
        console.log('File path:', file.file_path);
        console.log('File exists:', fs.existsSync(file.file_path));

        // Get absolute path for verification
        const absolutePath = path.resolve(file.file_path);
        console.log('Absolute path:', absolutePath);
        console.log('Absolute path exists:', fs.existsSync(absolutePath));

        if (!fs.existsSync(file.file_path)) {
            console.error('File not found on disk');
            console.error('Looking for file at:', file.file_path);

            // Try to list directory contents
            const uploadDir = path.join(__dirname, '..', 'agro-reports');
            console.error('Upload directory:', uploadDir);
            if (fs.existsSync(uploadDir)) {
                const files = fs.readdirSync(uploadDir);
                console.error('Files in upload directory:', files.slice(0, 10)); // Show first 10
            }

            return ApiResponse.badRequest("File not found on server").send(res);
        }

        console.log('File exists, sending download...');

        // Send file to client
        res.download(file.file_path, file.file_name, (err) => {
            if (err) {
                console.error('Error during download:', err);
                if (!res.headersSent) {
                    return ApiResponse.error('Error downloading file').send(res);
                }
            } else {
                console.log('File downloaded successfully:', file.file_name);
            }
        });
    } catch (error) {
        console.error('File download error:', error);
        console.error('Error stack:', error.stack);
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get assigned users for a task (admin only)
exports.getTaskUsers = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return ApiResponse.badRequest("Task ID is required").send(res);
        }

        const task = await Task.getTaskById(taskId);
        if (!task) {
            return ApiResponse.badRequest("Task not found").send(res);
        }

        const assignedUsers = await Task.getTaskAssignedUsers(taskId);

        return ApiResponse.success(assignedUsers, "Task users fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};

// GET: Get files uploaded by the current admin (admin only)
exports.getMyUploadedFiles = async (req, res, next) => {
    try {
        const adminId = req.admin.id;
        const { page = 1, limit = 20, taskId } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return ApiResponse.badRequest("Invalid page number").send(res);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return ApiResponse.badRequest("Invalid limit (1-100)").send(res);
        }

        const offset = (pageNum - 1) * limitNum;

        let files;
        let totalCount;

        if (taskId) {
            // Get files for specific task uploaded by admin
            files = await Task.getUploaderFilesByTask(adminId, taskId);
            totalCount = files.length;
        } else {
            // Get all files uploaded by admin
            files = await Task.getFilesByUploader(adminId, limitNum, offset);
            totalCount = await Task.countFilesByUploader(adminId);
        }

        const totalPages = taskId ? 1 : Math.ceil(totalCount / limitNum);

        return ApiResponse.success({
            files,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }, "Files fetched successfully").send(res);
    } catch (error) {
        return ApiResponse.error(error.message).send(res);
    }
};