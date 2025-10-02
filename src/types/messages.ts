import { z } from "zod";

const baseUserSchema = z.object({
  name: z.string().default("Lo User"),
  avatar: z.string().default("/placeholder.svg"),
});

const rawMessageSchema = z.object({
  id: z.string(),
  content: z.string().nullable().default(""),
  media_url: z.string().nullable().optional(),
  is_public: z.boolean().nullable().default(true),
  location: z.string().nullable().default(""),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  user_id: z.string().nullable().optional(),
  created_at: z.string(),
  expires_at: z.string().nullable().optional(),
  message_type: z.string().nullable().optional(),
  event_source: z.string().nullable().optional(),
  event_title: z.string().nullable().optional(),
  event_url: z.string().nullable().optional(),
  event_venue: z.string().nullable().optional(),
  event_start_date: z.string().nullable().optional(),
  event_price_min: z.number().nullable().optional(),
  event_price_max: z.number().nullable().optional(),
  likes: z
    .array(
      z.object({
        user_id: z.string(),
      })
    )
    .nullable()
    .optional(),
});

const rawEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  venue_name: z.string().nullable().optional(),
  venue_address: z.string().nullable().optional(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  start_date: z.string(),
  price_min: z.number().nullable().optional(),
  price_max: z.number().nullable().optional(),
  event_url: z.string().nullable().optional(),
  source: z.string().nullable().default("ticketmaster"),
  created_at: z.string().nullable().optional(),
});

export type RawMessage = z.infer<typeof rawMessageSchema>;
export type RawEvent = z.infer<typeof rawEventSchema>;

export const eventMetadataSchema = z.object({
  title: z.string(),
  venue: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  startDate: z.string(),
  priceMin: z.number().nullable().optional(),
  priceMax: z.number().nullable().optional(),
  source: z.string().nullable().optional(),
});

export type EventMetadata = z.infer<typeof eventMetadataSchema>;

export interface MapMessage {
  id: string;
  content: string;
  mediaUrl: string | null;
  isPublic: boolean;
  location: string;
  timestamp: string;
  expiresAt: string | null;
  lat: number;
  lng: number;
  position: { lat: number; lng: number; x: number; y: number };
  liked: boolean;
  likes: number;
  isEvent: boolean;
  eventData?: EventMetadata;
  user: z.infer<typeof baseUserSchema>;
}

const EVENT_DISPLAY_AVATARS: Record<string, string> = {
  ticketmaster:
    "https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg",
  eventbrite:
    "https://cdn.evbstatic.com/s3-build/fe/build/images/logos/eb-orange-wordmark-no-text.6f6804bb.svg",
};

const EVENT_DISPLAY_NAMES: Record<string, string> = {
  ticketmaster: "🎫 Ticketmaster Events",
  eventbrite: "🎟 Eventbrite Events",
};

export const transformMessage = (
  raw: RawMessage,
  currentUserId?: string | null
): MapMessage | null => {
  const parsed = rawMessageSchema.parse(raw);

  if (parsed.lat == null || parsed.lng == null) {
    return null;
  }

  const isEvent = parsed.message_type === "event";
  const source = parsed.event_source ?? "";
  const likes = parsed.likes?.length ?? 0;
  const liked = Boolean(currentUserId && parsed.likes?.some((like) => like.user_id === currentUserId));

  const user = baseUserSchema.parse({
    name: isEvent ? EVENT_DISPLAY_NAMES[source] ?? "Lo Events" : "Lo User",
    avatar: isEvent ? EVENT_DISPLAY_AVATARS[source] ?? "/placeholder.svg" : "/placeholder.svg",
  });

  const eventData = isEvent
    ? {
        title: parsed.event_title ?? "",
        venue: parsed.event_venue,
        url: parsed.event_url,
        startDate: parsed.event_start_date ?? parsed.created_at,
        priceMin: parsed.event_price_min ?? undefined,
        priceMax: parsed.event_price_max ?? undefined,
        source: parsed.event_source ?? undefined,
      }
    : undefined;

  return {
    id: parsed.id,
    content: parsed.content ?? "",
    mediaUrl: parsed.media_url ?? null,
    isPublic: parsed.is_public ?? true,
    location: parsed.location ?? "",
    timestamp: parsed.created_at,
    expiresAt: parsed.expires_at ?? null,
    lat: parsed.lat,
    lng: parsed.lng,
    position: { lat: parsed.lat, lng: parsed.lng, x: parsed.lat, y: parsed.lng },
    liked,
    likes,
    isEvent,
    eventData,
    user,
  };
};

export const transformEventToMessage = (event: RawEvent): MapMessage | null => {
  const parsed = rawEventSchema.parse(event);

  if (parsed.lat == null || parsed.lng == null) {
    return null;
  }

  return {
    id: `event-${parsed.id}`,
    content: buildEventContent(parsed),
    mediaUrl: parsed.image_url ?? null,
    isPublic: true,
    location: parsed.venue_address || parsed.venue_name || "",
    timestamp: parsed.created_at ?? parsed.start_date,
    expiresAt: parsed.start_date,
    lat: parsed.lat,
    lng: parsed.lng,
    position: { lat: parsed.lat, lng: parsed.lng, x: parsed.lat, y: parsed.lng },
    liked: false,
    likes: 0,
    isEvent: true,
    eventData: {
      title: parsed.title,
      venue: parsed.venue_name,
      url: parsed.event_url ?? undefined,
      startDate: parsed.start_date,
      priceMin: parsed.price_min ?? undefined,
      priceMax: parsed.price_max ?? undefined,
      source: parsed.source ?? undefined,
    },
    user: {
      name: EVENT_DISPLAY_NAMES[parsed.source ?? "ticketmaster"] ?? "Lo Events",
      avatar: EVENT_DISPLAY_AVATARS[parsed.source ?? "ticketmaster"] ?? "/placeholder.svg",
    },
  };
};

const buildEventContent = (event: RawEvent) => {
  const lines = [
    `🎫 ${event.title}`,
    event.venue_name ? `📍 ${event.venue_name}` : undefined,
    event.venue_address ? event.venue_address : undefined,
    `📅 ${new Date(event.start_date).toLocaleString()}`,
    event.price_min ? `💰 From $${event.price_min}` : undefined,
    event.event_url ? `🔗 ${event.event_url}` : undefined,
  ].filter(Boolean);

  if (event.description) {
    const trimmed = event.description.length > 200 ? `${event.description.slice(0, 200)}...` : event.description;
    lines.splice(1, 0, trimmed);
  }

  return `${lines.join("\n\n")}\n\n#Events`;
};
