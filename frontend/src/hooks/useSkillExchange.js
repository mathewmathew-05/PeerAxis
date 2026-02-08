import { useState, useEffect } from 'react';

// Mock skill exchange data generator
const generateMockExchanges = (userId) => {
  return [
    {
      id: 'exchange-1',
      userA: {
        id: userId,
        name: 'You',
        skill: 'Python Programming',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      },
      userB: {
        id: 'user-2',
        name: 'Priya Patel',
        skill: 'Flutter Development',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
      },
      status: 'active',
      creditsA: 8,
      creditsB: 8,
      hoursPerWeek: 4,
      totalSessions: 8,
      completedSessions: 8,
      plannedSessions: 12,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sessions: [
        { id: 's1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 1, teacher: userId, completed: true },
        { id: 's2', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), duration: 1, teacher: 'user-2', completed: true },
        { id: 's3', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), duration: 1, teacher: userId, completed: true },
        { id: 's4', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 1, teacher: 'user-2', completed: true },
        { id: 's5', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 1, teacher: userId, completed: true },
      ]
    },
    {
      id: 'exchange-2',
      userA: {
        id: 'user-3',
        name: 'Rahul Sharma',
        skill: 'Web Development',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul'
      },
      userB: {
        id: userId,
        name: 'You',
        skill: 'Machine Learning',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      },
      status: 'requested',
      creditsA: 0,
      creditsB: 0,
      hoursPerWeek: 3,
      totalSessions: 0,
      completedSessions: 0,
      plannedSessions: 10,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sessions: []
    },
    {
      id: 'exchange-3',
      userA: {
        id: userId,
        name: 'You',
        skill: 'Data Structures',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      },
      userB: {
        id: 'user-4',
        name: 'Amit Kumar',
        skill: 'System Design',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit'
      },
      status: 'completed',
      creditsA: 12,
      creditsB: 12,
      hoursPerWeek: 4,
      totalSessions: 12,
      completedSessions: 12,
      plannedSessions: 12,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      sessions: []
    }
  ];
};

export const useSkillExchange = (user) => {
  const [exchanges, setExchanges] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    if (!user) return;

    const mockExchanges = generateMockExchanges(user.id);
    setExchanges(mockExchanges);

    // Calculate total credits
    const credits = mockExchanges.reduce((total, exchange) => {
      if (exchange.userA.id === user.id) {
        return total + exchange.creditsA;
      } else if (exchange.userB.id === user.id) {
        return total + exchange.creditsB;
      }
      return total;
    }, 0);
    setTotalCredits(credits);
  }, [user]);

  const createExchange = (data) => {
    // Mock create - in real app would call API
    const newExchange = {
      id: `exchange-${Date.now()}`,
      userA: {
        id: user.id,
        name: 'You',
        skill: data.skillToTeach,
        avatar: user.avatar
      },
      userB: {
        id: 'pending',
        name: 'Looking for match...',
        skill: data.skillToLearn,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pending'
      },
      status: 'requested',
      creditsA: 0,
      creditsB: 0,
      hoursPerWeek: data.hoursPerWeek,
      totalSessions: 0,
      completedSessions: 0,
      plannedSessions: data.hoursPerWeek * 4, // 4 weeks
      createdAt: new Date().toISOString(),
      sessions: []
    };
    setExchanges([newExchange, ...exchanges]);
  };

  const completeSession = (exchangeId, duration) => {
    setExchanges(exchanges.map(ex => {
      if (ex.id === exchangeId) {
        const isUserATeaching = ex.sessions.length % 2 === 0;
        return {
          ...ex,
          completedSessions: ex.completedSessions + 1,
          creditsA: isUserATeaching ? ex.creditsA + duration : ex.creditsA,
          creditsB: !isUserATeaching ? ex.creditsB + duration : ex.creditsB,
          sessions: [
            ...ex.sessions,
            {
              id: `s-${Date.now()}`,
              date: new Date().toISOString(),
              duration,
              teacher: isUserATeaching ? ex.userA.id : ex.userB.id,
              completed: true
            }
          ]
        };
      }
      return ex;
    }));

    // Update total credits
    setTotalCredits(totalCredits + duration);
  };

  const updateExchangeStatus = (exchangeId, status) => {
    setExchanges(exchanges.map(ex => 
      ex.id === exchangeId ? { ...ex, status } : ex
    ));
  };

  return {
    exchanges,
    totalCredits,
    createExchange,
    completeSession,
    updateExchangeStatus
  };
};