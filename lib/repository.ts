import crypto from "crypto";
import { DepositModel } from "@/models/Deposit";
import { CounterModel } from "@/models/Counter";
import { OperatorModel } from "@/models/Operator";
import { VenueModel } from "@/models/Venue";
import { CustodyModel, OperationsModel } from "@/models/Pilot";
import { WaitlistModel } from "@/models/Waitlist";
import {
  DEFAULT_ITEM_CATEGORIES,
  DEFAULT_INSTRUCTIONS,
  SEED_DEPOSIT_TEMPLATES,
  SEED_OPERATORS,
  SEED_VENUES
} from "@/lib/constants";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";
import { buildShortCode, buildShortUrl, buildTokenId } from "@/lib/qr";
import {
  AnalyticsSummary,
  CreateDepositInput,
  DashboardStats,
  Deposit,
  DepositSearchFilters,
  Operator,
  PlatformSnapshot,
  PublicStats,
  StaffPerformance,
  SubscriptionStatus,
  Venue,
  VenueRegistrationInput,
  VenueSettingsInput,
  WaitlistEntry,
  WaitlistInput
} from "@/types";
import { resolveDepositStatus } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo-mode";

type MockStore = {
  venues: Venue[];
  operators: Operator[];
  deposits: Deposit[];
  waitlist: WaitlistEntry[];
  counters: Record<string, number>;
};

