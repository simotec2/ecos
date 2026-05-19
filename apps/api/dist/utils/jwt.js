"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = void 0;
exports.signToken = signToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "secret";
/* =========================
GENERAR TOKEN (NUEVO)
========================= */
function signToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        role: user.role
    }, JWT_SECRET, { expiresIn: "7d" });
}
/* =========================
COMPATIBILIDAD HACIA ATRÁS
(NO ROMPE NADA)
========================= */
// 🔥 Alias para código antiguo
exports.signAccessToken = signToken;
/* =========================
VERIFICAR TOKEN
========================= */
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
