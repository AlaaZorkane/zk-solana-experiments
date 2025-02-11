// A recursive type transformation: if a string literal is a numeric (or hex) string,
// we turn it into a bigint; if it’s an array we map the transformation over its elements,
// and if it’s an object we transform each property.
export type Unstringified<T> = T extends string
  ? T extends `0x${string}` // hex string literal
    ? bigint
    : T extends `${number}` // numeric string literal
      ? bigint
      : T
  : T extends Array<infer U>
    ? Unstringified<U>[]
    : T extends object
      ? { [K in keyof T]: Unstringified<T[K]> }
      : T;

// The function uses a generic type parameter T so that it returns the "transformed" type.
export const unstringifyBigInts = <T>(o: T): Unstringified<T> => {
  if (typeof o === "string") {
    // biome-ignore lint/performance/useTopLevelRegex: <explanation>
    if (/^[0-9]+$/.test(o) || /^0x[0-9a-fA-F]+$/.test(o)) {
      // Here we convert the string to a BigInt.
      return BigInt(o) as Unstringified<T>;
    }
    return o as Unstringified<T>;
  }

  if (Array.isArray(o)) {
    // Map over array elements recursively.
    return o.map(unstringifyBigInts) as Unstringified<T>;
  }

  if (o !== null && typeof o === "object") {
    // Use Object.entries and Object.fromEntries to rebuild the object.
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, unstringifyBigInts(v)]),
    ) as Unstringified<T>;
  }

  // For all other types, return as-is.
  return o as Unstringified<T>;
};
