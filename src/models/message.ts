import mongoose, { Document, Schema } from "mongoose";
import { IMessage } from "../utils/interfaces";


export const messageSchema: Schema = new Schema({
  chatRoomId:{type:Schema.Types.ObjectId},
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});


messageSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.messageId = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Message = mongoose.model<IMessage & Document>("Message", messageSchema);
export default Message;
