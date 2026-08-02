import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "motion-only-api-token";

type RequestOptions = RequestInit & { authenticated?: boolean };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (options.authenticated) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Motion Only could not reach the secure service. Check your connection and try again.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Motion Only could not complete that request.");
  return payload as T;
}

export type MemberProfile = {
  id: string;
  email: string;
  role: "member" | "moderator" | "admin";
  display_name?: string;
  displayName?: string;
  bio?: string | null;
  focuses?: Array<"Business" | "Trading" | "Fitness">;
  timezone?: string;
  onboarding_completed_at?: string | null;
  onboardingCompleted?: boolean;
  profile_visibility?: "private" | "members";
  progress_visibility?: "private" | "members";
  messaging_permission?: "members" | "connections" | "nobody";
};

export async function acceptInvitation(input: { inviteCode: string; email: string; password: string; name: string }) {
  const result = await request<{ token: string; user: MemberProfile }>("/v1/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(input)
  });
  await SecureStore.setItemAsync(TOKEN_KEY, result.token);
  return result.user;
}

export async function passwordLogin(email: string, password: string) {
  const result = await request<{ token: string; user: MemberProfile }>("/v1/auth/password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  await SecureStore.setItemAsync(TOKEN_KEY, result.token);
  return result.user;
}

export function requestMagicLink(email: string) {
  return request<{ accepted: true; developmentLink?: string }>("/v1/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function verifyMagicLink(token: string) {
  const result = await request<{ token:string; user:MemberProfile }>("/v1/auth/magic-link/verify", {
    method:"POST",
    body:JSON.stringify({ token })
  });
  await SecureStore.setItemAsync(TOKEN_KEY, result.token);
  return result.user;
}

export function requestPasswordReset(email: string) {
  return request<{ accepted:true; developmentLink?:string }>("/v1/auth/password-reset/request", {
    method:"POST",
    body:JSON.stringify({ email })
  });
}

export function confirmPasswordReset(token: string, password: string) {
  return request<{ success:true }>("/v1/auth/password-reset/confirm", {
    method:"POST",
    body:JSON.stringify({ token, password })
  });
}

export function getMe() {
  return request<MemberProfile>("/v1/me", { authenticated:true });
}

export function updateMe(input: {
  displayName?:string;
  bio?:string | null;
  focuses?:Array<"Business" | "Trading" | "Fitness">;
  timezone?:string;
  onboardingCompleted?:boolean;
  profileVisibility?:"private" | "members";
  progressVisibility?:"private" | "members";
  messagingPermission?:"members" | "connections" | "nobody";
}) {
  return request<MemberProfile>("/v1/me", {
    method:"PATCH",
    authenticated:true,
    body:JSON.stringify(input)
  });
}

export function listGoals() {
  return request<{ items: Array<{ id:string; title:string; focus:"Business"|"Trading"|"Fitness"; progress:number; target_date:string | null; status:string }> }>("/v1/goals", { authenticated: true });
}

export function createGoal(input: { title:string; focus:"Business"|"Trading"|"Fitness"; targetDate?:string }) {
  return request<{ id:string; title:string; focus:"Business"|"Trading"|"Fitness"; progress:number; target_date:string | null; status:string }>("/v1/goals", {
    method:"POST",
    authenticated:true,
    body:JSON.stringify(input)
  });
}

export function updateGoalProgress(id: string, progress: number, note?: string) {
  return request<{ id:string; progress:number; progression?:ProgressionAward }>(`/v1/goals/${id}/progress`, {
    method:"PATCH",
    authenticated:true,
    body:JSON.stringify({ progress, note })
  });
}

export function listMotions() {
  return request<{ items:Array<{ id:string; title:string; focus:"Business"|"Trading"|"Fitness"; scheduled_date:string; completed_at:string | null }> }>("/v1/motions", { authenticated:true });
}

export function createMotion(input: { title:string; focus:"Business"|"Trading"|"Fitness"; scheduledDate?:string }) {
  return request<{ id:string; title:string; focus:"Business"|"Trading"|"Fitness"; scheduled_date:string; completed_at:string | null }>("/v1/motions", {
    method:"POST",
    authenticated:true,
    body:JSON.stringify(input)
  });
}

export function setMotionComplete(id:string, completed:boolean) {
  return request<{ id:string; completed_at:string | null; progression?:ProgressionAward }>(`/v1/motions/${id}`, {
    method:"PATCH",
    authenticated:true,
    body:JSON.stringify({ completed })
  });
}

export function listHabits() {
  return request<{ items:Array<{ id:string; title:string; focus:"Business"|"Trading"|"Fitness"; checked_today:boolean; checkins_last_30:number }> }>("/v1/habits", { authenticated:true });
}

export function createHabit(input: { title:string; focus:"Business"|"Trading"|"Fitness" }) {
  return request<{ id:string; title:string; focus:"Business"|"Trading"|"Fitness" }>("/v1/habits", {
    method:"POST",
    authenticated:true,
    body:JSON.stringify(input)
  });
}

export function setHabitCheckin(id:string, checked:boolean, note?:string) {
  return request<{ checked:boolean; checkinDate:string; progression?:ProgressionAward }>(`/v1/habits/${id}/check-in`, {
    method:"PUT",
    authenticated:true,
    body:JSON.stringify({ checked, note })
  });
}

type ProgressionAward = { awarded:boolean; lifetime_xp:number; current_level:number; weekly_points:number };

export function getProgression() {
  return request<{
    profile: { lifetime_xp:number; current_level:number; momentum_streak:number; best_momentum_streak:number };
    week: { week_start:string | null; points:number; status:"building" | "secured" | "missed"; bonus_xp:number };
    events: Array<{ event_type:string; xp_points:number; momentum_points:number; occurred_at:string }>;
    history: Array<{ week_start:string; points:number; status:string; bonus_xp:number }>;
    levels: Array<{ level:number; name:string; xp_required:number }>;
  }>("/v1/progression", { authenticated:true });
}

export function submitWeeklyReview(input: { reflection:string; wins:string[]; nextWeekFocus:string }) {
  return request<{ weekStart:string; progression:ProgressionAward }>("/v1/progression/weekly-review", {
    method:"POST",
    authenticated:true,
    body:JSON.stringify(input)
  });
}

export type LibraryProgress = {
  resource_id:string;
  saved:boolean;
  checklist:number[];
  started_at:string | null;
  completed_at:string | null;
  updated_at:string;
};

export function listLibraryProgress() {
  return request<{items:LibraryProgress[]}>("/v1/library-progress",{authenticated:true});
}

export function updateLibraryProgress(resourceId:string,input:{saved?:boolean;checklist?:number[];completed?:boolean}) {
  return request<LibraryProgress>(`/v1/library-progress/${encodeURIComponent(resourceId)}`,{
    method:"PUT",authenticated:true,body:JSON.stringify(input)
  });
}

export type MemberDirectoryItem = {
  id:string;display_name:string;bio:string | null;
  focuses:Array<"Business"|"Trading"|"Fitness">;avatar_key:string | null;
};

export function listMembers() {
  return request<{items:MemberDirectoryItem[]}>("/v1/members",{authenticated:true});
}

export function blockMember(id:string) {
  return request(`/v1/members/${id}/block`,{method:"POST",authenticated:true});
}

export type RoomItem = {
  id:string;title:string;slug:string;description:string | null;
  focus:"Business"|"Trading"|"Fitness"|null;is_private:boolean;member_count:number;
};
export type ChatMessage = {
  id:string;room_id?:string;thread_id?:string;sender_id:string;
  display_name:string;body:string;created_at:string;
};

export function listRooms() {
  return request<{items:RoomItem[]}>("/v1/rooms",{authenticated:true});
}

export function listRoomMessages(id:string) {
  return request<{items:ChatMessage[]}>(`/v1/rooms/${id}/messages`,{authenticated:true});
}

export function sendRoomMessage(id:string,body:string) {
  return request<ChatMessage>(`/v1/rooms/${id}/messages`,{
    method:"POST",authenticated:true,body:JSON.stringify({body})
  });
}

export async function getRealtimeUrl() {
  const result=await request<{ticket:string}>("/v1/realtime-ticket",{method:"POST",authenticated:true});
  return `${API_URL.replace(/^http/,"ws").replace(/\/+$/,"")}/v1/realtime?ticket=${encodeURIComponent(result.ticket)}`;
}

export type DirectThread = {
  id:string;member_id:string;display_name:string;
  focuses:Array<"Business"|"Trading"|"Fitness">;avatar_key:string | null;
  last_message:string | null;last_message_at:string | null;
};

export function listDirectThreads() {
  return request<{items:DirectThread[]}>("/v1/direct-threads",{authenticated:true});
}

export function createDirectThread(memberId:string) {
  return request<{id:string}>("/v1/direct-threads",{
    method:"POST",authenticated:true,body:JSON.stringify({memberId})
  });
}

export function listDirectMessages(id:string) {
  return request<{items:ChatMessage[]}>(`/v1/direct-threads/${id}/messages`,{authenticated:true});
}

export function sendDirectMessage(id:string,body:string) {
  return request<ChatMessage>(`/v1/direct-threads/${id}/messages`,{
    method:"POST",authenticated:true,body:JSON.stringify({body})
  });
}

export type ProjectItem = {
  id:string;title:string;description:string | null;owner_id:string;
  progress:number;role:string;member_count:number;
};
export type ProjectUpdate = {
  id:string;author_id:string;display_name:string;body:string;created_at:string;
};

export function listProjects() {
  return request<{items:ProjectItem[]}>("/v1/projects",{authenticated:true});
}

export function createProject(input:{title:string;description?:string}) {
  return request<ProjectItem>("/v1/projects",{method:"POST",authenticated:true,body:JSON.stringify(input)});
}

export function listProjectUpdates(id:string) {
  return request<{items:ProjectUpdate[]}>(`/v1/projects/${id}/updates`,{authenticated:true});
}

export function sendProjectUpdate(id:string,body:string) {
  return request<ProjectUpdate>(`/v1/projects/${id}/updates`,{
    method:"POST",authenticated:true,body:JSON.stringify({body})
  });
}

export function inviteProjectMember(id:string,memberId:string) {
  return request(`/v1/projects/${id}/members`,{
    method:"POST",authenticated:true,body:JSON.stringify({memberId})
  });
}

export type AchievementItem = {
  id:string;title:string;description:string | null;achieved_at:string;created_at:string;
};

export function listAchievements() {
  return request<{items:AchievementItem[]}>("/v1/achievements",{authenticated:true});
}

export function createAchievement(input:{title:string;description?:string;achievedAt?:string;evidenceFileId?:string}) {
  return request<AchievementItem>("/v1/achievements",{
    method:"POST",authenticated:true,body:JSON.stringify(input)
  });
}

export async function uploadPrivateFile(file:{uri:string;name:string;mimeType?:string|null}) {
  const token=await SecureStore.getItemAsync(TOKEN_KEY);
  const body=new FormData();
  body.append("file",{uri:file.uri,name:file.name,type:file.mimeType||"application/octet-stream"} as unknown as Blob);
  let response:Response;
  try{
    response=await fetch(`${API_URL}/v1/files`,{method:"POST",headers:token?{authorization:`Bearer ${token}`}:{},body});
  }catch{
    throw new Error("Motion Only could not upload the private file. Check your connection and try again.");
  }
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.message??"The private file could not be uploaded.");
  return payload as {id:string;original_name:string;content_type:string;byte_size:number;created_at:string};
}

export type NotificationItem = {
  id:string;type:string;payload:Record<string,unknown>;read_at:string | null;created_at:string;
};

export function listNotifications() {
  return request<{items:NotificationItem[]}>("/v1/notifications",{authenticated:true});
}

export function markNotificationRead(id:string) {
  return request(`/v1/notifications/${id}/read`,{method:"PATCH",authenticated:true});
}

export function createModerationReport(input:{
  targetType:"member"|"room_message"|"direct_message"|"project_update";
  targetId:string;reason:string;detail?:string;
}) {
  return request("/v1/moderation/reports",{
    method:"POST",authenticated:true,body:JSON.stringify(input)
  });
}

export type AdminMember = {
  id:string;email:string;status:"active"|"suspended";display_name:string;
  focuses:Array<"Business"|"Trading"|"Fitness">;role:"member"|"moderator"|"admin";
  lifetime_xp:number;current_level:number;created_at:string;
};
export type AdminInvitation = {
  id:string;email:string;role:"member"|"moderator"|"admin";expires_at:string;
  accepted_at:string | null;revoked_at:string | null;created_at:string;
};
export type AdminRoom = RoomItem & {archived_at:string | null;created_at:string};
export type ModerationReport = {
  id:string;reporter_name:string;target_type:string;target_id:string;reason:string;
  detail:string | null;status:"open"|"reviewing"|"resolved"|"dismissed";created_at:string;
};

export function listAdminMembers() {
  return request<{items:AdminMember[]}>("/v1/admin/members",{authenticated:true});
}

export function updateAdminMember(id:string,input:{status?:"active"|"suspended";role?:"member"|"moderator"|"admin"}) {
  return request<{success:true}>(`/v1/admin/members/${id}`,{method:"PATCH",authenticated:true,body:JSON.stringify(input)});
}

export function listAdminInvitations() {
  return request<{items:AdminInvitation[]}>("/v1/admin/invitations",{authenticated:true});
}

export function createAdminInvitation(input:{email:string;role?:"member"|"moderator"|"admin";expiresInDays?:number}) {
  return request<{id:string;inviteCode:string;joinLink:string;email:string;expiresInDays:number;emailSent:boolean}>("/v1/admin/invitations",{
    method:"POST",authenticated:true,body:JSON.stringify(input)
  });
}

export function revokeAdminInvitation(id:string) {
  return request(`/v1/admin/invitations/${id}`,{method:"DELETE",authenticated:true});
}

export function listAdminRooms() {
  return request<{items:AdminRoom[]}>("/v1/admin/rooms",{authenticated:true});
}

export function createAdminRoom(input:{title:string;slug:string;description?:string;focus?:"Business"|"Trading"|"Fitness"|null;isPrivate?:boolean}) {
  return request<AdminRoom>("/v1/admin/rooms",{method:"POST",authenticated:true,body:JSON.stringify(input)});
}

export function updateAdminRoom(id:string,input:{title?:string;description?:string|null;archived?:boolean}) {
  return request<AdminRoom>(`/v1/admin/rooms/${id}`,{method:"PATCH",authenticated:true,body:JSON.stringify(input)});
}

export function listModerationReports() {
  return request<{items:ModerationReport[]}>("/v1/admin/moderation",{authenticated:true});
}

export function updateModerationReport(id:string,input:{status:"open"|"reviewing"|"resolved"|"dismissed";resolutionNote?:string|null}) {
  return request<ModerationReport>(`/v1/admin/moderation/${id}`,{method:"PATCH",authenticated:true,body:JSON.stringify(input)});
}

export async function logout() {
  await request("/v1/auth/logout", { method: "POST", authenticated: true }).catch(() => undefined);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function clearLocalSession() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function hasLocalSession() {
  return Boolean(await SecureStore.getItemAsync(TOKEN_KEY));
}
