const pool = require("../config/db");

exports.findOne = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM groups WHERE id = $1",
        [id]
    );
    return rows[0] || null;
}

exports.findAll = async () => {
    const { rows } = await pool.query(
        "SELECT * FROM groups",
    );
    return rows || null;
}


exports.findByParentId = async (parentId) => {
    if (parentId === "0") {
        const { rows } = await pool.query(
            "SELECT * FROM groups WHERE parent_id IS NULL"
        );
        return rows || null;
    } else {
        const { rows } = await pool.query(
            "SELECT * FROM groups WHERE parent_id = $1",
            [parentId]
        );
        return rows || null;
    }
}

exports.create = async ( data ) => {
    const { name, parentId } = data;
    const { rows } = await pool.query(
        "INSERT INTO groups (name, parent_id) VALUES ($1, $2) RETURNING *",
        [name, parentId]
    );
    return rows[0] || null;
}

exports.findByIdAndUpdate = async (id, data) => {
    const { name, parentId } = data;
    const { rows } = await pool.query(
        "UPDATE groups SET name = $1, parent_id = $2 WHERE id = $3 RETURNING *",
        [name, parentId, id]
    );
    return rows[0] || null;
}

exports.findByIdAndDelete = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM groups WHERE id = $1 RETURNING *",
        [id]
    );
    return rows[0] || null;
}