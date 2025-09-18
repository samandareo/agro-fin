const pool = require("../config/db");

exports.create = async (data) => {
    const { title, message, senderId, senderName } = data;
    const { rows } = await pool.query(
        "INSERT INTO notifications (title, message, sender_id, sender_name) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, message, senderId, senderName]
    );
    return rows[0] || null;
}

exports.findAll = async (filters = {}) => {
    let query = `
        SELECT n.*, 
               COUNT(un.id) as total_recipients,
               COUNT(CASE WHEN un.is_read = true THEN 1 END) as read_count
        FROM notifications n
        LEFT JOIN user_notifications un ON n.id = un.notification_id
        WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.senderId) {
        query += ` AND n.sender_id = $${paramCount}`;
        values.push(filters.senderId);
        paramCount++;
    }

    if (filters.title) {
        query += ` AND LOWER(n.title) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.title}%`);
        paramCount++;
    }

    if (filters.message) {
        query += ` AND LOWER(n.message) LIKE LOWER($${paramCount})`;
        values.push(`%${filters.message}%`);
        paramCount++;
    }

    query += ` GROUP BY n.id ORDER BY n.created_at DESC`;

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

exports.findById = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM notifications WHERE id = $1",
        [id]
    );
    return rows[0] || null;
}

exports.deleteById = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM notifications WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}

exports.sendToAllUsers = async (notificationId) => {
    // Get all active users
    const { rows: users } = await pool.query(
        "SELECT id FROM users WHERE status = true AND role = 'user'"
    );

    if (users.length === 0) {
        return [];
    }

    // Create user_notifications entries for all users
    const values = users.map((user, index) => 
        `($${index * 2 + 1}, $${index * 2 + 2})`
    ).join(', ');

    const params = users.flatMap(user => [notificationId, user.id]);

    const { rows } = await pool.query(
        `INSERT INTO user_notifications (notification_id, user_id) VALUES ${values} RETURNING *`,
        params
    );

    return rows || [];
}

exports.getUserNotifications = async (userId, filters = {}) => {
    let query = `
        SELECT n.*, 
               un.is_read,
               un.read_at,
               un.created_at as received_at
        FROM notifications n
        INNER JOIN user_notifications un ON n.id = un.notification_id
        WHERE un.user_id = $1
    `;
    
    const values = [userId];
    let paramCount = 2;

    if (filters.isRead !== undefined) {
        query += ` AND un.is_read = $${paramCount}`;
        values.push(filters.isRead);
        paramCount++;
    }

    query += ` ORDER BY un.created_at DESC`;

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

exports.getUnreadCount = async (userId) => {
    const { rows } = await pool.query(
        "SELECT COUNT(*) as count FROM user_notifications WHERE user_id = $1 AND is_read = false",
        [userId]
    );
    return parseInt(rows[0]?.count) || 0;
}

exports.markAsRead = async (notificationId, userId) => {
    const { rows } = await pool.query(
        "UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE notification_id = $1 AND user_id = $2 RETURNING *",
        [notificationId, userId]
    );
    return rows[0] || null;
}

exports.markAllAsRead = async (userId) => {
    const { rows } = await pool.query(
        "UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false RETURNING *",
        [userId]
    );
    return rows || [];
}
