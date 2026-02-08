// User Types
export const USER_ROLES = {
  MENTEE: 'mentee',
  MENTOR: 'mentor',
  ADMIN: 'admin'
};

export const MEETING_MODES = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};

export const SESSION_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const GOAL_STATUS = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  COMPLETED: 'completed'
};

export const NOTIFICATION_TYPES = {
  SESSION_REQUEST: 'session_request',
  SESSION_REMINDER: 'session_reminder',
  GOAL_DUE: 'goal_due',
  FEEDBACK_REQUEST: 'feedback_request',
  MESSAGE: 'message',
  BADGE_EARNED: 'badge_earned'
};

// Skills and departments
export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering'
];

export const SKILLS = [
  'Data Structures & Algorithms',
  'Web Development',
  'Mobile Development',
  'Machine Learning',
  'Cloud Computing',
  'Database Management',
  'Cybersecurity',
  'UI/UX Design',
  'DevOps',
  'Blockchain',
  'System Design',
  'Competitive Programming'
];

export const INTERESTS = [
  'Academic Excellence',
  'Career Guidance',
  'Interview Preparation',
  'Project Development',
  'Research',
  'Internship Guidance',
  'Communication Skills',
  'Time Management',
  'Leadership'
];

// Badge Types
export const BADGE_TYPES = [
  {
    id: 'first_session',
    name: 'First Session',
    description: 'Completed your first mentoring session',
    icon: '🎯',
    points: 10
  },
  {
    id: 'mentor_5',
    name: 'Rising Mentor',
    description: 'Completed 5 mentoring sessions',
    icon: '⭐',
    points: 50
  },
  {
    id: 'mentor_10',
    name: 'Expert Mentor',
    description: 'Completed 10 mentoring sessions',
    icon: '🏆',
    points: 100
  },
  {
    id: 'goal_achiever',
    name: 'Goal Achiever',
    description: 'Helped mentee achieve their goal',
    icon: '🎓',
    points: 30
  },
  {
    id: 'highly_rated',
    name: 'Highly Rated',
    description: 'Maintained 4.5+ rating for 5 sessions',
    icon: '⚡',
    points: 75
  },
  {
    id: 'consistent',
    name: 'Consistency Champion',
    description: 'Conducted sessions for 4 consecutive weeks',
    icon: '🔥',
    points: 60
  }
];