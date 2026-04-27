import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { SendTestWhatsAppCard } from "@/components/whatsapp/send-test-whatsapp-card";
import { WhatsAppBubble } from "@/components/whatsapp/whatsapp-bubble";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";
import { getCurrentSession } from "@/lib/session";
import { getDeposits, getVenueById } from "@/lib/repository";
import {
  buildGuardianAlertMessage,
  formatWhatsappClock,
  getTemplateGallerySamples
} from "@/lib/whatsapp-templates";
import { Deposit, Venue } from "@/types";
import { maskPhone } from "@/lib/utils";

function isTodayInIndia(value?: string) {
  if (!value) return false;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date(value)) === formatter.format(new Date());
}

function createDemoDeposit(venue: Venue, guardianPhone: string, operatorPhone: string): Deposit {
  const now = new Date().toISOString();

  return {
    _id: "demo-whatsapp",
    tokenId: "ST-EXAM-DEMO1",
    visitorName: "Satyam Giri",
    visitorPhone: "+919812345678",
    guardianName: "Demo Parent",
    guardianPhone,
    guardianRelation: "Parent",
    venueId: venue._id,
    venueType: venue.type,
    venueCity: venue.city,
    venueName: venue.name,
    itemsList: ["Mobile Phone", "Wallet", "Watch"],
    aiDetectedItems: ["Mobile Phone", "Wallet"],
    operatorDetectedItems: [],
    visitorUploadPhotoUrl: "",
    operatorCapturedPhotoUrl: "",
    itemsPhotoUrl: "",
    photoMismatchAlert: false,
    status: "in_custody",
    checkedInByPhone: operatorPhone,
    shortUrl: "https://safetag.in/r/demo",
    receiptPdfUrl: "",
    checkInTime: now,
    createdAt: now
  };
}

export default async function WhatsAppDemoPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const venue = await getVenueById(session.venueId);
  if (!venue) redirect("/dashboard");

  const deposits = await getDeposits({ venueId: session.venueId });
  const todayDeposits = deposits.filter((deposit) => deposit.guardianPhone && isTodayInIndia(deposit.createdAt));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://safetag.in";
  const sampleGuardianPhone =
    todayDeposits[0]?.guardianPhone || venue.contactPhone || "+919800000111";
  const sampleDeposit = todayDeposits[0] ?? createDemoDeposit(venue, sampleGuardianPhone, session.phone);

  const timelineRows = todayDeposits
    .flatMap((deposit) => {
      const rows = [
        {
          time: deposit.checkInTime,
          phone: deposit.guardianPhone || "",
          visitor: deposit.visitorName,
          type: "Check-in Alert"
        }
      ];

      if (!deposit.returnTime && Date.now() - new Date(deposit.checkInTime).getTime() > 2 * 60 * 60 * 1000) {
        rows.push({
          time: new Date(new Date(deposit.checkInTime).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          phone: deposit.guardianPhone || "",
          visitor: deposit.visitorName,
          type: "Reminder"
        });
      }

      if (deposit.returnTime && isTodayInIndia(deposit.returnTime)) {
        rows.push({
          time: deposit.returnTime,
          phone: deposit.guardianPhone || "",
          visitor: deposit.visitorName,
          type: "Return Alert"
        });
      }

      return rows;
    })
    .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime());

  const previewMessage = buildGuardianAlertMessage({
    visitorName: sampleDeposit.visitorName,
    venueName: venue.name,
    city: venue.city,
    itemsList: sampleDeposit.itemsList,
    tokenId: sampleDeposit.tokenId,
    checkInTime: sampleDeposit.checkInTime,
    appUrl: baseUrl
  });

  const templates = getTemplateGallerySamples(sampleDeposit, venue, baseUrl);

  return (
    <DashboardShell
      title="Live WhatsApp Notification Demo"
      description="See exactly what parents receive when their child deposits items"
      activeHref="/dashboard/whatsapp-demo"
    >
      <div className="grid gap-6">
        <SendTestWhatsAppCard defaultPhone={sampleGuardianPhone} previewMessage={previewMessage} />

        <Card>
          <CardHeader>
            <CardTitle>Message Timeline</CardTitle>
            <CardDescription>
              Shows guardian-facing alerts derived from today&apos;s deposit activity for this venue.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Time</TableHeaderCell>
                  <TableHeaderCell>Guardian Phone</TableHeaderCell>
                  <TableHeaderCell>Visitor</TableHeaderCell>
                  <TableHeaderCell>Message Type</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {timelineRows.length ? (
                  timelineRows.map((row) => (
                    <TableRow key={`${row.visitor}-${row.type}-${row.time}`}>
                      <TableCell>{formatWhatsappClock(row.time)}</TableCell>
                      <TableCell>{maskPhone(row.phone)}</TableCell>
                      <TableCell>{row.visitor}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>
                        <Badge variant="success">Delivered ✓✓</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                      No guardian WhatsApp activity yet today for this venue.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Message Templates</CardTitle>
            <CardDescription>
              The live demo can walk judges through every parent and visitor notification in one screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <div key={template.label} className="grid gap-2">
                <p className="text-sm font-semibold text-slate-700">{template.label}</p>
                <WhatsAppBubble
                  body={template.body}
                  time={formatWhatsappClock(sampleDeposit.checkInTime)}
                  shellClassName="bg-slate-900"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
