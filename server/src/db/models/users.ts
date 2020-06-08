import { Schema, Document, model }from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { List } from "./list";

export const schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, dropDupes: true },
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
}).plugin(uniqueValidator);

interface User extends Document {
  username: string;
  email: string;
  authorization: {
    password: string;
    twoFactorAuthentication: string;
    oauth: {
      google: string;
      facebook: string;
      github: string;
    }
  };
  list: List;
}

export default model<User & Document>("Users", schema);
