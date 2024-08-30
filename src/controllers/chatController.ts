import { Request,Response } from "express";
import user from "../models/user";
import Chat from "../models/chat";
import Message from "../models/message";
import {io} from "../index"
import mongoose from "mongoose";
import { log,error } from "../utils/logger";


export const chats = async (req: Request, res: Response) => {
  res.status(200).json({
    status: true,
    statusCode: 200,
    chats: "chats",
  });
};

export const create_FindChat = async (req:Request,res:Response)=>{
  try{
    const { friendId } = req.body;
    const userId = req.userId;

    if (!friendId) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "friendId is required",
      });
    }
    if (userId === friendId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        error: "Cannot create a chat with yourself",
      });
    }

    const friendExists = await user.findById(friendId);
    if (!friendExists) {
      return res
        .status(404)
        .json({ status: false, statusCode: 404, error: "Friend not found" });
    }

 let chatRoom = await Chat.findOne({
   participants: { $all: [userId, friendId] },
 });

 if (chatRoom) {
   return res.status(200).json({
     status: true,
     statusCode: 200,
     message: "Chat room already exists",
     chatRoomId: chatRoom._id,
    //  participants: chatRoom.participants,
     conservation: chatRoom.messages,
     receiver: {
       id: friendId,
       username: friendExists.username,
       email: friendExists.email,
       avatar:""
     },
   });
 }

  chatRoom = await Chat.findOne({
      participants: { $all: [userId, friendId] },
    });

    if (!chatRoom) {
      chatRoom = new Chat({
        participants: [userId, friendId],
        messages: [],
      });
      await chatRoom.save();
        io.to(userId!).emit("chatCreated", { chatRoomId: chatRoom._id });
        io.to(friendId).emit("chatCreated", { chatRoomId: chatRoom._id });
    }
    // optional
    else{
      if (!chatRoom.participants.includes(friendId)) {
        chatRoom.participants.push(friendId);
        await chatRoom.save();
          io.to(userId!).emit("chatCreated", { chatRoomId: chatRoom._id });
          io.to(friendId).emit("chatCreated", { chatRoomId: chatRoom._id });
    }
  }
    return res.status(201).json({
      status: true,
      statusCode: 201,
      message: "Chat room created",
      chatRoomId: chatRoom._id,
      conversation: chatRoom?.messages,
      receiver: {
        id: friendId,
        username: friendExists.username,
        email: friendExists.email
      },
    });
  }
  catch(error:any){
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ status: false, statusCode: 500, error: error.message });
    } else {
      res
        .status(500)
        .json({
          status: false,
          statusCode: 500,
          error: "Internal server error",
        });
    }

  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content, receiver } = req.body;
    const senderId = req.userId;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        error: "Message content cannot be empty",
      });
    }

    const chatRoom = await Chat.findById(chatId);
    if (!chatRoom) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "Chat room not found",
      });
    }

    if (!chatRoom.participants.includes(senderId!)) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "You are not a participant of this chat room",
      });
    }

    if (!chatRoom.participants.includes(receiver)) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        error: "Receiver is not a participant of this chat room",
      });
    }

    const newMessage = new Message({
      chatRoomId:chatId,
      sender: senderId,
      receiver: receiver,
      content,
      timestamp: new Date(),
    });

    await newMessage.save();

    chatRoom.messages.push(newMessage);
    await chatRoom.save();

    const senderObj = await user.findById(senderId);
    const receiverObj = await user.findById(receiver);
    
    if (senderObj! && !senderObj.chats.includes(chatRoom.id)) {
      senderObj.chats.push(chatRoom.id);
      await senderObj!.save();
    }
    
    if (receiverObj! && !receiverObj.chats.includes(chatRoom.id)) {
      receiverObj.chats.push(chatRoom.id);
      await receiverObj!.save();
    }
    io.to(chatRoom.id).emit("messageReceived", newMessage);
    
    res.status(201).json({
      status: true,
      statusCode: 201,
      message: "Message sent",
      newMessage,
    });
  } catch (error:any) {
    error("Error sending message:", error);
    res.status(500).json({
      status: false,
      statusCode: 500,
      error: "Internal server error",
    });
  }
};


export const getRecentChatsHistory = async (req: Request, res: Response) => {
  const userId = req.userId; 

  try {
    // Find the user's chat rooms where the user is a participant
    const findUser = await user.findById(userId)
      .populate({
        path: "chats",
        match: { participants: userId }, // Ensure the chat includes the user
        populate: [
          {
            path: "participants",
            select: "username email",
            // match:{id:userId}
            match: { _id: { $ne: userId } }, // Get other participants except the logged-in user
          },
          {
            path: "messages",
            select: "sender receiver content timestamp",
            options: { sort: { timestamp: -1 } }, // Sort messages by timestamp in descending order
          },
        ],
      })
      .lean(); // Convert mongoose document to a plain JS object
      
      log(findUser);
    if (!findUser) {
      return res
        .status(404)
        .json({ status: false, statusCode: 404, error: "User not found" });
    }

    let chats = findUser.chats;

    // Handle case when there are no chats
    if (!chats || chats.length === 0) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "No chats found",
        chats: [],
      });
    }

    // Filter out only the last message from each chat
    chats = chats.map((chat: any) => ({
      ...chat,
      messages: chat.messages.slice(-1), // Keep only the most recent message
    }));

    // Sort chats by the timestamp of the last message
    chats.sort((a: any, b: any) => {
      const lastMessageA = a.messages[0]?.timestamp ;
      const lastMessageB = b.messages[0]?.timestamp ;
      return (
        new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime()
      );
    });

    res.status(200).json({
      status: true,
      statusCode: 200,
      chats,
    });
  } catch (error:any) {
    error("Error fetching chat history:", error);
    res
      .status(500)
      .json({ status: false, statusCode: 500, error: "Internal server error" });
  }
};

export const getChatsWithFriend = async (req: Request, res: Response) => {
  const userId = req.userId; 
  const friendId = req.params.friendId; 
// log(!mongoose.Types.ObjectId.isValid(friendId));
  try {
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        error: "Invalid friendId",
      });
    }

    // Ensure the friend exists

    const friendExists = await user.findById(friendId);
  
    if (!friendExists) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "Friend not found",
      });
    }

    // Find the chat room between the user and the friend
    const chatRoom = await Chat.findOne({
      participants: { $all: [userId, friendId] },
    }).populate({
      path: "messages",
      select: "sender receiver content timestamp",
      options: { sort: { timestamp: 1 } }, // Sort messages in ascending order of time
    });

    if (!chatRoom) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        error: "Chat room not found between the users",
      });
    }

    if (chatRoom.messages.length === 0) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "No messages yet in this chat room",
        chatRoomId: chatRoom._id,
        //  participants: chatRoom.participants,
        conversation: chatRoom.messages,
        receiver: {
          id: friendId,
          username: friendExists.username,
          email: friendExists.email,
          avatar: "",
        },
      });
    }

    res.status(200).json({
      status: true,
      statusCode: 200,
      chatRoomId: chatRoom._id,
      //  participants: chatRoom.participants,
      conversation: chatRoom.messages,
      receiver: {
        id: friendId,
        username: friendExists.username,
        email: friendExists.email,
        avatar: "",
      },
    });

  } catch (error:any) {
    error("Error fetching chat with friend");
    res
      .status(500)
      .json({
        status: false,
        statusCode: 500,
        error: "Internal server error /Error fetching chat with friend",
      });
  }
};

