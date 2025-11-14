const pool = require("../config/db");

// Get all tasks assigned to a user
exports.getTasksByUser = async (userId) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status as task_status,
            tu.status as user_status,
            tu.updated_at as status_updated_at,
            u.name as created_by_name
        FROM tasks t
        INNER JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE tu.user_id = $1
        ORDER BY t.created_at DESC
    `, [userId]);
    return rows || [];
};

// Get active tasks for a user (where user's status is NOT 'completed')
exports.getActiveTasksByUser = async (userId, limit = 20, offset = 0) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status as task_status,
            tu.status as user_status,
            tu.updated_at as status_updated_at,
            u.name as created_by_name
        FROM tasks t
        INNER JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE tu.user_id = $1
            AND tu.status != 'completed'
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return rows || [];
};

// Get archived tasks for a user (where user's status is 'completed')
exports.getArchivedTasksByUser = async (userId, limit = 20, offset = 0) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status as task_status,
            tu.status as user_status,
            tu.updated_at as status_updated_at,
            u.name as created_by_name
        FROM tasks t
        INNER JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE tu.user_id = $1 AND tu.status = 'completed'
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return rows || [];
};

// Count active tasks for a user (where user's status is NOT 'completed')
exports.countActiveTasksByUser = async (userId) => {
    const { rows } = await pool.query(`
        SELECT COUNT(*) as total FROM tasks t
        INNER JOIN tasks_users tu ON t.id = tu.task_id
        WHERE tu.user_id = $1
            AND tu.status != 'completed'
    `, [userId]);
    return parseInt(rows[0]?.total) || 0;
};

// Count archived tasks for a user (where user's status is 'completed')
exports.countArchivedTasksByUser = async (userId) => {
    const { rows } = await pool.query(`
        SELECT COUNT(*) as total FROM tasks t
        INNER JOIN tasks_users tu ON t.id = tu.task_id
        WHERE tu.user_id = $1 AND tu.status = 'completed'
    `, [userId]);
    return parseInt(rows[0]?.total) || 0;
};

// Get task detail by ID with assigned users info
exports.getTaskById = async (taskId) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            u.id as created_by_id
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
    `, [taskId]);
    return rows[0] || null;
};

// Get all files attached to a task with uploader information
exports.getTaskFiles = async (taskId) => {
    const { rows } = await pool.query(`
        SELECT
            tf.id,
            tf.task_id,
            tf.file_name,
            tf.file_path,
            tf.file_type,
            tf.uploaded_by,
            tf.uploaded_at,
            u.name as uploader_name,
            u.telegram_id as uploader_telegram_id,
            u.role as uploader_role
        FROM tasks_files tf
        LEFT JOIN users u ON tf.uploaded_by = u.id
        WHERE tf.task_id = $1
        ORDER BY tf.uploaded_at DESC
    `, [taskId]);
    return rows || [];
};

// Get a single file by file ID
exports.getFileById = async (fileId) => {
    const { rows } = await pool.query(`
        SELECT
            id,
            task_id,
            file_name,
            file_path,
            file_type,
            uploaded_by,
            uploaded_at
        FROM tasks_files
        WHERE id = $1
    `, [fileId]);
    return rows[0] || null;
};

// Get assigned users for a task with status info
exports.getTaskAssignedUsers = async (taskId) => {
    const { rows } = await pool.query(`
        SELECT
            tu.id,
            tu.task_id,
            tu.user_id,
            u.name,
            u.telegram_id,
            tu.status,
            tu.updated_at
        FROM tasks_users tu
        LEFT JOIN users u ON tu.user_id = u.id
        WHERE tu.task_id = $1
        ORDER BY u.name
    `, [taskId]);
    return rows || [];
};

// Create a new task
exports.createTask = async (data) => {
    const { title, description, createdBy, deadline } = data;
    const { rows } = await pool.query(`
        INSERT INTO tasks (title, description, created_by, deadline, status, created_at)
        VALUES ($1, $2, $3, $4, 'open', NOW())
        RETURNING *
    `, [title, description, createdBy, deadline || null]);
    return rows[0] || null;
};

