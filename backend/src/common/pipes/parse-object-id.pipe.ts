import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

/** Valida que el parámetro sea un ObjectId de MongoDB antes de consultar. */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isValidObjectId(value)) {
      throw new BadRequestException(`"${value}" no es un identificador válido`);
    }
    return value;
  }
}
