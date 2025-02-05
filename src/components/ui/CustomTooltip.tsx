import React from "react";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 shadow-lg rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-200 font-bold">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="font-semibold" style={{ color: item.color }}>
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
