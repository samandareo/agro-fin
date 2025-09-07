const pool = require("../config/db");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM permissions WHERE id = $1",
        [id]
    );
    return rows[0] || null;
}

exports.findAll = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM permissions",
    );
    return rows || null;
}

exports.create = async (data) => {
    const { name, description } = data;
    const { rows } = await pool.query(
        "INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING *",
        [name, description]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    const { name, description } = data;
    const { rows } = await pool.query(
        "UPDATE permissions SET name = $1, description = $2 WHERE id = $3 RETURNING *",
        [name, description, id]
    );
    return rows[0] || null;
}

exports.findByIdAndDelete = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM permissions WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}