import { useState } from 'react';
import Modal from './Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onUpdated: (task: any) => void;
  onDeleted: (taskId: string) => void;
}

export default function TaskDetailModal({ isOpen, onClose, task, onUpdated, onDeleted }: TaskDetailModalProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const startEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/tasks/${task._id}`, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        status: editStatus,
      });
      onUpdated(res.data.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update task', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted(task._id);
      onClose();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: commentText.trim() });
      onUpdated(res.data.data);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const priorityClass = `priority-${task.priority}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setIsEditing(false); onClose(); }}
      title={isEditing ? 'Edit Task' : 'Task Details'}
      footer={
        isEditing ? (
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            <button className="btn btn-secondary" onClick={startEdit}>Edit</button>
          </>
        )
      }
    >
      {isEditing ? (
        <>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{task.title}</h3>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${priorityClass}`}>{task.priority}</span>
            <span className={`badge ${task.status === 'done' ? 'badge-success' : task.status === 'in-progress' ? 'badge-warning' : task.status === 'review' ? 'badge-info' : 'badge-primary'}`}>
              {task.status}
            </span>
          </div>

          {task.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Assignee</span>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>
                {task.assignee ? task.assignee.name : 'Unassigned'}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Created by</span>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>
                {task.createdBy?.name || 'Unknown'}
              </div>
            </div>
            {task.deadline && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Deadline</span>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>
                  {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Created</span>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>
                {formatDate(task.createdAt)}
              </div>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tags</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {task.tags.map((tag: string, i: number) => (
                  <span key={i} className="badge badge-info">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
              Comments ({task.comments?.length || 0})
            </h4>

            {task.comments && task.comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                {task.comments.map((comment: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="task-card-assignee" style={{ width: '28px', height: '28px', fontSize: '10px', flexShrink: 0 }}>
                      {getInitials(comment.user?.name || 'U')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{comment.user?.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                style={{ flex: 1 }}
                id="task-comment-input"
              />
              <button className="btn btn-primary btn-sm" onClick={addComment} disabled={!commentText.trim()}>
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
