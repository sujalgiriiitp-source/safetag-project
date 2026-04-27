import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { SectionHeading } from "@/components/shared/section-heading";
import { CheckinForm } from "@/components/visitor/checkin-form";
import { getVenues } from "@/lib/repository";

export default async function VisitorCheckinPage() {
  const venues = await getVenues();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Visitor Check-in"
          title="Deposit belongings in minutes, no paper slips needed"
          description="Select a venue, verify your phone, declare items, and generate a SafeTag QR receipt instantly."
        />
        <div className="mt-10">
          <CheckinForm venues={venues.filter((venue) => venue.isApproved)} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
