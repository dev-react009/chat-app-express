import { Document, model, Schema } from "mongoose";
import { IUser } from "../utils/interfaces";

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    resetOtp: { type: String },
    resetOtpExpire: { type: String },
    resetOtpUsed: {
      type: Boolean,
      default: false,},
    friends: [{ type: Schema.Types.ObjectId, ref: "user" }],
    chats: [{ type: Schema.Types.ObjectId, ref: "chat" }],
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.userId = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const User = model<IUser & Document >('user', userSchema);
export default User;