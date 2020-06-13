import { Schema, Document, model }from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IListDocument } from "./list";
import { hash } from "bcrypt";

export interface IUserDocument extends Document {
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
  lists: string[] | IListDocument[];
}

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

schema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified('authorization.password') && !this.isModified('username') && !this.isModified('email')) return next();

  try {
    this.authorization.password = await hash(`${this.username}${this.email}${this.authorization.password}`, 12);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
});

export default model<IUserDocument & Document>("Users", schema);
