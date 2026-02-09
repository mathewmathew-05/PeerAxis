import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Target, Plus, Calendar, CheckCircle, AlertCircle, Trash2,
  Edit, Play, Pause, Award, Search, Filter, Download
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

/* ---------- HELPERS ---------- */

const getMyCategoriesForRole = (role) => {
  if (role === 'mentee') return ['learning', 'skill', 'career', 'academic', 'project'];
  if (role === 'mentor') return ['teaching', 'professional_development', 'mentoring_goals'];
  return ['learning', 'career', 'skill', 'project', 'other'];
};

const PRIORITIES = ['low', 'medium', 'high'];
const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due Date (Soonest)' },
  { value: 'progress', label: 'Progress (Highest)' },
  { value: 'created', label: 'Recently Created' }
];

/* ---------- GOAL TEMPLATES ---------- */
const GOAL_TEMPLATES = [
  {
    id: 1,
    title: 'Learn a New Programming Language',
    description: 'Master a new programming language to expand technical skills',
    category: 'learning',
    priority: 'medium',
    specific: 'Learn Python programming language basics and intermediate concepts',
    measurable: 'Complete 5 projects and pass certification exam',
    achievable: 'Dedicate 1 hour daily to learning and practice',
    relevant: 'Python is essential for data science and automation',
    suggestedMilestones: [
      'Complete basic syntax tutorial',
      'Build first calculator app',
      'Learn data structures',
      'Complete intermediate course',
      'Build final portfolio project'
    ]
  },
  {
    id: 2,
    title: 'Get Professional Certification',
    description: 'Obtain industry-recognized certification',
    category: 'career',
    priority: 'high',
    specific: 'Prepare for and pass AWS Solutions Architect certification',
    measurable: 'Complete study guide, practice tests, and pass exam',
    achievable: 'Study 2 hours daily for 3 months',
    relevant: 'Certification will advance career in cloud computing',
    suggestedMilestones: [
      'Research certification requirements',
      'Purchase study materials',
      'Complete course modules',
      'Take 3 practice exams',
      'Schedule and pass exam'
    ]
  },
  {
    id: 3,
    title: 'Build a Portfolio Project',
    description: 'Create a significant project to showcase skills',
    category: 'project',
    priority: 'high',
    specific: 'Build a full-stack web application with React and Node.js',
    measurable: 'Complete app with 5 core features and deploy to cloud',
    achievable: 'Work 10 hours per week for 2 months',
    relevant: 'Portfolio project will help secure job interviews',
    suggestedMilestones: [
      'Design wireframes and architecture',
      'Set up development environment',
      'Build backend API',
      'Create frontend UI',
      'Deploy and document'
    ]
  }
];

/* ---------- COMPONENT ---------- */