declare global {
  var safeTagMockStore: MockStore | undefined;
  var safeTagDemoMockStore: MockStore | undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function getVenueBySeedKey(seedKey: string, venues: Venue[]) {
  return venues.find((venue) => venue.name === getVenueNameFromSeed(seedKey)) ?? venues[0];
}

function getVenueNameFromSeed(seedKey: string) {
  return SEED_VENUES.find((venue) => venue.seedKey === seedKey)?.name ?? SEED_VENUES[0].name;
}

function withDerivedStatus(deposit: Deposit): Deposit {
  const status = resolveDepositStatus(deposit.status, deposit.checkInTime, deposit.returnTime);
  return {
    ...deposit,
    status,
    itemsPhotoUrl: deposit.operatorCapturedPhotoUrl || deposit.visitorUploadPhotoUrl || deposit.itemsPhotoUrl
  };
}

function buildSeedDeposit(index: number, template: (typeof SEED_DEPOSIT_TEMPLATES)[number], venues: Venue[]) {
  const venue = getVenueBySeedKey(template.venueSeedKey, venues);
  const checkInTime = new Date(Date.now() - template.hoursAgo * 60 * 60 * 1000).toISOString();
  const returnTime =
    template.status === "returned"
      ? new Date(new Date(checkInTime).getTime() + 95 * 60 * 1000).toISOString()
      : undefined;

  return withDerivedStatus({
    ...template,
    _id: `seed-deposit-${index + 1}`,
    venueId: venue._id,
    venueName: venue.name,
    venueCity: venue.city,
    itemsPhotoUrl: template.operatorCapturedPhotoUrl || template.visitorUploadPhotoUrl,
    createdAt: checkInTime,
    checkInTime,
    returnTime,
    collectionTime: returnTime,
    printedAt: checkInTime
  });
}

function createMockStore(): MockStore {
  const venues: Venue[] = SEED_VENUES.map((venue, index) => ({
    ...venue,
    _id: `seed-venue-${index + 1}`
  }));

  const operators: Operator[] = SEED_OPERATORS.map((operator, index) => ({
    ...operator,
    _id: `seed-operator-${index + 1}`,
    venueId: getVenueBySeedKey(operator.venueSeedKey, venues)._id,
    createdAt: nowIso()
  }));

  const deposits = SEED_DEPOSIT_TEMPLATES.map((template, index) =>
    buildSeedDeposit(index, template, venues)
  );

  return {
    venues,
    operators,
    deposits,
    waitlist: [
      {
        _id: "seed-waitlist-1",
        email: "ops@sangamcbt.in",
        phone: "+919700000101",
        venueName: "Sangam CBT Center",
        venueType: "exam",
        city: "Prayagraj",
        status: "pending",
        createdAt: nowIso()
      },
      {
        _id: "seed-waitlist-2",
        email: "admin@heritagecounter.in",
        phone: "+919700000102",
        venueName: "Heritage City Deposit",
        venueType: "museum",
        city: "Jaipur",
        status: "pending",
        createdAt: nowIso()
      }
    ],
    counters: {}
  };
}

function createDemoMockStore(): MockStore {
  const venue: Venue = {
    _id: "demo-venue",
    name: "SafeTag Demo Venue",
    type: "museum",
    city: "Demo City",
    state: "Demo State",
    address: "Local demonstration environment",
    pincode: "000000",
    contactName: "Demo Contact",
    contactPhone: "0000000000",
    contactEmail: "demo@example.test",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.museum,
    customInstructions: DEFAULT_INSTRUCTIONS.museum,
    thermalPrinterSize: "58mm",
    isApproved: true,
    operatorPhones: ["demo-operator"],
    operatingHours: "08:00 AM - 08:00 PM",
    createdAt: nowIso(),
    subscriptionStatus: "active"
  };

  return {
    venues: [venue],
    operators: [
      {
        _id: "demo-operator",
        name: "Demo Operator",
        phone: "demo-operator",
        venueId: venue._id,
        role: "operator",
        isActive: true,
        totalCheckinsHandled: 0,
        createdAt: nowIso()
      }
    ],
    deposits: [],
    waitlist: [],
    counters: {}
  };
}

function getMockStore() {
  if (isDemoMode()) {
    global.safeTagDemoMockStore ??= createDemoMockStore();
    return global.safeTagDemoMockStore;
  }

  if (!global.safeTagMockStore) {
    global.safeTagMockStore = createMockStore();
  }

  return global.safeTagMockStore;
}

function normalizeVenue(doc: any): Venue {
  const venueType = doc.type as Venue["type"];
  return {
    _id: doc._id.toString(),
    name: doc.name,
    type: venueType,
    city: doc.city,
    state: doc.state,
    address: doc.address,
    pincode: doc.pincode,
    contactName: doc.contactName,
    contactPhone: doc.contactPhone,
    contactEmail: doc.contactEmail,
    logoUrl: doc.logoUrl || "/icons/safetag-icon.svg",
    customItemCategories: doc.customItemCategories ?? DEFAULT_ITEM_CATEGORIES[venueType],
    customInstructions: doc.customInstructions ?? DEFAULT_INSTRUCTIONS[venueType],
    thermalPrinterSize: doc.thermalPrinterSize ?? "58mm",
    isApproved: Boolean(doc.isApproved),
    operatorPhones: doc.operatorPhones ?? [],
    operatingHours: doc.operatingHours ?? "08:00 AM - 08:00 PM",
    subscriptionStatus: doc.subscriptionStatus ?? "none",
    subscriptionExpiresAt: doc.subscriptionExpiresAt,
    subscriptionNotes: doc.subscriptionNotes,
    createdAt: new Date(doc.createdAt ?? new Date()).toISOString(),
    brandColor: doc.brandColor,
    averageRating: Number(doc.averageRating ?? 0)
  };
}

function normalizeOperator(doc: any): Operator {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    phone: doc.phone,
    venueId: doc.venueId.toString(),
    role: doc.role,
    isActive: Boolean(doc.isActive),
    totalCheckinsHandled: Number(doc.totalCheckinsHandled ?? 0),
    createdAt: new Date(doc.createdAt ?? new Date()).toISOString()
  };
}

