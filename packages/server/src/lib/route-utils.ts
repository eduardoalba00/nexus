/** Fastify uses `:param` natively — passthrough for consistency */
export function fastifyRoute(route: string): string {
  return route;
}

/** Generate a random invite code (8 alphanumeric chars) */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return code;
}
