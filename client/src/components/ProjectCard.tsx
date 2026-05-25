import { useNavigate } from 'react-router-dom';

interface Member {
  _id: string;
  name: string;
  avatar: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  color: string;
  deadline?: string;
  members: Member[];
  owner: Member;
}

const memberColors = [
  'linear-gradient(135deg, #6c63ff, #8b5cf6)',
  'linear-gradient(135deg, #00d4aa, #06d6a0)',
  'linear-gradient(135deg, #ff4d6d, #ff6b8a)',
  'linear-gradient(135deg, #ffd166, #ffb347)',
  'linear-gradient(135deg, #4ea8de, #48bfe3)',
];

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';

  return (
    <div
      className="project-card"
      style={{ '--project-color': project.color } as React.CSSProperties}
      onClick={() => navigate(`/projects/${project._id}`)}
      id={`project-${project._id}`}
    >
      <div className="project-card-header">
        <h3 className="project-card-name">{project.name}</h3>
        <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'completed' ? 'badge-primary' : 'badge-warning'}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}

      <div className="project-card-progress">
        <div className="project-card-progress-header">
          <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
          <span style={{ fontWeight: 700 }}>{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
        </div>
      </div>

      <div className="project-card-footer">
        <div className="project-card-members">
          {project.members.slice(0, 4).map((member, i) => (
            <div
              key={member._id}
              className="project-card-member"
              style={{ background: memberColors[i % memberColors.length] }}
              title={member.name}
            >
              {getInitials(member.name)}
            </div>
          ))}
          {project.members.length > 4 && (
            <div className="project-card-member" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              +{project.members.length - 4}
            </div>
          )}
        </div>

        {project.deadline && (
          <span className={`project-card-deadline ${isOverdue ? 'deadline-overdue' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDate(project.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