function normalizeDeposit(doc: any): Deposit {
  const operatorPhoto = doc.operatorCapturedPhotoUrl || doc.itemsPhotoUrl;
  const visitorPhoto = doc.visitorUploadPhotoUrl || "";
  const returnTime = doc.returnTime ?? doc.collectionTime;
  return withDerivedStatus({
    _id: doc._id.toString(),
    tokenId: doc.tokenId,
    visitorName: doc.visitorName,
    visitorPhone: doc.visitorPhone,
    visitorEmail: doc.visitorEmail,
    guardianName: doc.guardianName,
    guardianPhone: doc.guardianPhone,
    guardianEmail: doc.guardianEmail,
    guardianRelation: doc.guardianRelation,
    venueId: doc.venueId.toString(),
    venueType: doc.venueType,
    venueCity: doc.venueCity,
    venueName: doc.venueName,
    itemsList: doc.itemsList ?? [],
    aiDetectedItems: doc.aiDetectedItems ?? [],
    operatorDetectedItems: doc.operatorDetectedItems ?? [],
    visitorUploadPhotoUrl: visitorPhoto,
    operatorCapturedPhotoUrl: operatorPhoto,
    itemsPhotoUrl: operatorPhoto || visitorPhoto,
    photoMismatchAlert: Boolean(doc.photoMismatchAlert),
    status: doc.status,
    checkedInByPhone: doc.checkedInByPhone,
    returnedByPhone: doc.returnedByPhone,
    receivedByOperatorId: doc.receivedByOperatorId?.toString(),
    collectedByOperatorId: doc.collectedByOperatorId?.toString(),
    shortUrl: doc.shortUrl,
    receiptPdfUrl: doc.receiptPdfUrl,
    checkInTime: new Date(doc.checkInTime ?? doc.createdAt ?? new Date()).toISOString(),
    returnTime: returnTime ? new Date(returnTime).toISOString() : undefined,
    collectionTime: returnTime ? new Date(returnTime).toISOString() : undefined,
    printedAt: doc.printedAt ? new Date(doc.printedAt).toISOString() : undefined,
    createdAt: new Date(doc.createdAt ?? new Date()).toISOString(),
    rating: doc.rating,
    reviewText: doc.reviewText
  });
}

function normalizeWaitlistEntry(doc: any): WaitlistEntry {
  return {
    _id: doc._id.toString(),
    email: doc.email,
    phone: doc.phone,
    venueName: doc.venueName,
    venueType: doc.venueType,
    city: doc.city,
    status: doc.status ?? "pending",
    createdAt: new Date(doc.createdAt ?? new Date()).toISOString()
  };
}

async function incrementOperatorCheckins(phone: string) {
  if (!phone) return;

  if (!isMongoConfigured()) {
    const operator = getMockStore().operators.find((item) => item.phone === phone);
    if (operator) operator.totalCheckinsHandled += 1;
    return;
  }

  await OperatorModel.findOneAndUpdate({ phone }, { $inc: { totalCheckinsHandled: 1 } });
}

async function upsertVenueOperators(venueId: string, phoneNumbers: string[], contactName = "Operator") {
  const uniquePhones = [...new Set(phoneNumbers.filter(Boolean))];

  if (!isMongoConfigured()) {
    const store = getMockStore();
    const existing = store.operators.filter((operator) => operator.venueId === venueId);

    existing.forEach((operator) => {
      operator.isActive = uniquePhones.includes(operator.phone);
    });

    uniquePhones.forEach((phone, index) => {
      const match = existing.find((operator) => operator.phone === phone);
      if (match) return;
      store.operators.push({
        _id: crypto.randomUUID(),
        name: index === 0 ? contactName : `Operator ${phone.slice(-4)}`,
        phone,
        venueId,
        role: index === 0 ? "admin" : "operator",
        isActive: true,
        totalCheckinsHandled: 0,
        createdAt: nowIso()
      });
    });
    return;
  }

  await Promise.all(
    uniquePhones.map((phone, index) =>
      OperatorModel.findOneAndUpdate(
        { phone, venueId },
        {
          name: index === 0 ? contactName : `Operator ${phone.slice(-4)}`,
          role: index === 0 ? "admin" : "operator",
          isActive: true
        },
        { upsert: true }
      )
    )
  );

  await OperatorModel.updateMany(
    { venueId, phone: { $nin: uniquePhones } },
    { isActive: false }
  );
}

async function ensureSeedData() {
  if (!isMongoConfigured()) return;
  await connectToDatabase();
  // Runtime reads never seed customer databases. Explicit seed scripts are separate.
}

export async function getVenues() {
  if (!isMongoConfigured()) {
    return clone(getMockStore().venues);
  }

  await ensureSeedData();
  const venues = await VenueModel.find({}).sort({ createdAt: -1 });
  return venues.map(normalizeVenue);
}

