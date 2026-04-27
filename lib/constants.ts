import {
  Deposit,
  MarketStat,
  Operator,
  Testimonial,
  Venue,
  VenueType,
  VenueTypeMeta
} from "@/types";

type SeedVenue = Omit<Venue, "_id"> & { seedKey: string };

type SeedOperator = Omit<Operator, "_id" | "venueId" | "createdAt"> & {
  venueSeedKey: string;
};

type SeedDepositTemplate = Omit<
  Deposit,
  | "_id"
  | "venueId"
  | "venueName"
  | "venueCity"
  | "checkInTime"
  | "createdAt"
  | "returnTime"
  | "printedAt"
  | "itemsPhotoUrl"
> & {
  venueSeedKey: string;
  hoursAgo: number;
};

const createdAt = "2026-04-17T08:00:00.000Z";

export const APP_NAME = "SafeTag";
export const APP_TAGLINE =
  "India's first hardware-free, software-only Universal Secure Belongings Management Platform.";
export const DEMO_OTP = "123456";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register Venue" },
  { href: "/nearby", label: "Find Operator" },
  { href: "/login", label: "Operator Login" },
  { href: "/dashboard", label: "Dashboard" }
];

export const VENUE_TYPE_META: Record<VenueType, VenueTypeMeta> = {
  exam: {
    label: "Exam Center",
    bilingualLabel: "Exam Center / Pariksha Kendra",
    shortCode: "EXAM",
    brandColor: "#1E3A8A",
    instructionsTitle: "Exam counter guide",
    heroLabel: "Fast check-in for high-pressure exam mornings"
  },
  temple: {
    label: "Temple",
    bilingualLabel: "Temple / Mandir",
    shortCode: "TMP",
    brandColor: "#D97706",
    instructionsTitle: "Mandir deposit guide",
    heroLabel: "Queue-safe storage for darshan rush"
  },
  park: {
    label: "National Park",
    bilingualLabel: "National Park / Van Kshetra",
    shortCode: "PARK",
    brandColor: "#0F766E",
    instructionsTitle: "Wildlife entry guide",
    heroLabel: "Photo-proof custody at entry gates"
  },
  museum: {
    label: "Museum",
    bilingualLabel: "Museum / Sangrahalaya",
    shortCode: "MUS",
    brandColor: "#475569",
    instructionsTitle: "Museum cloakroom guide",
    heroLabel: "Calm, secure drop-off before galleries"
  },
  religious: {
    label: "Religious Place",
    bilingualLabel: "Religious Place / Dharam Sthal",
    shortCode: "REL",
    brandColor: "#7C3AED",
    instructionsTitle: "Religious venue guide",
    heroLabel: "Respectful belongings management for faith spaces"
  },
  amusement: {
    label: "Amusement Park",
    bilingualLabel: "Amusement Park / Manoranjan Park",
    shortCode: "FUN",
    brandColor: "#0EA5E9",
    instructionsTitle: "Ride-safe storage guide",
    heroLabel: "Web-only storage for rides and water parks"
  },
  govt: {
    label: "Government Building",
    bilingualLabel: "Government Building / Sarkari Bhavan",
    shortCode: "GOVT",
    brandColor: "#334155",
    instructionsTitle: "Security checkpoint guide",
    heroLabel: "Proof-led flow for high-security entry points"
  },
  event: {
    label: "Event Venue",
    bilingualLabel: "Event Venue / Karyakram Sthal",
    shortCode: "EVNT",
    brandColor: "#BE123C",
    instructionsTitle: "Event deposit guide",
    heroLabel: "Crowd-ready custody for concerts and VIP events"
  }
};

export const DEFAULT_ITEM_CATEGORIES: Record<VenueType, string[]> = {
  exam: [
    "Mobile Phone",
    "Wallet",
    "Watch",
    "Keys",
    "Earphones",
    "Bag",
    "Water Bottle",
    "Other"
  ],
  temple: ["Mobile Phone", "Shoes", "Bag", "Camera", "Wallet", "Other"],
  religious: ["Mobile Phone", "Shoes", "Bag", "Camera", "Wallet", "Other"],
  park: ["Camera", "Bag", "Food Items", "Mobile Phone", "Binoculars", "Other"],
  amusement: ["Mobile Phone", "Wallet", "Bag", "Valuables", "Other"],
  museum: ["Camera", "Bag", "Umbrella", "Food Items", "Other"],
  govt: ["Mobile Phone", "Wallet", "Bag", "Keys", "ID Card", "Other"],
  event: ["Mobile Phone", "Wallet", "Bag", "Keys", "ID Card", "Other"]
};

