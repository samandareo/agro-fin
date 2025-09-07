const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND status = TRUE AND role = 'user'",
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
    const { name, telegramId, password, groupId } = data;
    let status = data.status;

    let rows;
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);

        rows = await pool.query(
            "UPDATE users SET name = $1, telegram_id = $2, password = $3, status = $4 WHERE id = $5 RETURNING *",
            [name, telegramId, hashedPassword, status, id]
        );
    } else {
        rows = await pool.query(
            "UPDATE users SET name = $1, telegram_id = $2, status = $3 WHERE id = $4 RETURNING *",
            [name, telegramId, status, id]
        );
    }

    const { rows: userGroupRows } = await pool.query(
        "UPDATE user_groups SET group_id = $1 WHERE user_id = $2 RETURNING *",
        [groupId, id]
    );

    return { ...rows[0], ...userGroupRows[0] } || null;
}

exports.findByTelegramId = async (telegramId) => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE telegram_id = $1 AND status = TRUE AND role = 'user'",
        [telegramId]
    );
    return rows[0] || null;
}

exports.create = async (data) => {
    const { name, telegramId, password, status, role } = data;

    const { rows: roleRows } = await pool.query(
        "SELECT * FROM roles WHERE name = $1",
        [role]
    );
    const roleId = roleRows[0].id;

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
        "INSERT INTO users (name, telegram_id, password, status, role, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name, telegramId, hashedPassword, status, role, roleId]
    );
    return rows[0] || null;
}

exports.assignToGroup = async (userId, groupId) => {
    const { rows } = await pool.query(
        "INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) RETURNING *",
        [userId, groupId]
    );
    return rows[0] || null;
}

exports.findUserGroup = async (userId) => {
    const { rows } = await pool.query(
        "SELECT g.* FROM user_groups ug JOIN groups g ON ug.group_id = g.id WHERE ug.user_id = $1",
        [userId]
    );
    return rows[0] || null;
}

exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

exports.searchUsers = async (filters) => {
    let query = `
        SELECT u.*, 
               g.name as group_name,
               g.id as group_id
        FROM users u
        LEFT JOIN user_groups ug ON u.id = ug.user_id
        LEFT JOIN groups g ON ug.group_id = g.id
        WHERE u.role = 'user'
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
    return rows || [];
}

exports.countUsersWithFilters = async (filters) => {
    let query = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_groups ug ON u.id = ug.user_id
        WHERE u.role = 'user'
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