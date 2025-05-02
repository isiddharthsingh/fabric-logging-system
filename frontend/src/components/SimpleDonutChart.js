import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';

// Custom donut chart with clean design
const SimpleDonutChart = ({ data, colors }) => {
  const theme = useTheme();
  
  // Format percentages for display
  const getPercentage = (value) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (value / total * 100).toFixed(0) + '%';
  };
  
  // Formatter for the legend items
  const legendFormatter = (value) => {
    const dataItem = data.find(item => item.name === value);
    if (dataItem) {
      return `${value}: ${getPercentage(dataItem.value)}`;
    }
    return value;
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart margin={{ right: 30 }}>
        <Pie
          data={data}
          cx="40%"
          cy="50%"
          labelLine={false}
          label={false}
          outerRadius={130}
          innerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
              stroke={theme.palette.background.paper}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          wrapperStyle={{
            paddingLeft: '60px',
            fontSize: '0.9rem',
            lineHeight: '1.5rem',
          }}
          iconSize={10}
          iconType="circle"
          itemStyle={{
            marginBottom: 10,
            paddingTop: 2,
            paddingBottom: 2,
            lineHeight: '20px',
          }}
          itemsPerRow={1}
          formatter={legendFormatter}
        />
        <Tooltip 
          formatter={(value) => [getPercentage(value), 'Percentage']}
          contentStyle={{ 
            borderRadius: 8, 
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SimpleDonutChart;
