// src/pages/Feed.tsx
// ============================================================
// AIMS — Department Feed (Smart Filtered by Role)
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import type { Department, FeedPost } from '@/types';

// ─────────────────────────────────────────────
// DATE HELPERS (Short lines to avoid paste breaks)
// ─────────────────────────────────────────────
const HOUR = 60 * 60 * 1000;
const NOW = Date.now();
const ONE_HOUR_AGO = new Date(NOW - 1 * HOUR).toISOString();
const TWO_HOURS_AGO = new Date(NOW - 2 * HOUR).toISOString();
const FIVE_HOURS_AGO = new Date(NOW - 5 * HOUR).toISOString();
const ONE_DAY_AGO = new Date(NOW - 24 * HOUR).toISOString();
const TWO_DAYS_AGO = new Date(NOW - 48 * HOUR).toISOString();

// ─────────────────────────────────────────────
// MOCK FEED DATA (Updated with Acholi Names)
// ─────────────────────────────────────────────
const MOCK_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    authorId: 'user-admin-001',
    authorName: 'Grace Aceng',
    department: 'Administration',
    content: 'Reminder: All team leads should submit their weekly reports by Friday 5 PM. Please use the new template shared in Documents.',
    createdAt: TWO_HOURS_AGO,
    likes: 5,
    comments: [
      {
        id: 'comment-1',
        authorId: 'user-finance-001',
        authorName: 'Amos Ojok',
        content: 'Noted, will submit mine by Thursday.',
        createdAt: ONE_HOUR_AGO,
      },
    ],
  },
  {
    id: 'post-2',
    authorId: 'user-innov-001',
    authorName: 'Pius Odong',
    department: 'Innovation',
    content: 'Exciting update: The new AI-powered grant writing assistant prototype is ready for internal testing. Grant writers, please try it out and share feedback!',
    createdAt: FIVE_HOURS_AGO,
    likes: 12,
    comments: [],
  },
  {
    id: 'post-3',
    authorId: 'user-ed-001',
    authorName: 'Peter Byamugisha',
    department: 'Executive',
    content: 'Congratulations to the Grants team for securing the UGX 850M education pillar grant. Outstanding work everyone involved!',
    createdAt: ONE_DAY_AGO,
    likes: 24,
    comments: [
      {
        id: 'comment-2',
        authorId: 'user-grant-001',
        authorName: 'Sarah Aciro',
        content: 'Thank you! This was a team effort.',
        createdAt: ONE_DAY_AGO,
      },
    ],
  },
  {
    id: 'post-4',
    authorId: 'user-finance-001',
    authorName: 'Amos Ojok',
    department: 'Finance',
    content: 'Q3 Budget allocations have been finalized. Department heads, please check your emails for the breakdown.',
    createdAt: TWO_DAYS_AGO,
    likes: 8,
    comments: [],
  },
];

// ─────────────────────────────────────────────
// FEED PAGE COMPONENT
// ─────────────────────────────────────────────
export function Feed() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const ALL_TABS = ['All', 'Executive', 'Administration', 'Finance', 'HR', 'Grants', 'Research', 'Innovation', 'IT'];

  const ROLE_DEPARTMENTS: Record<string, string[]> = {
    CD: ALL_TABS,
    ED: ALL_TABS,
    SYS_ADMIN: ALL_TABS,
    COMPANY_ADMIN: ['All', 'Administration', 'HR', 'IT'],
    FINANCE: ['All', 'Finance', 'Procurement'],
    GRANT_WRITER: ['All', 'Grants'],
    INNOVATOR: ['All', 'Innovation', 'Research'],
  };

  const visibleTabs = ROLE_DEPARTMENTS[user?.role || 'CD'] || ['All'];

  const [activeTab, setActiveTab] = useState<string>(visibleTabs[0]);
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);

  const filteredPosts = activeTab === 'All' ? posts : posts.filter((post) => post.department === activeTab);

  const handlePost = () => {
    if (!newPostContent.trim() || !user) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      department: user.department,
      content: newPostContent.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostContent('');

    showToast({
      title: 'Post Published',
      message: `Your update has been shared with the ${user.department} department.`,
      type: 'success',
    });
  };

  const handleLike = (postId: string) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
        <p className="text-sm text-gray-600 mt-1">Daily departmental updates and announcements</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-aims-navy text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-aims-green flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={`Share an update with ${user?.department || 'your'} department...`}
              className="w-full resize-none border-0 focus:ring-0 text-sm text-gray-800 placeholder-gray-400 min-h-[80px] bg-transparent"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePost}
                disabled={!newPostContent.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-colors',
                  newPostContent.trim()
                    ? 'bg-aims-green text-white hover:opacity-90'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Post Update
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            <span className="material-symbols-outlined text-[48px] mb-2 block">feed</span>
            <p>No posts in this department yet.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <FeedPostCard key={post.id} post={post} onLike={handleLike} />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FEED POST CARD COMPONENT
// ─────────────────────────────────────────────
interface FeedPostCardProps {
  post: FeedPost;
  onLike: (postId: string) => void;
}

function FeedPostCard({ post, onLike }: FeedPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-aims-navy flex items-center justify-center text-white font-bold text-sm">
          {post.authorName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
          <p className="text-xs text-gray-500 font-medium">
            {post.department} • {timeAgo}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed mb-4">{post.content}</p>

      <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-aims-orange transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">thumb_up</span>
          {post.likes}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-aims-navy transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">comment</span>
          {post.comments.length}
        </button>
      </div>

      {showComments && post.comments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold shrink-0">
                {comment.authorName.charAt(0)}
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <p className="text-xs font-bold text-gray-900">{comment.authorName}</p>
                <p className="text-xs text-gray-700 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPER: Time ago formatter
// ─────────────────────────────────────────────
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}