import crypto from "crypto";

export function buildHashInput({
  productName,
  processName,
  emissionValue,
  emissionUnit,
  scope,
  dataSource,
  recordedAt,
  prevHash,
}) {
  return JSON.stringify([
    productName ?? "",
    processName ?? "",
    Number(emissionValue),
    emissionUnit ?? "",
    scope ?? "",
    dataSource ?? "",
    recordedAt ?? "",
    prevHash ?? "",
  ]);
}

export function computeHash(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
