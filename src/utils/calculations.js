// EMI Calculator
export function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return null;
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  if (r === 0) return { emi: Number((principal / n).toFixed(2)), totalAmount: principal, totalInterest: 0 };
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalAmount = emi * n;
  const totalInterest = totalAmount - principal;
  return {
    emi: Number(emi.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
  };
}

// Amortisation Schedule
export function generateAmortisation(principal, annualRate, tenureMonths) {
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  const emi = r === 0
    ? principal / n
    : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = principal;
  const schedule = [];
  for (let i = 1; i <= n; i++) {
    const interest = Number((balance * r).toFixed(2));
    const principalPaid = Number((emi - interest).toFixed(2));
    balance = Number(Math.max(0, balance - principalPaid).toFixed(2));
    schedule.push({ month: i, emi: Number(emi.toFixed(2)), principal: principalPaid, interest, balance });
  }
  return schedule;
}

// SIP Calculator
export function calculateSIP(monthly, annualReturn, years) {
  const r = annualReturn / 12 / 100;
  const n = years * 12;
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return {
    futureValue: Number(fv.toFixed(2)),
    invested: Number((monthly * n).toFixed(2)),
    returns: Number((fv - monthly * n).toFixed(2)),
  };
}

// FD Calculator
export function calculateFD(amount, annualRate, years) {
  const maturity = amount * Math.pow(1 + annualRate / 100, years);
  return {
    maturity: Number(maturity.toFixed(2)),
    interest: Number((maturity - amount).toFixed(2)),
  };
}

// Format currency Indian style
export function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-IN").format(n);
}
