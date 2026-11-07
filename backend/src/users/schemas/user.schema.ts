import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      delete ret.password; // nunca exponer el hash
      return ret;
    },
  },
})
export class User {
  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  /** Hash bcrypt. `select: false` → no se trae en las consultas salvo que se pida. */
  @Prop({ type: String, required: true, select: false })
  password: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