export async function getApprovedPublicVenues() {
  const venues = await getVenues();
  if (isDemoMode()) return [];
  const reviewed = new Set(await OperationsModel.distinct("venueId", { review: "approved" }));
  return venues
    .filter((venue) => venue.isApproved && reviewed.has(venue._id))
    .map((venue) => ({
      _id: venue._id,
      name: venue.name,
      type: venue.type,
      city: venue.city,
      state: venue.state,
      address: venue.address,
      customItemCategories: venue.customItemCategories
    }));
}

export async function getVenueById(id: string) {
  if (!isMongoConfigured()) {
    return getMockStore().venues.find((venue) => venue._id === id) ?? null;
  }

  await ensureSeedData();
  const venue = await VenueModel.findById(id);
  return venue ? normalizeVenue(venue) : null;
}

export async function createVenueRegistration(input: VenueRegistrationInput) {
  const venuePayload = {
    name: input.name,
    type: input.type,
    city: input.city,
    state: input.state,
    address: input.address,
    pincode: input.pincode,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    contactEmail: "",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES[input.type],
    customInstructions: DEFAULT_INSTRUCTIONS[input.type],
    thermalPrinterSize: "58mm" as const,
    isApproved: false,
    operatorPhones: [input.contactPhone],
    operatingHours: "08:00 AM - 08:00 PM",
    subscriptionStatus: "none" as const,
    createdAt: nowIso(),
    brandColor: undefined,
    averageRating: 0
  };

  if (!isMongoConfigured()) {
    const store = getMockStore();
    const venue: Venue = {
      _id: crypto.randomUUID(),
      ...venuePayload
    };
    store.venues.unshift(venue);
    store.operators.unshift({
      _id: crypto.randomUUID(),
      name: input.contactName,
      phone: input.contactPhone,
      venueId: venue._id,
      role: "admin",
      isActive: true,
      totalCheckinsHandled: 0,
      createdAt: nowIso()
    });
    return venue;
  }

  await ensureSeedData();
  const createdVenue = await VenueModel.create(venuePayload);
  await OperatorModel.create({
    name: input.contactName,
    phone: input.contactPhone,
    venueId: createdVenue._id,
    role: "admin",
    isActive: true,
    totalCheckinsHandled: 0
  });

  return normalizeVenue(createdVenue);
}

export async function updateVenueSettings(venueId: string, input: VenueSettingsInput) {
  if (!isMongoConfigured()) {
    const store = getMockStore();
    const venue = store.venues.find((item) => item._id === venueId);
    if (!venue) return null;
    Object.assign(venue, input);
    await upsertVenueOperators(venueId, input.operatorPhones, venue.contactName);
    return clone(venue);
  }

  await ensureSeedData();
  const updated = await VenueModel.findByIdAndUpdate(
    venueId,
    { ...input },
    { new: true }
  );
  if (!updated) return null;
  await upsertVenueOperators(venueId, input.operatorPhones, updated.contactName);
  return normalizeVenue(updated);
}

export async function updateVenueApproval(venueId: string, isApproved: boolean) {
  if (!isMongoConfigured()) {
    const venue = getMockStore().venues.find((item) => item._id === venueId);
    if (!venue) return null;
    venue.isApproved = isApproved;
    return clone(venue);
  }

  await ensureSeedData();
  const updated = await VenueModel.findByIdAndUpdate(venueId, { isApproved }, { new: true });
  return updated ? normalizeVenue(updated) : null;
}

export interface VenueSubscriptionUpdate {
  status: SubscriptionStatus;
  expiresAt?: string;
  notes?: string;
}

/**
 * Manual subscription management: the venue pays via UPI off-platform and the
 * admin activates/renews the subscription here. No payment gateway involved.
 */
export async function updateVenueSubscription(venueId: string, input: VenueSubscriptionUpdate) {
  const patch = {
    subscriptionStatus: input.status,
    subscriptionExpiresAt: input.expiresAt || undefined,
    subscriptionNotes: input.notes || undefined
  };

  if (!isMongoConfigured()) {
    const venue = getMockStore().venues.find((item) => item._id === venueId);
    if (!venue) return null;
    venue.subscriptionStatus = patch.subscriptionStatus;
    venue.subscriptionExpiresAt = patch.subscriptionExpiresAt;
    venue.subscriptionNotes = patch.subscriptionNotes;
    return clone(venue);
  }

  await ensureSeedData();
  const updated = await VenueModel.findByIdAndUpdate(venueId, patch, { new: true });
  return updated ? normalizeVenue(updated) : null;
}

