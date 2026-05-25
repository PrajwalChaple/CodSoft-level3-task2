import { useState } from 'react';
import Modal from './Modal';
import api from '../api/axios';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: any) => void;
}

const projectColors = [
  '#6c63ff', '#00d4aa', '#ff4d6d', '#ffd166', '#4ea8de',
  '#8b5cf6', '#06d6a0', '#ff9843', '#a78bfa', '#f472b6',
];

export default function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#6c63ff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/projects', {
        name: name.trim(),
        description: description.trim(),
        deadline: deadline || undefined,
        color,
      });
      onCreated(res.data.data);
      handleClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setDeadline('');
    setColor('#6c63ff');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} form="create-project-form">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </>
      }
    >
      <form id="create-project-form" onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ padding: '8px', background: 'var(--color-danger-light)', borderRadius: '8px' }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter project name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            id="create-project-name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            id="create-project-description"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input
            type="date"
            className="form-input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            id="create-project-deadline"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {projectColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid white' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: color === c ? `0 0 12px ${c}60` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
