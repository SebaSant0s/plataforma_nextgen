"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidApiKey = isValidApiKey;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function isValidApiKey(key) {
    const result = await prisma.chat_api_keys.findUnique({
        where: { api_key: key },
    });
    return !!result;
}
