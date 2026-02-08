import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Target, Plus, Calendar, CheckCircle, AlertCircle, Clock, Trash2, Edit, Play, Pause, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { format, isPast, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = ['learning', 'career', 'skill', 'project', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

const GoalsPage = () => {
  const { user } = useAuth();
  
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');

  // Form state for creating/editing goals
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'learning',
    priority: 'medium',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    time_bound: '',
    tags: []
  });

  // Milestone form
  const [newMilestone, setNewMilestone] = useState('');

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchStats();
    }
  }, [user, filterStatus]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/goals/user/${user.user_id}?status=${filterStatus}`
      );
      const data = await res.json();
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/goals/user/${user.user_id}/stats`
      );
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.time_bound) {
      toast.error('Please fill in title and deadline');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: user.user_id
        })
      });

      if (!res.ok) throw new Error('Failed to create goal');

      const data = await res.json();
      toast.success('Goal created successfully! 🎯');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchGoals();
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateGoal = async (goalId, updates) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update goal');

      toast.success('Goal updated successfully');
      fetchGoals();
      fetchStats();
      if (selectedGoal?.goal_id === goalId) {
        loadGoalDetails(goalId);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete goal');

      toast.success('Goal deleted successfully');
      setIsDetailDialogOpen(false);
      fetchGoals();
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMilestone = async (goalId) => {
    if (!newMilestone.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/goals/${goalId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMilestone })
      });

      if (!res.ok) throw new Error('Failed to add milestone');

      toast.success('Milestone added ✅');
      setNewMilestone('');
      
      // Reload goal details
      if (selectedGoal?.goal_id === goalId) {
        loadGoalDetails(goalId);
      }
      fetchGoals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleMilestone = async (milestoneId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/milestones/${milestoneId}/toggle`, {
        method: 'PUT'
      });

      if (!res.ok) throw new Error('Failed to toggle milestone');

      // Reload goal details
      if (selectedGoal) {
        loadGoalDetails(selectedGoal.goal_id);
      }
      fetchGoals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/milestones/${milestoneId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete milestone');

      toast.success('Milestone deleted');
      
      if (selectedGoal) {
        loadGoalDetails(selectedGoal.goal_id);
      }
      fetchGoals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadGoalDetails = async (goalId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals/${goalId}`);
      const data = await res.json();
      setSelectedGoal(data);
    } catch (err) {
      toast.error('Failed to load goal details');
    }
  };

  const openGoalDetails = (goal) => {
    loadGoalDetails(goal.goal_id);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'learning',
      priority: 'medium',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      time_bound: '',
      tags: []
    });
  };

  const getStatusBadge = (goal) => {
    const daysLeft = differenceInDays(new Date(goal.time_bound), new Date());
    
    if (goal.status === 'completed') {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    
    if (daysLeft < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    if (daysLeft < 7) {
      return <Badge variant="destructive">Due Soon</Badge>;
    }
    
    if (goal.progress >= 75) {
      return <Badge className="bg-green-500">On Track</Badge>;
    }
    
    if (goal.progress >= 40) {
      return <Badge className="bg-yellow-500">In Progress</Badge>;
    }
    
    return <Badge variant="secondary">Just Started</Badge>;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const GoalCard = ({ goal }) => {
    const daysLeft = differenceInDays(new Date(goal.time_bound), new Date());

    return (
      <Card 
        className="hover:border-primary transition-smooth cursor-pointer"
        onClick={() => openGoalDetails(goal)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-2">
                <Target className={`w-5 h-5 mt-0.5 ${getPriorityColor(goal.priority)}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg leading-tight">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {goal.description}
                  </p>
                </div>
              </div>
            </div>
            {getStatusBadge(goal)}
          </div>

          <div className="space-y-3">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>

            {/* Milestones */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                <span>{goal.completed_milestones || 0}/{goal.total_milestones || 0} milestones</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`}
                </span>
              </div>
            </div>

            {/* Category Badge */}
            <div>
              <Badge variant="outline" className="capitalize">
                {goal.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Goals</h2>
          <p className="text-muted-foreground">Track your SMART learning objectives</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 w-4 h-4" />
          Create Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.active_goals || 0}</p>
            <p className="text-sm text-muted-foreground">Active Goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.completed_goals || 0}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.avg_progress || 0}%</p>
            <p className="text-sm text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.overdue_goals || 0}</p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="active" onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus} className="mt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading goals...</p>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No {filterStatus} goals yet</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {goals.map(goal => (
                <GoalCard key={goal.goal_id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Goal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4 py-4">
            {/* Title */}
            <div>
              <Label>Goal Title *</Label>
              <Input
                placeholder="e.g., Master React.js"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your goal in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(pri => (
                      <SelectItem key={pri} value={pri} className="capitalize">{pri}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SMART Goal Components */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">SMART Goal Framework</h4>
              
              <div className="space-y-3">
                <div>
                  <Label>Specific - What exactly do you want to achieve?</Label>
                  <Textarea
                    placeholder="Be specific about what you want to accomplish..."
                    value={formData.specific}
                    onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Measurable - How will you measure success?</Label>
                  <Input
                    placeholder="e.g., Complete 3 projects, Score 80% on tests"
                    value={formData.measurable}
                    onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Achievable - What resources do you need?</Label>
                  <Input
                    placeholder="e.g., Online courses, mentorship, 10 hours/week"
                    value={formData.achievable}
                    onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Relevant - Why is this goal important?</Label>
                  <Input
                    placeholder="e.g., Career growth, personal development"
                    value={formData.relevant}
                    onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Time-Bound - Target completion date *</Label>
                  <Input
                    type="date"
                    value={formData.time_bound}
                    onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Goal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedGoal.title}</DialogTitle>
                    <p className="text-muted-foreground mt-1">{selectedGoal.description}</p>
                  </div>
                  {getStatusBadge(selectedGoal)}
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Progress Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Overall Progress</span>
                    <span className="text-2xl font-bold">{selectedGoal.progress}%</span>
                  </div>
                  <Progress value={selectedGoal.progress} className="h-3" />
                </div>

                {/* Goal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium capitalize">{selectedGoal.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <p className={`font-medium capitalize ${getPriorityColor(selectedGoal.priority)}`}>
                      {selectedGoal.priority}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {format(new Date(selectedGoal.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Target Date</Label>
                    <p className="font-medium">
                      {format(new Date(selectedGoal.time_bound), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* SMART Components */}
                {(selectedGoal.specific || selectedGoal.measurable || selectedGoal.achievable || selectedGoal.relevant) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">SMART Framework</h4>
                    <div className="space-y-2">
                      {selectedGoal.specific && (
                        <div>
                          <Label className="text-muted-foreground">Specific</Label>
                          <p className="text-sm">{selectedGoal.specific}</p>
                        </div>
                      )}
                      {selectedGoal.measurable && (
                        <div>
                          <Label className="text-muted-foreground">Measurable</Label>
                          <p className="text-sm">{selectedGoal.measurable}</p>
                        </div>
                      )}
                      {selectedGoal.achievable && (
                        <div>
                          <Label className="text-muted-foreground">Achievable</Label>
                          <p className="text-sm">{selectedGoal.achievable}</p>
                        </div>
                      )}
                      {selectedGoal.relevant && (
                        <div>
                          <Label className="text-muted-foreground">Relevant</Label>
                          <p className="text-sm">{selectedGoal.relevant}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Milestones</h4>
                  
                  {/* Add Milestone */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a new milestone..."
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddMilestone(selectedGoal.goal_id);
                        }
                      }}
                    />
                    <Button 
                      onClick={() => handleAddMilestone(selectedGoal.goal_id)}
                      disabled={!newMilestone.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Milestone List */}
                  {selectedGoal.milestones && selectedGoal.milestones.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGoal.milestones.map((milestone) => (
                        <div
                          key={milestone.milestone_id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition"
                        >
                          <Checkbox
                            checked={milestone.completed}
                            onCheckedChange={() => handleToggleMilestone(milestone.milestone_id)}
                          />
                          <span className={`flex-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {milestone.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMilestone(milestone.milestone_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No milestones yet. Add one above!</p>
                  )}
                </div>

                {/* Status Actions */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Actions</h4>
                  <div className="flex gap-2">
                    {selectedGoal.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateGoal(selectedGoal.goal_id, { status: 'on_hold' })}
                        >
                          <Pause className="mr-2 w-4 h-4" />
                          Put On Hold
                        </Button>
                        {selectedGoal.progress === 100 && (
                          <Button
                            onClick={() => handleUpdateGoal(selectedGoal.goal_id, { status: 'completed' })}
                          >
                            <CheckCircle className="mr-2 w-4 h-4" />
                            Mark Complete
                          </Button>
                        )}
                      </>
                    )}
                    {selectedGoal.status === 'on_hold' && (
                      <Button
                        onClick={() => handleUpdateGoal(selectedGoal.goal_id, { status: 'active' })}
                      >
                        <Play className="mr-2 w-4 h-4" />
                        Resume Goal
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteGoal(selectedGoal.goal_id)}
                    >
                      <Trash2 className="mr-2 w-4 h-4" />
                      Delete Goal
                    </Button>
                  </div>
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