# event-projection-exercise

### Goal

Implement a deterministic event aggregation mini-pipeline that reduces a stream of events into current state per gift and exposes a few query helpers

### Timebox

40 minutes

### Requirements

Implement these functions in `src/index.ts`

1.  `sortEvents(events: GiftEvent[]): GiftEvent[]`

-   Sort by `eventTime` ascending

-   If `eventTime` is equal, sort by `eventId` ascending lexicographically

-   Must be deterministic

2.  `reduceEvents(events: GiftEvent[]): ReduceResult`

-   Process events in sorted order using `sortEvents`

-   Maintain per-gift state in a map

-   Track warnings instead of throwing for invalid transitions or missing prerequisites

-   Return `{ giftsById, warnings }`

3.  `getCancelableGiftIds(result: ReduceResult): string[]`

-   Return giftIds that are cancelable right now

-   Definition: cancelable if `orderStatus` is `CREATED` and gift is not `DELIVERED` and not `CANCELLED`

4.  `getStuckOrderGiftIds(result: ReduceResult, nowIso: string, thresholdMinutes: number): string[]`

-   "Stuck" means `orderStatus` is `CREATED` and not cancelled and not delivered

-   Compare `nowIso` to `orderCreatedAt`

-   Return giftIds whose age in minutes is strictly greater than thresholdMinutes

### Domain rules

Events are per giftId, but can arrive out of order and may be duplicated

Events types:

-   `GiftCreated`

-   `GiftClaimed`

-   `OrderCreated`

-   `OrderCancelled`

-   `ShipmentDelivered`

Rules and warnings

-   Duplicate events: if the same `eventId` appears twice, ignore the second and add a warning `DUPLICATE_EVENT_ID`

-   If an event references a gift that was never created, still create a placeholder state but add warning `MISSING_GIFT_CREATED`

-   Invalid transitions should not crash, they should add warning `INVALID_TRANSITION` and be ignored

    -   Cannot claim before created

    -   Cannot create an order before claimed

    -   Cannot cancel before order created

    -   Cannot deliver before order created

    -   Cannot cancel after delivered

    -   Cannot deliver after cancelled

-   If multiple `OrderCreated` happen, keep the first and warn `DUPLICATE_ORDER_CREATED`

### Output state

For each giftId, track:

-   `giftId`

-   `createdAt?: string`

-   `claimedAt?: string`

-   `orderStatus: 'NONE' | 'CREATED' | 'CANCELLED' | 'DELIVERED'`

-   `orderCreatedAt?: string`

-   `lastEventAt?: string`

### Notes

-   You can use TypeScript features freely

-   Don't add libraries

-   Make decisions explicit with small helper functions and comments

-   Aim for correctness and determinism over completeness
