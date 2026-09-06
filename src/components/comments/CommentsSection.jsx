import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
} from '../../features/comments/commentSlice';
import { Avatar } from '../common/Badge';
import Button from '../common/Button';
import { formatRelativeTime } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

import SendIcon from '@mui/icons-material/Send';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const CommentsSection = ({ taskId }) => {
  const dispatch = useDispatch();
  const { comments, loading } = useSelector((state) => state.comments);
  const { user } = useSelector((state) => state.auth);
  const { currentWorkspace } = useSelector((state) => state.workspaces);

  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mention autocomplete popup state
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionPosition, setMentionPosition] = useState(0);

  useEffect(() => {
    if (taskId) {
      dispatch(fetchComments(taskId));
    }
  }, [taskId, dispatch]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setContent(val);

    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ')) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query.toLowerCase());
        setMentionPosition(lastAt);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (memberUser) => {
    const textBefore = content.slice(0, mentionPosition);
    const textAfter = content.slice(mentionPosition + (mentionQuery?.length || 0) + 1);
    const newContent = `${textBefore}@${memberUser.username} ${textAfter}`;
    setContent(newContent);
    setMentionQuery(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await dispatch(createComment({ taskId, content: content.trim() })).unwrap();
      setContent('');
      setMentionQuery(null);
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await dispatch(updateComment({ id: commentId, content: editContent.trim() })).unwrap();
      setEditingId(null);
      toast.success('Comment updated');
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await dispatch(deleteComment(commentId)).unwrap();
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const workspaceMembers = currentWorkspace?.members || [];
  const filteredMembers = mentionQuery !== null
    ? workspaceMembers
        .map((m) => m.user || m)
        .filter(
          (u) =>
            u.username?.toLowerCase().includes(mentionQuery) ||
            u.name?.toLowerCase().includes(mentionQuery)
        )
    : [];

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Discussion ({comments.length})
      </h4>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="relative space-y-2">
        <textarea
          rows={2}
          value={content}
          onChange={handleTextChange}
          placeholder="Write a comment... use @ to mention teammates"
          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
        />

        {/* Mention Autocomplete Dropdown */}
        {mentionQuery !== null && filteredMembers.length > 0 && (
          <div className="absolute left-0 bottom-full mb-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-20">
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
              Mention Member
            </div>
            {filteredMembers.map((mUser) => (
              <button
                type="button"
                key={mUser._id}
                onClick={() => handleSelectMention(mUser)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <Avatar src={mUser.avatar} name={mUser.name} size="xs" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {mUser.name}
                </span>
                <span className="text-slate-400 ml-auto">@{mUser.username}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim()}
            isLoading={isSubmitting}
            icon={<SendIcon fontSize="inherit" />}
          >
            Comment
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {comments.map((comm) => {
          const isAuthor = comm.user?._id === user?._id;
          const isEditing = editingId === comm._id;

          return (
            <div
              key={comm._id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar src={comm.user?.avatar} name={comm.user?.name} size="xs" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {comm.user?.name || 'Member'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatRelativeTime(comm.createdAt)}
                  </span>
                </div>

                {isAuthor && !isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(comm._id);
                        setEditContent(comm.content);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-500 rounded transition-colors"
                      title="Edit Comment"
                    >
                      <EditOutlinedIcon fontSize="inherit" />
                    </button>
                    <button
                      onClick={() => handleDelete(comm._id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                      title="Delete Comment"
                    >
                      <DeleteOutlineIcon fontSize="inherit" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(comm._id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {comm.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentsSection;