// Update task
exports.updateTask = async (taskId, data) => {
    const { title, description, deadline, status } = data;

    // Build dynamic UPDATE statement to only update provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
        updates.push(`title = $${paramCount}`);
        values.push(title);
        paramCount++;
    }

    if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
    }

    if (deadline !== undefined) {
        updates.push(`deadline = $${paramCount}`);
        values.push(deadline || null);
        paramCount++;
    }

    if (status !== undefined) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
    }

    // If no fields to update, return null
    if (updates.length === 0) {
        return null;
    }

    // Add taskId as the last parameter
    values.push(taskId);

    const query = `
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
};

// Delete task (cascades to tasks_users and tasks_files)
exports.deleteTask = async (taskId) => {
    const { rows } = await pool.query(`
        DELETE FROM tasks WHERE id = $1 RETURNING *
    `, [taskId]);
    return rows[0] || null;
};

// Assign user to task
exports.assignUserToTask = async (taskId, userId) => {
    const { rows } = await pool.query(`
        INSERT INTO tasks_users (task_id, user_id, status, updated_at)
        VALUES ($1, $2, 'assigned', NOW())
        ON CONFLICT (task_id, user_id) DO NOTHING
        RETURNING *
    `, [taskId, userId]);
    return rows[0] || null;
};

// Remove user from task
exports.removeUserFromTask = async (taskId, userId) => {
    const { rows } = await pool.query(`
        DELETE FROM tasks_users WHERE task_id = $1 AND user_id = $2
        RETURNING *
    `, [taskId, userId]);
    return rows[0] || null;
};

// Update user task status
exports.updateUserTaskStatus = async (taskId, userId, status) => {
    const { rows } = await pool.query(`
        UPDATE tasks_users
        SET status = $1, updated_at = NOW()
        WHERE task_id = $2 AND user_id = $3
        RETURNING *
    `, [status, taskId, userId]);
    return rows[0] || null;
};

// Get user task assignment (check if user is assigned to task)
exports.getUserTaskAssignment = async (taskId, userId) => {
    const { rows } = await pool.query(`
        SELECT * FROM tasks_users
        WHERE task_id = $1 AND user_id = $2
    `, [taskId, userId]);
    return rows[0] || null;
};

// Add file to task
exports.addTaskFile = async (data) => {
    const { taskId, fileName, filePath, fileType, uploadedBy } = data;
    const { rows } = await pool.query(`
        INSERT INTO tasks_files (task_id, file_name, file_path, file_type, uploaded_by, uploaded_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
    `, [taskId, fileName, filePath, fileType, uploadedBy || null]);
    return rows[0] || null;
};

// Delete file from task
exports.deleteTaskFile = async (fileId) => {
    const { rows } = await pool.query(`
        DELETE FROM tasks_files WHERE id = $1
        RETURNING *
    `, [fileId]);
    return rows[0] || null;
};

// Get files uploaded by a specific admin
exports.getFilesByUploader = async (uploaderId, limit = 20, offset = 0) => {
    const { rows } = await pool.query(`
        SELECT
            tf.id,
            tf.task_id,
            tf.file_name,
            tf.file_path,
            tf.file_type,
            tf.uploaded_by,
            tf.uploaded_at,
            t.title as task_title,
            t.status as task_status,
            u.name as uploader_name
        FROM tasks_files tf
        JOIN tasks t ON tf.task_id = t.id
        LEFT JOIN users u ON tf.uploaded_by = u.id
        WHERE tf.uploaded_by = $1
        ORDER BY tf.uploaded_at DESC
        LIMIT $2 OFFSET $3
    `, [uploaderId, limit, offset]);
    return rows || [];
};

// Count files uploaded by a specific admin
exports.countFilesByUploader = async (uploaderId) => {
    const { rows } = await pool.query(`
        SELECT COUNT(*) as total FROM tasks_files
        WHERE uploaded_by = $1
    `, [uploaderId]);
    return parseInt(rows[0]?.total) || 0;
};

// Get files uploaded by admin for a specific task
exports.getUploaderFilesByTask = async (uploaderId, taskId) => {
    const { rows } = await pool.query(`
        SELECT
            tf.id,
            tf.task_id,
            tf.file_name,
            tf.file_path,
            tf.file_type,
            tf.uploaded_by,
            tf.uploaded_at,
            t.title as task_title,
            u.name as uploader_name
        FROM tasks_files tf
        JOIN tasks t ON tf.task_id = t.id
        LEFT JOIN users u ON tf.uploaded_by = u.id
        WHERE tf.uploaded_by = $1 AND tf.task_id = $2
        ORDER BY tf.uploaded_at DESC
    `, [uploaderId, taskId]);
    return rows || [];
};

// Get all tasks (for admin)
exports.getAllTasks = async (limit, offset) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            u.id as created_by_id,
            COUNT(DISTINCT tu.user_id) as assigned_users_count,
            COUNT(DISTINCT tf.id) as files_count
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN tasks_files tf ON t.id = tf.task_id
        GROUP BY t.id, u.id, u.name
        ORDER BY t.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return rows || [];
};

// Count all tasks
exports.countAllTasks = async () => {
    const { rows } = await pool.query(`
        SELECT COUNT(*) as total FROM tasks
    `);
    return parseInt(rows[0]?.total) || 0;
};

// Get active tasks for admin (tasks where NOT all users have completed)
exports.getActiveTasksAdmin = async (limit, offset) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            u.id as created_by_id,
            COUNT(DISTINCT tu.user_id) as assigned_users_count,
            COUNT(DISTINCT tf.id) as files_count
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN tasks_files tf ON t.id = tf.task_id
        WHERE t.id NOT IN (
            -- Exclude tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
        GROUP BY t.id, u.id, u.name
        ORDER BY t.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return rows || [];
};

// Get archived tasks for admin (tasks where ALL users have completed)
exports.getArchivedTasksAdmin = async (limit, offset) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            u.id as created_by_id,
            COUNT(DISTINCT tu.user_id) as assigned_users_count,
            COUNT(DISTINCT tf.id) as files_count
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN tasks_files tf ON t.id = tf.task_id
        WHERE t.id IN (
            -- Select tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
        GROUP BY t.id, u.id, u.name
        ORDER BY t.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return rows || [];
};

// Count active tasks for admin (tasks where NOT all users have completed)
exports.countActiveTasksAdmin = async () => {
    const { rows } = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM tasks t
        WHERE t.id NOT IN (
            -- Exclude tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
    `);
    return parseInt(rows[0]?.total) || 0;
};

