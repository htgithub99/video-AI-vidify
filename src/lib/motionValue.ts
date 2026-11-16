
export const canonicalMotionValue = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalMotionValue)
    : value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonicalMotionValue((value as Record<string, unknown>)[key])]),
        )
      : value;
