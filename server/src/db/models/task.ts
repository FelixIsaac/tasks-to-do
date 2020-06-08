import { Schema, Document, model }from "mongoose";
import { List } from "./list";

export const schema = new Schema({
  title: { type: String, required: true },
  description: String,
  attachments: [String],
  checklist: [{
    title: { type: String, required: true },
    due: Date,
    reminder: Date
  }],
  cover: String,
  activity: [String],
  list: { type: Schema.Types.ObjectId, ref: "Lists", required: true }
}, {
  autoIndex: true,
  autoCreate: true,
  timestamps: true
}).index({
  title: 1,
  "checklist.title": 1,
  _id: 1
});

interface Task extends Document {
  title: string;
  description: string;
  attachments: string[];
  checklist: {
    title: string;
    due: Date;
    reminder: Date;
  }[];
  cover: string;
  activity: string[];
  list: string | List;
}

export default model<Task & Document>('Tasks', schema);
