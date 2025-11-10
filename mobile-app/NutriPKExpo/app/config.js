// Central config for mobile app runtime values.
// Edit this file (or better: use environment injection) on each laptop to point to your backend.
const DEFAULT_API =
  typeof process !== "undefined" && process.env?.API_URL
    ? process.env.API_URL
    : "http://192.168.1.4:8000";

export const BACKEND_BASE = DEFAULT_API;

export default {
  BACKEND_BASE,
};