export async function getOperatorByPhone(phone: string) {
  if (!isMongoConfigured()) {
    return getMockStore().operators.find((operator) => operator.phone === phone && operator.isActive) ?? null;
  }

  await ensureSeedData();
  const operator = await OperatorModel.findOne({ phone, isActive: true });
  return operator ? normalizeOperator(operator) : null;
}

export async function getOperatorsByVenue(venueId: string) {
  if (!isMongoConfigured()) {
    return getMockStore().operators.filter((operator) => operator.venueId === venueId);
  }

  await ensureSeedData();
  const operators = await OperatorModel.find({ venueId }).sort({ createdAt: -1 });
  return operators.map(normalizeOperator);
}

function matchesDepositFilters(deposit: Deposit, filters: DepositSearchFilters) {
  if (filters.venueId && deposit.venueId !== filters.venueId) return false;
  if (filters.status && resolveDepositStatus(deposit.status, deposit.checkInTime, deposit.returnTime) !== filters.status) {
    return false;
  }

  if (filters.query) {
    const query = filters.query.toLowerCase();
    const haystack = [
      deposit.tokenId,
      deposit.visitorName,
      deposit.visitorPhone,
      deposit.guardianPhone,
      deposit.venueName
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  return true;
}

export async function getDeposits(filters: DepositSearchFilters = {}) {
  if (!isMongoConfigured()) {
    return getMockStore().deposits.filter((deposit) => matchesDepositFilters(deposit, filters));
  }

  await ensureSeedData();
  const query: Record<string, unknown> = {};
  if (filters.venueId) query.venueId = filters.venueId;
  const deposits = await DepositModel.find(query).sort({ createdAt: -1 });
  return deposits.map(normalizeDeposit).filter((deposit) => matchesDepositFilters(deposit, filters));
}

export async function searchDeposits(query: string, venueId?: string) {
  return getDeposits({ query, venueId });
}

export async function getDepositByTokenId(tokenId: string) {
  if (!isMongoConfigured()) {
    return getMockStore().deposits.find((deposit) => deposit.tokenId === tokenId) ?? null;
  }

  await ensureSeedData();
  const deposit = await DepositModel.findOne({ tokenId });
  return deposit ? normalizeDeposit(deposit) : null;
}

export async function getDepositByShortCode(shortCode: string) {
  if (!isMongoConfigured()) {
    return getMockStore().deposits.find((deposit) => deposit.shortUrl === buildShortUrl(shortCode)) ?? null;
  }

  await ensureSeedData();
  const deposit = await DepositModel.findOne({ shortUrl: buildShortUrl(shortCode) });
  return deposit ? normalizeDeposit(deposit) : null;
}

async function getNextTokenSequence(venueId: string): Promise<number> {
  const key = `deposit-seq:${venueId}`;

  if (!isMongoConfigured()) {
    const store = getMockStore();
    store.counters[key] = (store.counters[key] ?? 0) + 1;
    return store.counters[key];
  }

  await connectToDatabase();
  const counter = await CounterModel.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq as number;
}

export async function createDeposit(input: CreateDepositInput) {
  const venue = await getVenueById(input.venueId);
  if (!venue) {
    throw new Error("Venue not found.");
  }

  // Atomic per-venue sequence: findOneAndUpdate + $inc can never hand out the
  // same number twice, even under concurrent check-ins (the old
  // count-then-increment raced and caused duplicate-key 500s).
  const nextSequence = await getNextTokenSequence(venue._id);
  const tokenId = buildTokenId(input.venueType, nextSequence);
  const shortCode = buildShortCode(`${tokenId}-${Date.now()}`);
  const createdAt = nowIso();

  const deposit: Deposit = withDerivedStatus({
    _id: crypto.randomUUID(),
    tokenId,
    visitorName: input.visitorName,
    visitorPhone: input.visitorPhone,
    visitorEmail: input.visitorEmail,
    guardianName: input.guardianName,
    guardianPhone: input.guardianPhone,
    guardianEmail: input.guardianEmail,
    guardianRelation: "",
    venueId: venue._id,
    venueType: input.venueType,
    venueCity: venue.city,
    venueName: venue.name,
    itemsList: input.itemsList,
    aiDetectedItems: input.aiDetectedItems,
    operatorDetectedItems: [],
    visitorUploadPhotoUrl: input.visitorUploadPhotoUrl,
    operatorCapturedPhotoUrl: "",
    itemsPhotoUrl: input.visitorUploadPhotoUrl,
    photoMismatchAlert: false,
    status: "in_custody",
    checkedInByPhone: input.checkedInByPhone,
    returnedByPhone: undefined,
    receivedByOperatorId: undefined,
    collectedByOperatorId: undefined,
    shortUrl: buildShortUrl(shortCode),
    receiptPdfUrl: "",
    checkInTime: createdAt,
    returnTime: undefined,
    collectionTime: undefined,
    printedAt: undefined,
    createdAt,
    rating: undefined,
    reviewText: undefined
  });

  await incrementOperatorCheckins(input.checkedInByPhone);

  if (!isMongoConfigured()) {
    getMockStore().deposits.unshift(deposit);
    return deposit;
  }

  await ensureSeedData();
  const created = await DepositModel.create({
    ...deposit,
    venueId: input.venueId,
    checkInTime: new Date(createdAt),
    createdAt: new Date(createdAt)
  });

  return normalizeDeposit(created);
}

export async function updateDepositReceipt(tokenId: string, receiptPdfUrl: string) {
  const printedAt = nowIso();

  if (!isMongoConfigured()) {
    const deposit = getMockStore().deposits.find((item) => item.tokenId === tokenId);
    if (deposit) {
      deposit.receiptPdfUrl = receiptPdfUrl;
      deposit.printedAt = printedAt;
    }
    return deposit ?? null;
  }

  await ensureSeedData();
  const updated = await DepositModel.findOneAndUpdate(
    { tokenId },
    { receiptPdfUrl, printedAt: new Date(printedAt) },
    { new: true }
  );
  return updated ? normalizeDeposit(updated) : null;
}

export async function markDepositStored(
  tokenId: string,
  operatorPhone: string,
  operatorCapturedPhotoUrl: string,
  operatorDetectedItems: string[],
  photoMismatchAlert: boolean
) {
  if (!isMongoConfigured()) {
    const deposit = getMockStore().deposits.find((item) => item.tokenId === tokenId);
    if (!deposit) return null;
    deposit.operatorCapturedPhotoUrl = operatorCapturedPhotoUrl;
    deposit.operatorDetectedItems = operatorDetectedItems;
    deposit.photoMismatchAlert = photoMismatchAlert;
    deposit.itemsPhotoUrl = operatorCapturedPhotoUrl || deposit.visitorUploadPhotoUrl;
    deposit.status = resolveDepositStatus("in_custody", deposit.checkInTime, deposit.returnTime);
    return clone(deposit);
  }

  await ensureSeedData();
  const updated = await DepositModel.findOneAndUpdate(
    { tokenId },
    {
      operatorCapturedPhotoUrl,
      operatorDetectedItems,
      photoMismatchAlert,
      itemsPhotoUrl: operatorCapturedPhotoUrl,
      status: "in_custody"
    },
    { new: true }
  );
  return updated ? normalizeDeposit(updated) : null;
}

export async function markDepositReturned(tokenId: string, operatorPhone: string) {
  const returnTime = nowIso();

  if (!isMongoConfigured()) {
    const deposit = getMockStore().deposits.find((item) => item.tokenId === tokenId);
    if (!deposit) return null;
    deposit.status = "returned";
    deposit.returnedByPhone = operatorPhone;
    deposit.returnTime = returnTime;
    deposit.collectionTime = returnTime;
    return clone(deposit);
  }

  await ensureSeedData();
  const updated = await DepositModel.findOneAndUpdate(
    { tokenId },
    {
      status: "returned",
      returnedByPhone: operatorPhone,
      returnTime: new Date(returnTime),
      collectionTime: new Date(returnTime)
    },
    { new: true }
  );
  return updated ? normalizeDeposit(updated) : null;
}

export async function markDepositReceived(tokenId: string, operatorId: string) {
  const deposit = await getDepositByTokenId(tokenId);
  if (!deposit) return null;
  return markDepositStored(
    tokenId,
    deposit.checkedInByPhone,
    deposit.operatorCapturedPhotoUrl || deposit.visitorUploadPhotoUrl || "",
    deposit.operatorDetectedItems,
    deposit.photoMismatchAlert
  );
}

export async function markDepositCollected(tokenId: string, operatorId: string) {
  const operator = await getOperatorsByVenue((await getDepositByTokenId(tokenId))?.venueId ?? "");
  const phone = operator.find((item) => item._id === operatorId)?.phone ?? "";
  return markDepositReturned(tokenId, phone);
}

export async function getDashboardStats(venueId: string): Promise<DashboardStats> {
  const deposits = await getDeposits({ venueId });
  const today = new Date().toDateString();
  return {
    itemsInCustody: deposits.filter((deposit) => deposit.status !== "returned").length,
    returnedToday: deposits.filter(
      (deposit) =>
        deposit.status === "returned" &&
        deposit.returnTime &&
        new Date(deposit.returnTime).toDateString() === today
    ).length,
    overdueCount: deposits.filter((deposit) => deposit.status === "overdue").length,
    totalToday: deposits.filter((deposit) => new Date(deposit.createdAt).toDateString() === today).length
  };
}

export async function getAnalyticsSummary(venueId: string): Promise<AnalyticsSummary> {
  const [deposits, operators] = await Promise.all([
    getDeposits({ venueId }),
    getOperatorsByVenue(venueId)
  ]);

  const now = new Date();
  const weeklyMap = new Map<string, number>();
  const peakMap = new Map<string, number>();
  const itemMap = new Map<string, number>();
  const staffMap = new Map<string, StaffPerformance>();
  const returnMinutes: number[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const label = date.toLocaleDateString("en-IN", {
      weekday: "short",
      timeZone: "Asia/Kolkata"
    });
    weeklyMap.set(label, 0);
  }

  operators.forEach((operator) => {
    staffMap.set(operator.phone, {
      name: operator.name,
      phone: operator.phone,
      handled: 0
    });
  });

  deposits.forEach((deposit) => {
    const date = new Date(deposit.createdAt);
    const dayLabel = date.toLocaleDateString("en-IN", {
      weekday: "short",
      timeZone: "Asia/Kolkata"
    });
    weeklyMap.set(dayLabel, (weeklyMap.get(dayLabel) ?? 0) + 1);

    const hourLabel = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
    peakMap.set(hourLabel, (peakMap.get(hourLabel) ?? 0) + 1);

    deposit.itemsList.forEach((item) => itemMap.set(item, (itemMap.get(item) ?? 0) + 1));

    if (deposit.checkedInByPhone) {
      const entry = staffMap.get(deposit.checkedInByPhone) ?? {
        name: deposit.checkedInByPhone,
        phone: deposit.checkedInByPhone,
        handled: 0
      };
      entry.handled += 1;
      staffMap.set(deposit.checkedInByPhone, entry);
    }

    if (deposit.returnTime) {
      const minutes =
        (new Date(deposit.returnTime).getTime() - new Date(deposit.checkInTime).getTime()) /
        (1000 * 60);
      if (minutes > 0) returnMinutes.push(minutes);
    }
  });

  const itemBreakdown = [...itemMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      label,
      value,
      color: ["#1E3A8A", "#10B981", "#F59E0B", "#EF4444", "#0F766E"][index % 5]
    }));

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const totalItemsThisMonth = deposits
    .filter((deposit) => {
      const created = new Date(deposit.createdAt);
      return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    })
    .reduce((sum, deposit) => sum + deposit.itemsList.length, 0);

  const topPeakHour =
    [...peakMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "9 AM";

  return {
    weeklyCheckIns: [...weeklyMap.entries()].map(([label, value]) => ({ label, value })),
    peakHours: [...peakMap.entries()].map(([label, value]) => ({ label, value })),
    itemBreakdown,
    staffSuggestion: `Peak rush appears around ${topPeakHour}. Keep one extra operator ready during that window.`,
    averageReturnMinutes:
      returnMinutes.length > 0
        ? Math.round(returnMinutes.reduce((sum, value) => sum + value, 0) / returnMinutes.length)
        : 0,
    totalItemsThisMonth,
    staffPerformance: [...staffMap.values()].sort((a, b) => b.handled - a.handled)
  };
}

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  const [venues, deposits] = await Promise.all([getVenues(), getDeposits()]);
  return {
    totalVenues: venues.length,
    approvedVenues: venues.filter((venue) => venue.isApproved).length,
    liveDeposits: deposits.filter((deposit) => deposit.status !== "returned").length,
    totalDeposits: deposits.length,
    citiesCovered: new Set(venues.map((venue) => venue.city)).size
  };
}

