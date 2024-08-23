import mongoose, { Schema } from "mongoose";
import {messageSchema } from "./message.js";
import { IChat } from "../utils/interfaces";

const chatSchema: Schema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
  messages: [messageSchema],
});

chatSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.chatId = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const chat = mongoose.model<IChat & mongoose.Document>("chat", chatSchema);
export default chat;




