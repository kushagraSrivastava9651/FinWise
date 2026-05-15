// EMI Calculator
export function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return null;
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  if (r === 0) return { emi: principal / n, totalAmount: principal, totalInterest: 0 };
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalAmount = emi * n;
  const totalInterest = totalAmount - principal;
  return {
    emi: Math.round(emi),
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest),
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
    const interest = Math.round(balance * r);
    const principalPaid = Math.round(emi - interest);
    balance = Math.max(0, Math.round(balance - principalPaid));
    schedule.push({ month: i, emi: Math.round(emi), principal: principalPaid, interest, balance });
  }
  return schedule;
}

// SIP Calculator
export function calculateSIP(monthly, annualReturn, years) {
  const r = annualReturn / 12 / 100;
  const n = years * 12;
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return {
    futureValue: Math.round(fv),
    invested: monthly * n,
    returns: Math.round(fv - monthly * n),
  };
}

// FD Calculator
export function calculateFD(amount, annualRate, years) {
  const maturity = amount * Math.pow(1 + annualRate / 100, years);
  return {
    maturity: Math.round(maturity),
    interest: Math.round(maturity - amount),
  };
}

// Format currency Indian style
export function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-IN").format(n);
}
