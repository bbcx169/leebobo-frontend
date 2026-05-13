export const GAS_SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL;

if (!GAS_SCRIPT_URL) {
  throw new Error("Missing VITE_GAS_SCRIPT_URL. Set it in your local .env or deployment environment.");
}
