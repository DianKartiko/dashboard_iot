import Title from "../atoms/Title";
import Charts from "../molecules/Charts";
import Dryers from "../molecules/Dryers";
import Sidebar from "../molecules/Sidebar";
import Footer from "../atoms/Footer";
import TemperatureAggregateDashboard from "./TemperatureAggregateDashboardTemplate";
import TemperatureAggregatePage from "../pages/TemperatureAggregatePage";

export default function MainTemplates() {
  return (
    <>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:ml-64">
        <Title title={"Dashboard Anlitik Report"} />

        <TemperatureAggregatePage/>
      </div>
    </>
  );
}
