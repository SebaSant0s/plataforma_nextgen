"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const websocket_1 = require("./websocket");
const src_1 = require("./stream-chat/src");
const users_1 = __importDefault(require("./routes/users"));
const channels_1 = __importDefault(require("./routes/channels"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/', users_1.default);
app.use('/', channels_1.default);
app.get('/', (req, res) => {
    res.send('✅ Chat backend is running!');
});
// Test StreamChat connection using your own API
async function testStreamChatConnection() {
    try {
        const apiKey = 'test_api_key';
        const apiSecret = 'test_api_secret';
        const chatClient = src_1.StreamChat.getInstance(apiKey, apiSecret);
        console.log('🔎 Attempting to connect to StreamChat...');
        const chat_member = 'test-member';
        const chat_name = 'test_name';
        const channelId = '1234564';
        const requiredUsers = [
            { id: chat_member, name: chat_name },
            { id: "5491140897287", name: "NextGen AI" }, // Ensure this user is created
            { id: "default-user", name: "System" }
        ];
        try {
            // ✅ Ensure all required users exist in StreamChat
            await chatClient.upsertUsers(requiredUsers);
            console.log("✅ Users ensured in StreamChat:", requiredUsers);
        }
        catch (error) {
            console.error("❌ Error creating users:", error);
        }
        const channel = chatClient.channel("messaging", channelId, {
            name: `${chat_name}`,
            members: requiredUsers.map(user => user.id), // ✅ Use the IDs of the created users
            created_by: { id: chat_member, name: chat_name },
        });
        try {
            // ✅ Send message to StreamChat
            await channel.create();
            console.log("✅ Channel created or already exists!");
        }
        catch (error) {
            console.error("❌ Error in sending creating channel:", error);
        }
        // ✅ Ensure text message is sent even if no attachments
        const messagePayload = {
            id: "abcd",
            text: "Prueba 2", //|| "", // Ensure there's always a text value
            user_id: "11111111",
        };
        try {
            // ✅ Send message to StreamChat
            await channel.sendMessage(messagePayload);
            console.log("✅ Message sent successfully:", messagePayload);
        }
        catch (error) {
            console.error("❌ Error in sending message:", error);
        }
        const token = chatClient.createToken('test-user');
        console.log(token);
        console.log('✅ Successfully connected to StreamChat using the API.');
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('❌ Error connecting to StreamChat:', error.message);
        }
        else {
            console.error('❌ An unknown error occurred:', error);
        }
    }
}
// Run the test on startup
testStreamChatConnection();
// Create raw HTTP server
const server = http_1.default.createServer(app);
// Attach WebSocket server to HTTP server
(0, websocket_1.initWebSocket)(server);
// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server + WebSocket running at http://localhost:${PORT}`);
});