export const DEFAULT_INSTRUCTIONS: Record<VenueType, string> = {
  exam:
    "Counter par aaiye, details verify kijiye, QR receipt lijiye, aur exam ke baad same QR se samaan wapas lijiye.",
  temple:
    "Phones, bags, aur footwear yahan safely jama kar sakte hain. Return ke time QR slip ya token URL dikhaiye.",
  religious:
    "Respectful, queue-friendly deposit flow with bilingual instructions and quick return at exit.",
  park:
    "Entry se pehle restricted items yahan jama kariye. Operator photo proof ke saath secure tracking karega.",
  museum:
    "Large bags, umbrellas, aur camera items ko counter par deposit karke QR receipt lekar aage badhiye.",
  amusement:
    "Rides aur water activities ke pehle valuables jama kariye. Return ke time same QR show kariye.",
  govt:
    "Security-restricted items ko entry se pehle jama karke QR token lijiye. Staff photo proof maintain karega.",
  event:
    "Concerts aur VIP events ke liye fast counter flow. QR scan karke same token se items collect kijiye."
};

export const HOW_IT_WORKS_VISITOR = [
  "Counter pe aao",
  "Saman jama karo, QR slip lo",
  "Operator items ka photo leta hai",
  "Wapas aao, QR scan karo, saman verified wapas lo"
];

export const HOW_IT_WORKS_VENUE = [
  "Free mein register karo",
  "Staff ko access do",
  "Kal se shuru karo, koi hardware nahi"
];

export const MARKET_STATS: MarketStat[] = [
  { value: "7,50,000+", label: "Temples in India" },
  { value: "3,00,000+", label: "Mosques in India" },
  { value: "7,657", label: "Gurudwaras in India" },
  { value: "106 + 573", label: "National parks and sanctuaries" },
  { value: "1,001+", label: "Amusement and water parks" },
  { value: "86 Lakh+", label: "Students taking competitive exams yearly" },
  { value: "0", label: "Standard digital belongings systems today" }
];

export const PROBLEM_POINTS = [
  "Student roadside dukaan pe phone rakhta hai",
  "Koi receipt nahi, koi proof nahi",
  "Items mix-up ya loss ho jata hai",
  "Parents ko real-time update nahi milta"
];

export const SOLUTION_POINTS = [
  "Digital QR receipt instantly",
  "Items ka photo proof stored",
  "Real-time WhatsApp alerts to guardian",
  "AI item detection without extra hardware"
];

export const COMPETITOR_ROWS = [
  ["Hardware cost", "Rs 1-2 lakh per unit", "Zero hardware, web app only"],
  ["Go-live speed", "Installation required", "Same-week launch"],
  ["Ideal footprint", "Large venues only", "Tier-2, tier-3, exam centers, mandirs"],
  ["Operator workflow", "Custom devices needed", "Any phone, tablet, or laptop"]
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sajid Khan",
    role: "Exam Center Coordinator, Lucknow",
    quote:
      "Students aur parents dono ko WhatsApp receipt milti hai, isliye panic calls almost band ho gaye."
  },
  {
    name: "Ritu Sharma",
    role: "Temple Operations Lead, Ayodhya",
    quote:
      "Manual slips ke jagah photo proof aur QR aane se trust turant improve hua."
  },
  {
    name: "Arjun Nair",
    role: "Wildlife Gate Manager, Ramnagar",
    quote:
      "No hardware, no counter rebuild. Existing staff ne ek din mein system adopt kar liya."
  }
];

export const PITCH_COPY = {
  problem:
    "India mein 10 lakh+ jagah hain jahan log apna saman andar nahi le ja sakte. Temples, exam centers, parks, museums. Koi proper system nahi. Log roadside dukaan pe risk pe rakhte hain. Koi receipt nahi. Koi proof nahi.",
  solution:
    "SafeTag ek software-only platform hai. Visitor counter pe aata hai. Staff items register karta hai. Items ka photo liya jaata hai proof ke liye. QR slip milti hai phone pe bhi, print bhi. Same QR se items verified wapas milte hain.",
  differentiation:
    "SafeCloak aur Tuckit ko Rs 1-2 lakh ka hardware lagana padta hai. Hum software-only hain. Isliye exam centers, chhote mandirs, aur tier-2/3 cities mein bhi instantly deploy ho sakte hain.",
  market:
    "7.5 lakh temples + 3 lakh mosques + 7,657 gurudwaras + 86 lakh exam students + 1,000 amusement parks = crores of users in India."
};

