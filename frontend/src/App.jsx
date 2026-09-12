import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimulationProvider } from "./context/SimulationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./layout/Layout";
import SimulationPage from "./pages/SimulationPage";
import MetricsPage from "./pages/MetricsPage";

export default function App() {
  return (
    <ErrorBoundary>
      <SimulationProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<SimulationPage />} />
              <Route path="metrics" element={<MetricsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SimulationProvider>
    </ErrorBoundary>
  );
}
