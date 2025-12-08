import { api } from "./http";

export type TeacherSearchParams = {
  subject?: string;
  class?: string;
  location?: string;
  mode?: "online" | "offline" | "both" | string;
  page?: number | string;
  limit?: number | string;
};

// Update Teacher Profile
export async function updateTeacherProfile(data: {
  subjects: string;
  classes: string;
  experience: string;
  qualifications: string;
  location: { city: string; state?: string; address?: string };
  mode: "online" | "offline" | "both" | string;
  bio?: string;
  achievements?: string[];
}) {
  const res = await api.put("teachers/profile", data);
  return res.data;
}

// Create Teacher Profile
export async function createTeacherProfile(data: {
  subjects: string;
  classes: string;
  experience?: string;
  qualifications?: string;
  location?: { city: string; state?: string; address?: string };
  mode?: "online" | "offline" | "both" | string;
  bio?: string;
  achievements?: string[];
}) {
  const res = await api.post("teachers/profile", data);
  return res.data;
}

// Search Teachers
export async function searchTeachers(params: TeacherSearchParams) {
  const res = await api.get("teachers/search", { params });
  return res.data;
}

// Student dashboard
export async function getStudentDashboard() {
  const res = await api.get("students/dashboard");
  return res.data;
}

// Student meeting requests
export async function getStudentRequests(params?: any) {
  const res = await api.get("meetings/student", { params });
  return res.data.requests || [];
}

// Teacher meeting requests
export async function getTeacherRequests(params?: any) {
  const res = await api.get("meetings/teacher", { params });
  return res.data.requests || [];
}

// Create meeting (Jitsi)
export const createMeeting = async () => {
  const res = await api.post("meetings/create-meeting");
  return res.data;
};

// Meeting request (student → teacher)
export async function requestMeeting(payload: {
  teacherId: string;
  teacherProfileId?: string;
  subject: string;
  class: string;
  mode: "online" | "offline";
  message?: string;
}) {
  const res = await api.post("meetings/request", payload);
  return res.data;
}

// Auth: Register
export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  const res = await api.post("auth/register", data);
  // const res = await api.post("register", data);
  return res.data;
}

// Auth: Login
export async function login(data: { email: string; password: string }) {
  const res = await api.post("auth/login", data);
  // const res = await api.post("login", data);
  return res.data;
}

// Get teacher by ID
export async function getTeacherById(id: string) {
  const res = await api.get(`teachers/${id}`);
  return res.data;
}

// Get teacher profile by userId
export async function getTeacherProfileByUserId(userId: string) {
  const res = await api.get(`teachers/user/${userId}`);
  return res.data?.profile || res.data || null;
}

// Respond to meeting request
export async function respondToRequest(id: string, payload: any) {
  const res = await api.put(`meetings/${id}/respond`, payload);
  return res.data;
}

// Notifications
export async function getNotifications() {
  const res = await api.get("notifications");
  return res.data;
}

export async function getNotificationsCount() {
  const res = await api.get("notifications/count");
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await api.put(`notifications/${id}/read`);
  return res.data;
}

export async function deleteStudentRequest(requestId: string) {
  const res = await api.delete(`meetings/request/${requestId}`);
  return res.data;
}

// add forgt func 

// 1) Send Reset Email
export async function forgotPassword(email: string) {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
}

// 2) Validate Token
export async function validateResetToken(token: string) {
  const res = await api.get(`/auth/reset-password/${token}`);
  return res.data;
}

// 3) Reset Password
export async function resetPassword(token: string, password: string) {
  const res = await api.post(`/auth/reset-password/${token}`, { password });
  return res.data;
}