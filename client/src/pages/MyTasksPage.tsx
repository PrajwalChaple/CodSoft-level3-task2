import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function MyTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks/my-tasks');
        setTasks(res.data.data);
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      'todo': 'badge-primary',
      'in-progress': 'badge-warning',
      'review': 'badge-info',
      'done': 'badge-success',
    };
    return map[status] || 'badge-primary';
  };

  if (loading) {
    return <div className="loader"><div className="spinner"></div></div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Tasks</h1>
          <p>All tasks assigned to you across projects</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-my-tasks"
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="filter-task-status">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} id="filter-task-priority">
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <h3>{search || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No tasks match your filters' : 'No tasks assigned to you'}</h3>
          <p>Tasks will appear here when they are assigned to you</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                return (
                  <tr
                    key={task._id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => task.project?._id && navigate(`/projects/${task.project._id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {task.project && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '13px' }}>{task.project.name}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={isOverdue ? 'deadline-overdue' : ''} style={{ fontSize: '13px' }}>
                        {formatDate(task.deadline)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
