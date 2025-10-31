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
        "SELECT * FROM documents WHERE uploader_id = $1 ORDER BY upload_at DESC LIMIT $2 OFFSET $3",
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
    const { title, groupId, uploaderId, filePath, uploaderName, uploaderTelegramId, groupName, uploadAt } = data;
    const { rows } = await pool.query(
        "INSERT INTO documents (title, group_id, uploader_id, file_path, uploader_name, uploader_tg_id, group_name, upload_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [title, groupId, uploaderId, filePath, uploaderName, uploaderTelegramId, groupName, uploadAt || new Date()]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    const { title, uploaderId, filePath, uploadAt } = data;
    let query = "UPDATE documents SET title = $1, uploader_id = $2, file_path = $3";
    const params = [title, uploaderId, filePath];
    
    if (uploadAt) {
        query += `, upload_at = $4 WHERE id = $5`;
        params.push(uploadAt, id);
    } else {
        query += ` WHERE id = $4`;
        params.push(id);
    }
    
    const { rows } = await pool.query(query, params);
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
        query += ` AND EXTRACT(YEAR FROM d.upload_at) = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
    }

    if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM d.upload_at) = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
    }

    if (filters.date) {
        query += ` AND DATE(d.upload_at) = $${paramCount}`;
        values.push(filters.date);
        paramCount++;
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND DATE(d.upload_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
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

    query += ` ORDER BY d.upload_at DESC`;

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
        query += ` AND EXTRACT(YEAR FROM d.upload_at) = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
    }

    if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM d.upload_at) = $${paramCount}`;
        values.push(filters.month);
        paramCount++;
    }

    if (filters.date) {
        query += ` AND DATE(d.upload_at) = $${paramCount}`;
        values.push(filters.date);
        paramCount++;
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND DATE(d.upload_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
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
    try {
        // Get all groups the user belongs to (including parent groups)
        const userGroupsQuery = `
            SELECT id FROM groups WHERE id IN (
                SELECT group_id FROM user_groups WHERE user_id = $1
            )
        `;
        const userGroupsResult = await require("../config/db").query(userGroupsQuery, [userId]);
        const userGroupIds = userGroupsResult.rows.map(row => row.id);

        if (userGroupIds.length === 0) {
            return [];
        }

        // Get all child groups recursively
        const childGroupsQuery = `
            WITH RECURSIVE group_tree AS (
                SELECT id FROM groups WHERE id = ANY($1)
                
                UNION ALL
                
                SELECT g.id FROM groups g
                INNER JOIN group_tree gt ON g.parent_id = gt.id
            )
            SELECT id FROM group_tree
        `;
        const childGroupsResult = await require("../config/db").query(childGroupsQuery, [userGroupIds]);
        const allGroupIds = childGroupsResult.rows.map(row => row.id);

        // Build the main query
        let query = `
            SELECT d.* FROM documents d
            WHERE d.group_id = ANY($1)
        `;
        const params = [allGroupIds];
        let paramIndex = 2;

        if (filters.year) {
            query += ` AND EXTRACT(YEAR FROM d.upload_at) = $${paramIndex}`;
            params.push(filters.year);
            paramIndex++;
        }

        if (filters.month) {
            query += ` AND EXTRACT(MONTH FROM d.upload_at) = $${paramIndex}`;
            params.push(filters.month);
            paramIndex++;
        }

        if (filters.date) {
            query += ` AND DATE(d.upload_at) = $${paramIndex}`;
            params.push(filters.date);
            paramIndex++;
        }

        if (filters.startDate && filters.endDate) {
            query += ` AND DATE(d.upload_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(filters.startDate, filters.endDate);
            paramIndex += 2;
        }

        if (filters.groupId) {
            query += ` AND d.group_id = $${paramIndex}`;
            params.push(filters.groupId);
            paramIndex++;
        }

        if (filters.title) {
            query += ` AND d.title ILIKE $${paramIndex}`;
            params.push(`%${filters.title}%`);
            paramIndex++;
        }

        query += ` ORDER BY d.upload_at DESC`;

        if (filters.limit && filters.offset !== undefined) {
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(filters.limit, filters.offset);
        }

        const result = await pool.query(query, params);
        return result.rows || [];
    } catch (error) {
        throw error;
    }
}

exports.countUserDocumentsWithFilters = async (userId, filters) => {
    try {
            // Get all groups the user belongs to
        const userGroupsQuery = `
            SELECT id FROM groups WHERE id IN (
                SELECT group_id FROM user_groups WHERE user_id = $1
            )
        `;
        const userGroupsResult = await require("../config/db").query(userGroupsQuery, [userId]);
        const userGroupIds = userGroupsResult.rows.map(row => row.id);

        if (userGroupIds.length === 0) {
            return 0;
        }

        // Get all child groups recursively
        const childGroupsQuery = `
            WITH RECURSIVE group_tree AS (
                SELECT id FROM groups WHERE id = ANY($1)
                
                UNION ALL
                
                SELECT g.id FROM groups g
                INNER JOIN group_tree gt ON g.parent_id = gt.id
            )
            SELECT id FROM group_tree
        `;
        const childGroupsResult = await require("../config/db").query(childGroupsQuery, [userGroupIds]);
        const allGroupIds = childGroupsResult.rows.map(row => row.id);

        let query = `SELECT COUNT(*) FROM documents WHERE group_id = ANY($1)`;
        const params = [allGroupIds];
        let paramIndex = 2;

        if (filters.year) {
            query += ` AND EXTRACT(YEAR FROM upload_at) = $${paramIndex}`;
            params.push(filters.year);
            paramIndex++;
        }

        if (filters.month) {
            query += ` AND EXTRACT(MONTH FROM upload_at) = $${paramIndex}`;
            params.push(filters.month);
            paramIndex++;
        }

        if (filters.date) {
            query += ` AND DATE(upload_at) = $${paramIndex}`;
            params.push(filters.date);
            paramIndex++;
        }

        if (filters.startDate && filters.endDate) {
            query += ` AND DATE(upload_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(filters.startDate, filters.endDate);
            paramIndex += 2;
        }

        if (filters.groupId) {
            query += ` AND group_id = $${paramIndex}`;
            params.push(filters.groupId);
            paramIndex++;
        }

        if (filters.title) {
            query += ` AND title ILIKE $${paramIndex}`;
            params.push(`%${filters.title}%`);
            paramIndex++;
        }
        const { rows } = await pool.query(query, params);
        return parseInt(rows[0]?.total) || 0;
    } catch (error) {
        throw error;
    }
}

exports.getUserFilterOptions = async (userId) => {
    const pool = require("../config/db");

    const { rows: years } = await pool.query(`
        SELECT DISTINCT EXTRACT(YEAR FROM upload_at) as year
        FROM documents
        WHERE uploader_id = $1
        ORDER BY year DESC
    `, [userId]);

    const { rows: months } = await pool.query(`
        SELECT DISTINCT EXTRACT(MONTH FROM upload_at) as month
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

