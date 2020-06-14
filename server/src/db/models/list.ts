import { Schema, Document, model, Types }from "mongoose";
import { IUserDocument } from "./users";

export interface ITaskDocument {
  title: string;
  description?: string;
  attachments?: string[];
  checklist?: {
    title: string;
    due: Date;
    reminder: Date;
  }[];
  cover?: string;
  activity?: {
    action: "CREATED" | "UPDATE" | "ARCHIVE",
    detail: string,
    date: Date
  }[];
  _id?: Schema.Types.ObjectId
}

export interface IListDocument extends Document {
  name: string;
  description?: string;
  icon?: string;
  tasks: Types.Array<ITaskDocument>,
  user: Schema.Types.ObjectId | IUserDocument
  _id: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const Task = new Schema({
  title: { type: String, required: true },
  description: String,
  attachments: [String],
  checklist: [{
    title: { type: String, required: true },
    due: Date,
    reminder: Date
  }],
  cover: String,
  activity: [{
    action: String,
    detail: String,
    date: Date
  }],
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
