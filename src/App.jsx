import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import EMICalculator from "./pages/EMICalculator";
import SIPCalculator from "./pages/SIPCalculator";
import AmortisationPage from "./pages/AmortisationPage";
import ComparePage from "./pages/Comparepage";
import FDPage from "./pages/FDPage";
import TaxPage from "./pages/TaxPage";
import BudgetPage from "./pages/BudgetPage";


import {
} from "./pages/Placeholders";

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <BrowserRouter>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/emi" element={<EMICalculator />} />
        <Route path="/sip" element={<SIPCalculator />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/amortisation" element={<AmortisationPage />} />
        <Route path="/fd" element={<FDPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/tax" element={<TaxPage />} />
      </Routes>
    </BrowserRouter>
  );
}