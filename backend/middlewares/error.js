const ApiResponse = require("../utils/apiResponse");

// Helper function to convert PostgreSQL errors to user-friendly messages
const handleDatabaseError = (err) => {
    // Handle PostgreSQL constraint violations
    if (err.code === '23505') { // Unique constraint violation
        if (err.constraint) {
            switch (err.constraint) {
                case 'users_telegram_id_key':
                    return ApiResponse.badRequest("USERNAME_ALREADY_EXISTS");
                case 'users_name_key':
                    return ApiResponse.badRequest("USER_NAME_ALREADY_EXISTS");
                case 'groups_name_key':
                    return ApiResponse.badRequest("GROUP_NAME_ALREADY_EXISTS");
                default:
                    return ApiResponse.badRequest("DUPLICATE_ENTRY");
            }
        }
        return ApiResponse.badRequest("DUPLICATE_ENTRY");
    }
    
    // Handle foreign key constraint violations
    if (err.code === '23503') {
        return ApiResponse.badRequest("RELATED_RECORD_NOT_FOUND");
    }
    
    // Handle not null constraint violations
    if (err.code === '23502') {
        return ApiResponse.badRequest("REQUIRED_FIELD_MISSING");
    }
    
    // Handle check constraint violations
    if (err.code === '23514') {
        return ApiResponse.badRequest("DATA_VALIDATION_FAILED");
    }
    
    return null; // Not a database constraint error
};

module.exports = (err, req, res, next) => {
    console.error(err.stack);

    // Handle PostgreSQL database errors first
    const dbError = handleDatabaseError(err);
    if (dbError) {
        return dbError.send(res);
    }

    if (err.name === "ValidationError") {
        return ApiResponse.badRequest(err.message).send(res);
    }

    if (err.name === "UnauthorizedError") {
        return ApiResponse.unauthorized(err.message).send(res);
    }

    if (err.name === "NotFoundError") {
        return ApiResponse.notFound(err.message).send(res);
    }

    // Generic server error
    return ApiResponse.error("INTERNAL_SERVER_ERROR").send(res);
}