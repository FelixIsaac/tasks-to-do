import { Schema, Document, model, Types } from "mongoose";
import { Task, ITaskDocument } from "./tasks";
import { IUserDocument } from "./users";

export interface IListDocument extends Document {
  name: string;
  description: string;
  icon?: string;
  tasks: Types.DocumentArray<ITaskDocument>,
  user: Types.ObjectId | IUserDocument
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  tasks: { type: [Task], default: [] },
  user: { type: Schema.Types.ObjectId, ref: "Users", required: true }
}, {
  autoIndex: true,
  autoCreate: true,
  timestamps: true
}).index({
  name: 1,
  _id: 1
});

export default model<IListDocument & Document>('Lists', schema);
