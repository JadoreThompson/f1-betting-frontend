import { BrowserRouter, Route, Routes } from "react-router";
import AuthPages from "./pages/AuthPages";
import MarketsPage from "./pages/MarketsPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketsPage />} />
        <Route path="/auth" element={<AuthPages />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
