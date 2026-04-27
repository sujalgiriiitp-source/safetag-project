export type VenueType =
  | "exam"
  | "temple"
  | "park"
  | "museum"
  | "religious"
  | "amusement"
  | "govt"
  | "event";

export type OperatorRole = "operator" | "admin";

export type DepositStatus =
  | "in_custody"
  | "returned"
  | "overdue"
  | "checked_in"
  | "collected"
  | "unclaimed";

export type OtpPurpose =
  | "operator_login"
  | "venue_registration"
  | "visitor_login"
  | "collect";

export interface Venue {
  _id: string;
  name: string;
  type: VenueType;
  city: string;
  state: string;
  address: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  logoUrl: string;
  customItemCategories: string[];
  customInstructions: string;
  thermalPrinterSize: "58mm" | "80mm";
  isApproved: boolean;
  operatorPhones: string[];
  operatingHours: string;
  createdAt: string;
  brandColor?: string;
  averageRating?: number;
}

export interface Operator {
  _id: string;
  name: string;
  phone: string;
  venueId: string;
  role: OperatorRole;
  isActive: boolean;
  totalCheckinsHandled: number;
  createdAt: string;
}

export interface Deposit {
  _id: string;
  tokenId: string;
  visitorName: string;
  visitorPhone: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  venueId: string;
  venueType: VenueType;
  venueCity: string;
  venueName: string;
  itemsList: string[];
  aiDetectedItems: string[];
  operatorDetectedItems: string[];
  visitorUploadPhotoUrl?: string;
  operatorCapturedPhotoUrl?: string;
  itemsPhotoUrl?: string;
  photoMismatchAlert: boolean;
  status: DepositStatus;
  checkedInByPhone: string;
  returnedByPhone?: string;
  receivedByOperatorId?: string;
  collectedByOperatorId?: string;
  shortUrl: string;
  receiptPdfUrl?: string;
  checkInTime: string;
  returnTime?: string;
  collectionTime?: string;
  printedAt?: string;
  createdAt: string;
  rating?: number;
  reviewText?: string;
}

export interface OtpSession {
  _id: string;
  phone: string;
  otp: string;
  purpose: OtpPurpose;
  expiresAt: string;
  used: boolean;
}

export interface AuthSession {
  operatorId: string;
  venueId: string;
  role: OperatorRole;
  phone: string;
  name: string;
}

export interface VenueTypeMeta {
  label: string;
  bilingualLabel: string;
  shortCode: string;
  brandColor: string;
  instructionsTitle: string;
  heroLabel: string;
}

export interface MarketStat {
  label: string;
  value: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export interface DashboardStats {
  itemsInCustody: number;
  returnedToday: number;
  overdueCount: number;
  totalToday: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ItemBreakdown {
  label: string;
  value: number;
  color: string;
}

export interface StaffPerformance {
  name: string;
  phone: string;
  handled: number;
}

export interface AnalyticsSummary {
  weeklyCheckIns: ChartPoint[];
  peakHours: ChartPoint[];
  itemBreakdown: ItemBreakdown[];
  staffSuggestion: string;
  averageReturnMinutes: number;
  totalItemsThisMonth: number;
  staffPerformance: StaffPerformance[];
}

export interface DepositSearchFilters {
  venueId?: string;
  status?: DepositStatus;
  query?: string;
}

export interface CreateDepositInput {
  visitorName: string;
  visitorPhone: string;
  guardianName?: string;
  guardianPhone?: string;
  venueId: string;
  venueType: VenueType;
  itemsList: string[];
  aiDetectedItems: string[];
  visitorUploadPhotoUrl?: string;
  checkedInByPhone: string;
}

export interface StoreDepositInput {
  tokenId: string;
  operatorPhone: string;
  operatorCapturedPhotoUrl: string;
  operatorDetectedItems: string[];
  photoMismatchAlert: boolean;
}

export interface VenueRegistrationInput {
  name: string;
  type: VenueType;
  city: string;
  state: string;
  address: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
}

export interface VenueSettingsInput {
  name: string;
  address: string;
  city: string;
  state: string;
  logoUrl: string;
  customInstructions: string;
  customItemCategories: string[];
  thermalPrinterSize: "58mm" | "80mm";
  operatorPhones: string[];
  operatingHours: string;
}

export interface PlatformSnapshot {
  totalVenues: number;
  approvedVenues: number;
  liveDeposits: number;
  totalDeposits: number;
  citiesCovered: number;
}

export interface PublicStats extends PlatformSnapshot {
  venueTypes: number;
  todayDeposits: number;
}

export interface WaitlistEntry {
  _id: string;
  email: string;
  phone: string;
  venueName: string;
  venueType?: VenueType;
  city: string;
  status: "pending" | "contacted" | "approved";
  createdAt: string;
}

export interface WaitlistInput {
  email: string;
  phone: string;
  venueName: string;
  venueType?: VenueType;
  city: string;
}
