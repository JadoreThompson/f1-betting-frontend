import { BrowserRouter, Route, Routes } from "react-router";

import LoginPage from "./pages/LoginPage";
import MarketsPage from "./pages/MarketsPage";
import PortfolioPage from "./pages/PortfolioPage";
import RegisterPage from "./pages/RegisterPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/portfolio"
          element={<PortfolioPage />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
