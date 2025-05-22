"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/users.ts
const express_1 = __importDefault(require("express"));
const apiKeyServices_1 = require("../services/apiKeyServices");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// In-memory store (for demo purposes)
const users = {};
/**
 * POST /users
 * Body: { users: { [userId]: { id, name } } }
 */
router.post('/users', async (req, res) => {
    const apiKey = req.query.api_key;
    const authHeader = req.headers.authorization;
    console.log(apiKey);
    console.log(authHeader);
    if (!apiKey || !(await (0, apiKeyServices_1.isValidApiKey)(apiKey))) {
        res.status(403).json({ error: 'Invalid API key' });
        return;
    }
    if (!authHeader || !authHeader.startsWith('Bearer ') && !authHeader.startsWith('ey')) {
        res.status(401).json({ error: 'Missing or invalid Authorization token' });
        return;
    }
    const { users: newUsers } = req.body;
    if (!newUsers || typeof newUsers !== 'object') {
        res.status(400).json({ error: 'Missing or invalid "users" object in request body' });
        return;
    }
    Object.entries(newUsers).forEach(async ([id, user]) => {
        if (!user.id || !user.name) {
            res.status(400).json({ error: `User ${id} must have 'id' and 'name'` });
            return;
        }
        // Store in memory (optional)
        users[id] = {
            id: user.id,
            name: user.name,
        };
        // Store in DB
        await prisma.chat_users.upsert({
            where: { id: user.id },
            update: {
                name: user.name,
                language: user.language || '',
                role: user.role || '',
                teams: user.teams || [],
                updated_at: new Date(user.updated_at || new Date()),
                banned: user.banned ?? false,
                online: user.online ?? false,
                last_active: user.last_active ? new Date(user.last_active) : null,
                blocked_user_ids: user.blocked_user_ids || [],
                shadow_banned: user.shadow_banned ?? false,
                invisible: user.invisible ?? false,
            },
            create: {
                id: user.id,
                name: user.name,
                language: user.language || '',
                role: user.role || '',
                teams: user.teams || [],
                created_at: new Date(user.created_at || new Date()),
                updated_at: new Date(user.updated_at || new Date()),
                banned: user.banned ?? false,
                online: user.online ?? false,
                last_active: user.last_active ? new Date(user.last_active) : null,
                blocked_user_ids: user.blocked_user_ids || [],
                shadow_banned: user.shadow_banned ?? false,
                invisible: user.invisible ?? false,
            },
        });
    });
    res.status(200).json({ users });
    return;
});
exports.default = router;
