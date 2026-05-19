"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db"));
const JWT_SECRET = process.env.JWT_SECRET || "secret";
// ==========================
// GENERAR TOKEN
// ==========================
function signToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        role: user.role
    }, JWT_SECRET, { expiresIn: "7d" });
}
// ==========================
// MIDDLEWARE AUTH
// ==========================
async function authMiddleware(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header) {
            return res.status(401).json({ error: "No token" });
        }
        const token = header.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await db_1.default.user.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        req.user = user;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
