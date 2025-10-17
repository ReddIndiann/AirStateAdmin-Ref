// src/components/StatCard.tsx

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from './Card';

interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, iconColor, bgColor, title, value, trend, trendValue }) => {
  const trendIsPositive = trend === 'up';

  return (
    <Card>
      <CardContent>
        <div className="flex items-center">
          <div className={`${bgColor} p-3 rounded-full`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center">
              <h3 className="text-2xl font-bold">{value}</h3>
              {trendValue && (
                <span className={`flex items-center ml-2 text-sm ${trendIsPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {trendIsPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {trendValue}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
