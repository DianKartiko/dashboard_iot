import Title from "../atoms/Title";
import Charts from "../molecules/Charts";
import Dryers from "../molecules/Dryers";
import Sidebar from "../molecules/Sidebar";
import Footer from "../atoms/Footer";

export default function MainTemplates() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:ml-64">
        <Title />
        {/* Dryers */}
        <Dryers />
        {/* Charts */}
        <Charts />
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
