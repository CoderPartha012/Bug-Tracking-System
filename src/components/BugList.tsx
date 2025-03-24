import React, { useState } from 'react';
import { Bug } from '../types/bug';
import { useBugs } from '../context/BugContext';
import { AlertTriangle, Clock, CheckCircle, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Comments } from './Comments';
import { ActivityLog } from './ActivityLog';

interface BugListProps {
  onEdit: (bug: Bug) => void;
}

export function BugList({ onEdit }: BugListProps) {
  const { state, dispatch } = useBugs();
  const [expandedBug, setExpandedBug] = useState<string | null>(null);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'medium':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'low':
        return <AlertTriangle className="text-green-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'in-progress':
        return <Clock className="text-yellow-500" size={20} />;
      case 'closed':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return '';
    }
  };

  const filteredBugs = state.bugs.filter(bug => {
    const matchesStatus = state.filters.status === 'all' || bug.status === state.filters.status;
    const matchesSeverity = state.filters.severity === 'all' || bug.severity === state.filters.severity;
    const matchesAssigned = state.filters.assignedTo === 'all' || bug.assignedTo.toLowerCase().includes(state.filters.assignedTo.toLowerCase());
    const matchesSearch = bug.title.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                         bug.description.toLowerCase().includes(state.filters.search.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesAssigned && matchesSearch;
  });

  const toggleExpand = (bugId: string) => {
    setExpandedBug(expandedBug === bugId ? null : bugId);
  };

  return (
    <div className="space-y-4">
      {filteredBugs.map(bug => (
        <div
          key={bug.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {getSeverityIcon(bug.severity)}
                <h3 className="text-lg font-semibold dark:text-white">{bug.title}</h3>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{bug.description}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(bug)}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => dispatch({ type: 'DELETE_BUG', payload: bug.id })}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={() => toggleExpand(bug.id)}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                {expandedBug === bug.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(bug.status)}`}>
                {bug.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Assigned to: {bug.assignedTo}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(bug.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {expandedBug === bug.id && (
            <div className="mt-4 border-t dark:border-gray-700 pt-4">
              <Comments bugId={bug.id} />
              <ActivityLog bugId={bug.id} />
            </div>
          )}
        </div>
      ))}
      
      {filteredBugs.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No bugs found matching your criteria
        </div>
      )}
    </div>
  );
}