export const DEMO_OPERATOR_PHONES = [
  "+919811110001",
  "+919811110002",
  "+919811110003",
  "+919811110004",
  "+919811110005",
  "+919811110006"
];

export const SEED_VENUES: SeedVenue[] = [
  {
    seedKey: "exam-st-xavier",
    name: "St. Xavier's CBT Center",
    type: "exam",
    city: "Lucknow",
    state: "UP",
    address: "Civil Lines, Hazratganj Road",
    pincode: "226001",
    contactName: "Anubhav Singh",
    contactPhone: "+919811110001",
    contactEmail: "ops@stxaviercbt.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.exam,
    customInstructions: DEFAULT_INSTRUCTIONS.exam,
    thermalPrinterSize: "58mm",
    isApproved: true,
    operatorPhones: ["+919811110001", "+919811110002"],
    operatingHours: "06:00 AM - 08:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.exam.brandColor
  },
  {
    seedKey: "exam-dps-delhi",
    name: "DPS Computer Center",
    type: "exam",
    city: "New Delhi",
    state: "Delhi",
    address: "Sector 12, Dwarka",
    pincode: "110075",
    contactName: "Niharika Bansal",
    contactPhone: "+919811110003",
    contactEmail: "hello@dpscbt.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.exam,
    customInstructions: DEFAULT_INSTRUCTIONS.exam,
    thermalPrinterSize: "80mm",
    isApproved: true,
    operatorPhones: ["+919811110003"],
    operatingHours: "06:00 AM - 08:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.exam.brandColor
  },
  {
    seedKey: "exam-kv-patna",
    name: "Kendriya Vidyalaya Hub",
    type: "exam",
    city: "Patna",
    state: "Bihar",
    address: "Bailey Road",
    pincode: "800014",
    contactName: "Rohit Kumar",
    contactPhone: "+919811110004",
    contactEmail: "patna@kvhub.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.exam,
    customInstructions: DEFAULT_INSTRUCTIONS.exam,
    thermalPrinterSize: "58mm",
    isApproved: true,
    operatorPhones: ["+919811110004"],
    operatingHours: "06:30 AM - 07:30 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.exam.brandColor
  },
  {
    seedKey: "temple-kashi",
    name: "Kashi Vishwanath Counter",
    type: "temple",
    city: "Varanasi",
    state: "UP",
    address: "Lahori Tola",
    pincode: "221001",
    contactName: "Shivam Tiwari",
    contactPhone: "+919811110005",
    contactEmail: "kashi@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.temple,
    customInstructions: DEFAULT_INSTRUCTIONS.temple,
    thermalPrinterSize: "80mm",
    isApproved: true,
    operatorPhones: ["+919811110005"],
    operatingHours: "04:00 AM - 11:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.temple.brandColor
  },
  {
    seedKey: "temple-ram-mandir",
    name: "Ram Mandir Deposit",
    type: "temple",
    city: "Ayodhya",
    state: "UP",
    address: "Janmabhoomi Path",
    pincode: "224123",
    contactName: "Mahima Gupta",
    contactPhone: "+919811110006",
    contactEmail: "rammandir@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.temple,
    customInstructions: DEFAULT_INSTRUCTIONS.temple,
    thermalPrinterSize: "80mm",
    isApproved: true,
    operatorPhones: ["+919811110006"],
    operatingHours: "05:00 AM - 10:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.temple.brandColor
  },
  {
    seedKey: "temple-iskcon-delhi",
    name: "ISKCON Temple",
    type: "religious",
    city: "New Delhi",
    state: "Delhi",
    address: "Sant Nagar, East of Kailash",
    pincode: "110065",
    contactName: "Prerna Das",
    contactPhone: "+919855552221",
    contactEmail: "iskcon@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.religious,
    customInstructions: DEFAULT_INSTRUCTIONS.religious,
    thermalPrinterSize: "58mm",
    isApproved: true,
    operatorPhones: ["+919855552221"],
    operatingHours: "04:30 AM - 09:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.religious.brandColor
  },
  {
    seedKey: "park-corbett",
    name: "Jim Corbett Entry Gate",
    type: "park",
    city: "Ramnagar",
    state: "Uttarakhand",
    address: "Dhikuli Gate",
    pincode: "244715",
    contactName: "Arjun Nair",
    contactPhone: "+919844441234",
    contactEmail: "corbett@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.park,
    customInstructions: DEFAULT_INSTRUCTIONS.park,
    thermalPrinterSize: "80mm",
    isApproved: true,
    operatorPhones: ["+919844441234"],
    operatingHours: "05:30 AM - 06:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.park.brandColor
  },
  {
    seedKey: "park-dudhwa",
    name: "Dudhwa Tiger Reserve",
    type: "park",
    city: "Lakhimpur",
    state: "UP",
    address: "Palia Kalan",
    pincode: "262902",
    contactName: "Farhan Ali",
    contactPhone: "+919877771234",
    contactEmail: "dudhwa@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.park,
    customInstructions: DEFAULT_INSTRUCTIONS.park,
    thermalPrinterSize: "58mm",
    isApproved: true,
    operatorPhones: ["+919877771234"],
    operatingHours: "06:00 AM - 05:30 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.park.brandColor
  },
  {
    seedKey: "park-ranthambore",
    name: "Ranthambore Gate 1",
    type: "park",
    city: "Sawai Madhopur",
    state: "Rajasthan",
    address: "Zone 1 Entry Road",
    pincode: "322001",
    contactName: "Pooja Meena",
    contactPhone: "+919866661234",
    contactEmail: "ranthambore@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.park,
    customInstructions: DEFAULT_INSTRUCTIONS.park,
    thermalPrinterSize: "80mm",
    isApproved: true,
    operatorPhones: ["+919866661234"],
    operatingHours: "05:30 AM - 06:30 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.park.brandColor
  },
  {
    seedKey: "museum-national",
    name: "National Museum Counter",
    type: "museum",
    city: "New Delhi",
    state: "Delhi",
    address: "Janpath",
    pincode: "110011",
    contactName: "Aditi Rao",
    contactPhone: "+919833331234",
    contactEmail: "museum@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.museum,
    customInstructions: DEFAULT_INSTRUCTIONS.museum,
    thermalPrinterSize: "58mm",
    isApproved: true,
    operatorPhones: ["+919833331234"],
    operatingHours: "10:00 AM - 06:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.museum.brandColor
  },
  {
    seedKey: "museum-indian",
    name: "Indian Museum Cloakroom",
    type: "museum",
    city: "Kolkata",
    state: "West Bengal",
    address: "Jawaharlal Nehru Road",
    pincode: "700016",
    contactName: "Soham Dutta",
    contactPhone: "+919822221234",
    contactEmail: "indianmuseum@safetag.in",
    logoUrl: "/icons/safetag-icon.svg",
    customItemCategories: DEFAULT_ITEM_CATEGORIES.museum,
    customInstructions: DEFAULT_INSTRUCTIONS.museum,
    thermalPrinterSize: "80mm",
    isApproved: true,
    operatorPhones: ["+919822221234"],
    operatingHours: "10:00 AM - 05:00 PM",
    createdAt,
    brandColor: VENUE_TYPE_META.museum.brandColor
  }
];

