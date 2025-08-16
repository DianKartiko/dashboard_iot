import Title from "../atoms/Title";
import Charts from "../molecules/Charts";
import Dryers from "../molecules/Dryers";
import Sidebar from "../molecules/Sidebar";
import Footer from "../atoms/Footer";

export default function MainTemplates() {
  return (
    <>
      <Sidebar></Sidebar>
      <div className="p-4 sm:ml-64 bg-grey-50">
        <Title></Title>
        {/* Dryers */}
        <Dryers></Dryers>
        {/* Chart.js */}
        <Charts></Charts>
        {/* Footers */}
        <Footer></Footer>
      </div>
    </>
  );
}
