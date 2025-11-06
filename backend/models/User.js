const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND status = TRUE AND role = 'user'",
        [id]
    );

    return rows[0] || null;
}

exports.findById = async (id) => {
    // Find any user by ID regardless of role
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
    );

    return rows[0] || null;
}

exports.findAll = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE status = TRUE AND role = 'user'",
    );
    return rows || null;
}

exports.findByIdAndDelete = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    console.log(`[DEBUG] findByIdAndUpdate called with userId: ${id}`);
    console.log(`[DEBUG] Update data:`, JSON.stringify(data));
    
    const { name, telegramId, password, groupId, groupIds, roleId } = data;
    let status = data.status;

    console.log(`[DEBUG] Parsed values - name: ${name}, telegramId: ${telegramId}, groupId: ${groupId}, groupIds:`, groupIds, `roleId: ${roleId}, status: ${status}`);

    const role = await pool.query(
        "SELECT * FROM roles WHERE id = $1",
        [Number(roleId)]
    );

    if (!role.rows[0]) {
        console.error(`[ERROR] Invalid role ID: ${roleId}`);
        throw new Error("Invalid role ID");
    }
    
    let rows;
    if (password && password !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`[DEBUG] Password provided, creating hash`);

        const result = await pool.query(
            "UPDATE users SET name = $1, telegram_id = $2, password = $3, status = $4, role = $5, role_id = $6 WHERE id = $7 RETURNING *",
            [name, telegramId, hashedPassword, status, role.rows[0].name, Number(roleId), id]
        );
        rows = result.rows;
    } else {
        console.log(`[DEBUG] No password provided, skipping password update`);
        const result = await pool.query(
            "UPDATE users SET name = $1, telegram_id = $2, status = $3, role = $4, role_id = $5 WHERE id = $6 RETURNING *",
            [name, telegramId, status, role.rows[0].name, Number(roleId), id]
        );
        rows = result.rows;
    }

    if (!rows || rows.length === 0) {
        console.error(`[ERROR] User update returned no rows for userId: ${id}`);
        throw new Error("Failed to update user");
    }

    console.log(`[DEBUG] User record updated:`, rows[0]);

    // Handle group assignment only if provided
    const groupsToAssign = groupIds && groupIds.length > 0 ? groupIds : (groupId ? [groupId] : null);
    
    console.log(`[DEBUG] Groups to assign:`, groupsToAssign);
    
    if (groupsToAssign && groupsToAssign.length > 0) {
        try {
            console.log(`[DEBUG] Calling assignMultipleGroups for userId: ${id} with groups:`, groupsToAssign);
            await exports.assignMultipleGroups(id, groupsToAssign);
            console.log(`[DEBUG] Group assignment successful for userId: ${id}`);
        } catch (groupError) {
            console.error(`[ERROR] Failed to assign groups for userId: ${id}`, groupError);
            throw groupError;
        }
    } else {
        console.log(`[DEBUG] No groups to assign for userId: ${id}`);
    }

    return rows[0] || null;
}

exports.findByTelegramId = async (telegramId) => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE telegram_id = $1 AND status = TRUE",
        [telegramId]
    );
    return rows[0] || null;
}

