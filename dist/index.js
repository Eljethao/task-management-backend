"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT ?? 5000;
// Ensure DB is connected on every serverless invocation
app_1.default.use(async (_req, _res, next) => {
    try {
        await (0, database_1.connectDB)();
        next();
    }
    catch (err) {
        next(err);
    }
});
// Local / traditional server — not used by Vercel
if (!process.env.VERCEL) {
    (0, database_1.connectDB)()
        .then(() => {
        app_1.default.listen(PORT, () => {
            console.info(`Server running on port ${PORT} in ${process.env.NODE_ENV ?? 'development'} mode`);
        });
    })
        .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
// Vercel serverless export
exports.default = app_1.default;
//# sourceMappingURL=index.js.map