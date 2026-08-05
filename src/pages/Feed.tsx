// src/pages/Feed.tsx
// ============================================================
// AIMS — Department Feed (Phase 2 — Replaces Chat)
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import type { Department, FeedPost } from '@/types';

// ─────────────────────────────────────────────
// DEPARTMENT TABS
// ─────────────────────────────────────────────
const DEPARTMENT_TABS: (Department | 'All')[] = [
  'All',
  'Executive',
  'Administration',
  'Finance',
  'HR',
  'Grants',
  'Research',
  'Innovation',
];

// ─────────────────────────────────────────────
// MOCK FEED DATA (Replace with API later)
// ─────────────────────────────────────────────
const MOCK_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    authorId: 'user-admin-001',
    authorName: 'Sarah Kimani',
    department: 'Administration',
    content: '📢 Reminder: All team leads should submit their weekly reports by Friday 5 PM. Please use the new template shared in Documents.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 5,
    comments: [
      {
        id: 'comment-1',
        authorId: 'user-finance-001',
        authorName: 'James Odhiambo',
        content: 'Noted, will submit mine by Thursday.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post-2',
    authorId: 'user-innov-001',
    authorName: 'Kevin Njoroge',
    department: 'Innovation',
    content: '🚀 Exciting update: The new AI-powered grant writing assistant prototype is ready for internal testing. Grant writers, please try it out and share feedback!',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 12,
    comments: [],
  },
  {
    id: 'post-3',
    authorId: 'user-ed-001',
    authorName: 'David Mwangi',
    department: 'Executive',
    content: '🎉 Congratulations to the Grants team for securing the $250K education pillar grant. Outstanding work everyone involved!',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: 24,
    comments: [
      {
        id: 'comment-2',
        authorId: 'user-grant-001',
        authorName: 'Fatima Hassan',
        content: 'Thank you! This was a team effort. 🙏',
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// ─────────────────────────────────────────────
// FEED PAGE COMPONENT
// ─────────────────────────────────────────────
export function Feed() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<Department | 'All'>('All');
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);

  // Filter posts by department
  const filteredPosts = activeTab === 'All'
    ? posts
    : posts.filter((post) => post.department === activeTab);

  // Handle new post submission
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

    // Show success toast
    showToast({
      title: 'Post Published',
      message: `Your update has been shared with the ${user.department} department.`,
      type: 'success',
    });
  };

  // Handle like
  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Feed</h1>
        <p className="text-sm text-gray-500 mt-1">
          Daily departmental updates and announcements
        </p>
      </div>

      {/* Department Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DEPARTMENT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-aims-mint text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Post Composer */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-aims-mint flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={`Share an update with ${user?.department || 'your'} department...`}
              className="w-full resize-none border-0 focus:ring-0 text-sm text-gray-700 placeholder-gray-400 min-h-[80px]"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePost}
                disabled={!newPostContent.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  newPostContent.trim()
                    ? 'bg-aims-mint text-white hover:opacity-90'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Post Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="flex flex-col gap-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-[48px] mb-2 block">
              feed
            </span>
            <p>No posts in this department yet.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
            />
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
          {post.authorName.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{post.authorName}</p>
          <p className="text-xs text-gray-400">
            {post.department} • {timeAgo}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {post.content}
      </p>

      {/* Post Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-aims-mint transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
          {post.likes}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-aims-mint transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">comment</span>
          {post.comments.length}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && post.comments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold shrink-0">
                {comment.authorName.charAt(0)}
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <p className="text-xs font-medium text-gray-700">{comment.authorName}</p>
                <p className="text-xs text-gray-600 mt-0.5">{comment.content}</p>
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