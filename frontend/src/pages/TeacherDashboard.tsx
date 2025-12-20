import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import {
  Home,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  Video
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

import { socket } from "@/lib/socket";
import {
  getTeacherRequests,
  getTeacherProfileByUserId,
  updateTeacherProfile,
  getMessagesForRoom,
  getMyCallLogs
} from "@/lib/api";


import IncomingCallModal from "@/components/IncomingCallModal";
import OutgoingCallModal from "@/components/OutgoingCallModal";

const TeacherDashboard = () => {
  const { user } = useUser();
  const userId = user?.id || (user as any)?._id;

  const [loading, setLoading] = useState(true);
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [outgoingCall, setOutgoingCall] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    subjects: "",
    classes: "",
    achievements: [],
    experience: "",
    qualifications: "",
    bio: "",
    mode: "both",
    location: {
      city: "",
      state: ""
    }
  });


  // Chat
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");

  // requests
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  /* ---------------- CALLING ---------------- */
  const [incomingCall, setIncomingCall] = useState<any>(null);


  // Profile edit
  const [editing, setEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modeState, setModeState] = useState<"online" | "offline" | "both">("both");

  /* ---------------- LOAD DASHBOARD ---------------- */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const [reqs, prof, calls] = await Promise.all([
          getTeacherRequests(),
          getTeacherProfileByUserId(userId),
          getMyCallLogs()
        ]);

        setMeetingRequests(reqs || []);
        setCallLogs(calls || []);

        setProfile({
          subjects: prof?.subjects || "",
          classes: prof?.classes || "",
          achievements: prof?.achievements || [],
          experience: prof?.experience || "",
          qualifications: prof?.qualifications || "",
          bio: prof?.bio || "",
          mode: prof?.mode || "both",
          location: {
            city: prof?.location?.city || "",
            state: prof?.location?.state || ""
          }
        });

        setModeState(prof?.mode || "both");

        if (prof?.mode) setModeState(prof.mode);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  /* ---------------- SOCKET REGISTER ---------------- */
  useEffect(() => {
    if (!userId) return;
    // Register the socket for notifications (UserContext also registers)
    socket.emit("register", userId);
  }, [userId]);

  /* ---------------- INCOMING CALL ---------------- */
  useEffect(() => {
    const onIncomingCall = ({ fromUser, roomId }: any) => {
      setIncomingCall({ fromUser, roomId });
    };

      const onCallRejected = ({ roomId }: any) => {
      // if we were the caller, clear outgoing UI
      setOutgoingCall(null);
      toast.error("Call rejected");
    };

    const onCallAccepted = ({ roomId }: any) => {
      // clear outgoing UI if any and navigate to Jitsi in same tab (avoid popup blockers)
      setOutgoingCall(null);
      toast.success("Call accepted");
      window.location.href = `https://meet.jit.si/${roomId}`;
    };

    const onCallCancelled = ({ roomId, fromUser }: any) => {
      // callee got cancelled by caller
      setIncomingCall(null);
      toast.info(`${fromUser?.name || 'Caller'} cancelled the call`);
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-rejected", onCallRejected);
    socket.on("call-accepted", onCallAccepted);
    socket.on("call-cancelled", onCallCancelled);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-rejected", onCallRejected);
      socket.off("call-accepted", onCallAccepted);
      socket.off("call-cancelled", onCallCancelled);
    };
  }, []);

  /* ---------------- CHAT HELPERS ---------------- */
  const makeRoomId = (a: string, b: string) =>
    a < b ? `chat_${a}_${b}` : `chat_${b}_${a}`;

  const openChat = async (student: any) => {
    const roomId = makeRoomId(userId!, student._id);
    setActiveChat({ student, roomId });

    try {
      const res = await getMessagesForRoom(roomId, 1, 100);
      setMessages(res.messages || []);
      socket.emit("join_room", roomId);
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !activeChat) return;

    socket.emit("send_message", {
      roomId: activeChat.roomId,
      senderId: userId,
      recipientId: activeChat.student._id,
      text: messageText.trim()
    });

    setMessageText("");
  };

  useEffect(() => {
    const onReceive = (msg: any) => {
      if (msg.roomId === activeChat?.roomId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on("receive_message", onReceive);
    return () => {
      socket.off("receive_message", onReceive);
    };
  }, [activeChat]);

  /* ---------------- START CALL ---------------- */
  const startCall = () => {
    if (!activeChat) return;

    const roomId = `class_${activeChat.student._id}`;

    socket.emit("start-call", {
      toUserId: activeChat.student._id,
      fromUser: { id: userId, name: user?.name },
      roomId
    });

    // show outgoing UI
    setOutgoingCall({ toUser: activeChat.student, roomId, toUserId: activeChat.student._id });
  };

  /* ---------------- ACCEPT / REJECT ---------------- */
  const acceptCall = () => {
    socket.emit("call-accepted", {
      toUserId: incomingCall.fromUser.id,
      roomId: incomingCall.roomId
    });

    window.open(`https://meet.jit.si/${incomingCall.roomId}`, "_blank");
    setIncomingCall(null);
  };

  const rejectCall = () => {
    socket.emit("call-rejected", {
      toUserId: incomingCall.fromUser.id
    });

    setIncomingCall(null);
  };


  /* ---------------- SAVE PROFILE ---------------- */
  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Defensive: if this handler was called while not in edit mode (unexpected), toggle editing instead of saving.
    if (!editing) {
      console.debug('handleSaveProfile called while not editing — toggling edit mode');
      setEditing(true);
      return;
    }

    if (!profile) {
      toast.error("Profile not loaded");
      return;
    }

    try {
      setProfileLoading(true);

      const payload = {
        subjects: profile.subjects || "",
        classes: profile.classes || "",
        achievements: profile.achievements || [],
        experience: profile.experience || "",
        qualifications: profile.qualifications || "",
        bio: profile.bio || "",
        mode: modeState,
        location: profile.location || { city: "", state: "" }
      };

      const res = await updateTeacherProfile(payload);
      console.debug('updateTeacherProfile response:', res);
      if (res && res.success === false) {
        toast.error(res.message || 'Failed to save profile');
        return;
      }

      // fetch the latest profile from server to ensure what persisted
      const fresh = await getTeacherProfileByUserId(userId);
      const prof = fresh || res.profile || res;
      if (!prof) {
        toast.error('Failed to load updated profile');
        return;
      }

      setProfile({
        subjects: prof?.subjects || "",
        classes: prof?.classes || "",
        achievements: prof?.achievements || [],
        experience: prof?.experience || "",
        qualifications: prof?.qualifications || "",
        bio: prof?.bio || "",
        mode: prof?.mode || "both",
        location: {
          city: prof?.location?.city || "",
          state: prof?.location?.state || ""
        }
      });
      setModeState(prof?.mode || "both");
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      console.error('handleSaveProfile error:', err);
      toast.error("Failed to save profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // for requests 
  const handleResponse = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const { respondToRequest } = await import('@/lib/api');
      const payload: any = {
        status: action === 'accept' ? 'accepted' : 'declined',
        response: responseMessage.trim() || ''
      };
      if (action === 'accept' && proposedTime) {
        const dt = new Date(proposedTime);
        payload.scheduledDate = dt.toISOString();
        payload.scheduledTime = dt.toLocaleTimeString();
      }
      const res = await respondToRequest(requestId, payload);
      toast.success(res.message || `Request ${payload.status} successfully`);
      // update local state
      setMeetingRequests((prev) => prev.map((r: any) => r._id === requestId ? { ...r, status: payload.status, teacherResponse: responseMessage, scheduledDate: payload.scheduledDate } : r));
      setSelectedRequest(null);
      setResponseMessage('');
      setProposedTime('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to respond');
    }
  };
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'pending': return 'bg-yellow-100 text-yellow-800';
  //     case 'responded': return 'bg-blue-100 text-blue-800';
  //     case 'accepted': return 'bg-green-100 text-green-800';
  //     case 'declined':
  //     case 'rejected': return 'bg-red-100 text-red-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };


  if (loading) return <div className="p-8">Loading…</div>;

  const pending = meetingRequests.filter(r => r.status === "pending");
  const accepted = meetingRequests.filter(r => r.status === "accepted");
  const declined = meetingRequests.filter(r => r.status === "declined");


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name}</h1>

        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home"><Home className="h-4 w-4 mr-1" /> Home</TabsTrigger>
            <TabsTrigger value="requests"><Home className="h-4 w-4 mr-1" /> Requests</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" /> Chat</TabsTrigger>
            <TabsTrigger value="calls"><Video className="h-4 w-4 mr-1" /> Calls</TabsTrigger>
            <TabsTrigger value="profile"><Settings className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
          </TabsList>

          {/* HOME */}
          <TabsContent value="home">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-sm text-gray-500">Total Requests</div>
                  <div className="text-3xl font-bold">{meetingRequests.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-sm text-gray-500">Incoming</div>
                  <div className="text-3xl font-bold text-yellow-600">
                    {pending.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-sm text-gray-500">Accepted</div>
                  <div className="text-3xl font-bold text-green-600">
                    {accepted.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-sm text-gray-500">Declined</div>
                  <div className="text-3xl font-bold text-red-600">
                    {declined.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* REQUESTS */}
          <TabsContent value="requests">
            {pending.length === 0 && (
              <div className="text-gray-500">No incoming requests</div>
            )}

            {pending.map(r => (
              <Card key={r._id} className="mb-3">
                <CardContent className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{r.studentId?.name}</div>
                    <div className="text-sm text-gray-500">
                      {r.subject} — Class {r.class}
                    </div>
                  </div>

                  <Button onClick={() => setSelectedRequest(r)}>
                    Respond
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>


          {/* CHAT */}
          <TabsContent value="chat">
            <div className="flex h-[70vh] border rounded overflow-hidden">
              {/* LEFT */}
              <div className="w-1/3 border-r overflow-auto">
                {accepted.map(r => (
                  <div
                    key={r._id}
                    onClick={() => openChat(r.studentId)}
                    className={`p-3 cursor-pointer hover:bg-gray-100 ${activeChat && activeChat.student && String(activeChat.student._id) === String(r.studentId._id) ? "bg-gray-200" : ""}`}>
                    {r.studentId?.name}
                  </div>
                ))}
              </div>

              {/* RIGHT */}
              <div className="flex-1 flex flex-col">
                {activeChat ? (
                  <>
                    <div className="p-3 border-b flex justify-between items-center">
                      <div className="font-medium">{activeChat.student.name}</div>
                      <Button size="sm" onClick={startCall}>
                        <Video className="h-4 w-4 mr-1" /> Call
                      </Button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-2">
                      {messages.map((m, i) => {
                        const isMe = String(m.senderId) === String(userId);
                        return (
                          <div key={i} className={isMe ? "text-right" : "text-left"}>
                            <div className={`inline-block px-3 py-2 rounded ${isMe ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 border-t flex gap-2">
                      <Input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Type message…"
                      />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    Select a student to start chatting
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* CALLS */}
          <TabsContent value="calls">
            {callLogs.length === 0 ? (
              <div className="text-gray-500">No call history</div>
            ) : (
              callLogs.map(log => (
                <Card key={log._id} className="mb-2">
                  <CardContent>
                    <div className="font-semibold">{log.isIncoming ? `${log.otherUserName} → You` : `You → ${log.otherUserName}`}</div>
                    <div className="text-sm text-gray-500">Status: {log.status} — {new Date(log.createdAt).toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile">
            <Card>
              <CardContent className="space-y-4">

                <form onSubmit={handleSaveProfile} className="space-y-4">

                  <div>
                    <Label>Subjects</Label>
                    <Input
                      disabled={!editing}
                      value={profile?.subjects || ''}
                      onChange={e => setProfile({ ...profile, subjects: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Classes</Label>
                    <Input
                      disabled={!editing}
                      value={profile?.classes || ''}
                      onChange={e => setProfile({ ...profile, classes: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Experience</Label>
                    <Input
                      disabled={!editing}
                      value={profile?.experience || ''}
                      onChange={e => setProfile({ ...profile, experience: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Qualifications</Label>
                    <Input
                      disabled={!editing}
                      value={profile?.qualifications || ''}
                      onChange={e => setProfile({ ...profile, qualifications: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Achievements (comma separated)</Label>
                    <Input
                      disabled={!editing}
                      value={(profile?.achievements || []).join(', ')}
                      onChange={e =>
                        setProfile({
                          ...profile,
                          achievements: e.target.value.split(',').map(a => a.trim())
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      disabled={!editing}
                      value={profile?.bio || ''}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        disabled={!editing}
                        value={profile?.location?.city || ''}
                        onChange={e =>
                          setProfile({
                            ...profile,
                            location: { ...profile.location || {}, city: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>State</Label>
                      <Input
                        disabled={!editing}
                        value={profile?.location?.state || ''}
                        onChange={e =>
                          setProfile({
                            ...profile,
                            location: { ...profile.location, state: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Mode</Label>
                    <select
                      disabled={!editing}
                      value={modeState}
                      onChange={e => setModeState(e.target.value as any)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  {!editing ? (
                    <Button type="button" onClick={(e:any) => { e.preventDefault(); e.stopPropagation(); console.debug('Edit Profile clicked'); setEditing(true); }}>
                      Edit Profile
                    </Button>
                  ) : (
                    <Button type="submit" disabled={profileLoading}>
                      Save Profile
                    </Button>
                  )}

                </form>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>


      </div>

      {/* INCOMING CALL POPUP */}
      <IncomingCallModal
        open={!!incomingCall}
        caller={incomingCall?.fromUser}
        roomId={incomingCall?.roomId}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {/* OUTGOING CALL (caller UI) */}
      <OutgoingCallModal
        open={!!outgoingCall}
        callee={outgoingCall?.toUser}
        onCancel={() => {
          if (outgoingCall?.toUserId) {
            socket.emit('cancel-call', { toUserId: outgoingCall.toUserId, roomId: outgoingCall.roomId, fromUser: { id: userId, name: user?.name } });
          }
          setOutgoingCall(null);
        }}
      />
      {/* RESPOND MODAL */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Respond to {selectedRequest?.studentId?.name}
            </DialogTitle>
          </DialogHeader>

          <Textarea
            placeholder="Response message"
            value={responseMessage}
            onChange={e => setResponseMessage(e.target.value)}
          />

          <Input
            type="datetime-local"
            value={proposedTime}
            onChange={e => setProposedTime(e.target.value)}
          />

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() =>
                handleResponse(selectedRequest!._id, "accept")
              }
            >
              Accept
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                handleResponse(selectedRequest!._id, "decline")
              }
            >
              Decline
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default TeacherDashboard;
