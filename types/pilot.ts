export type CustodyState = "REGISTERED" | "STORED" | "RETURNED" | "CANCELLED";
export type MessageState = "pending" | "processing" | "queued" | "sent" | "delivered" | "read" | "failed" | "not_configured" | "opted_out" | "uncertain";
export interface CustodyItem { name: string; quantity: number; condition: string; notes: string }
export interface AuditEvent { action: string; actor: string; at: Date; reason: string }
export interface NotificationJob {
  id: string; recipient: string; audience: "visitor" | "guardian"; event: "stored" | "returned";
  state: MessageState; attempts: number; nextAttemptAt: Date; leaseUntil?: Date; leaseId?: string;
  sid?: string; errorCode?: string; updatedAt: Date;
}
export interface Custody {
  _id: string; venueId: string; receiptNumber: string; requestKey: string; requestHash: string;
  nonce: string; receiptHash: string; collectionHash: string; collectionVersion: number;
  visitorName: string; visitorPhone: string; guardianPhone: string;
  visitorConsent: boolean; guardianConsent: boolean; consentAt: Date;
  items: CustodyItem[]; state: CustodyState; location?: string;
  photoAsset?: string; createdAt: Date; storedAt?: Date; returnedAt?: Date;
  acceptedBy?: string; returnedBy?: string; returnRequestKey?: string;
  amountPaise: number; pricingTerms: string;
  paymentState: "pending" | "paid" | "waived" | "refunded";
  paymentMethod: "cash" | "manual"; paymentReference?: string;
  incident: string; events: AuditEvent[]; outbox: NotificationJob[];
}
export interface VenueOperations {
  venueId: string; review: "pending" | "approved" | "rejected" | "suspended";
  hours: string; locations: string[]; acceptedItems: string[]; prohibitedItems: string[];
  feePaise: number; pricingTerms: string; retentionDays: number;
}
