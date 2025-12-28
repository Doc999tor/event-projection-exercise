import test from "node:test";
import assert from "node:assert/strict";
import {
  sortEvents,
  reduceEvents,
  getCancelableGiftIds,
  getStuckOrderGiftIds
} from "../src/index.ts";

const e = (eventId, giftId, eventTime, type) => ({ eventId, giftId, eventTime, type });

test("1) sortEvents sorts by time then eventId", () => {
  const events = [
    e("b", "g1", "2025-12-01T10:00:00Z", "GiftCreated"),
    e("a", "g1", "2025-12-01T10:00:00Z", "GiftClaimed"),
    e("c", "g1", "2025-12-01T09:59:59Z", "GiftCreated")
  ];
  const sorted = sortEvents(events);
  assert.deepEqual(sorted.map(x => x.eventId), ["c", "a", "b"]);
});

test("2) reduceEvents handles out-of-order valid flow", () => {
  const events = [
    e("3", "g1", "2025-12-01T10:03:00Z", "OrderCreated"),
    e("1", "g1", "2025-12-01T10:01:00Z", "GiftCreated"),
    e("2", "g1", "2025-12-01T10:02:00Z", "GiftClaimed")
  ];
  const r = reduceEvents(events);
  assert.equal(r.warnings.length, 0);

  const s = r.giftsById["g1"];
  assert.equal(s.giftId, "g1");
  assert.equal(s.createdAt, "2025-12-01T10:01:00Z");
  assert.equal(s.claimedAt, "2025-12-01T10:02:00Z");
  assert.equal(s.orderStatus, "CREATED");
  assert.equal(s.orderCreatedAt, "2025-12-01T10:03:00Z");
  assert.equal(s.lastEventAt, "2025-12-01T10:03:00Z");
});

test("3) duplicate eventId is ignored and produces warning", () => {
  const events = [
    e("dup", "g1", "2025-12-01T10:01:00Z", "GiftCreated"),
    e("dup", "g1", "2025-12-01T10:02:00Z", "GiftClaimed")
  ];
  const r = reduceEvents(events);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].code, "DUPLICATE_EVENT_ID");

  const s = r.giftsById["g1"];
  // second event ignored, so not claimed
  assert.equal(s.claimedAt, undefined);
  assert.equal(s.orderStatus, "NONE");
});

test("4) missing GiftCreated creates placeholder state with warning", () => {
  const events = [e("1", "g2", "2025-12-01T10:02:00Z", "GiftClaimed")];
  const r = reduceEvents(events);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].code, "MISSING_GIFT_CREATED");
  assert.ok(r.giftsById["g2"]);
});

test("5) invalid transition is ignored with warning", () => {
  const events = [
    e("1", "g3", "2025-12-01T10:01:00Z", "GiftCreated"),
    e("2", "g3", "2025-12-01T10:02:00Z", "OrderCreated") // cannot order before claim
  ];
  const r = reduceEvents(events);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].code, "INVALID_TRANSITION");
  assert.equal(r.giftsById["g3"].orderStatus, "NONE");
});

test("6) deliver after cancel is invalid and ignored", () => {
  const events = [
    e("1", "g4", "2025-12-01T10:01:00Z", "GiftCreated"),
    e("2", "g4", "2025-12-01T10:02:00Z", "GiftClaimed"),
    e("3", "g4", "2025-12-01T10:03:00Z", "OrderCreated"),
    e("4", "g4", "2025-12-01T10:04:00Z", "OrderCancelled"),
    e("5", "g4", "2025-12-01T10:05:00Z", "ShipmentDelivered")
  ];
  const r = reduceEvents(events);
  assert.equal(r.giftsById["g4"].orderStatus, "CANCELLED");
  assert.equal(r.warnings.some(w => w.code === "INVALID_TRANSITION"), true);
});

test("7) duplicate OrderCreated keeps first and warns", () => {
  const events = [
    e("1", "g5", "2025-12-01T10:01:00Z", "GiftCreated"),
    e("2", "g5", "2025-12-01T10:02:00Z", "GiftClaimed"),
    e("3", "g5", "2025-12-01T10:03:00Z", "OrderCreated"),
    e("4", "g5", "2025-12-01T10:04:00Z", "OrderCreated")
  ];
  const r = reduceEvents(events);
  assert.equal(r.giftsById["g5"].orderCreatedAt, "2025-12-01T10:03:00Z");
  assert.equal(r.warnings.some(w => w.code === "DUPLICATE_ORDER_CREATED"), true);
});

test("8) getCancelableGiftIds and getStuckOrderGiftIds", () => {
  const events = [
    e("1", "g6", "2025-12-01T10:00:00Z", "GiftCreated"),
    e("2", "g6", "2025-12-01T10:01:00Z", "GiftClaimed"),
    e("3", "g6", "2025-12-01T10:02:00Z", "OrderCreated"),

    e("4", "g7", "2025-12-01T10:00:00Z", "GiftCreated"),
    e("5", "g7", "2025-12-01T10:01:00Z", "GiftClaimed"),
    e("6", "g7", "2025-12-01T10:02:00Z", "OrderCreated"),
    e("7", "g7", "2025-12-01T10:03:00Z", "ShipmentDelivered")
  ];
  const r = reduceEvents(events);

  const cancelable = getCancelableGiftIds(r);
  assert.deepEqual(cancelable, ["g6"]);

  const stuck = getStuckOrderGiftIds(r, "2025-12-01T10:40:00Z", 30);
  assert.deepEqual(stuck, ["g6"]);
});
