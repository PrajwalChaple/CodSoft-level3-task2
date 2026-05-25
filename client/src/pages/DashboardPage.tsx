import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/my-tasks'),
        ]);
        setProjects(projRes.data.data);
        setMyTasks(taskRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="loader"><div className="spinner"></div></div>;
  }

  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === 'done').length;
  const overdueTasks = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'in-progress').length;

  const upcomingTasks = myTasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })
    .slice(0, 5);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--color-primary)' } as React.CSSProperties}>
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'var(--color-primary-light)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{projects.length}</div>
          <div className="stat-card-label">Total Projects</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--color-info)' } as React.CSSProperties}>
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'rgba(78, 168, 222, 0.15)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{totalTasks}</div>
          <div className="stat-card-label">My Tasks</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--color-success)' } as React.CSSProperties}>
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'var(--color-success-light)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{completedTasks}</div>
          <div className="stat-card-label">Completed</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--color-danger)' } as React.CSSProperties}>
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'var(--color-danger-light)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{overdueTasks}</div>
          <div className="stat-card-label">Overdue</div>
        </div>
      </div>

      {/* Recent Projects + Upcoming Tasks */}
      <div className="charts-grid">
        {/* Recent Projects */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="chart-card-title" style={{ marginBottom: 0 }}>Recent Projects</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>View All</button>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>No projects yet. Create your first project!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.slice(0, 5).map(project => (
                <div
                  key={project._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px',
                    background: 'var(--glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    transition: 'var(--transition)', border: '1px solid transparent',
                  }}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-color-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', background: project.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: '80px' }}>
                      <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '30px', textAlign: 'right' }}>{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="chart-card-title" style={{ marginBottom: 0 }}>Upcoming Tasks</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-tasks')}>View All</button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>No upcoming tasks. You're all caught up! 🎉</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingTasks.map(task => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                return (
                  <div
                    key={task._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px',
                      background: 'var(--glass)', borderRadius: 'var(--radius-sm)',
                      transition: 'var(--transition)', border: '1px solid transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-color-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: task.priority === 'critical' ? 'var(--color-danger)' :
                        task.priority === 'high' ? '#ff9843' :
                        task.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-success)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      {task.project && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {task.project.name}
                        </div>
                      )}
                    </div>
                    {task.deadline && (
                      <span style={{ fontSize: '12px', color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="chart-card" style={{ marginBottom: '28px' }}>
        <h3 className="chart-card-title">Activity Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--glass)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-warning)' }}>{inProgressTasks}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--glass)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>{completedTasks}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Done</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--glass)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Completion Rate</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--glass)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>{projects.filter(p => p.status === 'active').length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Active Projects</div>
          </div>
        </div>
      </div>
    </>
  );
}
