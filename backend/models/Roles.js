const pool = require("../config/db");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM roles WHERE id = $1",
        [id]
    );
    return rows[0] || null;
}

exports.findAll = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM roles",
    );
    return rows || null;
}

exports.create = async (data) => {
    const { name } = data;
    const { rows } = await pool.query(
        "INSERT INTO roles (name) VALUES ($1) RETURNING *",
        [name]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    const { name } = data;
    const { rows } = await pool.query(
        "UPDATE roles SET name = $1 WHERE id = $2 RETURNING *",
        [name, id]
    );
    return rows[0] || null;
}

exports.findByIdAndDelete = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM roles WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}