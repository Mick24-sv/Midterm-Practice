export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isValidEmail(email) {
  return typeof email === "string" &&
    Buffer.byteLength(email, "utf8") <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  const length = Buffer.byteLength(password, "utf8");
  return length >= 8 && length <= 72;
}
