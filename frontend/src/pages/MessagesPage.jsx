import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { io } from 'socket.io-client';
import { Send, Search, User } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState(null);
  const scrollAreaRef = useRef(null);
  const [searchParams] = useSearchParams();
  const predefinedUserId = searchParams.get('userId');

  const selectedConversationRef = useRef(selectedConversation);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Initialize Socket.io
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000'); // Connect to backend
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('join_room', user.user_id);
      });

      newSocket.on('receive_message', (message) => {
        handleReceiveMessage(message);
      });

      return () => newSocket.close();
    }
  }, [user]);

  // Fetch Conversations and handle query param
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, predefinedUserId]);

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/messages/conversations/${user.user_id}`);
      setConversations(res.data);

      // Handle predefined user selection
      if (predefinedUserId) {
        const existingConv = res.data.find(c => c.other_user_id === predefinedUserId);
        if (existingConv) {
          setSelectedConversation(existingConv);
        } else {
          // If not in list, we might need to fetch their details to show a "New Conversation" placeholder
          // For now, let's assume if they are valid "contact" they returned by the backend query 0r we fetch them.
          // Simplest: Fetch user details and create temp conversation object
          fetchUserDetails(predefinedUserId);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchUserDetails = async (id) => {
    try {
      const res = await api.get(`/users/${id}`);
      const newUser = res.data.user;
      const tempConv = {
        other_user_id: newUser.user_id,
        other_user_name: newUser.name,
        other_user_role: newUser.role,
        other_user_avatar: newUser.avatar,
        content: null, // No messages yet
        created_at: null
      };
      setConversations(prev => [tempConv, ...prev]);
      setSelectedConversation(tempConv);
    } catch (err) {
      console.error("Failed to fetch user details for new chat");
    }
  };


  // Fetch Messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReceiveMessage = (message) => {
    const currentSelected = selectedConversationRef.current;

    setMessages(prev => {
      if (currentSelected && (message.sender_id === currentSelected.other_user_id || message.sender_id === user.user_id)) {
        return [...prev, message];
      }
      return prev;
    });
    fetchConversations();
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const res = await api.get(`/messages/${otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const res = await api.post('/messages', {
        receiver_id: selectedConversation.other_user_id,
        content: messageText
      });
      const storedMessage = res.data;

      if (socket) {
        socket.emit('send_message', storedMessage);
      }

      setMessages([...messages, storedMessage]);
      setMessageText('');
      fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Messages</h2>
        <p className="text-muted-foreground">Connect with your mentors and mentees</p>
      </div>

      <Card className="h-[calc(100vh-250px)]">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search messages..." className="pl-10" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No active conversations.<br />
                  Connect with a mentor or mentee to start chatting.
                </div>
              )}
              {conversations.map(conv => (
                <div
                  key={conv.other_user_id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-smooth ${selectedConversation?.other_user_id === conv.other_user_id ? 'bg-muted' : ''
                    }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conv.other_user_avatar} />
                        <AvatarFallback>{conv.other_user_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{conv.other_user_name}</p>
                        {conv.read === false && conv.sender_id !== user.user_id && (
                          <Badge className="bg-primary">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.content || 'Start a conversation'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.created_at ? format(new Date(conv.created_at), 'h:mm a') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.other_user_avatar} />
                    <AvatarFallback>{selectedConversation.other_user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.other_user_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedConversation.other_user_role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollAreaRef}>
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground mt-10">
                    <p>No messages yet.</p>
                    <p className="text-sm">Say hello to {selectedConversation.other_user_name}!</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.message_id || msg.id}
                    className={`flex ${msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === user.user_id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                        }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user.user_id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                        {msg.created_at && format(new Date(msg.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Invisible div to scroll to */}
                <div ref={scrollAreaRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MessagesPage;