import type { AuthHeader } from '../types.js';

export function generateBasicAuthHeader(username: string, password: string): AuthHeader {
  // bun is implementing btoa
  const encoded = btoa(`${username}:${password}`);
  return `Basic ${encoded}`;
}
