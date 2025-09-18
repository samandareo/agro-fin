const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middlewares/error");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Routes
app.use("/api/v1/admins", require("./routes/adminRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/groups", require("./routes/groupRoutes"));
app.use("/api/v1/documents", require("./routes/documentRoutes"));
app.use("/api/v1/roles", require("./routes/roleRoutes"));
app.use("/api/v1/permissions", require("./routes/permissionRoute"));
app.use("/api/v1/role-permissions", require("./routes/rolePermissionRoutes"));
app.use("/api/v1/delete-requests", require("./routes/deleteRequestRoutes"));
app.use("/api/v1/notifications", require("./routes/notificationRoutes"));

app.use(errorHandler);

module.exports = app;