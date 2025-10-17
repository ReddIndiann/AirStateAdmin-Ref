// src/components/ListCard.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

interface ListCardItem {
  label: string;
  value: string;
  valueColor?: string;
}

interface ListCardProps {
  title: string;
  items: ListCardItem[];
}

const ListCard: React.FC<ListCardProps> = ({ title, items }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className={`text-sm ${item.valueColor || 'font-medium'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ListCard;
