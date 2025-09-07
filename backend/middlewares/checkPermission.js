const pool = require("../config/db");
const ApiResponse = require("../utils/apiResponse");

function checkPermission(permission) {
  return async (req, res, next) => {
    try {
      let userId;
      if (req.user) {
        userId = req.user.id;
      } else if (req.admin) {
        userId = req.admin.id;
      } else {
        return ApiResponse.forbidden("You don't have permission to access this resource").send(res);
      }

      const query = `
        SELECT p.name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE u.id = $1
      `;

      const { rows } = await pool.query(query, [userId]);
      const userPermissions = rows.map(row => row.name);

      console.log(userPermissions);
      console.log(permission);
      if (!userPermissions.includes(permission)) {
        return ApiResponse.forbidden("You don't have permission to access this resource").send(res);
      }

      next();
    } catch (error) {
      console.error(error);
      return ApiResponse.error(error.message).send(res);
    }
  };
}

module.exports = checkPermission;
