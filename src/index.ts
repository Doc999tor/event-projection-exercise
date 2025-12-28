export type IsoDateString = string;

export type EventType =
  | "GiftCreated"
  | "GiftClaimed"
  | "OrderCreated"
  | "OrderCancelled"
  | "ShipmentDelivered";

export type GiftEvent = Readonly<{
  eventId: string;
  giftId: string;
  eventTime: IsoDateString; // ISO8601 UTC, e.g. 2025-12-01T10:00:00Z
  type: EventType;
}>;

export type OrderStatus = "NONE" | "CREATED" | "CANCELLED" | "DELIVERED";

export type GiftState = Readonly<{
  giftId: string;
  createdAt?: IsoDateString;
  claimedAt?: IsoDateString;
  orderStatus: OrderStatus;
  orderCreatedAt?: IsoDateString;
  lastEventAt?: IsoDateString;
}>;

export type WarningCode =
  | "DUPLICATE_EVENT_ID"
  | "MISSING_GIFT_CREATED"
  | "INVALID_TRANSITION"
  | "DUPLICATE_ORDER_CREATED";

export type Warning = Readonly<{
  code: WarningCode;
  eventId: string;
  giftId: string;
  message: string;
}>;

export type ReduceResult = Readonly<{
  giftsById: Readonly<Record<string, GiftState>>;
  warnings: ReadonlyArray<Warning>;
}>;

function defaultState(giftId: string): GiftState {
  return {
    giftId,
    orderStatus: "NONE"
  };
}

/**
 * Sort by eventTime asc, then by eventId asc (lexicographically)
 */
export function sortEvents(events: GiftEvent[]): GiftEvent[] {
  // TODO
  return events;
}

/**
 * Reduce events into per-gift current state
 */
export function reduceEvents(events: GiftEvent[]): ReduceResult {
  // TODO
  return { giftsById: {}, warnings: [] };
}

/**
 * Cancelable if orderStatus is CREATED and not DELIVERED and not CANCELLED
 * (in this model, orderStatus already encodes those states)
 */
export function getCancelableGiftIds(result: ReduceResult): string[] {
  // TODO
  return [];
}

/**
 * Stuck means orderStatus is CREATED for longer than thresholdMinutes
 * Age is computed from nowIso - orderCreatedAt
 */
export function getStuckOrderGiftIds(
  result: ReduceResult,
  nowIso: string,
  thresholdMinutes: number
): string[] {
  // TODO
  return [];
}

// small helpers are encouraged
export function minutesBetween(laterIso: string, earlierIso: string): number {
  const later = Date.parse(laterIso);
  const earlier = Date.parse(earlierIso);
  return (later - earlier) / 60000;
}
