import { Router } from "express";
import {
  chats,
  create_FindChat,
  getChatsWithFriend,
  getRecentChatsHistory,
  sendMessage,
} from "../controllers/chatController";
import authMiddleware from "../middlewares/auth/authMiddleware";


const chatRouter = Router();

chatRouter.get("/chats",authMiddleware, chats);
chatRouter.post("/createChatRoom", authMiddleware,create_FindChat);
chatRouter.post('/:chatId/message',authMiddleware,sendMessage);
chatRouter.get(
  "/getChatsWithFriend/:friendId",
  authMiddleware,
  getChatsWithFriend
);
chatRouter.get("/getRecentChatsHistory", authMiddleware, getRecentChatsHistory);


export default chatRouter;