// Count archived tasks for admin (tasks where ALL users have completed)
exports.countArchivedTasksAdmin = async () => {
    const { rows } = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM tasks t
        WHERE t.id IN (
            -- Select tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
    `);
    return parseInt(rows[0]?.total) || 0;
};

// Get active tasks for director (tasks created by director, excluding archived)
exports.getActiveTasksDirector = async (createdById, limit, offset) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            u.id as created_by_id,
            COUNT(DISTINCT tu.user_id) as assigned_users_count,
            COUNT(DISTINCT tf.id) as files_count
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN tasks_files tf ON t.id = tf.task_id
        WHERE t.created_by = $1
        AND t.id NOT IN (
            -- Exclude tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
        GROUP BY t.id, u.id, u.name
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
    `, [createdById, limit, offset]);
    return rows || [];
};

// Get archived tasks for director (tasks created by director, where all users completed)
exports.getArchivedTasksDirector = async (createdById, limit, offset) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            u.id as created_by_id,
            COUNT(DISTINCT tu.user_id) as assigned_users_count,
            COUNT(DISTINCT tf.id) as files_count
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN tasks_users tu ON t.id = tu.task_id
        LEFT JOIN tasks_files tf ON t.id = tf.task_id
        WHERE t.created_by = $1
        AND t.id IN (
            -- Select tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
        GROUP BY t.id, u.id, u.name
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
    `, [createdById, limit, offset]);
    return rows || [];
};

// Count active tasks for director (tasks created by director)
exports.countActiveTasksDirector = async (createdById) => {
    const { rows } = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM tasks t
        WHERE t.created_by = $1
        AND t.id NOT IN (
            -- Exclude tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
    `, [createdById]);
    return parseInt(rows[0]?.total) || 0;
};

// Count archived tasks for director (tasks created by director, all users completed)
exports.countArchivedTasksDirector = async (createdById) => {
    const { rows } = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM tasks t
        WHERE t.created_by = $1
        AND t.id IN (
            -- Select tasks where ALL users have completed
            SELECT t2.id
            FROM tasks t2
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks_users tu2
                WHERE tu2.task_id = t2.id
                AND tu2.status != 'completed'
            )
            AND EXISTS (
                SELECT 1 FROM tasks_users tu3
                WHERE tu3.task_id = t2.id
            )
        )
    `, [createdById]);
    return parseInt(rows[0]?.total) || 0;
};

// Get task with all details including users
exports.getTaskWithDetails = async (taskId) => {
    const task = await exports.getTaskById(taskId);
    if (!task) return null;

    const assignedUsers = await exports.getTaskAssignedUsers(taskId);
    const files = await exports.getTaskFiles(taskId);

    return {
        ...task,
        assignedUsers,
        files
    };
};

// Get task details for a user (includes user's assignment status)
exports.getTaskWithDetailsForUser = async (taskId, userId) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status as task_status,
            tu.status as user_status,
            tu.updated_at as status_updated_at,
            u.name as created_by_name,
            u.id as created_by_id
        FROM tasks t
        LEFT JOIN tasks_users tu ON t.id = tu.task_id AND tu.user_id = $2
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
    `, [taskId, userId]);

    if (!rows || rows.length === 0) return null;

    const task = rows[0];
    const assignedUsers = await exports.getTaskAssignedUsers(taskId);
    const files = await exports.getTaskFiles(taskId);

    return {
        ...task,
        assignedUsers,
        files
    };
};

// Get tasks by status
exports.getTasksByStatus = async (status, limit, offset) => {
    const { rows } = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.description,
            t.deadline,
            t.created_at,
            t.status,
            u.name as created_by_name,
            COUNT(tu.id) as assigned_users_count
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN tasks_users tu ON t.id = tu.task_id
        WHERE t.status = $1
        GROUP BY t.id, u.name
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
    `, [status, limit, offset]);
    return rows || [];
};
