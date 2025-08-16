import "./index.css";
import MainTemplates from "./components/pages/MainTemplates";
import NotFound from "./components/pages/404NotFound";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
        <Routes>
          <Route path="/" element={<MainTemplates />} />
          {/* Tambahan route kalau ada page lain */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
