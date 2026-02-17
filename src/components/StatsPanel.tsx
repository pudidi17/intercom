'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Bot,
  Activity,
  Hash,
  MessageSquare,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';
import { motion } from 'framer-motion';

interface StatsPanelProps {
  stats: DashboardStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const statItems = [
    {
      label: 'Total Agents',
      value: stats.totalAgents,
      icon: Bot,
      color: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Online Now',
      value: stats.onlineAgents,
      icon: Activity,
      color: 'from-green-500 to-emerald-600',
      iconColor: 'text-green-400',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Active Channels',
      value: stats.activeChannels,
      icon: Hash,
      color: 'from-blue-500 to-cyan-600',
      iconColor: 'text-blue-400',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Messages Today',
      value: stats.messagesToday,
      icon: MessageSquare,
      color: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-400',
      trend: '+23%',
      trendUp: true,
    },
    {
      label: 'Capabilities',
      value: stats.capabilities,
      icon: Zap,
      color: 'from-pink-500 to-rose-600',
      iconColor: 'text-pink-400',
      trend: '+3',
      trendUp: true,
    },
    {
      label: 'Success Rate',
      value: '98.5%',
      icon: TrendingUp,
      color: 'from-teal-500 to-green-600',
      iconColor: 'text-teal-400',
      trend: '+0.5%',
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="relative overflow-hidden bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-gray-600 transition-all duration-300">
            {/* Gradient accent */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                stat.color
              )}
            />

            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-start justify-between mb-2">
                <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
                {stat.trend && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      stat.trendUp ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">
                {typeof stat.value === 'number'
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

interface MiniStatsProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

export function MiniStats({
  icon,
  label,
  value,
  trend,
  trendUp,
}: MiniStatsProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
      <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold text-white">{value}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          {label}
          {trend && (
            <span
              className={cn(
                'text-xs',
                trendUp ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
