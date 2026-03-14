import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { BookOpen, Users, Search, Plus, MessageSquare, Sparkles, Trash2, CalendarPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const SkillExchangePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    exchange_type: 'offering',
    description: ''
  });

  // Schedule session state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMatch, setScheduleMatch] = useState(null); // the match being scheduled
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    duration: '60',
    mode: 'online',
    location: ''
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduledMatchIds, setScheduledMatchIds] = useState(new Set());

  useEffect(() => {
    fetchSkills();
    fetchMatches();
  }, [activeTab]);

  const fetchSkills = async () => {
    try {
      let url = '/skills';
      if (activeTab === 'mine') {
        url = `/skills?user_id=${user.user_id}`;
      } else if (activeTab !== 'all') {
        url = `/skills?type=${activeTab}`;
      }
      const res = await api.get(url);
      setSkills(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load skills");
    }
  };

  const fetchMatches = async () => {
    try {
      const [matchRes, sessionRes] = await Promise.all([
        api.get(`/skills/matches/${user.user_id}`),
        api.get(`/sessions/user/${user.user_id}`)
      ]);

      const fetchedMatches = matchRes.data.matches || [];
      setMatches(fetchedMatches);

      // Check which matched users already have a "Skill Exchange:" session with me
      const sessions = Array.isArray(sessionRes.data) ? sessionRes.data : [];
      const alreadyScheduled = new Set();
      fetchedMatches.forEach(match => {
        const hasSession = sessions.some(s =>
          (s.mentor_id === match.user_id || s.mentee_id === match.user_id) &&
          s.topic?.startsWith('Skill Exchange:') &&
          s.status !== 'cancelled'
        );
        if (hasSession) alreadyScheduled.add(match.user_id);
      });
      setScheduledMatchIds(alreadyScheduled);
    } catch (err) {
      // silently ignore
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateExchange = async () => {
    if (!newSkill.skill_name || !newSkill.description) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await api.post('/skills', { ...newSkill, user_id: user.user_id });
      toast.success("Skill exchange posted!");
      setIsDialogOpen(false);
      setNewSkill({ skill_name: '', exchange_type: 'offering', description: '' });
      fetchSkills();
      fetchMatches();
    } catch (err) {
      toast.error("Failed to post skill exchange");
    }
  };

  const handleDelete = async (exchangeId) => {
    if (!window.confirm('Delete this skill exchange post?')) return;
    try {
      await api.delete(`/skills/${exchangeId}`);
      toast.success('Post deleted');
      fetchSkills();
      fetchMatches();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const openSchedule = (match) => {
    setScheduleMatch(match);
    setScheduleForm({ date: '', time: '', duration: '60', mode: 'online', location: '' });
    setScheduleOpen(true);
  };

  const handleScheduleSession = async () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      toast.error('Please select a date and time');
      return;
    }
    setScheduling(true);
    try {
      // In a mutual exchange: they teach me their skill → they are mentor
      // (a separate session could be scheduled for the reverse direction)
      const mentorId = scheduleMatch.user_id;
      const menteeId = user.user_id;
      // topic = the two skills being exchanged
      const skillLabel = scheduleMatch.they_teach_me && scheduleMatch.i_teach_them
        ? `${scheduleMatch.they_teach_me} ↔ ${scheduleMatch.i_teach_them}`
        : (scheduleMatch.they_teach_me || scheduleMatch.i_teach_them || 'Skill Exchange');
      const topic = `Skill Exchange: ${skillLabel}`;
      const scheduled = new Date(`${scheduleForm.date}T${scheduleForm.time}`);

      await api.post('/sessions', {
        mentor_id:      mentorId,
        mentee_id:      menteeId,
        topic,
        scheduled_date: scheduled.toISOString(),
        duration:       Number(scheduleForm.duration),
        mode:           scheduleForm.mode,
        location:       scheduleForm.location || (scheduleForm.mode === 'online' ? 'Online' : ''),
      });

      toast.success(`Session scheduled! Check your Sessions page.`);
      setScheduledMatchIds(prev => new Set([...prev, scheduleMatch.user_id]));
      setScheduleOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Skill Exchange</h2>
          <p className="text-muted-foreground">Teach what you know, learn what you don't</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Post Exchange
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a Skill Exchange</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>I want to...</Label>
                <div className="flex gap-4">
                  <Button
                    variant={newSkill.exchange_type === 'offering' ? 'default' : 'outline'}
                    onClick={() => setNewSkill({ ...newSkill, exchange_type: 'offering' })}
                    className="flex-1"
                  >
                    Offer (Teach)
                  </Button>
                  <Button
                    variant={newSkill.exchange_type === 'wanting' ? 'default' : 'outline'}
                    onClick={() => setNewSkill({ ...newSkill, exchange_type: 'wanting' })}
                    className="flex-1"
                  >
                    Want (Learn)
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input
                  placeholder="e.g. React Native, Public Speaking"
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what you can teach or what you want to learn..."
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateExchange} className="w-full">Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
              >
                All
              </Button>
              <Button
                variant={activeTab === 'offering' ? 'default' : 'outline'}
                onClick={() => setActiveTab('offering')}
              >
                Offering
              </Button>
              <Button
                variant={activeTab === 'wanting' ? 'default' : 'outline'}
                onClick={() => setActiveTab('wanting')}
              >
                Wanting
              </Button>
              <Button
                variant={activeTab === 'mine' ? 'default' : 'outline'}
                onClick={() => setActiveTab('mine')}
              >
                My Posts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches for You */}
      {matches.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              Matches For You
            </CardTitle>
            <p className="text-sm text-muted-foreground">People whose skills complement yours</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map(match => (
                <div key={match.user_id} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                  <Avatar className="w-10 h-10 mt-1">
                    <AvatarImage src={match.user_avatar} />
                    <AvatarFallback>{match.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{match.user_name}</p>
                    {match.user_department && (
                      <p className="text-xs text-muted-foreground mb-2">{match.user_department}</p>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="default" className="text-xs">They teach you</Badge>
                        <span className="text-xs font-medium">{match.they_teach_me}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs">You teach them</Badge>
                        <span className="text-xs font-medium">{match.i_teach_them}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {scheduledMatchIds.has(match.user_id) ? (
                      <Button size="sm" variant="outline" disabled className="text-green-600 border-green-600">
                        ✓ Scheduled
                      </Button>
                    ) : (
                      <Button size="sm" variant="default" onClick={() => openSchedule(match)}>
                        <CalendarPlus className="w-3 h-3 mr-1" />
                        Schedule
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => navigate(`/messages?userId=${match.user_id}`)}>
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map(skill => (
          <Card key={skill.exchange_id} className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant={skill.exchange_type === 'offering' ? 'default' : 'secondary'}>
                  {skill.exchange_type === 'offering' ? 'Offering' : 'Wanting'}
                </Badge>
                <span className="text-xs text-muted-foreground">{new Date(skill.created_at).toLocaleDateString()}</span>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">{skill.skill_name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {skill.description}
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-border">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={skill.user_avatar} />
                  <AvatarFallback>{skill.user_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm flex-1">
                  <p className="font-medium">{skill.user_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{skill.user_role}</p>
                </div>
                {/* Delete button for own posts */}
                {skill.user_id === user.user_id ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(skill.exchange_id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/messages?userId=${skill.user_id}`)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSkills.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No skill exchanges found. Be the first to post one!
          </div>
        )}
      </div>

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-primary" />
              Schedule Exchange Session
            </DialogTitle>
            <DialogDescription>
              {scheduleMatch && (
                <span>
                  Skill: <strong>{scheduleMatch.skill_name}</strong> with <strong>{scheduleMatch.user_name}</strong>
                  {scheduleMatch.exchange_type === 'offering' ? ' (they will teach you)' : ' (you will teach them)'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={scheduleForm.time}
                  onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={scheduleForm.duration}
                  onValueChange={v => setScheduleForm(f => ({ ...f, duration: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={scheduleForm.mode}
                  onValueChange={v => setScheduleForm(f => ({ ...f, mode: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{scheduleForm.mode === 'online' ? 'Meeting Link (optional)' : 'Location'}</Label>
              <Input
                placeholder={scheduleForm.mode === 'online' ? 'https://meet.google.com/...' : 'Library Room 2, Lab A...'}
                value={scheduleForm.location}
                onChange={e => setScheduleForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)} disabled={scheduling}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSession} disabled={scheduling}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              {scheduling ? 'Scheduling...' : 'Schedule Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillExchangePage;