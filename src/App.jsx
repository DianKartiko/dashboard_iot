import { useState } from "react";
import "./index.css";
import MainTemplates from "./components/pages/MainTemplates";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

function App() {
  return (
    <div className="bg-gray-100 dark:bg-gray-950">
      <MainTemplates></MainTemplates>
    </div>
  );
}

export default App;
