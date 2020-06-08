import { Schema, Document, model }from "mongoose";
import Task from "./task";

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

export interface List extends Document {
  name: string;
  description: string;
  icon: string;
  tasks: string[] | typeof Task[]
}

export default model<List & Document>('Lists', schema);
