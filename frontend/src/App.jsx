import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimulationProvider } from "./context/SimulationContext";
import { FredProvider } from "./context/FredContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./layout/Layout";
import SimulationPage from "./pages/SimulationPage";
import MetricsPage from "./pages/MetricsPage";
import FredPage from "./pages/FredPage";

export default function App() {
  return (
    <ErrorBoundary>
      <SimulationProvider>
        <FredProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<SimulationPage />} />
                <Route path="metrics" element={<MetricsPage />} />
                <Route path="fred" element={<FredPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </FredProvider>
      </SimulationProvider>
    </ErrorBoundary>
  );
}
