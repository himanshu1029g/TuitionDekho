import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

import {
  Home,
  MessageSquare,
  Video,
  History,
  BookOpen
} from "lucide-react";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import IncomingCallModal from "@/components/IncomingCallModal";
import OutgoingCallModal from "@/components/OutgoingCallModal";

import {
  getStudentRequests,
  getMessagesForRoom,
  getMyCallLogs
} from "@/lib/api";

/* -------------------------------------------------- */

const StudentDashboard = () => {
  const { user } = useUser();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);

  /* ---------------- CHAT ---------------- */
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [outgoingCall, setOutgoingCall] = useState<any>(null);

  /* ---------------- CALLING ---------------- */
  const [incomingCall, setIncomingCall] = useState<any>(null);

  /* ---------------- LOAD DASHBOARD ---------------- */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const [reqs, calls] = await Promise.all([getStudentRequests(), getMyCallLogs()]);
        setMeetingRequests(reqs || []);
        setCallLogs(calls || []);
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
    // Register socket id for notifications (UserContext also registers on login)
    socket.emit("register", userId);
  }, [userId]);

  /* ---------------- INCOMING CALL ---------------- */
  useEffect(() => {
    const onIncomingCall = ({ fromUser, roomId }: any) => {
      setIncomingCall({ fromUser, roomId });
    };

    const onCallRejected = ({ roomId }: any) => {
      setOutgoingCall(null);
      toast.error("Call rejected");
    };

    const onCallAccepted = ({ roomId }: any) => {
      setOutgoingCall(null);
      toast.success("Call accepted");
      window.location.href = `https://meet.jit.si/${roomId}`;
    };

    const onCallCancelled = ({ roomId, fromUser }: any) => {
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

  /* ---------------- HELPERS ---------------- */
  const makeRoomId = (a: string, b: string) =>
    a < b ? `chat_${a}_${b}` : `chat_${b}_${a}`;

  /* ---------------- CHAT ---------------- */
  const openChat = async (teacher: any) => {
    if (!userId) return;

    const roomId = makeRoomId(userId, teacher._id);
    setActiveChat({ teacher, roomId });

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
      recipientId: activeChat.teacher._id,
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

    const roomId = `class_${activeChat.teacher._id}`;

    socket.emit("start-call", {
      toUserId: activeChat.teacher._id,
      fromUser: { id: userId, name: user?.name },
      roomId
    });

    setOutgoingCall({ toUser: activeChat.teacher, roomId, toUserId: activeChat.teacher._id });
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

  /* ---------------- FILTERS ---------------- */
  const pending = meetingRequests.filter(r => r.status === "pending");
  const accepted = meetingRequests.filter(r => r.status === "accepted");
  const declined = meetingRequests.filter(r => r.status === "declined");
  const history = meetingRequests.filter(r =>
    ["declined", "completed"].includes(r.status)
  );

  if (loading) return <div className="p-8">Loading…</div>;

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">
          Welcome, {user?.name}
        </h1>

        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home"><Home className="h-4 w-4 mr-1" /> Home</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" /> Chat</TabsTrigger>
            <TabsTrigger value="calls"><Video className="h-4 w-4 mr-1" /> Calls</TabsTrigger>
            <TabsTrigger value="bookings"><BookOpen className="h-4 w-4 mr-1" /> Bookings</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-1" /> History</TabsTrigger>
          </TabsList>

          {/* HOME */}
          <TabsContent value="home">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-6">Total {meetingRequests.length}</CardContent></Card>
              <Card><CardContent className="p-6">Pending {pending.length}</CardContent></Card>
              <Card><CardContent className="p-6">Accepted {accepted.length}</CardContent></Card>
              <Card><CardContent className="p-6">Declined {declined.length}</CardContent></Card>
            </div>
          </TabsContent>

          {/* REQUESTS */}
          <TabsContent value="requests" className="space-y-3">
            {meetingRequests.map(r => (
              <Card key={r._id}>
                <CardContent>
                  <div className="font-semibold">{r.teacherId?.name}</div>
                  <div className="text-sm">{r.subject}</div>
                  <div>Status: {r.status}</div>
                  {r.teacherResponse && <div>Teacher: {r.teacherResponse}</div>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* CHAT */}
          <TabsContent value="chat">
            <div className="flex h-[70vh] border rounded">
              <div className="w-1/3 border-r">
                {accepted.map(r => (
                  <div
                    key={r._id}
                    onClick={() => openChat(r.teacherId)}
                    className="p-3 cursor-pointer hover:bg-gray-100"
                  >
                    {r.teacherId?.name}
                  </div>
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                {activeChat ? (
                  <>
                    <div className="p-3 border-b flex justify-between items-center">
                      <div className="font-medium">{activeChat.teacher.name}</div>
                      <Button size="sm" onClick={startCall}>
                        <Video className="h-4 w-4 mr-1" /> Call
                      </Button>
                    </div>

                    <div className="flex-1 p-4 overflow-auto space-y-2">
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
                      <Input value={messageText} onChange={e => setMessageText(e.target.value)} />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    Select a chat
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

          {/* BOOKINGS */}
          <TabsContent value="bookings">
            {accepted.map(r => (
              <Card key={r._id}>
                <CardContent>{r.teacherId?.name}</CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Meeting Requests</h3>
              {meetingRequests.length === 0 && <div className="text-gray-500">No meeting requests</div>}

              {meetingRequests.map(r => (
                <Card key={r._id} className="mb-2">
                  <CardContent>
                    <div className="font-semibold">To: {r.teacherId?.name}</div>
                    <div className="text-sm">Subject: {r.subject} — Class: {r.class}</div>
                    <div className="text-sm">Status: {r.status} {r.teacherResponse && `— Teacher: ${r.teacherResponse}`}</div>
                  </CardContent>
                </Card>
              ))}

              <h3 className="text-lg font-semibold mt-4">Call History</h3>
              {callLogs.length === 0 && <div className="text-gray-500">No call history</div>}
              {callLogs.map(log => (
                <Card key={log._id} className="mb-2">
                  <CardContent>
                    <div className="font-semibold">{log.isIncoming ? `${log.otherUserName} → You` : `You → ${log.otherUserName}`}</div>
                    <div className="text-sm text-gray-500">Status: {log.status} — {new Date(log.createdAt).toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      <OutgoingCallModal
        open={!!outgoingCall}
        callee={outgoingCall?.toUser}
        onCancel={() => {
          if (outgoingCall?.toUserId) {
            socket.emit('call-rejected', { toUserId: outgoingCall.toUserId });
          }
          setOutgoingCall(null);
        }}
      />
    </div>
  );
};

export default StudentDashboard;
