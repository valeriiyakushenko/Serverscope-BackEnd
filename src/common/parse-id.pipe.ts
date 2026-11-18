import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const INT4_MAX = 2147483647;
// keeps OFFSET far inside bigint; no list has anywhere near this many pages
export const MAX_PAGE = 1_000_000;

// Ids are int4 in PostgreSQL: a larger value would fail in the query with a 500 instead of a 400
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!/^\d+$/.test(value) || id < 1 || id > INT4_MAX) {
      throw new BadRequestException(
        `Validation failed (an integer from 1 to ${INT4_MAX} is expected)`,
      );
    }
    return id;
  }
}
