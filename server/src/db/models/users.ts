import { Schema, model } from "mongoose";

export const schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true},
  authorization: {
    password: { type: String, required: true },
    twoFactorAuthentication: String,
    oauth: {
      google: String,
      facebook: String,
      github: String
    }
  },
  lists: { type: [Schema.Types.ObjectId], ref: "Lists", default: [] }
}, {
  autoIndex: true,
  autoCreate: true,
  timestamps: true
}).index({
  username: 1,
  email: 1,
  _id: 1
});

export default model("Users", schema);