const GoalsPage = () => {
  const { user } = useAuth();
  const CATEGORIES = getMyCategoriesForRole(user.role);

  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState('active');

  /* 🔍 SEARCH & FILTERS */
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');

  /* ✏️ EDIT MODE */
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  /* CREATE FORM */
  const getDefaultCategory = () => {
    if (user.role === 'mentee') return 'learning';
    if (user.role === 'mentor') return 'teaching';
    return 'learning';
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: getDefaultCategory(),
    priority: 'medium',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    time_bound: '',
  });

  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  /* For adding milestone to existing goal */
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newExistingGoalMilestone, setNewExistingGoalMilestone] = useState('');
  const [newExistingGoalMilestoneDate, setNewExistingGoalMilestoneDate] = useState('');

  /* ---------- EFFECTS ---------- */

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchStats();
    }
  }, [user, filterStatus]);

  /* ---------- API FUNCTIONS ---------- */

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/goals/user/${user.user_id}?status=${filterStatus}`
      );
      setGoals(await res.json());
    } catch {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await fetch(
      `http://localhost:5000/api/goals/user/${user.user_id}/stats`
    );
    setStats(await res.json());
  };

  const loadGoalDetails = async (goalId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/${goalId}`);
      const data = await res.json();
      console.log('Loaded goal details:', data);
      console.log('Milestones:', data.milestones);
      setSelectedGoal(data);
      setIsEditMode(false);
      setAddingMilestone(false);
      setNewExistingGoalMilestone('');
      setNewExistingGoalMilestoneDate('');
      setEditData({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        specific: data.specific,
        measurable: data.measurable,
        achievable: data.achievable,
        relevant: data.relevant,
        time_bound: data.time_bound
      });
    } catch (err) {
      toast.error('Failed to load goal details');
      console.error(err);
    }
  };

  const handleCreateGoal = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    if (!formData.time_bound) {
      toast.error('Please select a deadline');
      return;
    }
    if (!formData.specific.trim()) {
      toast.error('Please fill in the SMART framework fields');
      return;
    }

    try {
      console.log('Creating goal with data:', { ...formData, user_id: user.user_id });
      
      const res = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user.user_id })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to create goal');
      }
      
      const result = await res.json();
      const newGoal = result.goal; // Backend returns { message, goal }
      
      console.log('Created goal:', newGoal);
      
      // Add milestones using correct endpoint
      if (milestones.length > 0) {
        for (const milestone of milestones) {
          const milestoneRes = await fetch(`http://localhost:5000/api/goals/${newGoal.goal_id}/milestones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: milestone.title,
              due_date: milestone.due_date || null
            })
          });
          
          if (!milestoneRes.ok) {
            console.error('Failed to create milestone:', milestone.title);
          }
        }
        toast.success(`Goal created with ${milestones.length} milestone(s)! 🎯`);
      } else {
        toast.success('Goal created! 🎯');
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchGoals();
      fetchStats();
    } catch (err) {
      console.error('Error creating goal:', err);
      toast.error(err.message || 'Failed to create goal');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/${selectedGoal.goal_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      if (!res.ok) throw new Error('Failed to update goal');
      
      toast.success('Goal updated! ✅');
      setIsEditMode(false);
      loadGoalDetails(selectedGoal.goal_id);
      fetchGoals();
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    
    try {
      await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: 'DELETE'
      });
      toast.success('Goal deleted');
      setIsDetailDialogOpen(false);
      fetchGoals();
      fetchStats();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const handleToggleMilestone = async (milestoneId, completed) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completed })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update milestone');
      }
      
      toast.success(completed ? 'Milestone completed! ✅' : 'Milestone reopened');
      
      // Reload goal to get updated progress
      await loadGoalDetails(selectedGoal.goal_id);
      await fetchGoals();
      await fetchStats();
    } catch (err) {
      toast.error('Failed to update milestone');
      console.error('Milestone update error:', err);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Delete this milestone?')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/goals/milestones/${milestoneId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete milestone');
      }
      
      toast.success('Milestone deleted');
      await loadGoalDetails(selectedGoal.goal_id);
      await fetchGoals();
      await fetchStats();
    } catch (err) {
      toast.error('Failed to delete milestone');
      console.error(err);
    }
  };

  const handleAddMilestoneToExistingGoal = async () => {
    if (!newExistingGoalMilestone.trim()) {
      toast.error('Please enter a milestone title');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/goals/${selectedGoal.goal_id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newExistingGoalMilestone,
          due_date: newExistingGoalMilestoneDate || null
        })
      });

      if (!res.ok) {
        throw new Error('Failed to add milestone');
      }

      toast.success('Milestone added! ✅');
      setNewExistingGoalMilestone('');
      setNewExistingGoalMilestoneDate('');
      setAddingMilestone(false);
      await loadGoalDetails(selectedGoal.goal_id);
      await fetchGoals();
      await fetchStats();
    } catch (err) {
      toast.error('Failed to add milestone');
      console.error(err);
    }
  };

  const handlePauseGoal = async (goalId) => {
    try {
      await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'on_hold' })
      });
      toast.success('Goal paused');
      loadGoalDetails(goalId);
      fetchGoals();
      fetchStats();
    } catch {
      toast.error('Failed to pause goal');
    }
  };

  const handleResumeGoal = async (goalId) => {
    try {
      await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      toast.success('Goal resumed');
      loadGoalDetails(goalId);
      fetchGoals();
      fetchStats();
    } catch {
      toast.error('Failed to resume goal');
    }
  };

  const handleToggleStatus = async (goalId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/goals/${goalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const statusMessages = {
        'active': 'Goal resumed! 🎯',
        'on_hold': 'Goal paused ⏸️',
        'completed': 'Goal completed! 🎉'
      };
      
      toast.success(statusMessages[newStatus] || 'Status updated');
      loadGoalDetails(goalId);
      fetchGoals();
      fetchStats();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: getDefaultCategory(),
      priority: 'medium',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      time_bound: '',
    });
    setMilestones([]);
  };

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setMilestones([...milestones, { 
        title: newMilestone,
        due_date: newMilestoneDate || null
      }]);
      setNewMilestone('');
      setNewMilestoneDate('');
    }
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  /* ---------- TEMPLATE FUNCTIONS ---------- */

  const applyTemplate = (template) => {
    setFormData({
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority,
      specific: template.specific,
      measurable: template.measurable,
      achievable: template.achievable,
      relevant: template.relevant,
      time_bound: ''
    });
    
    setMilestones(template.suggestedMilestones.map(title => ({ 
      title, 
      due_date: null 
    })));
    
    setIsTemplateDialogOpen(false);
    setIsCreateDialogOpen(true);
    toast.success('Template applied! Customize as needed.');
  };

  /* ---------- SEARCH & FILTER ---------- */

  const getFilteredAndSortedGoals = () => {
    let filtered = goals;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(g => g.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(g => g.priority === priorityFilter);
    }

    // Sort
    if (sortBy === 'due_date') {
      filtered.sort((a, b) => new Date(a.time_bound) - new Date(b.time_bound));
    } else if (sortBy === 'progress') {
      filtered.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === 'created') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  };

  const filteredGoals = getFilteredAndSortedGoals();

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('due_date');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all';

  /* ---------- UI HELPERS ---------- */

  const getStatusBadge = (goal) => {
    const daysLeft = differenceInDays(new Date(goal.time_bound), new Date());

    if (goal.status === 'completed')
      return <Badge className="bg-green-500">✅ Completed</Badge>;

    if (daysLeft < 0)
      return <Badge variant="destructive">❌ Overdue</Badge>;

    if (daysLeft === 0)
      return <Badge variant="destructive" className="animate-pulse">🔥 Due Today!</Badge>;

    if (daysLeft <= 3)
      return <Badge variant="destructive">⚠️ Due in {daysLeft}d</Badge>;

    if (daysLeft <= 7)
      return <Badge className="bg-yellow-500">⏰ Due Soon</Badge>;

    if (goal.progress >= 75)
      return <Badge className="bg-green-500">🎯 On Track</Badge>;

    if (goal.progress >= 40)
      return <Badge className="bg-blue-500">📈 In Progress</Badge>;

    return <Badge variant="secondary">🆕 Just Started</Badge>;
  };

  const getPriorityColor = (p) =>
    p === 'high' ? 'text-red-500' :
    p === 'medium' ? 'text-yellow-500' :
    'text-green-500';

  const getCategoryLabel = (cat) => 
    cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  /* ---------- GOAL CARD ---------- */

  const GoalCard = ({ goal }) => {
    const daysLeft = differenceInDays(new Date(goal.time_bound), new Date());
    const isUrgent = daysLeft <= 3 && daysLeft >= 0 && goal.status !== 'completed';

    return (
      <Card
        onClick={() => { 
          loadGoalDetails(goal.goal_id); 
          setIsDetailDialogOpen(true); 
        }}
        className={`cursor-pointer hover:border-primary transition-all ${
          isUrgent ? 'border-2 border-red-500' : ''
        }`}
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{goal.title}</h3>
              <div className="flex gap-2 flex-wrap mb-3">
                <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                  {goal.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {getCategoryLabel(goal.category)}
                </Badge>
              </div>
            </div>
            {getStatusBadge(goal)}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {goal.description}
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Due: {format(new Date(goal.time_bound), 'MMM dd, yyyy')}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ---------- RENDER ---------- */

  return (
    <div className="space-y-6 pb-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Goals</h2>
          <p className="text-muted-foreground">Track and achieve your SMART goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <Target className="mr-2 w-4 h-4" /> Use Template
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 w-4 h-4" /> Create Goal
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="mx-auto mb-2 w-8 h-8 text-blue-500" />
            <p className="text-2xl font-bold">{stats.active_goals || 0}</p>
            <p className="text-sm text-muted-foreground">Active Goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto mb-2 w-8 h-8 text-green-500" />
            <p className="text-2xl font-bold">{stats.completed_goals || 0}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Award className="mx-auto mb-2 w-8 h-8 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.avg_progress || 0}%</p>
            <p className="text-sm text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-2 w-8 h-8 text-red-500" />
            <p className="text-2xl font-bold">{stats.overdue_goals || 0}</p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH & FILTERS */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters & Count */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-2 flex-wrap">
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: "{searchQuery}"
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="secondary">
                    {getCategoryLabel(categoryFilter)}
                    <button 
                      onClick={() => setCategoryFilter('all')}
                      className="ml-2 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary">
                    {priorityFilter.toUpperCase()}
                    <button 
                      onClick={() => setPriorityFilter('all')}
                      className="ml-2 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                Showing {filteredGoals.length} of {goals.length} goals
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs defaultValue="active" onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading goals...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Target className="mx-auto w-16 h-16 text-muted-foreground/50" />
                {hasActiveFilters ? (
                  <>
                    <h3 className="text-xl font-semibold">No goals match your filters</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold">No {filterStatus} goals yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {filterStatus === 'active' 
                        ? 'Create your first goal to get started!' 
                        : `You don't have any ${filterStatus.replace('_', ' ')} goals.`}
                    </p>
                    {filterStatus === 'active' && (
                      <div className="space-y-2">
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="mr-2 w-4 h-4" /> Create Your First Goal
                        </Button>
                        <div className="text-sm text-muted-foreground mt-4">
                          <p className="font-semibold mb-2">💡 Tips for great goals:</p>
                          <ul className="text-left max-w-md mx-auto space-y-1">
                            <li>• Be specific and measurable</li>
                            <li>• Set realistic deadlines</li>
                            <li>• Break into small milestones</li>
                            <li>• Track progress regularly</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredGoals.map(goal => (
                <GoalCard key={goal.goal_id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ========== DIALOGS ========== */}

      {/* TEMPLATE DIALOG */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Goal Template</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {GOAL_TEMPLATES.map(template => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:border-primary transition-all"
                onClick={() => applyTemplate(template)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                    <Badge variant="outline" className={getPriorityColor(template.priority)}>
                      {template.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Includes {template.suggestedMilestones.length} milestones:</p>
                    <ul className="space-y-0.5">
                      {template.suggestedMilestones.slice(0, 3).map((m, i) => (
                        <li key={i}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full" size="sm">
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Learn React.js"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of your goal..."
                rows={3}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority *</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SMART Framework */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">SMART Framework</h3>
              
              <div>
                <Label>Specific *</Label>
                <Input
                  value={formData.specific}
                  onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                  placeholder="What exactly do you want to accomplish?"
                />
              </div>

              <div>
                <Label>Measurable *</Label>
                <Input
                  value={formData.measurable}
                  onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                  placeholder="How will you measure success?"
                />
              </div>

              <div>
                <Label>Achievable *</Label>
                <Input
                  value={formData.achievable}
                  onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                  placeholder="How will you achieve this?"
                />
              </div>

              <div>
                <Label>Relevant *</Label>
                <Input
                  value={formData.relevant}
                  onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                  placeholder="Why is this goal important?"
                />
              </div>

              <div>
                <Label>Time-Bound (Deadline) *</Label>
                <Input
                  type="date"
                  value={formData.time_bound}
                  onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Milestones (Optional)</h3>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add a milestone..."
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
                  />
                </div>
                <div className="w-40">
                  <Input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    placeholder="Due date"
                  />
                </div>
                <Button onClick={addMilestone} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {milestones.length > 0 && (
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-secondary rounded">
                      <div className="flex-1">
                        <span>{m.title}</span>
                        {m.due_date && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({format(new Date(m.due_date), 'MMM dd, yyyy')})
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMilestone(i)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {isEditMode ? (
                      <Input
                        value={editData.title}
                        onChange={e => setEditData({ ...editData, title: e.target.value })}
                        className="text-xl font-bold"
                      />
                    ) : (
                      <DialogTitle className="text-2xl">{selectedGoal.title}</DialogTitle>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditMode ? (
                      <>
                        {selectedGoal.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePauseGoal(selectedGoal.goal_id)}
                          >
                            <Pause className="w-4 h-4 mr-2" /> Pause
                          </Button>
                        )}
                        {selectedGoal.status === 'on_hold' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResumeGoal(selectedGoal.goal_id)}
                          >
                            <Play className="w-4 h-4 mr-2" /> Resume
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteGoal(selectedGoal.goal_id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditMode(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status & Info */}
                <div className="flex gap-4 flex-wrap">
                  {getStatusBadge(selectedGoal)}
                  <Badge variant="outline" className={getPriorityColor(selectedGoal.priority)}>
                    Priority: {selectedGoal.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {getCategoryLabel(selectedGoal.category)}
                  </Badge>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Progress</span>
                    <span className="text-lg font-bold">{selectedGoal.progress}%</span>
                  </div>
                  <Progress value={selectedGoal.progress} className="h-3" />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-base font-semibold">Description</Label>
                  {isEditMode ? (
                    <Textarea
                      value={editData.description}
                      onChange={e => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-muted-foreground mt-2">
                      {selectedGoal.description || 'No description provided'}
                    </p>
                  )}
                </div>

                {/* SMART Framework */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg">SMART Framework</h3>
                  
                  <div>
                    <Label>Specific</Label>
                    {isEditMode ? (
                      <Input
                        value={editData.specific}
                        onChange={e => setEditData({ ...editData, specific: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{selectedGoal.specific}</p>
                    )}
                  </div>

                  <div>
                    <Label>Measurable</Label>
                    {isEditMode ? (
                      <Input
                        value={editData.measurable}
                        onChange={e => setEditData({ ...editData, measurable: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{selectedGoal.measurable}</p>
                    )}
                  </div>

                  <div>
                    <Label>Achievable</Label>
                    {isEditMode ? (
                      <Input
                        value={editData.achievable}
                        onChange={e => setEditData({ ...editData, achievable: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{selectedGoal.achievable}</p>
                    )}
                  </div>

                  <div>
                    <Label>Relevant</Label>
                    {isEditMode ? (
                      <Input
                        value={editData.relevant}
                        onChange={e => setEditData({ ...editData, relevant: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{selectedGoal.relevant}</p>
                    )}
                  </div>

                  <div>
                    <Label>Deadline</Label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={editData.time_bound}
                        onChange={e => setEditData({ ...editData, time_bound: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(selectedGoal.time_bound), 'MMMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Milestones</h3>
                    {!addingMilestone && !isEditMode && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setAddingMilestone(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Milestone
                      </Button>
                    )}
                  </div>

                  {/* Add new milestone form */}
                  {addingMilestone && (
                    <div className="bg-secondary/50 p-3 rounded-lg space-y-2">
                      <div className="space-y-2">
                        <Input
                          placeholder="Milestone title..."
                          value={newExistingGoalMilestone}
                          onChange={(e) => setNewExistingGoalMilestone(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddMilestoneToExistingGoal();
                            }
                          }}
                        />
                        <Input
                          type="date"
                          placeholder="Due date (optional)"
                          value={newExistingGoalMilestoneDate}
                          onChange={(e) => setNewExistingGoalMilestoneDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleAddMilestoneToExistingGoal}
                          className="flex-1"
                        >
                          Add Milestone
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setAddingMilestone(false);
                            setNewExistingGoalMilestone('');
                            setNewExistingGoalMilestoneDate('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing milestones */}
                  {selectedGoal.milestones && selectedGoal.milestones.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGoal.milestones.map(milestone => (
                        <div 
                          key={milestone.milestone_id}
                          className="flex items-start gap-3 p-3 bg-secondary rounded"
                        >
                          <Checkbox
                            id={`milestone-${milestone.milestone_id}`}
                            checked={milestone.completed || false}
                            onCheckedChange={(checked) => {
                              console.log('Milestone clicked:', milestone.milestone_id, 'New state:', checked);
                              handleToggleMilestone(milestone.milestone_id, checked);
                            }}
                          />
                          <div className="flex-1">
                            <p className={milestone.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                              {milestone.title}
                            </p>
                            {milestone.due_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteMilestone(milestone.milestone_id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : !addingMilestone && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No milestones yet. Click "Add Milestone" to create one.
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Created: {format(new Date(selectedGoal.created_at), 'MMMM dd, yyyy')}</p>
                  {selectedGoal.updated_at && (
                    <p>Last updated: {format(new Date(selectedGoal.updated_at), 'MMMM dd, yyyy')}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalsPage;