const pool = require("../config/db");

exports.findPermissionByRole = async (roleId) => {
    const { rows } = await pool.query(
        `
        SELECT p.id, p.name, p.description
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1;
        `,
        [roleId]
    );
    return rows || null;
}

exports.checkDuplicatePermission = async (roleId, permissionId) => {
    const { rows } = await pool.query(
        "SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2",
        [roleId, permissionId]
    );
    return rows[0] || null;
}

exports.addPermissionToRole = async (roleId, permissionId) => {
    const { rows } = await pool.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) RETURNING *",
        [roleId, permissionId]
    );
    return rows[0] || null;
}

exports.removePermissionFromRole = async (roleId, permissionId) => {
    const { rows } = await pool.query(
        "DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING *",
        [roleId, permissionId]
    );
    return rows[0] || null;
}

