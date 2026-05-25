interface TaskCardProps {
  task: any;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  const isSoon = task.deadline && !isOverdue && (new Date(task.deadline).getTime() - Date.now()) < 2 * 24 * 60 * 60 * 1000;

  const priorityClass = `priority-${task.priority}`;

  return (
    <div
      className="task-card"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      id={`task-${task._id}`}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <span className={`badge ${priorityClass}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-footer">
        <div className="task-card-meta">
          {task.deadline && (
            <span className={isOverdue ? 'deadline-overdue' : isSoon ? 'deadline-soon' : ''} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDate(task.deadline)}
            </span>
          )}
          {task.comments && task.comments.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {task.comments.length}
            </span>
          )}
        </div>

        {task.assignee && (
          <div className="task-card-assignee" title={task.assignee.name}>
            {getInitials(task.assignee.name)}
          </div>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
          {task.tags.slice(0, 3).map((tag: string, i: number) => (
            <span key={i} className="badge badge-info" style={{ fontSize: '9px', padding: '2px 6px', textTransform: 'lowercase' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
