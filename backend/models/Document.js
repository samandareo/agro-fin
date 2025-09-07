const pool = require("../config/db");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM documents WHERE id = $1",
        [id]
    );
    return rows[0] || null;
}

exports.findAll = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM documents",
    );
    return rows || null;
}

exports.findAllByGroupId = async (groupId) => {
    const { rows } = await pool.query(
        "SELECT * FROM documents WHERE group_id = $1",
        [groupId]
    );
    return rows || null;
}

exports.findAllByUploaderId = async (uploaderId) => {
    const { rows } = await pool.query(
        "SELECT * FROM documents WHERE uploader_id = $1",
        [uploaderId]
    );
    return rows || null;
}

exports.findByUploaderIdWithPagination = async (uploaderId, limit, offset) => {
    const { rows } = await pool.query(
        "SELECT * FROM documents WHERE uploader_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [uploaderId, limit, offset]
    );
    return rows || [];
}

exports.countByUploaderId = async (uploaderId) => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) as total FROM documents WHERE uploader_id = $1",
        [uploaderId]
    );
    return parseInt(rows[0].total) || 0;
}

exports.findAllByGroupAndUploaderId = async (uploaderId) => {
    const { rows: groupRows } = await pool.query(
        "SELECT group_id FROM user_groups WHERE user_id = $1",
        [uploaderId]
    );

    const groupId = groupRows[0].group_id;
    const { rows } = await pool.query(
        "SELECT * FROM documents WHERE group_id = $1 AND uploader_id = $2",
        [groupId, uploaderId]
    );
    return rows || null;
}

exports.create = async (data) => {
    const { title, groupId, uploaderId, filePath, uploaderName, uploaderTelegramId, groupName } = data;
    const { rows } = await pool.query(
        "INSERT INTO documents (title, group_id, uploader_id, file_path, uploader_name, uploader_tg_id, group_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [title, groupId, uploaderId, filePath, uploaderName, uploaderTelegramId, groupName]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    const { title, uploaderId, filePath } = data;
    const { rows } = await pool.query(
        "UPDATE documents SET title = $1, uploader_id = $2, file_path = $3 WHERE id = $4 RETURNING *",
        [title, uploaderId, filePath, id]
    );
    return rows[0] || null;
}

exports.findByIdAndDelete = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM documents WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}

exports.findWithFilters = async (filters) => {
    let query = `
        SELECT d.*, 
               g.name as group_name,
               u.name as uploader_name,
               u.telegram_id as uploader_telegram_id
        FROM documents d
        LEFT JOIN groups g ON d.group_id = g.id
        LEFT JOIN users u ON d.uploader_id = u.id
        WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.year) {
        query += ` AND EXTRACT(YEAR FROM d.created_at) = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
    }

    if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM d.created_at) = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
    }

    if (filters.date) {
        query += ` AND DATE(d.created_at) = $${paramCount}`;
        values.push(filters.date);
        paramCount++;
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND DATE(d.created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
        values.push(filters.startDate, filters.endDate);
        paramCount += 2;
    }

    if (filters.groupId) {
        query += ` AND d.group_id = $${paramCount}`;
        values.push(filters.groupId);
        paramCount++;
    }

    if (filters.uploaderId) {
        query += ` AND d.uploader_id = $${paramCount}`;
        values.push(filters.uploaderId);
        paramCount++;
    }

    if (filters.title && filters.uploaderName) {
        query += ` AND (LOWER(d.title) LIKE LOWER($${paramCount}) OR LOWER(u.name) LIKE LOWER($${paramCount + 1}))`;
        values.push(`%${filters.title}%`, `%${filters.uploaderName}%`);
        paramCount += 2;
    } else if (filters.title) {
        query += ` AND LOWER(d.title) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.title}%`);
        paramCount++;
    } else if (filters.uploaderName) {
        query += ` AND LOWER(u.name) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.uploaderName}%`);
        paramCount++;
    }

    query += ` ORDER BY d.created_at DESC`;

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

exports.getNestedGroups = async (parentId) => {
    const { rows } = await pool.query(`
        WITH RECURSIVE nested_groups AS (
            SELECT id, name, parent_id, 0 as level
            FROM groups 
            WHERE parent_id = $1
            
            UNION ALL
            
            SELECT g.id, g.name, g.parent_id, ng.level + 1
            FROM groups g
            INNER JOIN nested_groups ng ON g.parent_id = ng.id
        )
        SELECT id, name, level FROM nested_groups
        ORDER BY level, name
    `, [parentId]);
    
    return rows || [];
}

