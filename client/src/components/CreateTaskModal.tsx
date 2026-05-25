import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../api/axios';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: any) => void;
  projectId: string;
  defaultStatus?: string;
}

export default function CreateTaskModal({ isOpen, onClose, onCreated, projectId, defaultStatus = 'todo' }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState(defaultStatus);
  const [deadline, setDeadline] = useState('');
  const [assignee, setAssignee] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && projectId) {
      api.get(`/projects/${projectId}`).then((res) => {
        setMembers(res.data.data.members || []);
      }).catch(() => {});
      setStatus(defaultStatus);
    }
  }, [isOpen, projectId, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        project: projectId,
        priority,
        status,
        deadline: deadline || undefined,
        assignee: assignee || undefined,
        tags,
      });
      onCreated(res.data.data);
      handleClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDeadline('');
    setAssignee('');
    setTagsInput('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ padding: '8px', background: 'var(--color-danger-light)', borderRadius: '8px' }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">Task Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            id="create-task-title"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            placeholder="Describe the task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            id="create-task-description"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)} id="create-task-priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} id="create-task-status">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Assignee</label>
          <select className="form-select" value={assignee} onChange={(e) => setAssignee(e.target.value)} id="create-task-assignee">
            <option value="">Unassigned</option>
            {members.map((m: any) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input
            type="date"
            className="form-input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            id="create-task-deadline"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input
            type="text"
            className="form-input"
            placeholder="design, frontend, bug..."
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            id="create-task-tags"
          />
        </div>
      </form>
    </Modal>
  );
}
