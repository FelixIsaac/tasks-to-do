import { Document, Schema, Types } from "mongoose";

export interface ITaskDocument extends Document {
  title: string;
  description: string;
  attachments: string[];
  checklist: {
    title: string;
    due: Partial<Date>;
    reminder: Partial<Date>;
    steps: Partial<{
      step: string;
      completed: boolean;
    }[]>
    _id: Types.ObjectId;
  }[];
  cover: string;
  activity: {
    action: "CREATE" | "UPDATE" | "ARCHIVE" | "DELETE",
    detail: string,
    date: Date
  }[];
  completed: boolean;
  list: Types.ObjectId;
  _id: Types.ObjectId;
}

export const Task = new Schema({
  title: { type: String, required: true },
  description: String,
  attachments: {
    type: [String],
    default: []
  },
  checklist: {
    type: [{
      title: { type: String, required: true },
      due: Date,
      reminder: Date,
      steps: [{
        step: String,
        completed: Boolean
      }]
    }],
    default: []
  },
  cover: String,
  activity: {
    type: [{
      action: String,
      detail: String,
      date: Date
    }],
    default: [{
      action: "CREATE",
      default: "",
      date: new Date()
    }]
  },
  completed: { type: Boolean, default: false },
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
