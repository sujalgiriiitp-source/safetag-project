"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Deposit, Venue } from "@/types";
import { formatDateTime, maskPhone } from "@/lib/utils";

const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="h-[150px] w-[150px] rounded-sm bg-black/5" aria-hidden="true" />,
});

export function ThermalReceipt({ deposit, venue }: { deposit: Deposit; venue: Venue }) {
  const hasAutoPrintedRef = useRef(false);
  const printFnRef = useRef<() => void>(() => {});
  const [receiptUrl, setReceiptUrl] = useState(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
    return `${base}/receipt/${deposit.tokenId}`;
  });
  const qrSize = venue.thermalPrinterSize === "80mm" ? 180 : 150;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    printFnRef.current = () => {
      window.print();
    };

    if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) {
      setReceiptUrl(`${window.location.origin}/receipt/${deposit.tokenId}`);
    }

    if (hasAutoPrintedRef.current) {
      return;
    }

    hasAutoPrintedRef.current = true;

    const timeout = window.setTimeout(() => {
      printFnRef.current();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [deposit.tokenId]);

  const handlePrintAgain = () => {
    printFnRef.current();
  };

  return (
    <div className="mx-auto flex min-h-screen items-start justify-center bg-white px-4 py-6 text-black print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div
        className="print-receipt border border-black/10 bg-white p-4 print:border-none print:p-2"
        style={{ width: venue.thermalPrinterSize === "80mm" ? "80mm" : "58mm" }}
      >
        <div className="text-center">
          <p className="text-lg font-bold">SAFETAG</p>
          <p className="mt-1 text-sm font-semibold">{venue.name}</p>
          <p className="text-[11px]">{venue.city}</p>
        </div>

        <div className="my-4 flex justify-center">
          <QRCodeSVG value={receiptUrl} size={qrSize} includeMargin />
        </div>

        <div className="space-y-1 text-[11px]">
          <p>
            <span className="font-semibold">Token:</span> {deposit.tokenId}
          </p>
          <p>
            <span className="font-semibold">Name:</span> {deposit.visitorName}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {maskPhone(deposit.visitorPhone)}
          </p>
        </div>

        <div className="mt-4 text-[11px]">
          <p className="font-semibold">Items deposited:</p>
          <ul className="mt-2 space-y-1">
            {deposit.itemsList.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 space-y-1 text-[11px]">
          <p>
            <span className="font-semibold">Date:</span> {formatDateTime(deposit.checkInTime)}
          </p>
          <p className="text-center font-medium">Show this slip to collect your items</p>
          <p className="text-center">safetag.in</p>
        </div>

        <div className="mt-6 flex justify-center print:hidden">
          <Button onClick={handlePrintAgain}>Print again</Button>
        </div>
      </div>
    </div>
  );
}