export const SEED_OPERATORS: SeedOperator[] = [
  {
    name: "Anubhav Singh",
    phone: "+919811110001",
    venueSeedKey: "exam-st-xavier",
    role: "operator",
    isActive: true,
    totalCheckinsHandled: 84
  },
  {
    name: "Megha Verma",
    phone: "+919811110002",
    venueSeedKey: "exam-st-xavier",
    role: "admin",
    isActive: true,
    totalCheckinsHandled: 112
  },
  {
    name: "Niharika Bansal",
    phone: "+919811110003",
    venueSeedKey: "exam-dps-delhi",
    role: "admin",
    isActive: true,
    totalCheckinsHandled: 65
  },
  {
    name: "Rohit Kumar",
    phone: "+919811110004",
    venueSeedKey: "exam-kv-patna",
    role: "operator",
    isActive: true,
    totalCheckinsHandled: 43
  },
  {
    name: "Shivam Tiwari",
    phone: "+919811110005",
    venueSeedKey: "temple-kashi",
    role: "admin",
    isActive: true,
    totalCheckinsHandled: 131
  },
  {
    name: "Mahima Gupta",
    phone: "+919811110006",
    venueSeedKey: "temple-ram-mandir",
    role: "operator",
    isActive: true,
    totalCheckinsHandled: 98
  }
];

