import React, { useState } from 'react';
import { useBugs } from '../context/BugContext';
import { MessageSquare, Send } from 'lucide-react';

interface CommentsProps {
  bugId: string;
}

export function Comments({ bugId }: CommentsProps) {
  const { state, dispatch } = useBugs();
  const [newComment, setNewComment] = useState('');
  const bug = state.bugs.find(b => b.id === bugId);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: crypto.randomUUID(),
      bugId,
      text: newComment,
      author: 'Current User', // In a real app, this would come from auth
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_COMMENT',
      payload: { bugId, comment },
    });

    setNewComment('');
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
        <MessageSquare size={20} />
        Comments
      </h3>

      <div className="space-y-4 mb-4">
        {bug?.comments.map(comment => (
          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <span className="font-medium dark:text-white">{comment.author}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{comment.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddComment} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );
}