exports.countWithFilters = async (filters) => {
    let query = `
        SELECT COUNT(*) as total
        FROM documents d
        LEFT JOIN groups g ON d.group_id = g.id
        LEFT JOIN users u ON d.uploader_id = u.id
        WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.year) {
        query += ` AND EXTRACT(YEAR FROM d.created_at) = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
    }

    if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM d.created_at) = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
    }

    if (filters.date) {
        query += ` AND DATE(d.created_at) = $${paramCount}`;
        values.push(filters.date);
        paramCount++;
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND DATE(d.created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
        values.push(filters.startDate, filters.endDate);
        paramCount += 2;
    }

    if (filters.groupId) {
        query += ` AND d.group_id = $${paramCount}`;
        values.push(filters.groupId);
        paramCount++;
    }

    if (filters.uploaderId) {
        query += ` AND d.uploader_id = $${paramCount}`;
        values.push(filters.uploaderId);
        paramCount++;
    }

    if (filters.title && filters.uploaderName) {
        query += ` AND (LOWER(d.title) LIKE LOWER($${paramCount}) OR LOWER(u.name) LIKE LOWER($${paramCount + 1}))`;
        values.push(`%${filters.title}%`, `%${filters.uploaderName}%`);
        paramCount += 2;
    } else if (filters.title) {
        query += ` AND LOWER(d.title) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.title}%`);
        paramCount++;
    } else if (filters.uploaderName) {
        query += ` AND LOWER(u.name) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.uploaderName}%`);
        paramCount++;
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0]?.total) || 0;
}

exports.findUserDocumentsWithFilters = async (userId, filters) => {
    let query = `
        SELECT d.*, 
               g.name as group_name
        FROM documents d
        LEFT JOIN groups g ON d.group_id = g.id
        WHERE d.uploader_id = $1
    `;
    
    const values = [userId];
    let paramCount = 2;

    if (filters.year) {
        query += ` AND EXTRACT(YEAR FROM d.created_at) = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
    }

    if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM d.created_at) = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
    }

    if (filters.date) {
        query += ` AND DATE(d.created_at) = $${paramCount}`;
        values.push(filters.date);
        paramCount++;
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND DATE(d.created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
        values.push(filters.startDate, filters.endDate);
        paramCount += 2;
    }

    if (filters.groupId) {
        query += ` AND d.group_id = $${paramCount}`;
        values.push(filters.groupId);
        paramCount++;
    }

    if (filters.title) {
        query += ` AND LOWER(d.title) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.title}%`);
        paramCount++;
    }

    query += ` ORDER BY d.created_at DESC`;

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

exports.countUserDocumentsWithFilters = async (userId, filters) => {
    let query = `
        SELECT COUNT(*) as total
        FROM documents d
        LEFT JOIN groups g ON d.group_id = g.id
        WHERE d.uploader_id = $1
    `;
    
    const values = [userId];
    let paramCount = 2;

    if (filters.year) {
        query += ` AND EXTRACT(YEAR FROM d.created_at) = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
    }

    if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM d.created_at) = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
    }

    if (filters.date) {
        query += ` AND DATE(d.created_at) = $${paramCount}`;
        values.push(filters.date);
        paramCount++;
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND DATE(d.created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
        values.push(filters.startDate, filters.endDate);
        paramCount += 2;
    }

    if (filters.groupId) {
        query += ` AND d.group_id = $${paramCount}`;
        values.push(filters.groupId);
        paramCount++;
    }

    if (filters.title) {
        query += ` AND LOWER(d.title) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.title}%`);
        paramCount++;
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0]?.total) || 0;
}

exports.getUserFilterOptions = async (userId) => {
    const pool = require("../config/db");

    const { rows: years } = await pool.query(`
        SELECT DISTINCT EXTRACT(YEAR FROM created_at) as year
        FROM documents
        WHERE uploader_id = $1
        ORDER BY year DESC
    `, [userId]);

    const { rows: months } = await pool.query(`
        SELECT DISTINCT EXTRACT(MONTH FROM created_at) as month
        FROM documents
        WHERE uploader_id = $1
        ORDER BY month
    `, [userId]);

    const { rows: groups } = await pool.query(`
        SELECT DISTINCT g.id, g.name, g.parent_id
        FROM groups g
        INNER JOIN documents d ON g.id = d.group_id
        WHERE d.uploader_id = $1
        ORDER BY g.name
    `, [userId]);

    return {
        years: years.map(row => row.year),
        months: months.map(row => row.month),
        groups
    };
}
