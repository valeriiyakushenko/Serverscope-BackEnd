// LIKE/ILIKE treat % and _ as wildcards and \ as the escape character; escape them to match the text literally
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
