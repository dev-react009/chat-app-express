import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import cors from 'cors';
import http from 'http';  
import { Server } from "socket.io";
import userRouter from "./routes/userRoutes";
import chatRouter from "./routes/chatRoutes";
import { connectToDatabase } from "./services/dbConnection";
import { log,error } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 9200;

app.use(cors());
app.use(express.json());
connectToDatabase();

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, welcome to Express server");
});

app.get("/api", (req: Request, res: Response) => {
    res.json({ status: true, statusCode: 201, message: "success" });
});


app.use("/api/auth", userRouter);
app.use("/api/chat", chatRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).send('Internal Server Error');
}); 

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "https://chat-app-react-coral.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {

    socket.on("reconnect", (attemptNumber) => {
        log(`Reconnected after ${attemptNumber} attempts: ${socket.id}`);
    });

    socket.on("reconnect_error", (error) => {
        error("Reconnection error:", error);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
        log(`Reconnection attempt #${attemptNumber}`);
    });

    socket.on("joinRoom", async ({ chatId }) => {
        log("chatID RECEIVED", chatId);
        try {
            if (!chatId) {
                throw new Error("Chat ID is required to join a room");
            }
            socket.join(chatId);
            log(`User joined chat room: ${chatId}`);
        } catch (error: any) {
            error("Error joining chat room:", error);
            socket.emit("error", error.message);
        }
    });

    socket.on("sendMessage", async ({ chatRoomId, senderId, content, receiver }) => {
    
        try {
            if (!chatRoomId || !senderId || !content || !receiver) {
                throw new Error("All message fields are required");
            }
            const newMessage = {chatRoomId, senderId, content, receiver};
            io.to(chatRoomId).emit('newMessage', newMessage);
             io.to(receiver).emit("newMessage", newMessage);
        } catch (error: any) {
            error("Error sending message:", error);
            socket.emit("error", error.message);
        }
    });

    socket.on("typing", ({ chatRoomId, userId }) => {
        if (chatRoomId && userId) {
            socket.to(chatRoomId).emit("typing", userId);
        } else {
            error("ChatRoom ID and User ID are required for typing event");
        }
    });

    socket.on("disconnect", () => {
        log("User disconnected", socket.id);
    });
});

server.listen(PORT, () => {
    log(`Server is running on http://localhost:${PORT}`);
});


// export default (req: Request, res: Response) => {
//     server.emit("request", req, res);
// };


