import { Capacitor } from "@capacitor/core";
import { z } from "zod";

const envSchema = z
  .object({
    VITE_SUPABASE_URL: z.string().url().nonempty(),
    VITE_SUPABASE_ANON_KEY: z.string().nonempty(),
    VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
    VITE_GOOGLE_MAPS_API_KEY_IOS: z.string().optional(),
    VITE_GOOGLE_MAPS_API_KEY_ANDROID: z.string().optional(),
    VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !data.VITE_GOOGLE_MAPS_API_KEY &&
      !data.VITE_GOOGLE_MAPS_API_KEY_IOS &&
      !data.VITE_GOOGLE_MAPS_API_KEY_ANDROID
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY (and optionally platform-specific keys).",
        path: ["VITE_GOOGLE_MAPS_API_KEY"],
      });
    }
  });

type EnvSchema = z.infer<typeof envSchema>;

let cachedEnv: EnvSchema | null = null;

const buildEnv = () => {
  const rawEnv = {
    VITE_SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    VITE_GOOGLE_MAPS_API_KEY:
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_GOOGLE_MAPS_API_KEY_IOS:
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY_IOS ||
      process.env.VITE_GOOGLE_MAPS_API_KEY_IOS,
    VITE_GOOGLE_MAPS_API_KEY_ANDROID:
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY_ANDROID ||
      process.env.VITE_GOOGLE_MAPS_API_KEY_ANDROID,
    VITE_VAPID_PUBLIC_KEY:
      import.meta.env.VITE_VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const formatted = result.error.format();
    console.error("Environment validation failed", formatted);
    throw new Error("Missing or invalid environment configuration. Check your .env file.");
  }

  return result.data;
};

export const getEnv = () => {
  if (!cachedEnv) {
    cachedEnv = buildEnv();
  }
  return cachedEnv;
};

export const requireEnv = (key: keyof EnvSchema) => {
  const env = getEnv();
  return env[key];
};

export const getGoogleMapsApiKey = (): string => {
  const env = getEnv();
  const platform = Capacitor.getPlatform();

  if (platform === "ios" && env.VITE_GOOGLE_MAPS_API_KEY_IOS) {
    return env.VITE_GOOGLE_MAPS_API_KEY_IOS;
  }

  if (platform === "android" && env.VITE_GOOGLE_MAPS_API_KEY_ANDROID) {
    return env.VITE_GOOGLE_MAPS_API_KEY_ANDROID;
  }

  return (
    env.VITE_GOOGLE_MAPS_API_KEY ||
    env.VITE_GOOGLE_MAPS_API_KEY_IOS ||
    env.VITE_GOOGLE_MAPS_API_KEY_ANDROID ||
    ""
  );
};
