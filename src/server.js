import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import { initDb } from "./db.js";
import { buildHashInput, computeHash } from "./hash.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/static", express.static(publicDir));

const db = await initDb();

function toBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function normalizeInput(body) {
  const productName = String(body.productName ?? "").trim();
  const processName = String(body.processName ?? "").trim();
  const emissionValue = Number(body.emissionValue);
  const emissionUnit = String(body.emissionUnit ?? "kg CO2e").trim();
  const scope = String(body.scope ?? "Scope 1").trim();
  const dataSource = String(body.dataSource ?? "simulated").trim();

  const errors = [];
  if (!productName) errors.push("productName is required");
  if (!Number.isFinite(emissionValue)) errors.push("emissionValue must be a number");
  if (!emissionUnit) errors.push("emissionUnit is required");

  return {
    errors,
    data: {
      productName,
      processName: processName || null,
      emissionValue,
      emissionUnit,
      scope: scope || null,
      dataSource: dataSource || null,
    },
  };
}

function recordToApi(record, baseUrl) {
  return {
    id: record.id,
    product_name: record.product_name,
    process_name: record.process_name,
    emission_value: record.emission_value,
    emission_unit: record.emission_unit,
    scope: record.scope,
    data_source: record.data_source,
    recorded_at: record.recorded_at,
    prev_hash: record.prev_hash,
    hash: record.hash,
    verify_url: `${baseUrl}/verify/${record.id}`,
    qr_url: `${baseUrl}/api/records/${record.id}/qr`,
  };
}

function computeRecordHash(record) {
  const input = buildHashInput({
    productName: record.product_name,
    processName: record.process_name,
    emissionValue: record.emission_value,
    emissionUnit: record.emission_unit,
    scope: record.scope,
    dataSource: record.data_source,
    recordedAt: record.recorded_at,
    prevHash: record.prev_hash,
  });
  return computeHash(input);
}

async function verifyRecord(record) {
  const expectedHash = computeRecordHash(record);
  const isHashValid = expectedHash === record.hash;

  const prevRecord = await db.get(
    "SELECT id, hash FROM records WHERE id < ? ORDER BY id DESC LIMIT 1",
    record.id
  );

  const isPrevHashValid = prevRecord
    ? prevRecord.hash === record.prev_hash
    : record.prev_hash === "GENESIS";

  return {
    is_hash_valid: isHashValid,
    is_prev_hash_valid: isPrevHashValid,
    is_chain_valid: isHashValid && isPrevHashValid,
  };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/api/records", async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM records ORDER BY id DESC LIMIT 50"
  );
  const baseUrl = toBaseUrl(req);
  res.json(rows.map((row) => recordToApi(row, baseUrl)));
});

app.post("/api/records", async (req, res) => {
  const { errors, data } = normalizeInput(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const last = await db.get(
    "SELECT hash FROM records ORDER BY id DESC LIMIT 1"
  );
  const prevHash = last?.hash ?? "GENESIS";
  const recordedAt = new Date().toISOString();
  const hashInput = buildHashInput({
    ...data,
    recordedAt,
    prevHash,
  });
  const hash = computeHash(hashInput);

  const result = await db.run(
    `INSERT INTO records
      (product_name, process_name, emission_value, emission_unit, scope, data_source, recorded_at, prev_hash, hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ,
    data.productName,
    data.processName,
    data.emissionValue,
    data.emissionUnit,
    data.scope,
    data.dataSource,
    recordedAt,
    prevHash,
    hash
  );

  const record = await db.get("SELECT * FROM records WHERE id = ?", result.lastID);
  const baseUrl = toBaseUrl(req);
  res.status(201).json(recordToApi(record, baseUrl));
});

app.get("/api/records/:id", async (req, res) => {
  const record = await db.get("SELECT * FROM records WHERE id = ?", req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const baseUrl = toBaseUrl(req);
  const verification = await verifyRecord(record);
  res.json({
    ...recordToApi(record, baseUrl),
    verification,
  });
});

app.get("/api/records/:id/qr", async (req, res) => {
  const record = await db.get("SELECT * FROM records WHERE id = ?", req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const verifyUrl = `${toBaseUrl(req)}/verify/${record.id}`;
  const buffer = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
  });

  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
});

app.get("/verify/:id", async (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EcoTrace Verification</title>
  <link rel="stylesheet" href="/static/styles.css" />
</head>
<body class="verify">
  <main class="shell">
    <section class="card">
      <div class="card-header">
        <p class="eyebrow">EcoTrace Verification</p>
        <h1>Carbon Footprint Record</h1>
        <p class="sub">Scan verified data linked to this product or process.</p>
      </div>
      <div id="status" class="status pending">Checking integrity...</div>
      <div class="grid" id="details"></div>
      <div class="actions">
        <a class="button ghost" href="/">Create another record</a>
      </div>
    </section>
  </main>
  <script>
    const id = ${JSON.stringify(req.params.id)};
    const statusEl = document.getElementById("status");
    const detailsEl = document.getElementById("details");

    fetch("/api/records/" + id)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const ok = data.verification && data.verification.is_chain_valid;
        statusEl.textContent = ok ? "Integrity verified" : "Integrity warning";
        statusEl.classList.toggle("ok", ok);
        statusEl.classList.toggle("warn", !ok);

        const fields = [
          ["Product", data.product_name],
          ["Process", data.process_name || "N/A"],
          ["Emission", data.emission_value + " " + data.emission_unit],
          ["Scope", data.scope || "N/A"],
          ["Source", data.data_source || "N/A"],
          ["Recorded", new Date(data.recorded_at).toLocaleString()],
          ["Record ID", data.id],
          ["Hash", data.hash],
          ["Previous Hash", data.prev_hash],
        ];

        detailsEl.innerHTML = fields
          .map(function ([label, value]) {
            return (
              '<div class="field">' +
              '<div class="label">' +
              label +
              '</div>' +
              '<div class="value">' +
              value +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      })
      .catch(() => {
        statusEl.textContent = "Record not found";
        statusEl.classList.add("warn");
      });
  </script>
</body>
</html>`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`EcoTrace running on http://localhost:${port}`);
});
