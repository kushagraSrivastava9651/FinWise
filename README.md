# FinWise — Smart Finance Calculator

A modern Indian finance app built with **React + Tailwind CSS**.

---

## 🚀 Quick Start (VS Code)

### 1. Install dependencies
```bash
npm install
```

### 2. Start the dev server
```bash
npm start
```
Opens at `http://localhost:3000`

---

## 📁 Project Structure

```
finwise/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx       ← Top nav with all routes
│   │   └── SliderInput.jsx  ← Reusable slider component
│   ├── pages/
│   │   ├── Home.jsx         ← Landing page / feature grid
│   │   ├── EMICalculator.jsx ← ✅ DONE — full EMI calculator
│   │   └── Placeholders.jsx ← Stub pages for upcoming calculators
│   ├── utils/
│   │   └── calculations.js  ← All math: EMI, SIP, FD, Amortisation
│   ├── App.jsx              ← Router setup
│   ├── index.js             ← Entry point
│   └── index.css            ← Global styles + Tailwind
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## ✅ Features Built

| Feature | Status | Route |
|---------|--------|-------|
| EMI Calculator | ✅ Done | `/emi` |
| Amortisation Table | ✅ Built-in EMI page | `/emi` |
| SIP Calculator | 🔜 Next | `/sip` |
| Loan Comparison | 🔜 Planned | `/compare` |
| FD Calculator | 🔜 Planned | `/fd` |
| Budget Tracker | 🔜 Planned | `/budget` |
| Tax Calculator | 🔜 Planned | `/tax` |

---

## 🧮 EMI Calculator Features
- Loan amount slider: ₹1L – ₹1Cr
- Interest rate: 5% – 24%
- Tenure: 6 months – 30 years
- **Loan type presets** (Home, Car, Personal, Education)
- **Quick tenure buttons** (1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 30Y)
- Monthly EMI result with **gold card display**
- Principal vs Interest **pie chart**
- Expandable **amortisation schedule table**
- Interest savings tip on rate comparison

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#F5C842` (Gold) |
| Background | `#0A0A0F` (Ink) |
| Surface | `#14141C` (Ink Soft) |
| Display Font | Syne (700/800) |
| Body Font | DM Sans |
| Mono Font | DM Mono |

---

## 📦 Dependencies
- `react-router-dom` — routing
- `recharts` — charts
- `lucide-react` — icons
- `tailwindcss` — styling

---

## 🔜 Next Steps

1. **SIP Calculator** — `src/pages/SIPCalculator.jsx`
2. **Loan Comparison** — side-by-side 2–4 loans
3. **FD Calculator** — compound interest
4. **Budget Tracker** — income/expense/savings
5. **Share / PDF export** — jsPDF integration
6. **Pro tier** — prepayment, goal planner, AI insights
