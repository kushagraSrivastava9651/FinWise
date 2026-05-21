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
npm run dev
```
Opens at `http://localhost:5173`

---

## 📁 Project Structure

```
finwise/
├── index.html               ← Vite entry HTML
├── src/
│   ├── main.jsx             ← Entry point
│   ├── App.jsx              ← Router setup
│   ├── index.css            ← Tailwind + theme tokens
│   ├── components/
│   ├── pages/
│   └── utils/
├── server/                  ← Express API + auth
├── tailwind.config.js
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
