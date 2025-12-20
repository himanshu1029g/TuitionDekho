import React, { useEffect, useState } from 'react';
import { formatLocation } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, BookOpen, MessageSquare, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { getTeacherById, requestMeeting, createOrGetChat, getTeacherStudentCount } from '@/lib/api';

type Teacher = {
  _id: string;
  userId?: { _id: string; name: string };
  fullName?: string;
  subjects?: string[] | string;
  classes?: string[] | string;
  achievements?: string[] | string;
  qualifications?: string | string[];
  bio?: string;
  experience?: string;
  location?: any;
  fee?: string;
  rating?: number;
  reviews?: any[];
  mode?: string;
};

const TeacherProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [meetingMessage, setMeetingMessage] = useState('');
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    // initialize selected subject/class from teacher when loaded
    if (teacher) {
      const subs = Array.isArray(teacher.subjects) ? teacher.subjects : (teacher.subjects || '').split(',');
      const cls = Array.isArray(teacher.classes) ? teacher.classes : (teacher.classes || '').split(',');
      setSelectedSubject(subs[0]?.trim() || '');
      setSelectedClass(cls[0]?.trim() || '');
    }
  }, [teacher]);

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      if (!teacher) return;
      try {
        const res = await getTeacherStudentCount(teacher._id);
        if (!mounted) return;
        setStudentCount(res.count ?? 0);
      } catch (e) {
        console.error('Failed to load student count', e);
      }
    };
    loadCount();
    return () => { mounted = false; };
  }, [teacher]);
  const [preferredMode, setPreferredMode] = useState<'online' | 'offline' | 'both'>('online');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadTeacher = async () => {
      if (!id) return;

      try {
        const res = await getTeacherById(id);
        if (!mounted) return;

        const t = res.teacher || res.data?.teacher || res;
        setTeacher(t);
        setReviews(t?.reviews || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load teacher');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTeacher();
    return () => { mounted = false; };
  }, [id]);

  const handleMeetingRequest = async () => {
    if (!isLoggedIn || user?.role !== 'student') {
      toast.error('Only logged-in students can request meetings');
      return;
    }

    if (meetingMessage.trim().length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }

    try {
      const teacherId = teacher?.userId?._id || teacher?._id || id;

      const subjectsArr = Array.isArray(teacher?.subjects)
        ? teacher.subjects
        : (teacher?.subjects || '').split(',');

      const classesArr = Array.isArray(teacher?.classes)
        ? teacher.classes
        : (teacher?.classes || '').split(',');

      await requestMeeting({
        teacherId,
        teacherProfileId: teacher?._id,
        message: meetingMessage,
        mode: preferredMode === 'both' ? 'online' : preferredMode,
        subject: selectedSubject || subjectsArr[0]?.trim(),
        class: selectedClass || classesArr[0]?.trim()
      });

      toast.success('Meeting request sent');
      setMeetingMessage('');
      setIsRequestDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Request failed');
    }
  };



  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !teacher) return <div className="text-red-500">{error}</div>;

  const subjectList = Array.isArray(teacher.subjects) ? teacher.subjects : (teacher.subjects || '').split(',');
  const classList = Array.isArray(teacher.classes) ? teacher.classes : (teacher.classes || '').split(',');
  const achievementsList = Array.isArray(teacher.achievements) ? teacher.achievements : (teacher.achievements || '').split(',');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold">{teacher.userId?.name || teacher.fullName}</h1>
                <p className="text-primary font-semibold mt-2">{subjectList.join(' • ')}</p>

                <div className="flex items-center gap-4 text-sm mt-3 text-gray-600">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {teacher.experience || '—'}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {formatLocation(teacher.location)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {classList.map(cls => (
                    <Badge key={cls} variant="secondary">{cls.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="about">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p>{teacher.bio}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {achievementsList.length ? (
                      achievementsList.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2">
                          <Award className="h-4 w-4 text-yellow-500 mt-1" />
                          <span>{a.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No achievements listed.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* SIDEBAR */}
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>{Array.isArray(teacher.qualifications) ? teacher.qualifications.join(', ') : (teacher.qualifications || '—')}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-4">
                <div className="text-sm text-gray-500">Students enrolled</div>
                <div className="text-xl font-semibold">{typeof studentCount === 'number' ? studentCount : '—'}</div>
              </div>

              <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request Meeting
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Request</DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Subject</Label>
                      <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full border rounded px-3 py-2">
                        {(Array.isArray(teacher.subjects) ? teacher.subjects : (teacher.subjects || '').split(',')).map((s:any, idx:number) => (
                          <option key={idx} value={s.trim()}>{s.trim()}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Class</Label>
                      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border rounded px-3 py-2">
                        {(Array.isArray(teacher.classes) ? teacher.classes : (teacher.classes || '').split(',')).map((c:any, idx:number) => (
                          <option key={idx} value={c.trim()}>{c.trim()}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Mode</Label>
                      <select value={preferredMode} onChange={e => setPreferredMode(e.target.value as any)} className="w-full border rounded px-3 py-2">
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label>Message</Label>
                    <Textarea
                      value={meetingMessage}
                      onChange={e => setMeetingMessage(e.target.value)}
                      placeholder="Write a short message that explains your requirements..."
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Button onClick={handleMeetingRequest} className="mt-2 w-full">Send Request</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