export async function getPublicStats(): Promise<PublicStats> {
  if (!isDemoMode()) {
    const venues = await getApprovedPublicVenues();
    const ids = venues.map((venue) => venue._id);
    const [total, live, today, itemCounts] = await Promise.all([
      CustodyModel.countDocuments({ venueId: { $in: ids } }),
      CustodyModel.countDocuments({ venueId: { $in: ids }, state: "STORED" }),
      CustodyModel.countDocuments({ venueId: { $in: ids }, createdAt: { $gte: new Date(new Date().toISOString().slice(0, 10)) } }),
      CustodyModel.aggregate([{ $match: { venueId: { $in: ids }, state: { $in: ["STORED", "RETURNED"] } } }, { $unwind: "$items" }, { $group: { _id: null, total: { $sum: "$items.quantity" } } }])
    ]);
    return { totalVenues: venues.length, approvedVenues: venues.length, totalDeposits: total, liveDeposits: live, citiesCovered: new Set(venues.map((v) => v.city)).size, venueTypes: new Set(venues.map((v) => v.type)).size, todayDeposits: today, itemsSecured: itemCounts[0]?.total || 0 };
  }
  return { totalVenues: 0, approvedVenues: 0, totalDeposits: 0, liveDeposits: 0, citiesCovered: 0, venueTypes: 0, todayDeposits: 0, itemsSecured: 0 };
  /* Legacy demo metrics are deliberately excluded from public traction.
  const [venues, deposits] = await Promise.all([getVenues(), getDeposits()]);
  const approvedVenues = venues.filter((venue) => venue.isApproved);
  const today = new Date().toDateString();

  return {
    totalVenues: venues.length,
    approvedVenues: approvedVenues.length,
    liveDeposits: deposits.filter((deposit) => deposit.status !== "returned").length,
    totalDeposits: deposits.length,
    citiesCovered: new Set(approvedVenues.map((venue) => venue.city)).size,
    venueTypes: new Set(approvedVenues.map((venue) => venue.type)).size,
    todayDeposits: deposits.filter((deposit) => new Date(deposit.createdAt).toDateString() === today).length,
    itemsSecured: deposits.reduce((count, deposit) => count + deposit.itemsList.length, 0)
  };
  */
}

