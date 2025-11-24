import { z } from 'zod';

export const stringToOptionalNumberArray = z.preprocess(val => {
  if (typeof val === 'string') {
    const r = val.split(',');
    return r.length === 1 && r[0] === '' ? [] : r;
  }
  return val;
}, z.array(z.coerce.number()).optional());
