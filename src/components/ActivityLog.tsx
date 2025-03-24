import React from 'react';
import { useBugs } from '../context/BugContext';
import { History } from 'lucide-react';

interface ActivityLogProps {
  bugId: string;
}

export function ActivityLog({ bugId }: ActivityLogProps) {
  const { state } = useBugs();
  const bug = state.bugs.find(b => b.id === bugId);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
        <History size={20} />
        Activity Log
      </h3>

      <div className="space-y-4">
        {bug?.activityLogs.map(log => (
          <div key={log.id} className="flex items-start gap-4">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-300">{log.details}</p>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}