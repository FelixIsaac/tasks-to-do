import { Schema, model } from "mongoose";

export const schema = new Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  tasks: [{ type: Schema.Types.ObjectId, ref: "Tasks" }],
  user: { type: Schema.Types.ObjectId, ref: "Users", required: true }
}, {
  autoIndex: true,
  autoCreate: true,
  timestamps: true
}).index({
  name: 1,
  _id: 1
});

export default model('Lists', schema);
