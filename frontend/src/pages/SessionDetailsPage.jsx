import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Clock, MapPin, Video, Trash2, Star, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SessionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!id) return;
    
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/sessions/${id}`
      );
      
      if (!res.ok) throw new Error('Session not found');
      
      const data = await res.json();
      console.log('📅 Session loaded:', data);
      setSession(data);
      
      // Set notes based on user role
      if (user.role === 'mentor') {
        setNotes(data.mentor_notes || '');
      } else {
        setNotes(data.mentee_notes || '');
      }
      
      // Set existing rating if available
      if (data.rating) {
        setRating(data.rating);
        setFeedback(data.feedback || '');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      toast.error('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const updateData = user.role === 'mentor'
        ? { mentor_notes: notes }
        : { mentee_notes: notes };

      const res = await fetch(
        `http://localhost:5000/api/sessions/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      if (!res.ok) throw new Error('Failed to save notes');

      toast.success('Notes saved successfully');
      fetchSession();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMarkComplete = () => {
    // Open dialog for mentees (need rating), or confirm for mentors
    if (user.role === 'mentee') {
      setShowCompleteDialog(true);
    } else {
      // Mentors can complete directly
      handleSubmitComplete();
    }
  };

  const handleSubmitComplete = async () => {
    setIsSubmitting(true);

    try {
      // If mentee, must provide rating
      if (user.role === 'mentee') {
        if (rating === 0) {
          toast.error('Please select a rating');
          setIsSubmitting(false);
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/sessions/${id}/complete`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rating,
              feedback,
              user_id: user.user_id,
            }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to complete session');
        }

        toast.success('Session completed and rating submitted!');
      } else {
        // Mentor just marks as complete
        const res = await fetch(
          `http://localhost:5000/api/sessions/${id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'completed',
            }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to complete session');
        }

        toast.success('Session marked as completed!');
      }

      setShowCompleteDialog(false);
      fetchSession(); // Refresh to show updated status
    } catch (err) {
      console.error('Error completing session:', err);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSession = async () => {
    try {
      console.log('🗑️ Attempting to cancel session:', id);
      
      const res = await fetch(
        `http://localhost:5000/api/sessions/${id}?reason=${encodeURIComponent(cancelReason || 'Cancelled by user')}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel session');
      }

      console.log('✅ Session cancelled successfully');
      toast.success('Session cancelled successfully');
      setShowCancelDialog(false);
      
      // Navigate back to sessions list
      setTimeout(() => {
        navigate('/sessions');
      }, 1000);
    } catch (err) {
      console.error('❌ Error cancelling session:', err);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <p className="text-muted-foreground">Loading session details...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Session not found</p>
          <Button className="mt-4" onClick={() => navigate('/sessions')}>
            Back to Sessions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Determine if user is mentor or mentee
  const isMentor = user.user_id === session.mentor_id;
  const partner = isMentor 
    ? { name: session.mentee_name, avatar: session.mentee_avatar }
    : { name: session.mentor_name, avatar: session.mentor_avatar };

  // Check if session date has passed
  const sessionDate = new Date(session.scheduled_date);
  const isPast = sessionDate < new Date();
  const canComplete = session.status === 'scheduled' && isPast;
  const canCancel = session.status === 'scheduled' && !isPast;

  const ratingLabels = {
    1: "Poor",
    2: "Fair", 
    3: "Good",
    4: "Very Good",
    5: "Excellent"
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Button variant="outline" onClick={() => navigate('/sessions')}>
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to Sessions
      </Button>

      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={partner.avatar} />
                <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl mb-1">{session.topic}</CardTitle>
                <p className="text-muted-foreground">
                  With {partner.name}
                </p>
              </div>
            </div>
            <Badge variant={
              session.status === 'scheduled' ? 'default' : 
              session.status === 'completed' ? 'secondary' : 
              'destructive'
            }>
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(sessionDate, 'MMMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{format(sessionDate, 'h:mm a')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  {session.mode === 'online' ? (
                    <Video className="w-5 h-5 text-accent" />
                  ) : (
                    <MapPin className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  {session.mode === 'online' && session.location ? (
                    <a 
                      href={session.location} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-primary hover:underline"
                    >
                      Join Meeting
                    </a>
                  ) : (
                    <p className="font-medium">{session.location || 'No location set'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{session.duration} minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {canComplete && (
              <Button 
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 w-4 h-4" />
                Mark as Complete
              </Button>
            )}
            
            {canCancel && (
              <Button 
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                <Trash2 className="mr-2 w-4 h-4" />
                Cancel Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes & Action Items</TabsTrigger>
          {session.status === 'completed' && (
            <TabsTrigger value="feedback">Feedback & Rating</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your notes here..."
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={session.status === 'cancelled'}
              />
              <Button 
                onClick={handleSaveNotes}
                disabled={session.status === 'cancelled'}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {session.status === 'completed' && (
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Session Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {session.rating ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {isMentor ? 'Mentee Rating' : 'Your Rating'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-6 h-6 ${
                              star <= session.rating 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold">
                        {session.rating}/5
                      </span>
                    </div>
                    {session.feedback && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-sm text-muted-foreground">{session.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No rating submitted yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Complete Session Dialog (for mentees) */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Session & Rate</DialogTitle>
            <DialogDescription>
              How would you rate this session with {session.mentor_name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <p className="text-sm font-medium mb-3">Your Rating *</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {ratingLabels[rating]}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Feedback (Optional)</p>
              <Textarea
                placeholder="Share your thoughts about this session..."
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitComplete}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Session Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm font-medium mb-2">Reason for cancellation (Optional)</p>
            <Textarea
              placeholder="Let your partner know why you're cancelling..."
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Session
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSession}
            >
              <Trash2 className="mr-2 w-4 h-4" />
              Cancel Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionDetailsPage;