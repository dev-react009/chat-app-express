import { Types } from "mongoose";

export interface IMessage {
  sender: string | undefined;
  receiver: string;
  content: string;
  timestamp: Date;
}

export interface IChat {
   _id: Types.ObjectId;
  participants: string[];
  messages: IMessage[];
}


export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  mobile: string;
  resetOtp?: string;
  resetOtpExpire?: number;
  resetOtpUsed?:boolean;
  friends: string[];
  chats: IChat[];
}
