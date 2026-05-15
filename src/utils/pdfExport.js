/**
 * PDF export utility using jsPDF directly.
 *
 * Fix 1 — Rupee symbol: jsPDF's built-in Helvetica has no ₹ glyph (renders as
 *   "1" or blank). Solution: load NotoSans from Google Fonts as a base64 TTF
 *   via the jspdf-font trick, falling back to loading via fetch + addFileToVFS.
 *   Simpler fallback used here: strip ₹ and prefix "Rs." which always renders.
 *
 * Fix 2 — Complete data: removed the rowsToShow = 24 cap. Every row is written
 *   with a newPage() guard so multi-page schedules work correctly.
 */

// ─── Load jsPDF ──────────────────────────────────────────────────────────────
async function loadJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.jspdf.jsPDF;
}

// ─── Rupee-safe formatter ────────────────────────────────────────────────────
// jsPDF built-in fonts (Helvetica/Times/Courier) don't include ₹ (U+20B9).
// We replace it with "Rs." which renders perfectly in all PDF viewers.
function pdfCurrency(formatINR, value) {
  return String(formatINR(value)).replace(/₹\s*/g, "Rs. ");
}

// ─── Colour palette ──────────────────────────────────────────────────────────
const C = {
  bg:      [13,  13,  20],
  card:    [22,  22,  36],
  gold:    [245, 200,  66],
  orange:  [251, 146,  60],
  emerald: [ 52, 211, 153],
  white:   [232, 232, 240],
  dim:     [ 90,  93, 114],
  border:  [ 38,  38,  56],
};

// ─── Drawing helpers ─────────────────────────────────────────────────────────
function fillRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, "F");
}

function fillRoundRect(doc, x, y, w, h, r, color) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function txt(doc, str, x, y, size, color, opts = {}) {
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(str ?? ""), x, y, opts);
}

function hRule(doc, x, y, w, color = C.border) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.2);
  doc.line(x, y, x + w, y);
}

// ─── Page management ─────────────────────────────────────────────────────────
// Returns a newPage function and a checkY function that auto-adds pages.
function makePageManager(doc, W, H, pad, bgColor) {
  let y = { val: pad };

  function newPage() {
    doc.addPage();
    fillRect(doc, 0, 0, W, H, bgColor);
    y.val = pad;
  }

  // Call before drawing a block of `height` mm. Adds page if needed.
  function checkY(height) {
    if (y.val + height > H - 16) newPage();
  }

  return { y, newPage, checkY };
}

// Draw footer on ALL pages
function drawFooters(doc, W, H, pad, col, label) {
  const pageCount = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    hRule(doc, pad, H - 13, col);
    txt(doc, `Generated on ${dateStr}  ·  Page ${i} of ${pageCount}`, pad, H - 7, 6, C.dim);
    txt(doc, label, W - pad, H - 7, 6, C.dim, { align: "right" });
  }
}

