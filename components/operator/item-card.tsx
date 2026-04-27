import Image from "next/image";
import { Deposit, Venue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatStatus, getStatusClasses, formatTimeAgo } from "@/lib/utils";

export function ItemCard({ deposit, venue }: { deposit: Deposit; venue?: Venue | null }) {
  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {deposit.itemsPhotoUrl ? (
        <Image
          src={deposit.itemsPhotoUrl}
          alt={deposit.tokenId}
          width={1200}
          height={800}
          className="h-40 w-full object-cover"
          unoptimized
        />
      ) : null}
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-slate-500">{deposit.tokenId}</p>
            <h3 className="text-lg font-semibold text-slate-800">{deposit.visitorName}</h3>
          </div>
          <Badge className={getStatusClasses(deposit.status, deposit.checkInTime, deposit.returnTime)}>
            {formatStatus(deposit.status, deposit.checkInTime, deposit.returnTime)}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          {(venue?.name || deposit.venueName) ?? "Venue"} {venue ? `, ${venue.city}` : ""} | {formatDateTime(deposit.checkInTime)}
        </p>
        <p className="text-sm text-slate-500">Time since check-in: {formatTimeAgo(deposit.checkInTime)}</p>
        <div className="flex flex-wrap gap-2">
          {deposit.itemsList.map((item) => (
            <Badge key={item} variant={deposit.aiDetectedItems.includes(item) ? "success" : "secondary"}>
              {item}
            </Badge>
          ))}
        </div>
        {deposit.photoMismatchAlert ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Item mismatch detected. Please verify manually before returning.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
