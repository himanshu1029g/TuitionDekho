import React, { useState, useEffect } from "react";
import { formatLocation } from "@/lib/utils";
import {
  MessageSquare,
  MapPin
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

const StudentDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [recommendedTeachers, setRecommendedTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const {
          getStudentDashboard,
          getStudentRequests,
          searchTeachers
        } = await import("@/lib/api");

        const [dash, reqs, teachers] = await Promise.all([
          getStudentDashboard().catch(() => null),
          getStudentRequests().catch(() => []),
          searchTeachers({ page: 1, limit: 4 }).catch(() => ({ teachers: [] }))
        ]);

        if (!mounted) return;

        setDashboard(dash?.dashboard || null);
        setMeetingRequests(reqs || []);
        setRecommendedTeachers(teachers.teachers || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------------- CHAT ----------------
  const makeRoomId = (a: string, b: string) =>
    a < b ? `chat_${a}_${b}` : `chat_${b}_${a}`;

  const openChatWithTeacher = (teacherUserId: string) => {
    if (!user?.id) return;

    const roomId = makeRoomId(user.id, teacherUserId);
    navigate("/chat", { state: { roomId } });
  };

  // ---------------- VIDEO CALL ----------------
  const startCall = (teacherUserId: string, requestId: string) => {
    if (!user) return;

    const roomId = `class_${requestId}`;

    socket.emit("start-call", {
      toUserId: teacherUserId,
      fromUser: {
        id: user.id,
        name: user.name
      },
      roomId
    });

    window.open(`https://meet.jit.si/${roomId}`, "_blank");
  };

  // ---------------- DELETE REQUEST ----------------
  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { deleteStudentRequest } = await import("@/lib/api");
      await deleteStudentRequest(requestId);
      setMeetingRequests(prev => prev.filter(r => r._id !== requestId));
      toast.success("Request deleted");
    } catch {
      toast.error("Failed to delete request");
    }
  };

  // ---------------- UI ----------------
  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">
          Hi, {user?.name || "Student"}
        </h1>

        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* REQUESTS */}
          <TabsContent value="requests" className="space-y-4">
            {meetingRequests.map(r => (
              <Card key={r._id}>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      {r.teacherId?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {r.subject}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {r.status === "accepted" && (
                      <Button
                        onClick={() =>
                          openChatWithTeacher(
                            typeof r.teacherId === "string"
                              ? r.teacherId
                              : r.teacherId._id
                          )
                        }
                      >
                        Chat
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteRequest(r._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* BOOKINGS */}
          <TabsContent value="bookings" className="space-y-4">
            {meetingRequests
              .filter(b => ["accepted", "completed"].includes(b.status))
              .map(b => {
                const teacherId =
                  typeof b.teacherId === "string"
                    ? b.teacherId
                    : b.teacherId?._id;

                return (
                  <Card key={b._id}>
                    <CardContent className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">
                          {b.teacherId?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {b.scheduledDate
                            ? new Date(b.scheduledDate).toLocaleString()
                            : ""}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => startCall(teacherId, b._id)}
                      >
                        📹 Start Call
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>

          {/* RECOMMENDED */}
          <TabsContent value="recommended">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedTeachers.map(t => (
                <Card
                  key={t._id}
                  onClick={() => navigate(`/teacher/${t._id}`)}
                  className="cursor-pointer hover:shadow"
                >
                  <CardHeader>
                    <CardTitle>{t.userId?.name}</CardTitle>
                    <CardDescription>{t.subjects}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {formatLocation(t.location)}
                    </div>
                    <Badge>{t.mode}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
