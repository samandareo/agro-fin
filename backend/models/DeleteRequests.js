const pool = require("../config/db");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM delete_requests WHERE id = $1",
        [id]
    );
    return rows[0] || null;
}

exports.findAll = async (filters = {}) => {
    let query = `
        SELECT dr.*, 
               d.title as document_title,
               d.file_path,
               u.name as requester_name,
               u.telegram_id as requester_telegram_id
        FROM delete_requests dr
        LEFT JOIN documents d ON dr.document_id = d.id
        LEFT JOIN users u ON dr.requester_id = u.id
        WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.status) {
        query += ` AND dr.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    query += ` ORDER BY dr.created_at DESC`;

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

exports.create = async (data) => {
    const { documentId, requesterId, status } = data;
    const { rows } = await pool.query(
        "INSERT INTO delete_requests (document_id, requester_id, status) VALUES ($1, $2, $3) RETURNING *",
        [documentId, requesterId, status]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    const { status } = data;
    const { rows } = await pool.query(
        "UPDATE delete_requests SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
    );
    return rows[0] || null;
}

exports.findByIdAndDelete = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM delete_requests WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}

exports.findAllByStatus = async (status) => {
    const { rows } = await pool.query(
        "SELECT * FROM delete_requests WHERE status = $1",
        [status]
    );
    return rows || null;
}

exports.findUserDeleteRequests = async (userId) => {
    const { rows } = await pool.query(`
        SELECT dr.*, 
               d.title as document_title,
               d.file_path,
               d.created_at as document_created_at,
               g.name as group_name
        FROM delete_requests dr
        LEFT JOIN documents d ON dr.document_id = d.id
        LEFT JOIN groups g ON d.group_id = g.id
        WHERE dr.requester_id = $1
        ORDER BY dr.created_at DESC
    `, [userId]);
    return rows || [];
}

exports.countUserDeleteRequests = async (userId) => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) as total FROM delete_requests WHERE requester_id = $1",
        [userId]
    );
    return parseInt(rows[0]?.total) || 0;
}

exports.countWithFilters = async (filters = {}) => {
    let query = `
        SELECT COUNT(*) as total
        FROM delete_requests dr
        LEFT JOIN documents d ON dr.document_id = d.id
        LEFT JOIN users u ON dr.requester_id = u.id
        WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.status) {
        query += ` AND dr.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0]?.total) || 0;
}

exports.countByStatus = async (status) => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) as total FROM delete_requests WHERE status = $1",
        [status]
    );
    return parseInt(rows[0]?.total) || 0;
}