export type Jsonify<T> = T extends string | number | boolean | null
  ? T
  : T extends Date
    ? string
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- Treat functions as non-serializable
    : T extends Function | undefined
      ? null // Functions and undefined are not serializable
      : T extends object
        ? T extends Array<infer U>
          ? Array<Jsonify<U>> // Handle arrays
          : {
            [K in keyof T as K extends symbol ? never : K]: Jsonify<T[K]>; // Handle objects and recurse
          }
        : never;