// ─── EMI PDF ─────────────────────────────────────────────────────────────────
export async function downloadEMIPdf({ loanAmount, interestRate, tenure, result, schedule, formatINR }) {
  const jsPDF = await loadJsPDF();
  const doc   = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210, H = 297, pad = 14, col = W - pad * 2;

  // Page 1 background
  fillRect(doc, 0, 0, W, H, C.bg);

  const fmt = (v) => pdfCurrency(formatINR, v);
  const { y, newPage, checkY } = makePageManager(doc, W, H, pad, C.bg);

  // ── Header ────────────────────────────────────────────────────────────────
  txt(doc, "EMI CALCULATOR", pad, y.val + 5, 7, C.gold);
  y.val += 10;
  doc.setFont(undefined, "bold");
  txt(doc, "Loan Summary", pad, y.val, 20, C.white);
  doc.setFont(undefined, "normal");
  y.val += 6;
  hRule(doc, pad, y.val, col);
  y.val += 8;

  // ── Hero EMI card ─────────────────────────────────────────────────────────
  fillRoundRect(doc, pad, y.val, col, 28, 3, C.gold);
  txt(doc, "MONTHLY EMI", pad + 6, y.val + 8, 7, [30, 30, 10]);
  doc.setFont(undefined, "bold");
  txt(doc, fmt(result.emi), pad + 6, y.val + 20, 22, C.bg);
  doc.setFont(undefined, "normal");
  const yrs = Math.floor(tenure / 12);
  const mos = tenure % 12;
  const tenureStr = [yrs > 0 && `${yrs} yr${yrs !== 1 ? "s" : ""}`, mos > 0 && `${mos} mo`].filter(Boolean).join(" ");
  txt(doc, `Per month  ·  ${tenureStr}`, pad + 6, y.val + 26, 7, [80, 70, 10]);
  y.val += 36;

  // ── Stats row ─────────────────────────────────────────────────────────────
  checkY(26);
  const sw = (col - 4) / 3;
  [
    { label: "Principal",      value: fmt(loanAmount),           color: C.white  },
    { label: "Total Interest", value: fmt(result.totalInterest), color: C.orange },
    { label: "Total Payment",  value: fmt(result.totalAmount),   color: C.white  },
  ].forEach((s, i) => {
    const sx = pad + i * (sw + 2);
    fillRoundRect(doc, sx, y.val, sw, 20, 2, C.card);
    txt(doc, s.label, sx + 4, y.val + 7,  7, C.dim);
    doc.setFont(undefined, "bold");
    txt(doc, s.value, sx + 4, y.val + 15, 9, s.color);
    doc.setFont(undefined, "normal");
  });
  y.val += 28;

  // ── Parameters ────────────────────────────────────────────────────────────
  checkY(28);
  fillRoundRect(doc, pad, y.val, col, 26, 2, C.card);
  txt(doc, "LOAN PARAMETERS", pad + 4, y.val + 7, 7, C.dim);
  hRule(doc, pad + 4, y.val + 9, col - 8, C.border);
  [
    ["Loan Amount",   fmt(loanAmount)],
    ["Interest Rate", `${interestRate}% p.a.`],
    ["Tenure",        `${tenure} months (${tenureStr})`],
  ].forEach(([label, val], i) => {
    const px = pad + 4 + i * (col / 3);
    txt(doc, label, px, y.val + 16, 7, C.dim);
    doc.setFont(undefined, "bold");
    txt(doc, val,   px, y.val + 23, 8, C.white);
    doc.setFont(undefined, "normal");
  });
  y.val += 32;

  // ── Breakup bar ───────────────────────────────────────────────────────────
  checkY(26);
  fillRoundRect(doc, pad, y.val, col, 24, 2, C.card);
  txt(doc, "PRINCIPAL vs INTEREST BREAKUP", pad + 4, y.val + 7, 7, C.dim);
  const pPct   = loanAmount / result.totalAmount;
  const bX     = pad + 4, bW = col - 8, bY2 = y.val + 13;
  fillRoundRect(doc, bX,           bY2, bW * pPct,       5, 1, C.gold);
  fillRoundRect(doc, bX + bW*pPct, bY2, bW*(1 - pPct),  5, 1, C.border);
  txt(doc, `Principal  ${Math.round(pPct * 100)}%`,        bX,                y.val + 23, 7, C.gold);
  txt(doc, `Interest  ${Math.round((1 - pPct) * 100)}%`, bX + bW * pPct + 2, y.val + 23, 7, C.orange);
  y.val += 32;

  // ── Amortisation schedule ─────────────────────────────────────────────────
  if (schedule && schedule.length > 0) {
    checkY(20);
    txt(doc, "AMORTISATION SCHEDULE", pad, y.val + 5, 7, C.gold);
    y.val += 10;

    // Column definitions (x positions)
    const TC = [
      { label: "Mo",        x: pad + 3,         align: "left"  },
      { label: "EMI",       x: pad + 35,        align: "right" },
      { label: "Principal", x: pad + 78,        align: "right" },
      { label: "Interest",  x: pad + 122,       align: "right" },
      { label: "Balance",   x: pad + col - 2,   align: "right" },
    ];

    const drawTableHeader = () => {
      fillRoundRect(doc, pad, y.val, col, 8, 1, C.card);
      TC.forEach(c => txt(doc, c.label, c.x, y.val + 5.5, 6.5, C.dim, { align: c.align }));
      y.val += 9;
    };

    drawTableHeader();

    schedule.forEach((row, i) => {
      // New page: redraw header
      if (y.val + 7 > H - 16) {
        newPage();
        drawTableHeader();
      }
      if (i % 2 === 0) fillRect(doc, pad, y.val, col, 7, [20, 20, 30]);
      txt(doc, row.month,               TC[0].x, y.val + 5, 7, C.dim,    { align: "left"  });
      txt(doc, fmt(row.emi),            TC[1].x, y.val + 5, 7, C.white,  { align: "right" });
      txt(doc, fmt(row.principal),      TC[2].x, y.val + 5, 7, C.gold,   { align: "right" });
      txt(doc, fmt(row.interest),       TC[3].x, y.val + 5, 7, C.orange, { align: "right" });
      txt(doc, fmt(row.balance),        TC[4].x, y.val + 5, 7, C.white,  { align: "right" });
      y.val += 7;
    });
  }

  drawFooters(doc, W, H, pad, col, "EMI Calculator");
  doc.save(`emi-${loanAmount}-${interestRate}pct-${tenure}mo.pdf`);
}

