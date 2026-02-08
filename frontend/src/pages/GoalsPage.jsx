import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMockData } from '../hooks/useMockData';
import { Target, Plus, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';

const GoalsPage = () => {
  const { user } = useAuth();
  const { goals } = useMockData(user);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const handleCreateGoal = () => {
    toast.success('Goal created successfully!');
    setIsCreateDialogOpen(false);
  };

  const GoalCard = ({ goal }) => (
    <Card className="hover:border-primary transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg mb-2">{goal.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
          </div>
          <Badge variant={goal.status === 'on_track' ? 'default' : goal.status === 'at_risk' ? 'destructive' : 'secondary'}>
            {goal.status === 'on_track' ? 'On Track' : goal.status === 'at_risk' ? 'At Risk' : 'Completed'}
          </Badge>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Due: {format(new Date(goal.timeBound), 'MMM dd, yyyy')}</span>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Micro Tasks</p>
            <div className="space-y-2">
              {goal.microTasks.map(task => (
                <div key={task.id} className="flex items-center space-x-2 text-sm">
                  {task.completed ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                  )}
                  <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full">View Details</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Goals</h2>
          <p className="text-muted-foreground">Track your SMART learning objectives</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="e.g., Master Data Structures" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Describe your goal..." rows={3} />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" />
              </div>
              <Button className="w-full" onClick={handleCreateGoal}>Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{activeGoals.length}</p>
            <p className="text-sm text-muted-foreground">Active Goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{completedGoals.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)}%</p>
            <p className="text-sm text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-display font-semibold mb-4">Active Goals</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      </div>

      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-xl font-display font-semibold mb-4">Completed Goals</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;