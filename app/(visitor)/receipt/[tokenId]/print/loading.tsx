export default function ReceiptPrintLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-black">
      <div className="w-full max-w-sm rounded-md border border-black/10 p-4 text-center">
        <p className="text-sm font-medium">Preparing printable receipt…</p>
        <p className="mt-1 text-xs text-black/60">Please wait a moment.</p>
      </div>
    </main>
  );
}