// ─── SIP PDF ─────────────────────────────────────────────────────────────────
export async function downloadSIPPdf({ monthly, rate, years, result, chartData, formatINR }) {
  const jsPDF = await loadJsPDF();
  const doc   = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210, H = 297, pad = 14, col = W - pad * 2;

  fillRect(doc, 0, 0, W, H, C.bg);

  const fmt = (v) => pdfCurrency(formatINR, v);
  const { y, newPage, checkY } = makePageManager(doc, W, H, pad, C.bg);

  const totalInvested = monthly * years * 12;
  const wealthRatio   = (result.futureValue / totalInvested).toFixed(1);
  const absReturn     = Math.round(((result.futureValue - totalInvested) / totalInvested) * 100);

  // ── Header ────────────────────────────────────────────────────────────────
  txt(doc, "SIP CALCULATOR", pad, y.val + 5, 7, C.emerald);
  y.val += 10;
  doc.setFont(undefined, "bold");
  txt(doc, "Investment Summary", pad, y.val, 20, C.white);
  doc.setFont(undefined, "normal");
  y.val += 6;
  hRule(doc, pad, y.val, col);
  y.val += 8;

  // ── Hero Future Value card ────────────────────────────────────────────────
  fillRoundRect(doc, pad, y.val, col, 28, 3, [18, 52, 36]);
  doc.setDrawColor(20, 90, 60);
  doc.setLineWidth(0.3);
  doc.roundedRect(pad, y.val, col, 28, 3, 3, "S");
  txt(doc, "FUTURE VALUE", pad + 6, y.val + 8, 7, [30, 140, 90]);
  doc.setFont(undefined, "bold");
  txt(doc, fmt(result.futureValue), pad + 6, y.val + 20, 22, C.white);
  doc.setFont(undefined, "normal");
  txt(doc, `After ${years} year${years !== 1 ? "s" : ""} of investing`, pad + 6, y.val + 26, 7, [30, 140, 90]);
  y.val += 36;

  // ── Stats row ─────────────────────────────────────────────────────────────
  checkY(26);
  const sw = (col - 6) / 4;
  [
    { label: "Total Invested", value: fmt(totalInvested),    color: C.white   },
    { label: "Est. Returns",   value: fmt(result.returns),   color: C.emerald },
    { label: "Wealth Ratio",   value: `${wealthRatio}x`,     color: C.gold    },
    { label: "Abs. Return",    value: `+${absReturn}%`,      color: C.emerald },
  ].forEach((s, i) => {
    const sx = pad + i * (sw + 2);
    fillRoundRect(doc, sx, y.val, sw, 20, 2, C.card);
    txt(doc, s.label, sx + 3, y.val + 7,  6.5, C.dim);
    doc.setFont(undefined, "bold");
    txt(doc, s.value, sx + 3, y.val + 15, 8.5, s.color);
    doc.setFont(undefined, "normal");
  });
  y.val += 28;

  // ── Parameters ────────────────────────────────────────────────────────────
  checkY(28);
  fillRoundRect(doc, pad, y.val, col, 26, 2, C.card);
  txt(doc, "INVESTMENT PARAMETERS", pad + 4, y.val + 7, 7, C.dim);
  hRule(doc, pad + 4, y.val + 9, col - 8, C.border);
  [
    ["Monthly SIP",     fmt(monthly)],
    ["Expected Return", `${rate}% p.a.`],
    ["Duration",        `${years} year${years !== 1 ? "s" : ""}`],
  ].forEach(([label, val], i) => {
    const px = pad + 4 + i * (col / 3);
    txt(doc, label, px, y.val + 16, 7, C.dim);
    doc.setFont(undefined, "bold");
    txt(doc, val,   px, y.val + 23, 8, C.white);
    doc.setFont(undefined, "normal");
  });
  y.val += 32;

  // ── Breakup bar ───────────────────────────────────────────────────────────
  checkY(26);
  fillRoundRect(doc, pad, y.val, col, 24, 2, C.card);
  txt(doc, "INVESTED vs RETURNS BREAKUP", pad + 4, y.val + 7, 7, C.dim);
  const iPct = totalInvested / result.futureValue;
  const bX   = pad + 4, bW = col - 8, bY2 = y.val + 13;
  fillRoundRect(doc, bX,          bY2, bW * iPct,      5, 1, [42, 74, 58]);
  fillRoundRect(doc, bX + bW*iPct, bY2, bW*(1 - iPct), 5, 1, C.emerald);
  txt(doc, `Invested  ${Math.round(iPct * 100)}%`,        bX,                y.val + 23, 7, C.white);
  txt(doc, `Returns  ${Math.round((1-iPct)*100)}%`,  bX + bW*iPct + 2,  y.val + 23, 7, C.emerald);
  y.val += 32;

  // ── Year-by-year table ────────────────────────────────────────────────────
  checkY(20);
  txt(doc, "YEAR-BY-YEAR BREAKDOWN", pad, y.val + 5, 7, C.emerald);
  y.val += 10;

  const TC = [
    { label: "Year",        x: pad + 3,        align: "left"  },
    { label: "Invested",    x: pad + 44,       align: "right" },
    { label: "Returns",     x: pad + 88,       align: "right" },
    { label: "Total Value", x: pad + 132,      align: "right" },
    { label: "Gain",        x: pad + col - 2,  align: "right" },
  ];

  const drawTableHeader = () => {
    fillRoundRect(doc, pad, y.val, col, 8, 1, C.card);
    TC.forEach(c => txt(doc, c.label, c.x, y.val + 5.5, 6.5, C.dim, { align: c.align }));
    y.val += 9;
  };

  drawTableHeader();

  chartData.forEach((row, i) => {
    if (y.val + 7 > H - 16) {
      newPage();
      drawTableHeader();
    }
    if (i % 2 === 0) fillRect(doc, pad, y.val, col, 7, [20, 20, 30]);
    const gain = `+${Math.round((row.returns / row.invested) * 100)}%`;
    txt(doc, row.year,             TC[0].x, y.val + 5, 7, C.dim,    { align: "left"  });
    txt(doc, fmt(row.invested),    TC[1].x, y.val + 5, 7, C.white,  { align: "right" });
    txt(doc, fmt(row.returns),     TC[2].x, y.val + 5, 7, C.emerald,{ align: "right" });
    txt(doc, fmt(row.value),       TC[3].x, y.val + 5, 7, C.white,  { align: "right" });
    doc.setFont(undefined, "bold");
    txt(doc, gain,                 TC[4].x, y.val + 5, 7, C.gold,   { align: "right" });
    doc.setFont(undefined, "normal");
    y.val += 7;
  });

  drawFooters(doc, W, H, pad, col, "SIP Calculator");
  doc.save(`sip-${monthly}pm-${rate}pct-${years}yr.pdf`);
}