// src/pages/Feed.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface Comment {
  id: string;
  author: string;
  content: string;
  time: string;
}

interface FeedPost {
  id: string;
  author: string;
  department: string;
  content: string;
  time: string;
  likes: number;
  comments: Comment[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  mediaName?: string;
}

const MOCK_POSTS: FeedPost[] = [
  { id: 'f1', author: 'Grace Aceng', department: 'Administration', content: 'Reminder: All staff must complete the updated Employee Biodata Form by Friday. Forms are available in Documents > Templates. Please submit completed forms to HR.', time: '2h ago', likes: 8, comments: [{ id: 'c1', author: 'Amos Ojok', content: 'Will submit mine by Thursday.', time: '1h ago' }] },
  { id: 'f2', author: 'Peter Byamugisha', department: 'Executive', content: 'Great news! Our SEFAA application has been shortlisted. Thank you to everyone who contributed to the preparation. Special recognition to Sarah and the grants team.', time: '5h ago', likes: 24, comments: [{ id: 'c2', author: 'Sarah Aciro', content: 'Team effort! Proud of everyone.', time: '4h ago' }, { id: 'c3', author: 'Janet Apio', content: 'Congratulations to the whole team!', time: '3h ago' }] },
  { id: 'f3', author: 'Pius Odong', department: 'Innovation', content: 'Field testing of the solar-powered irrigation prototype completed successfully in Karamoja. Photos and video documentation attached.', time: '1d ago', likes: 15, comments: [], mediaUrl: '#', mediaType: 'image', mediaName: 'Karamoja_Field_Test_Photos.jpg' },
  { id: 'f4', author: 'Nassir Mwanje', department: 'Executive', content: 'Minutes from the August 6 institutional identity meeting with Mr. Karule Richard are now available in Documents > Meeting Minutes. Key decisions on vision, mission, and pillar restructuring require Board approval.', time: '2d ago', likes: 12, comments: [{ id: 'c4', author: 'Grace Aceng', content: 'Uploaded. Also added the comparison summary table.', time: '2d ago' }], mediaUrl: '#', mediaType: 'document', mediaName: 'ARDHI_Identity_Summary_Table.docx' },
];

export function Feed() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [mediaFile, setMediaFile] = useState<{ name: string; type: 'image' | 'video' | 'document' } | null>(null);

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    const newPost: FeedPost = {
      id: `f${Date.now()}`,
      author: user?.name || 'Unknown',
      department: user?.department || 'General',
      content: newPostContent.trim(),
      time: 'Just now',
      likes: 0,
      comments: [],
      ...(mediaFile ? { mediaUrl: '#', mediaType: mediaFile.type, mediaName: mediaFile.name } : {}),
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setMediaFile(null);
    showToast({ title: 'Posted', message: 'Your post has been published.', type: 'success' });
  };

  const handleReply = (postId: string) => {
    if (!replyContent.trim()) return;
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: [...p.comments, { id: `c${Date.now()}`, author: user?.name || 'Unknown', content: replyContent.trim(), time: 'Just now' }],
    } : p));
    setReplyContent('');
    setReplyingTo(null);
    showToast({ title: 'Reply Posted', message: 'Your reply has been added.', type: 'success' });
  };

  const handleMediaAttach = (type: 'image' | 'video' | 'document') => {
    const names: Record<string, string> = { image: 'Attached_Photo.jpg', video: 'Attached_Video.mp4', document: 'Attached_Document.pdf' };
    setMediaFile({ name: names[type], type });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Feed</h1>
        <p className="text-sm text-slate-500 mt-1">Department updates, announcements, and discussions</p>
      </div>

      {/* COMPOSE POST */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-aims-green flex items-center justify-center text-white text-sm font-bold shrink-0">{user?.name?.charAt(0) || '?'}</div>
          <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Share an update with your team..." rows={3} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50 resize-none" />
        </div>
        {mediaFile && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="material-symbols-outlined text-[18px] text-slate-400">{mediaFile.type === 'image' ? 'image' : mediaFile.type === 'video' ? 'videocam' : 'description'}</span>
            <span className="text-xs font-medium text-slate-700 flex-1">{mediaFile.name}</span>
            <button onClick={() => setMediaFile(null)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button>
          </div>
        )}
        <div className="flex items-center justify-between pl-12">
          <div className="flex gap-1">
            <button onClick={() => handleMediaAttach('image')} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Photo"><span className="material-symbols-outlined text-[18px]">image</span></button>
            <button onClick={() => handleMediaAttach('video')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Video"><span className="material-symbols-outlined text-[18px]">videocam</span></button>
            <button onClick={() => handleMediaAttach('document')} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Document"><span className="material-symbols-outlined text-[18px]">description</span></button>
          </div>
          <button onClick={handlePost} disabled={!newPostContent.trim()} className={cn('px-4 py-1.5 rounded-lg text-xs font-bold', newPostContent.trim() ? 'bg-aims-navy text-white hover:opacity-90' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>Post</button>
        </div>
      </div>

      {/* POSTS FEED */}
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-aims-mint flex items-center justify-center text-aims-green text-sm font-bold shrink-0">{post.author.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{post.author}</p>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{post.department}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{post.time}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">{post.content}</p>
              </div>
            </div>

            {post.mediaUrl && (
              <div className="ml-12 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-slate-400">{post.mediaType === 'image' ? 'image' : post.mediaType === 'video' ? 'videocam' : 'description'}</span>
                <div>
                  <p className="text-xs font-bold text-slate-700">{post.mediaName}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{post.mediaType} • Click to view</p>
                </div>
              </div>
            )}

            <div className="ml-12 flex items-center gap-4 pt-2 border-t border-slate-100">
              <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-aims-green transition-colors">
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>{post.likes}
              </button>
              <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-aims-navy transition-colors">
                <span className="material-symbols-outlined text-[16px]">chat_bubble</span>{post.comments.length} Reply{post.comments.length !== 1 ? 'ies' : ''}
              </button>
            </div>

            {post.comments.length > 0 && (
              <div className="ml-12 mt-3 space-y-2">
                {post.comments.map(comment => (
                  <div key={comment.id} className="flex gap-2 pl-3 border-l-2 border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">{comment.author.charAt(0)}</div>
                    <div>
                      <p className="text-xs"><span className="font-bold text-slate-800">{comment.author}</span> <span className="text-slate-600">{comment.content}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{comment.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {replyingTo === post.id && (
              <div className="ml-12 mt-3 flex gap-2">
                <input type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)} placeholder="Write a reply..." className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
                <button onClick={() => handleReply(post.id)} disabled={!replyContent.trim()} className="px-3 py-1.5 bg-aims-navy text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}