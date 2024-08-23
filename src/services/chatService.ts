import Message from "../models/message.js";
import Chat from "../models/chat.js"


export const joinChatRoom = async (chatRoomId: string) => {
  const chatRoom = await Chat.findById(chatRoomId);
  if (!chatRoom) throw new Error("Chat room not found");
  return chatRoom;
};


export const sendMessageToChat = async (
  chatRoomId: string,
  senderId: string,
  content: string,
  receiver:string
) => {
  const chatRoom = await Chat.findById(chatRoomId);
  if (!chatRoom) throw new Error("Chat room not found");

  const newMessage = new Message({
    sender: senderId,
    content,
    receiver,
    timestamp: new Date(),
  });

  await newMessage.save();
  chatRoom.messages.push(newMessage);
  await chatRoom.save();
  return newMessage;
};
