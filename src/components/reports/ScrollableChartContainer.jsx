// src/components/reports/ScrollableChartContainer.jsx

const ScrollableChartContainer = ({ children, minWidth }) => (
  <div className="mt-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
    <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
  </div>
);

export default ScrollableChartContainer;
