import { BrowserRouter, Route, Routes } from "react-router";

import LoginPage from "./pages/LoginPage";
import MarketsPage from "./pages/MarketsPage";
import RegisterPage from "./pages/RegisterPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