exports.create = async (data) => {
    const { name, telegramId, password, status, roleId } = data;

    const { rows: roleRows } = await pool.query(
        "SELECT * FROM roles WHERE id = $1",
        [Number(roleId)]
    );
    const role = roleRows[0].name;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Creating user with role: ${role}, roleId: ${roleId}, name: ${name}, telegramId: ${telegramId}, status: ${status}`);
    console.log(` Types - role: ${typeof role}, roleId: ${typeof roleId}, name: ${typeof name}, telegramId: ${typeof telegramId}, status: ${typeof status}`);
    const { rows } = await pool.query(
        "INSERT INTO users (name, telegram_id, password, status, role, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name, telegramId, hashedPassword, status, role, Number(roleId)]
    );
    return rows[0] || null;
}

exports.assignMultipleGroups = async (userId, groupIds) => {
    try {
        console.log(`[DEBUG] assignMultipleGroups called - userId: ${userId}, incoming groupIds:`, groupIds);
        
        // Filter out null, undefined, and empty values
        const validGroupIds = groupIds
            .filter(id => id !== null && id !== undefined && id !== '')
            .map(id => Number(id))
            .filter(id => !isNaN(id));
        
        console.log(`[DEBUG] After validation - validGroupIds:`, validGroupIds);
        console.log(`[DEBUG] validGroupIds length: ${validGroupIds.length}`);
        
        if (validGroupIds.length === 0) {
            console.log(`[DEBUG] No valid groups provided, deleting existing assignments for userId: ${userId}`);
            // If no valid groups, just delete existing assignments
            await pool.query("DELETE FROM user_groups WHERE user_id = $1", [userId]);
            console.log(`[DEBUG] Deleted existing group assignments for userId: ${userId}`);
            return [];
        }
        
        // Delete existing group assignments for this user
        console.log(`[DEBUG] Deleting existing group assignments for userId: ${userId}`);
        const deleteResult = await pool.query("DELETE FROM user_groups WHERE user_id = $1", [userId]);
        console.log(`[DEBUG] Deleted ${deleteResult.rowCount} existing assignments`);
        
        // Insert new group assignments
        const values = validGroupIds.map((groupId, index) => `($1, $${index + 2})`).join(',');
        const queryParams = [userId, ...validGroupIds];
        
        const query = `
            INSERT INTO user_groups (user_id, group_id)
            VALUES ${values}
            RETURNING *
        `;
        
        console.log(`[DEBUG] Executing insert query with params:`, queryParams);
        console.log(`[DEBUG] Full query:`, query);
        
        const { rows } = await pool.query(query, queryParams);
        console.log(`[DEBUG] Successfully inserted ${rows.length} group assignments:`, rows);
        return rows;
    } catch (error) {
        console.error(`[ERROR] Error assigning multiple groups:`, error.message);
        console.error(`[ERROR] Full error:`, error);
        console.error(`[ERROR] Error stack:`, error.stack);
        throw error;
    }
};

// Keep existing assignToGroup for backward compatibility
exports.assignToGroup = async (userId, groupId) => {
    return exports.assignMultipleGroups(userId, [groupId]);
};

exports.getUserGroups = async (userId) => {
    try {
        const { rows } = await pool.query(
            `SELECT g.id, g.name, g.parent_id FROM groups g
             INNER JOIN user_groups ug ON g.id = ug.group_id
             WHERE ug.user_id = $1
             ORDER BY g.name`,
            [userId]
        );
        return rows;
    } catch (error) {
        console.error("Error getting user groups:", error);
        return null;
    }
};

exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

exports.searchUsers = async (filters) => {
    let query = `
        SELECT u.*
        FROM users u
        WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.name || filters.telegramId) {
        query += ` AND (`;
        const conditions = [];
        
        if (filters.name) {
            conditions.push(`LOWER(u.name) LIKE LOWER($${paramCount})`);
            values.push(`%${filters.name}%`);
            paramCount++;
        }
        
        if (filters.telegramId) {
            conditions.push(`LOWER(u.telegram_id) LIKE LOWER($${paramCount})`);
            values.push(`%${filters.telegramId}%`);
            paramCount++;
        }
        
        query += conditions.join(' OR ') + ')';
    }

    if (filters.groupId) {
        query += ` AND u.id IN (SELECT user_id FROM user_groups WHERE group_id = $${paramCount})`;
        values.push(filters.groupId);
        paramCount++;
    }

    if (filters.status !== undefined) {
        query += ` AND u.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    query += ` ORDER BY u.name ASC`;

    if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;
    }

    if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(filters.offset);
        paramCount++;
    }

    const { rows } = await pool.query(query, values);
    
    // Fetch groups for each user
    for (let user of rows) {
        const groupRows = await pool.query(
            `SELECT g.id, g.name FROM groups g
             INNER JOIN user_groups ug ON g.id = ug.group_id
             WHERE ug.user_id = $1`,
            [user.id]
        );
        user.groups = groupRows.rows;
        // For backward compatibility, add first group info
        user.group_name = groupRows.rows[0]?.name || null;
        user.group_id = groupRows.rows[0]?.id || null;
    }
    
    return rows || [];
}

exports.countUsersWithFilters = async (filters) => {
    let query = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_groups ug ON u.id = ug.user_id
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.name || filters.telegramId) {
        query += ` AND (`;
        const conditions = [];
        
        if (filters.name) {
            conditions.push(`LOWER(u.name) LIKE LOWER($${paramCount})`);
            values.push(`%${filters.name}%`);
            paramCount++;
        }
        
        if (filters.telegramId) {
            conditions.push(`LOWER(u.telegram_id) LIKE LOWER($${paramCount})`);
            values.push(`%${filters.telegramId}%`);
            paramCount++;
        }
        
        query += conditions.join(' OR ') + ')';
    }

    if (filters.groupId) {
        query += ` AND ug.group_id = $${paramCount}`;
        values.push(filters.groupId);
        paramCount++;
    }

    if (filters.status !== undefined) {
        query += ` AND u.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0]?.total) || 0;
}