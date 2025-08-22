import Title from "../atoms/Title";
import Charts from "../molecules/Charts";
import Dryers from "../molecules/Dryers";
import Sidebar from "../molecules/Sidebar";
import Footer from "../atoms/Footer";

export default function MainTemplates() {
  return (
    <>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:ml-64 dark:bg-gray-950 bg-gray-50 min-h-screen">
        <Title title={"Dashboard Statistic"} />
        {/* Dryers */}
        <Dryers />
        {/* Charts */}
        <Charts />
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
