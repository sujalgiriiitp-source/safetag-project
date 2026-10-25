import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
type Staff = { cookie: string; operatorId: string };
const auth = JSON.parse(readFileSync(".pilot-data/e2e-auth.json", "utf8")) as Staff & { staff: Staff; foreign: Staff; revocable: Staff };
const sessionHeaders = (cookie: string) => ({ cookie: `safetag-session=${cookie}`, origin: "http://localhost:3100" });
for (const width of [390, 1280]) {
  test(`physical custody journey at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "safetag-session", value: auth.cookie, domain: "localhost", path: "/", httpOnly: true, sameSite: "Strict" }]);
    const consoleErrors: string[] = []; page.on("pageerror", (e) => consoleErrors.push(e.message));
    await page.goto("/pilot");
    await expect(page.getByRole("heading", { name: "TEST ONLY - SafeTag Pilot Counter" })).toBeVisible();
    await page.getByLabel("Visitor name / Naam").fill(`Synthetic Browser ${width} - A deliberately long visitor name for thermal wrap inspection`);
    await page.getByLabel("Visitor phone / Mobile").fill("9999999994");
    await page.getByRole("button", { name: "Register / Details save karein" }).click();
    await expect(page.getByText("REGISTERED only.", { exact: false })).toBeVisible();
    await page.getByLabel("Capture item photo (required)").setInputFiles(".pilot-data/items.jpg");
    await expect(page.getByText("Private photo saved", { exact: true })).toBeVisible();
    await page.getByLabel("Physical rack / bin").selectOption(width === 390 ? "P-1" : "P-2");
    await page.getByLabel("I inspected the actual items", { exact: false }).check();
    await page.getByRole("button", { name: "Confirm Stored / Saman jama hua" }).click();
    await expect(page.getByText("Issue printed collection coupon to visitor")).toBeVisible();
    await expect(page.getByLabel("Items match the record", { exact: false })).not.toBeChecked();
    await page.screenshot({ path: `test-results/counter-${width}.png`, fullPage: true });
    for (const printer of ["58mm", "80mm"]) {
      await page.getByLabel("Printer width").selectOption(printer);
      await page.emulateMedia({ media: "print" });
      await page.pdf({ path: `test-results/receipt-${width}-${printer}.pdf`, width: printer, height: "420mm", printBackground: true });
      await page.emulateMedia({ media: "screen" });
    }
    const couponText = await page.locator(".pilot-print-only p.break-all").textContent();
    expect(couponText).toMatch(/^[A-Za-z0-9_-]{43}$/);
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Record cash received / Cash mila" }).click();
    await expect(page.getByText("Fee: ₹5.00 · paid", { exact: true })).toBeVisible();
    await page.getByLabel("Separate collection code / Printed coupon").fill(couponText!);
    await page.getByLabel("Items match the record", { exact: false }).check();
    await page.getByRole("button", { name: "Mark Returned / Saman wapas diya" }).click();
    await expect(page.getByText("Returned. Collection authorization expired.", { exact: false })).toBeVisible();
    expect(consoleErrors).toEqual([]);
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflowing).toBe(false);
  });
}
test("anonymous and cross-origin writes rejected; legacy receipt never public", async ({ request }) => {
  expect((await request.post("/api/pilot/deposits", { data: {} })).status()).toBe(401);
  expect((await request.get("/api/pilot/workspace")).status()).toBe(401);
  expect((await request.post("/api/deposits", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/pilot/deposits", { headers: { origin: "https://attacker.invalid" }, data: {} })).status()).toBe(403);
  expect((await request.get("/api/deposits/ST-EXAM-00004")).status()).toBe(401);
  expect((await request.get("/api/pilot/jobs")).status()).toBe(401);
});

test("server enforces role, private photo and fragment receipt boundaries", async ({ request, browser }) => {
  const manager = sessionHeaders(auth.cookie), staff = sessionHeaders(auth.staff.cookie), foreign = sessionHeaders(auth.foreign.cookie);
  expect((await request.get("/api/pilot/platform", { headers: manager })).status()).toBe(403);
  expect((await request.get("/api/pilot/export", { headers: staff })).status()).toBe(403);
  expect((await request.post("/api/pilot/staff", { headers: staff, data: { action: "invite", name: "Must Reject", phone: "9999999971", role: "admin" } })).status()).toBe(403);
  const body = { requestKey: randomUUID(), visitorName: "Synthetic Receipt Visitor", visitorPhone: "9999999972", visitorConsent: false, guardianConsent: false, items: [{ name: "Wallet", quantity: 1, condition: "No visible damage", notes: "" }] };
  const response = await request.post("/api/pilot/deposits", { headers: manager, data: body });
  expect(response.status()).toBe(201);
  const created = await response.json();
  expect((await request.get(`/api/pilot/deposits/${created.record.id}`, { headers: foreign })).status()).toBe(404);
  const uploaded = await request.post("/api/pilot/assets", { headers: manager, data: { custodyId: created.record.id, imageBase64: `data:image/jpeg;base64,${readFileSync(".pilot-data/items.jpg").toString("base64")}` } });
  expect(uploaded.ok()).toBe(true);
  const photo = await uploaded.json();
  expect((await request.get(photo.path)).status()).toBe(401);
  expect((await request.get(photo.path, { headers: foreign })).status()).toBe(404);
  const privatePhoto = await request.get(photo.path, { headers: manager });
  expect(privatePhoto.status()).toBe(200);
  expect(privatePhoto.headers()["cache-control"]).toContain("no-store");
  const context = await browser.newContext({ baseURL: "http://localhost:3100" });
  const visitor = await context.newPage();
  const paths: string[] = [];
  visitor.on("request", (r) => paths.push(r.url()));
  await visitor.goto(created.receiptPath);
  await expect(visitor.getByText("Synthetic Receipt Visitor", { exact: false })).toBeVisible();
  await expect(visitor).toHaveURL("http://localhost:3100/pilot/receipt");
  const viewSecret = created.receiptPath.split("#")[1];
  expect(paths.some((url) => url.includes(viewSecret))).toBe(false);
  expect(await visitor.locator("img").count()).toBe(0);
  const cookies = await context.cookies("http://localhost:3100/api/pilot/receipt");
  const receiptCookie = cookies.find((cookie) => cookie.name === "safetag-receipt");
  expect(receiptCookie?.httpOnly).toBe(true);
  expect(receiptCookie?.secure).toBe(true);
  expect(receiptCookie?.sameSite).toBe("Strict");
  await visitor.reload();
  await expect(visitor.getByText("Synthetic Receipt Visitor", { exact: false })).toBeVisible();
  await context.close();
});

test("staff revocation and logout immediately invalidate real session cookies", async ({ request, browser }) => {
  const member = sessionHeaders(auth.revocable.cookie);
  expect((await request.get("/api/pilot/workspace", { headers: member })).status()).toBe(200);
  expect((await request.post("/api/pilot/staff", { headers: sessionHeaders(auth.cookie), data: { action: "revoke", operatorId: auth.revocable.operatorId } })).status()).toBe(200);
  expect((await request.get("/api/pilot/workspace", { headers: member })).status()).toBe(401);
  const context = await browser.newContext({ baseURL: "http://localhost:3100" });
  await context.addCookies([{ name: "safetag-session", value: auth.staff.cookie, domain: "localhost", path: "/", httpOnly: true, sameSite: "Strict" }]);
  const page = await context.newPage();
  await page.goto("/pilot");
  await expect(page.getByRole("heading", { name: "TEST ONLY - SafeTag Pilot Counter" })).toBeVisible();
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.get("/api/pilot/workspace", { headers: sessionHeaders(auth.staff.cookie) })).status()).toBe(401);
  await context.close();
});