export async function createWaitlistEntry(input: WaitlistInput) {
  const payload = {
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    venueName: input.venueName.trim(),
    venueType: input.venueType ?? "exam",
    city: input.city.trim(),
    status: "pending" as const,
    createdAt: nowIso()
  };

  if (!payload.email || !payload.phone || !payload.venueName || !payload.city) {
    throw new Error("Email, phone, venue name, and city are required.");
  }

  if (!isMongoConfigured()) {
    const store = getMockStore();
    const existing = store.waitlist.find((entry) => entry.email === payload.email || entry.phone === payload.phone);
    if (existing) return clone(existing);

    const entry: WaitlistEntry = {
      _id: crypto.randomUUID(),
      ...payload
    };
    store.waitlist.unshift(entry);
    return clone(entry);
  }

  await ensureSeedData();
  const entry = await WaitlistModel.findOneAndUpdate(
    { $or: [{ email: payload.email }, { phone: payload.phone }] },
    payload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return normalizeWaitlistEntry(entry);
}

export async function getWaitlistEntries() {
  if (!isMongoConfigured()) {
    return clone(getMockStore().waitlist).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  await ensureSeedData();
  const entries = await WaitlistModel.find({}).sort({ createdAt: -1 });
  return entries.map(normalizeWaitlistEntry);
}

export async function getWaitlistCount() {
  if (!isMongoConfigured()) {
    return 0;
  }

  await ensureSeedData();
  return WaitlistModel.countDocuments();
}
