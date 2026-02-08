import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Inbox, Send, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

const RequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session scheduling dialog state
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sessionData, setSessionData] = useState({
    topic: "",
    scheduled_date: "",
    duration: 60,
    mode: "online",
    location: "",
  });
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/requests/user/${user.user_id}`
      );
      const data = await res.json();

      console.log("📥 Fetched requests:", data);

      setReceivedRequests(data.received || []);
      setSentRequests(data.sent || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request) => {
    setSelectedRequest(request);
    setScheduleDialog(true);
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/requests/${requestId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "declined" }),
        }
      );

      if (!res.ok) throw new Error("Failed to decline request");

      toast.success("Request declined");
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/requests/${requestId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to cancel request");

      toast.success("Request cancelled");
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleScheduleSession = async () => {
    if (!sessionData.topic || !sessionData.scheduled_date) {
      toast.error("Please fill in topic and date/time");
      return;
    }

    setIsScheduling(true);

    try {
      console.log("🔄 Creating session with data:", {
        mentor_id: user.user_id,
        mentee_id: selectedRequest.mentee_id,
        ...sessionData,
      });

      // Step 1: Create the session
      const sessionRes = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: user.user_id,
          mentee_id: selectedRequest.mentee_id,
          topic: sessionData.topic,
          scheduled_date: sessionData.scheduled_date,
          duration: sessionData.duration,
          mode: sessionData.mode,
          location: sessionData.location,
        }),
      });

      if (!sessionRes.ok) {
        const errorData = await sessionRes.json();
        console.error("❌ Session creation failed:", errorData);
        throw new Error(errorData.error || "Failed to create session");
      }

      const sessionResult = await sessionRes.json();
      console.log("✅ Session created:", sessionResult);

      // Step 2: Accept the request
      const requestRes = await fetch(
        `http://localhost:5000/api/requests/${selectedRequest.request_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" }),
        }
      );

      if (!requestRes.ok) {
        const errorData = await requestRes.json();
        console.error("❌ Request acceptance failed:", errorData);
        throw new Error(errorData.error || "Failed to accept request");
      }

      console.log("✅ Request accepted");

      toast.success("Session scheduled successfully! 🎉");
      setScheduleDialog(false);
      setSelectedRequest(null);
      setSessionData({
        topic: "",
        scheduled_date: "",
        duration: 60,
        mode: "online",
        location: "",
      });
      fetchRequests();

      // Navigate to sessions page after a brief delay
      setTimeout(() => {
        navigate("/sessions");
      }, 1500);
    } catch (err) {
      console.error("❌ Error in handleScheduleSession:", err);
      toast.error(err.message || "Failed to schedule session");
    } finally {
      setIsScheduling(false);
    }
  };

  const ReceivedRequestCard = ({ request }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={request.mentee_avatar} />
              <AvatarFallback>{request.mentee_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{request.mentee_name}</p>
              <p className="text-sm text-muted-foreground">
                {request.mentee_department}
              </p>
            </div>
          </div>
          <Badge
            variant={
              request.status === "pending"
                ? "default"
                : request.status === "accepted"
                ? "secondary"
                : "destructive"
            }
          >
            {request.status}
          </Badge>
        </div>

        {request.message && (
          <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
            "{request.message}"
          </p>
        )}

        <p className="text-xs text-muted-foreground mb-4">
          Requested {format(new Date(request.created_at), "MMM dd, yyyy 'at' h:mm a")}
        </p>

        {request.status === "pending" && (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => handleAcceptRequest(request)}
            >
              <CheckCircle className="mr-2 w-4 h-4" />
              Accept & Schedule
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDeclineRequest(request.request_id)}
            >
              <XCircle className="mr-2 w-4 h-4" />
              Decline
            </Button>
          </div>
        )}

        {request.status === "accepted" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Request accepted - Session scheduled
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const SentRequestCard = ({ request }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={request.mentor_avatar} />
              <AvatarFallback>{request.mentor_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{request.mentor_name}</p>
              <p className="text-sm text-muted-foreground">
                {request.mentor_department}
              </p>
            </div>
          </div>
          <Badge
            variant={
              request.status === "pending"
                ? "default"
                : request.status === "accepted"
                ? "secondary"
                : "destructive"
            }
          >
            {request.status}
          </Badge>
        </div>

        {request.message && (
          <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
            Your message: "{request.message}"
          </p>
        )}

        <p className="text-xs text-muted-foreground mb-4">
          Sent {format(new Date(request.created_at), "MMM dd, yyyy 'at' h:mm a")}
        </p>

        {request.status === "pending" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleCancelRequest(request.request_id)}
          >
            Cancel Request
          </Button>
        )}

        {request.status === "accepted" && (
          <Button
            className="w-full"
            onClick={() => navigate("/sessions")}
          >
            View Scheduled Session
          </Button>
        )}

        {request.status === "declined" && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Request was declined
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const pendingReceived = receivedRequests.filter(r => r.status === "pending");
  const pendingSent = sentRequests.filter(r => r.status === "pending");

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mentoring Requests</h2>
        <p className="text-muted-foreground">
          Manage your incoming and outgoing mentoring requests
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading requests...</p>
      ) : (
        <Tabs defaultValue={user.role === "mentor" ? "received" : "sent"}>
          <TabsList>
            {user.role === "mentor" && (
              <TabsTrigger value="received">
                <Inbox className="mr-2 w-4 h-4" />
                Received ({pendingReceived.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="sent">
              <Send className="mr-2 w-4 h-4" />
              Sent ({pendingSent.length})
            </TabsTrigger>
          </TabsList>

          {user.role === "mentor" && (
            <TabsContent value="received" className="space-y-4">
              {receivedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No mentoring requests yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {receivedRequests.map((request) => (
                    <ReceivedRequestCard
                      key={request.request_id}
                      request={request}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No sent requests yet
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/find-mentor")}
                  >
                    Find a Mentor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {sentRequests.map((request) => (
                  <SentRequestCard key={request.request_id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule First Session</DialogTitle>
            <DialogDescription>
              Accept the request and schedule your first session with{" "}
              {selectedRequest?.mentee_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Session Topic *</Label>
              <Input
                placeholder="e.g., Introduction to React"
                value={sessionData.topic}
                onChange={(e) =>
                  setSessionData({ ...sessionData, topic: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={sessionData.scheduled_date}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    scheduled_date: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={sessionData.duration}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    duration: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label>Mode</Label>
              <select
                className="w-full border border-border rounded-md p-2"
                value={sessionData.mode}
                onChange={(e) =>
                  setSessionData({ ...sessionData, mode: e.target.value })
                }
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div>
              <Label>
                {sessionData.mode === "online"
                  ? "Meeting Link"
                  : "Physical Location"}
              </Label>
              <Input
                placeholder={
                  sessionData.mode === "online"
                    ? "https://meet.google.com/..."
                    : "Room 301, CS Building"
                }
                value={sessionData.location}
                onChange={(e) =>
                  setSessionData({ ...sessionData, location: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialog(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleSession}
              disabled={isScheduling}
            >
              {isScheduling ? "Scheduling..." : "Schedule & Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsPage;