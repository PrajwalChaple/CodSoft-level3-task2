import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';

const columns = [
  { id: 'todo', title: 'To Do', color: 'var(--color-primary)' },
  { id: 'in-progress', title: 'In Progress', color: 'var(--color-warning)' },
  { id: 'review', title: 'Review', color: 'var(--color-info)' },
  { id: 'done', title: 'Done', color: 'var(--color-success)' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState('todo');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
      ]);
      setProject(projRes.data.data);
      setTasks(taskRes.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 404 || e.response?.status === 403) {
        navigate('/projects');
      }
      console.error('Failed to load project', err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Socket.io real-time events
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:project', id);

    socket.on('task:created', (task: any) => {
      setTasks(prev => {
        if (prev.find(t => t._id === task._id)) return prev;
        return [...prev, task];
      });
    });

    socket.on('task:updated', (updatedTask: any) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }
    });

    socket.on('task:statusUpdated', (updatedTask: any) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });

    socket.on('task:deleted', (taskId: string) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });

    socket.on('task:commentAdded', (updatedTask: any) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }
    });

    socket.on('project:updated', (updatedProject: any) => {
      setProject(updatedProject);
    });

    return () => {
      socket.emit('leave:project', id);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:statusUpdated');
      socket.off('task:deleted');
      socket.off('task:commentAdded');
      socket.off('project:updated');
    };
  }, [socket, id, selectedTask]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('dragging');
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      // Revert on failure
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: task.status } : t));
      console.error('Failed to update task status', err);
    }
  };

  const openCreateTask = (status: string) => {
    setCreateTaskStatus(status);
    setShowCreateTask(true);
  };

  const handleTaskCreated = (task: any) => {
    setTasks(prev => [...prev, task]);
  };

  const handleTaskClick = async (task: any) => {
    try {
      const res = await api.get(`/tasks/${task._id}`);
      setSelectedTask(res.data.data);
      setShowTaskDetail(true);
    } catch (err) {
      console.error('Failed to load task details', err);
    }
  };

  const handleTaskUpdated = (updatedTask: any) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return <div className="loader"><div className="spinner"></div></div>;
  }

  if (!project) {
    return <div className="empty-state"><h3>Project not found</h3></div>;
  }

  const memberColors = [
    'linear-gradient(135deg, #6c63ff, #8b5cf6)',
    'linear-gradient(135deg, #00d4aa, #06d6a0)',
    'linear-gradient(135deg, #ff4d6d, #ff6b8a)',
    'linear-gradient(135deg, #ffd166, #ffb347)',
    'linear-gradient(135deg, #4ea8de, #48bfe3)',
  ];

  return (
    <>
      {/* Project Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/projects')}
            style={{ padding: '6px 10px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: project.color }} />
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{project.name}</h1>
          <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'completed' ? 'badge-primary' : 'badge-warning'}`}>
            {project.status}
          </span>
        </div>
        {project.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginLeft: '44px' }}>{project.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px', marginLeft: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Progress:</span>
            <div className="progress-bar" style={{ width: '120px' }}>
              <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{project.progress}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Team:</span>
            <div style={{ display: 'flex', marginLeft: '4px' }}>
              {project.members.slice(0, 5).map((member: any, i: number) => (
                <div
                  key={member._id}
                  title={member.name}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700,
                    color: 'white', background: memberColors[i % memberColors.length],
                    marginLeft: i > 0 ? '-6px' : '0', border: '2px solid var(--bg-primary)',
                  }}
                >
                  {getInitials(member.name)}
                </div>
              ))}
            </div>
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map(col => {
          const columnTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  {col.title}
                  <span className="kanban-column-count">{columnTasks.length}</span>
                </div>
                <button
                  className="btn btn-icon"
                  onClick={() => openCreateTask(col.id)}
                  style={{ color: 'var(--text-muted)' }}
                  title={`Add task to ${col.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              <div
                className={`kanban-column-body ${dragOverColumn === col.id ? 'dragging-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {columnTasks.map(task => (
                  <div key={task._id} onDragEnd={handleDragEnd}>
                    <TaskCard
                      task={task}
                      onClick={() => handleTaskClick(task)}
                      onDragStart={(e) => handleDragStart(e, task._id)}
                    />
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic',
                    border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)',
                    minHeight: '80px',
                  }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreated={handleTaskCreated}
        projectId={id!}
        defaultStatus={createTaskStatus}
      />

      <TaskDetailModal
        isOpen={showTaskDetail}
        onClose={() => { setShowTaskDetail(false); setSelectedTask(null); }}
        task={selectedTask}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
      />
    </>
  );
}
