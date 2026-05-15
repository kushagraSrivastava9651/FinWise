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
  return (
    <BrowserRouter>
      <Navbar />
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