export const SEED_DEPOSIT_TEMPLATES: SeedDepositTemplate[] = [
  {
    tokenId: "ST-EXAM-00119",
    visitorName: "Rahul Sharma",
    visitorPhone: "+919812345678",
    guardianName: "Pooja Sharma",
    guardianPhone: "+919800000111",
    guardianRelation: "Mother",
    venueSeedKey: "exam-st-xavier",
    venueType: "exam",
    itemsList: ["Mobile Phone", "Wallet", "Keys"],
    aiDetectedItems: ["Mobile Phone", "Wallet"],
    operatorDetectedItems: ["Mobile Phone", "Wallet", "Keys"],
    visitorUploadPhotoUrl: "",
    operatorCapturedPhotoUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    photoMismatchAlert: false,
    status: "in_custody",
    checkedInByPhone: "+919811110001",
    returnedByPhone: undefined,
    receivedByOperatorId: undefined,
    collectedByOperatorId: undefined,
    shortUrl: "/r/exam00119",
    receiptPdfUrl: "",
    rating: undefined,
    reviewText: undefined,
    hoursAgo: 2.25
  },
  {
    tokenId: "ST-EXAM-00118",
    visitorName: "Nandini Singh",
    visitorPhone: "+919899991111",
    guardianName: "Suresh Singh",
    guardianPhone: "+919855550001",
    guardianRelation: "Father",
    venueSeedKey: "exam-dps-delhi",
    venueType: "exam",
    itemsList: ["Mobile Phone", "Bag", "Water Bottle"],
    aiDetectedItems: ["Mobile Phone", "Bag"],
    operatorDetectedItems: ["Mobile Phone", "Bag"],
    visitorUploadPhotoUrl: "",
    operatorCapturedPhotoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    photoMismatchAlert: true,
    status: "overdue",
    checkedInByPhone: "+919811110003",
    returnedByPhone: undefined,
    receivedByOperatorId: undefined,
    collectedByOperatorId: undefined,
    shortUrl: "/r/exam00118",
    receiptPdfUrl: "",
    rating: undefined,
    reviewText: undefined,
    hoursAgo: 4.4
  },
  {
    tokenId: "ST-TMP-00042",
    visitorName: "Kiran Patel",
    visitorPhone: "+919822221111",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
    venueSeedKey: "temple-kashi",
    venueType: "temple",
    itemsList: ["Mobile Phone", "Shoes"],
    aiDetectedItems: ["Mobile Phone", "Shoes"],
    operatorDetectedItems: ["Mobile Phone", "Shoes"],
    visitorUploadPhotoUrl: "",
    operatorCapturedPhotoUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    photoMismatchAlert: false,
    status: "returned",
    checkedInByPhone: "+919811110005",
    returnedByPhone: "+919811110005",
    receivedByOperatorId: undefined,
    collectedByOperatorId: undefined,
    shortUrl: "/r/tmp00042",
    receiptPdfUrl: "",
    rating: undefined,
    reviewText: undefined,
    hoursAgo: 6.2
  },
  {
    tokenId: "ST-PARK-00017",
    visitorName: "Aman Khan",
    visitorPhone: "+919844440000",
    guardianName: "Salma Khan",
    guardianPhone: "+919866660000",
    guardianRelation: "Mother",
    venueSeedKey: "park-corbett",
    venueType: "park",
    itemsList: ["Camera", "Bag", "Food Items"],
    aiDetectedItems: ["Camera", "Bag"],
    operatorDetectedItems: ["Camera", "Bag", "Food Items"],
    visitorUploadPhotoUrl: "",
    operatorCapturedPhotoUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    photoMismatchAlert: false,
    status: "in_custody",
    checkedInByPhone: "+919844441234",
    returnedByPhone: undefined,
    receivedByOperatorId: undefined,
    collectedByOperatorId: undefined,
    shortUrl: "/r/park00017",
    receiptPdfUrl: "",
    rating: undefined,
    reviewText: undefined,
    hoursAgo: 1.1
  },
  {
    tokenId: "ST-MUS-00008",
    visitorName: "Sneha Dutta",
    visitorPhone: "+919833330000",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
    venueSeedKey: "museum-national",
    venueType: "museum",
    itemsList: ["Bag", "Umbrella"],
    aiDetectedItems: ["Bag"],
    operatorDetectedItems: ["Bag", "Umbrella"],
    visitorUploadPhotoUrl: "",
    operatorCapturedPhotoUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    photoMismatchAlert: false,
    status: "returned",
    checkedInByPhone: "+919833331234",
    returnedByPhone: "+919833331234",
    receivedByOperatorId: undefined,
    collectedByOperatorId: undefined,
    shortUrl: "/r/mus00008",
    receiptPdfUrl: "",
    rating: undefined,
    reviewText: undefined,
    hoursAgo: 8.8
  }
];
