const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND status = TRUE",
        [id]
    );
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

exports.findByIdAndUpdate = async (id, data) => {
    const { name, telegramId, password } = data;

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            "UPDATE users SET name = $1, telegram_id = $2, password = $3 WHERE id = $4 RETURNING *",
            [name, telegramId, hashedPassword, id]
        );
        return rows[0] || null;
    } else {
        const { rows } = await pool.query(
            "UPDATE users SET name = $1, telegram_id = $2 WHERE id = $3 RETURNING *",
            [name, telegramId, id]
        );
        return rows[0] || null;
    }
}

exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}