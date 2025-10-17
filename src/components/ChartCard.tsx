import React, { ReactElement } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { ResponsiveContainer } from 'recharts';

interface ChartCardProps {
  title: string;
  height?: number;
  children: ReactElement; // Ensure it's a React element
}

const ChartCard: React.FC<ChartCardProps> = ({ title, height = 300, children }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
