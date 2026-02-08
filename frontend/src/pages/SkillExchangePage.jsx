import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSkillExchange } from '../hooks/useSkillExchange';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { SKILLS } from '../types';

const SkillExchangePage = () => {
  const { user } = useAuth();
  const { exchanges, totalCredits, createExchange, completeSession, updateExchangeStatus } = useSkillExchange(user);
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [formData, setFormData] = useState({
    skillToTeach: '',
    skillToLearn: '',
    hoursPerWeek: 3
  });

  const activeExchanges = exchanges.filter(ex => ex.status === 'active');
  const requestedExchanges = exchanges.filter(ex => ex.status === 'requested');
  const completedExchanges = exchanges.filter(ex => ex.status === 'completed');

  const stats = [
    { label: 'Total Credits', value: totalCredits, icon: TrendingUp, color: 'text-primary' },
    { label: 'Active Exchanges', value: activeExchanges.length, icon: RefreshCw, color: 'text-secondary' },
    { label: 'Completed', value: completedExchanges.length, icon: CheckCircle, color: 'text-success' },
  ];

  const handleCreateExchange = () => {
    if (!formData.skillToTeach || !formData.skillToLearn) {
      toast.error('Please fill all fields');
      return;
    }
    createExchange(formData);
    toast.success('Skill exchange request created!');
    setIsCreateModalOpen(false);
    setFormData({ skillToTeach: '', skillToLearn: '', hoursPerWeek: 3 });
  };

  const handleCompleteSession = (exchangeId) => {
    completeSession(exchangeId, 1);
    toast.success('Session marked as completed! +1 credit earned');
  };

  const ExchangeCard = ({ exchange, onClick }) => {
    const isUserA = exchange.userA.id === user.id;
    const mySkill = isUserA ? exchange.userA.skill : exchange.userB.skill;
    const theirSkill = isUserA ? exchange.userB.skill : exchange.userA.skill;
    const partner = isUserA ? exchange.userB : exchange.userA;
    const myCredits = isUserA ? exchange.creditsA : exchange.creditsB;
    const theirCredits = isUserA ? exchange.creditsB : exchange.creditsA;

    return (
      <Card className="hover:border-primary transition-smooth cursor-pointer" onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={partner.avatar} />
                <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{partner.name}</p>
                <p className="text-sm text-muted-foreground">Exchange Partner</p>
              </div>
            </div>
            <Badge variant={exchange.status === 'active' ? 'default' : exchange.status === 'completed' ? 'secondary' : 'outline'}>
              {exchange.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">You teach</p>
              <p className="font-medium text-sm">{mySkill}</p>
              <p className="text-xs text-primary mt-1">{myCredits} credits earned</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">You learn</p>
              <p className="font-medium text-sm">{theirSkill}</p>
              <p className="text-xs text-secondary mt-1">{theirCredits} credits earned</p>
            </div>
          </div>

          {exchange.status === 'active' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{exchange.completedSessions}/{exchange.plannedSessions} sessions</span>
              </div>
              <Progress value={(exchange.completedSessions / exchange.plannedSessions) * 100} className="h-2" />
            </div>
          )}

          {exchange.status === 'completed' && (
            <div className="flex items-center space-x-2 text-sm text-success">
              <CheckCircle className="w-4 h-4" />
              <span>All sessions completed!</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ExchangeDetailsModal = ({ exchange, onClose }) => {
    if (!exchange) return null;

    const isUserA = exchange.userA.id === user.id;
    const myCredits = isUserA ? exchange.creditsA : exchange.creditsB;
    const theirCredits = isUserA ? exchange.creditsB : exchange.creditsA;
    const partner = isUserA ? exchange.userB : exchange.userA;

    return (
      <Dialog open={!!exchange} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Skill Exchange Details</DialogTitle>
            <DialogDescription>Track progress and manage sessions</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Partner Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={partner.avatar} />
                <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">Exchange Partner</p>
              </div>
              <Badge className="ml-auto">{exchange.status}</Badge>
            </div>

            {/* Skills */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">You teach</p>
                  <p className="font-semibold">{isUserA ? exchange.userA.skill : exchange.userB.skill}</p>
                  <p className="text-sm text-primary mt-2">{myCredits} credits earned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">You learn</p>
                  <p className="font-semibold">{isUserA ? exchange.userB.skill : exchange.userA.skill}</p>
                  <p className="text-sm text-secondary mt-2">{theirCredits} credits earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            {exchange.status === 'active' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Overall Progress</p>
                  <p className="text-sm text-muted-foreground">{exchange.completedSessions}/{exchange.plannedSessions} sessions</p>
                </div>
                <Progress value={(exchange.completedSessions / exchange.plannedSessions) * 100} className="h-3" />
              </div>
            )}

            {/* Session History */}
            <div>
              <h4 className="font-semibold mb-3">Session History</h4>
              {exchange.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sessions yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {exchange.sessions.slice().reverse().map((session, idx) => {
                    const wasTeacher = session.teacher === user.id;
                    return (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            wasTeacher ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                          }`}>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {wasTeacher ? 'You taught' : 'You learned'} - {session.duration}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">+{session.duration} credit</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            {exchange.status === 'active' && (
              <Button 
                className="w-full" 
                onClick={() => {
                  handleCompleteSession(exchange.id);
                  setSelectedExchange(null);
                }}
              >
                <CheckCircle className="mr-2 w-4 h-4" />
                Mark Session as Completed
              </Button>
            )}

            {exchange.status === 'requested' && (
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    updateExchangeStatus(exchange.id, 'active');
                    toast.success('Exchange accepted!');
                    setSelectedExchange(null);
                  }}
                >
                  Accept Exchange
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    toast.info('Exchange declined');
                    setSelectedExchange(null);
                  }}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Skill Exchange</h2>
          <p className="text-muted-foreground">Teach and learn skills, earn credits together</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Create Exchange
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Skill Exchange</DialogTitle>
              <DialogDescription>Find a partner to exchange skills and earn credits</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Skill I can teach</Label>
                <Select value={formData.skillToTeach} onValueChange={(value) => setFormData({ ...formData, skillToTeach: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Skill I want to learn</Label>
                <Select value={formData.skillToLearn} onValueChange={(value) => setFormData({ ...formData, skillToLearn: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hours per week</Label>
                <Select value={formData.hoursPerWeek.toString()} onValueChange={(value) => setFormData({ ...formData, hoursPerWeek: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours/week</SelectItem>
                    <SelectItem value="3">3 hours/week</SelectItem>
                    <SelectItem value="4">4 hours/week</SelectItem>
                    <SelectItem value="5">5 hours/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateExchange}>Create Exchange</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeExchanges.length})</TabsTrigger>
          <TabsTrigger value="requested">Requested ({requestedExchanges.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedExchanges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeExchanges.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active skill exchanges</p>
                <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                  Create Your First Exchange
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeExchanges.map(exchange => (
                <ExchangeCard 
                  key={exchange.id} 
                  exchange={exchange} 
                  onClick={() => setSelectedExchange(exchange)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requested" className="space-y-4">
          {requestedExchanges.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {requestedExchanges.map(exchange => (
                <ExchangeCard 
                  key={exchange.id} 
                  exchange={exchange} 
                  onClick={() => setSelectedExchange(exchange)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedExchanges.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed exchanges yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {completedExchanges.map(exchange => (
                <ExchangeCard 
                  key={exchange.id} 
                  exchange={exchange} 
                  onClick={() => setSelectedExchange(exchange)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Exchange Details Modal */}
      {selectedExchange && (
        <ExchangeDetailsModal 
          exchange={selectedExchange} 
          onClose={() => setSelectedExchange(null)} 
        />
      )}
    </div>
  );
};

export default SkillExchangePage;