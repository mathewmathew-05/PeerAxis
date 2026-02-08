import { useState, useEffect } from 'react';
import { USER_ROLES, SESSION_STATUS, GOAL_STATUS, NOTIFICATION_TYPES } from '../types';

// Mock data generator
const generateMockMentors = () => {
  const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh'];
  const skills = ['DSA', 'Web Dev', 'ML', 'Cloud', 'Mobile Dev'];
  
  return names.map((name, idx) => ({
    id: `mentor-${idx + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    role: USER_ROLES.MENTOR,
    department: 'Computer Science',
    year: 3 + (idx % 2),
    skills: [skills[idx], skills[(idx + 1) % skills.length]],
    rating: 4.2 + (Math.random() * 0.8),
    sessionsCompleted: 5 + Math.floor(Math.random() * 20),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    availability: ['Mon 4-6 PM', 'Wed 5-7 PM', 'Fri 3-5 PM'],
    timezone: 'IST',
    bio: `Experienced in ${skills[idx]} with a passion for teaching and mentoring students.`
  }));
};

const generateMockSessions = (userId, userRole) => {
  const sessions = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + (i - 2) * 3);
    
    sessions.push({
      id: `session-${i + 1}`,
      mentorId: userRole === USER_ROLES.MENTOR ? userId : `mentor-${i % 3 + 1}`,
      menteeId: userRole === USER_ROLES.MENTEE ? userId : `mentee-${i % 3 + 1}`,
      mentorName: userRole === USER_ROLES.MENTOR ? 'You' : ['Rahul Sharma', 'Priya Patel', 'Amit Kumar'][i % 3],
      menteeName: userRole === USER_ROLES.MENTEE ? 'You' : ['Student A', 'Student B', 'Student C'][i % 3],
      date: date.toISOString(),
      duration: 60,
      mode: i % 2 === 0 ? 'online' : 'offline',
      meetingLink: i % 2 === 0 ? 'https://meet.google.com/abc-defg-hij' : null,
      location: i % 2 === 1 ? 'Library Room 301' : null,
      status: date > today ? SESSION_STATUS.UPCOMING : SESSION_STATUS.COMPLETED,
      topic: ['DSA Practice', 'Web Dev Project', 'Career Guidance', 'Interview Prep', 'ML Concepts'][i % 5],
      agenda: ['Discuss binary trees', 'Review React components', 'Resume tips', 'Mock interview', 'Neural networks'][i % 5],
      notes: date < today ? 'Great session! Covered all topics.' : '',
      rating: date < today ? 4 + Math.random() : null
    });
  }
  
  return sessions;
};

const generateMockGoals = (userId) => {
  return [
    {
      id: 'goal-1',
      userId,
      title: 'Master Dynamic Programming',
      description: 'Complete 50 DP problems on LeetCode',
      specific: 'Solve DP problems from Easy to Hard',
      measurable: '50 problems completed',
      achievable: 'Dedicate 2 hours daily',
      relevant: 'Essential for interviews',
      timeBound: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 40,
      status: GOAL_STATUS.ON_TRACK,
      category: 'DSA',
      microTasks: [
        { id: 'mt-1', title: 'Complete 10 easy problems', completed: true, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'mt-2', title: 'Complete 20 medium problems', completed: true, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'mt-3', title: 'Complete 10 hard problems', completed: false, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'mt-4', title: 'Practice interview problems', completed: false, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal-2',
      userId,
      title: 'Build Full-Stack Project',
      description: 'Create a complete MERN stack application',
      specific: 'Build a task management app',
      measurable: 'Deployed and functional app',
      achievable: 'Work on weekends',
      relevant: 'Portfolio project for internships',
      timeBound: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 65,
      status: GOAL_STATUS.ON_TRACK,
      category: 'Web Dev',
      microTasks: [
        { id: 'mt-5', title: 'Design UI mockups', completed: true, dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'mt-6', title: 'Setup backend API', completed: true, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'mt-7', title: 'Implement authentication', completed: false, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'mt-8', title: 'Deploy to cloud', completed: false, dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

const generateMockNotifications = (userId) => {
  return [
    {
      id: 'notif-1',
      userId,
      type: NOTIFICATION_TYPES.SESSION_REMINDER,
      title: 'Session Tomorrow',
      message: 'Your mentoring session with Rahul Sharma is scheduled for tomorrow at 4 PM',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      link: '/sessions'
    },
    {
      id: 'notif-2',
      userId,
      type: NOTIFICATION_TYPES.GOAL_DUE,
      title: 'Goal Deadline Approaching',
      message: 'Your goal "Master Dynamic Programming" is due in 5 days',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      link: '/goals'
    },
    {
      id: 'notif-3',
      userId,
      type: NOTIFICATION_TYPES.BADGE_EARNED,
      title: 'New Badge Earned! 🎉',
      message: 'You earned the "Rising Mentor" badge for completing 5 sessions',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      link: '/leaderboard'
    }
  ];
};

const generateMockMessages = (userId) => {
  return [
    {
      id: 'conv-1',
      participants: [userId, 'mentor-1'],
      otherUser: {
        id: 'mentor-1',
        name: 'Rahul Sharma',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul Sharma',
        online: true
      },
      lastMessage: {
        text: 'See you tomorrow at 4 PM!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        senderId: 'mentor-1'
      },
      messages: [
        {
          id: 'msg-1',
          senderId: userId,
          text: 'Hi! Can we discuss DP problems tomorrow?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg-2',
          senderId: 'mentor-1',
          text: 'Sure! I can help you with that.',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString()
        },
        {
          id: 'msg-3',
          senderId: 'mentor-1',
          text: 'See you tomorrow at 4 PM!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ],
      unreadCount: 1
    }
  ];
};

export const useMockData = (user) => {
  const [data, setData] = useState({
    mentors: [],
    sessions: [],
    goals: [],
    notifications: [],
    messages: [],
    leaderboard: []
  });

  useEffect(() => {
    if (!user) return;

    // Generate mock data
    const mockData = {
      mentors: generateMockMentors(),
      sessions: generateMockSessions(user.id, user.role),
      goals: generateMockGoals(user.id),
      notifications: generateMockNotifications(user.id),
      messages: generateMockMessages(user.id),
      leaderboard: generateMockMentors().map((mentor, idx) => ({
        ...mentor,
        rank: idx + 1,
        points: 500 - idx * 50,
        badges: Math.floor(Math.random() * 4) + 1
      }))
    };

    setData(mockData);
  }, [user]);

  return data;
};