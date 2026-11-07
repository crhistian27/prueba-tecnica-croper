import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    const password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    return this.userModel.create({ ...data, password });
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /** Incluye el hash del password (solo para validar credenciales). */
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .exec();
  }
}
