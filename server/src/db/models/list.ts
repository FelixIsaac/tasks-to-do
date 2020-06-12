import { Schema, Document, model }from "mongoose";
import { ITaskDocument } from "./task";
import { IUserDocument } from "./users";

export interface IListDocument extends Document {
  name: string;
  description?: string;
  icon?: string;
  tasks?: string[] | ITaskDocument[],
  user: IUserDocument
}

export const schema = new Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  tasks: { type: [Schema.Types.ObjectId], ref: "Tasks", default: [] },
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
