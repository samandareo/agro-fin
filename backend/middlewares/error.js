const ApiResponse = require("../utils/apiResponse");

module.exports = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === "ValidationError") {
        return ApiResponse.badRequest(err.message).send(res);
    }

    if (err.name === "UnauthorizedError") {
        return ApiResponse.unauthorized(err.message).send(res);
    }

    if (err.name === "NotFoundError") {
        return ApiResponse.notFound(err.message).send(res);
    }

    return ApiResponse.error(err.message).send(res);
}