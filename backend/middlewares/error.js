const ApiResponse = require("../utils/apiResponse");

// Helper function to convert PostgreSQL errors to user-friendly messages
const handleDatabaseError = (err) => {
    // Handle PostgreSQL constraint violations
    if (err.code === '23505') { // Unique constraint violation
        if (err.constraint) {
            switch (err.constraint) {
                case 'users_telegram_id_key':
                    return ApiResponse.badRequest("Пользователь с таким именем пользователя уже существует | Bunday foydalanuvchi nomi bilan foydalanuvchi allaqachon mavjud");
                case 'users_name_key':
                    return ApiResponse.badRequest("Пользователь с таким именем уже существует | Bunday ismli foydalanuvchi allaqachon mavjud");
                case 'groups_name_key':
                    return ApiResponse.badRequest("Группа с таким названием уже существует | Bunday nomli guruh allaqachon mavjud");
                default:
                    return ApiResponse.badRequest("Запись с такими данными уже существует | Bunday ma'lumotlar allaqachon mavjud");
            }
        }
        return ApiResponse.badRequest("Данные уже существуют в системе | Ma'lumotlar allaqachon tizimda mavjud");
    }
    
    // Handle foreign key constraint violations
    if (err.code === '23503') {
        return ApiResponse.badRequest("Связанная запись не найдена или была удалена | Bog'langan yozuv topilmadi yoki o'chirilgan");
    }
    
    // Handle not null constraint violations
    if (err.code === '23502') {
        return ApiResponse.badRequest("Обязательное поле не заполнено | Majburiy maydon to'ldirilmagan");
    }
    
    // Handle check constraint violations
    if (err.code === '23514') {
        return ApiResponse.badRequest("Данные не соответствуют требованиям | Ma'lumotlar talablarga mos kelmaydi");
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
    return ApiResponse.error("Произошла внутренняя ошибка сервера").send(res);
}