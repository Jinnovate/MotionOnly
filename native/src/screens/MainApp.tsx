import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Brand, Card, Eyebrow, GoldButton, OutlineButton, ProgressBar } from "../components/Primitives";
import { Focus } from "../data";
import { libraryCategories, libraryContent } from "../libraryContent";
import { getLevel, getMomentumStage, LEVELS, weeklyMomentumBonus } from "../progression";
import {
  AchievementItem, AdminInvitation, AdminMember, AdminRoom, ChatMessage, DirectThread, LibraryProgress, MemberDirectoryItem, ModerationReport, NotificationItem, ProjectItem, ProjectUpdate, RoomItem,
  blockMember, createAchievement, createAdminInvitation, createAdminRoom, createDirectThread, createGoal, createHabit, createModerationReport, createMotion, createProject, getMe, getProgression, getRealtimeUrl,
  inviteProjectMember, listDirectMessages, listDirectThreads, listGoals, listHabits, listLibraryProgress, listMembers,
  listAchievements, listAdminInvitations, listAdminMembers, listAdminRooms, listModerationReports, listMotions, listNotifications, listProjects, listProjectUpdates, listRoomMessages, listRooms, markNotificationRead, revokeAdminInvitation, sendDirectMessage,
  sendProjectUpdate, sendRoomMessage, setHabitCheckin, setMotionComplete, submitWeeklyReview,
  updateAdminMember, updateAdminRoom, updateGoalProgress, updateLibraryProgress, updateMe, updateModerationReport, uploadPrivateFile
} from "../api/client";
import { colors } from "../theme";

type Tab = "today" | "goals" | "momentum" | "library" | "network" | "messages" | "profile";
type Props = { userId:string;role:"member"|"moderator"|"admin";name: string; focuses: Focus[]; onLogout: () => void };
type GoalItem = { id:string;title:string;focus:Focus;progress:number;target:string;status:string };
type MotionItem = { id:string;title:string;focus:Focus;meta:string;complete:boolean };
type HabitItem = { id:string;title:string;focus:Focus;checked:boolean;checkinsLast30:number };
type ProgressionState = Awaited<ReturnType<typeof getProgression>>;
type LibrarySection = {
  heading:string;body?:string[];bullets?:string[];steps?:string[];
  callout?:{label:string;text:string};
  table?:{headers:string[];rows:string[][]};
};
type LibraryResource = {
  id:string;title:string;category:string;type:string;level:string;minutes:number;
  featured?:boolean;summary:string;outcome:string;sections:LibrarySection[];checklist:string[];
  template?:{title:string;intro:string;fields:string[][]};
  sources?:Array<{label:string;url:string}>;
  safety?:string;
};

const emptyProgression:ProgressionState = {
  profile:{lifetime_xp:0,current_level:1,momentum_streak:0,best_momentum_streak:0},
  week:{week_start:null,points:0,status:"building",bonus_xp:0},
  events:[],
  history:[],
  levels:LEVELS.map(item=>({level:item.level,name:item.name,xp_required:item.xp}))
};

const tabs: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "today", label: "Today", icon: "pulse-outline" },
  { id: "goals", label: "Goals", icon: "flag-outline" },
  { id: "momentum", label: "Momentum", icon: "flash-outline" },
  { id: "library", label: "Library", icon: "library-outline" },
  { id: "network", label: "Network", icon: "people-outline" },
  { id: "messages", label: "Messages", icon: "chatbubble-outline" },
  { id: "profile", label: "You", icon: "person-outline" }
];

export function MainApp({ userId, role, name, focuses, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [motions,setMotions] = useState<MotionItem[]>([]);
  const [goals,setGoals] = useState<GoalItem[]>([]);
  const [habits,setHabits] = useState<HabitItem[]>([]);
  const [progression,setProgression] = useState<ProgressionState>(emptyProgression);
  const [loading,setLoading] = useState(true);
  const [notifications,setNotifications]=useState<NotificationItem[]>([]);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const firstName = name.split(" ")[0] || name;
  const xp = progression.profile.lifetime_xp;
  const weeklyMomentum = progression.week.points;
  const momentumStreak = progression.profile.momentum_streak;
  const reviewComplete = progression.events.some(event=>event.event_type==="weekly_review"&&isCurrentWeek(event.occurred_at));

  const loadPrivateData = async () => {
    setLoading(true);
    try {
      const [motionResult,goalResult,habitResult,progressionResult] = await Promise.all([
        listMotions(),listGoals(),listHabits(),getProgression()
      ]);
      setMotions(motionResult.items.map(item=>({
        id:item.id,title:item.title,focus:item.focus,meta:"Today",complete:Boolean(item.completed_at)
      })));
      setGoals(goalResult.items.map(item=>({
        id:item.id,title:item.title,focus:item.focus,progress:item.progress,
        target:item.target_date ? new Date(`${item.target_date}T00:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short"}) : "No deadline",
        status:item.status
      })));
      setHabits(habitResult.items.map(item=>({
        id:item.id,title:item.title,focus:item.focus,checked:item.checked_today,checkinsLast30:item.checkins_last_30
      })));
      setProgression(progressionResult);
    } catch (error) {
      Alert.alert("Private data could not load",error instanceof Error ? error.message : "Pull to try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications=async()=>{try{setNotifications((await listNotifications()).items);}catch{}};
  useEffect(()=>{loadPrivateData();refreshNotifications();},[]);
  const readNotification=async(item:NotificationItem)=>{
    if(!item.read_at){setNotifications(current=>current.map(notification=>notification.id===item.id?{...notification,read_at:new Date().toISOString()}:notification));await markNotificationRead(item.id).catch(()=>undefined);}
  };

  const applyAward = (award?:{lifetime_xp:number;weekly_points:number} | null) => {
    if (!award) return;
    setProgression(current=>({
      ...current,
      profile:{...current.profile,lifetime_xp:award.lifetime_xp},
      week:{...current.week,points:award.weekly_points}
    }));
  };

  const toggleMotion = async (id:string) => {
    const target = motions.find(item => item.id === id);
    if (!target) return;
    const next = !target.complete;
    setMotions(current=>current.map(item=>item.id===id?{...item,complete:next}:item));
    try {
      const result = await setMotionComplete(id,next);
      applyAward(result.progression);
    } catch (error) {
      setMotions(current=>current.map(item=>item.id===id?{...item,complete:target.complete}:item));
      Alert.alert("Move could not be updated",error instanceof Error ? error.message : "Try again.");
    }
  };
  const nudgeGoal = async (id:string) => {
    const target=goals.find(item=>item.id===id);
    if(!target)return;
    const progress=Math.min(100,target.progress+5);
    try{
      const result=await updateGoalProgress(id,progress);
      setGoals(current=>current.map(item=>item.id===id?{...item,progress}:item));
      applyAward(result.progression);
    }catch(error){
      Alert.alert("Progress could not be saved",error instanceof Error?error.message:"Try again.");
    }
  };
  const addGoal = async (title:string,focus:Focus) => {
    const result=await createGoal({title,focus});
    setGoals(current=>[{id:result.id,title:result.title,focus:result.focus,progress:result.progress,target:"No deadline",status:result.status},...current]);
  };
  const addMotion = async (title:string,focus:Focus) => {
    const result=await createMotion({title,focus});
    setMotions(current=>[...current,{id:result.id,title:result.title,focus:result.focus,meta:"Today",complete:false}]);
  };
  const addHabit = async (title:string,focus:Focus) => {
    const result=await createHabit({title,focus});
    setHabits(current=>[...current,{id:result.id,title:result.title,focus:result.focus,checked:false,checkinsLast30:0}]);
  };
  const toggleHabit = async (id:string) => {
    const target=habits.find(item=>item.id===id);
    if(!target)return;
    const next=!target.checked;
    setHabits(current=>current.map(item=>item.id===id?{...item,checked:next}:item));
    try{
      const result=await setHabitCheckin(id,next);
      applyAward(result.progression);
    }catch(error){
      setHabits(current=>current.map(item=>item.id===id?{...item,checked:target.checked}:item));
      Alert.alert("Standard could not be updated",error instanceof Error?error.message:"Try again.");
    }
  };
  const completeReview = async (reflection:string,nextWeekFocus:string) => {
    const result=await submitWeeklyReview({reflection,wins:[],nextWeekFocus});
    applyAward(result.progression);
    await loadPrivateData();
  };
  const completed = motions.filter(item => item.complete).length;
  const motionScore=motions.length?completed/motions.length*40:0;
  const goalScore=goals.length?goals.reduce((sum,goal)=>sum+goal.progress,0)/goals.length*.6:0;
  const momentum = Math.round(motionScore+goalScore);

  if(loading){
    return <View style={styles.loadingState}><ActivityIndicator color={colors.gold}/><Text style={styles.loadingText}>OPENING YOUR PRIVATE SPACE</Text></View>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Brand compact />
        <View style={styles.headerCenter}><Text style={styles.headerBrand}>MOTION <Text style={{ color: colors.gold }}>ONLY</Text></Text><Text style={styles.headerSub}>MEMBERS ONLY</Text></View>
        <Pressable style={styles.headerButton} onPress={() => {setNotificationsOpen(true);refreshNotifications();}}>
          <Ionicons name="notifications-outline" size={21} color={colors.textSoft}/>{notifications.some(item=>!item.read_at)&&<View style={styles.dot}/>}
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {tab === "today" && <TodayScreen firstName={firstName} motions={motions} goals={goals} momentum={momentum} weeklyMomentum={weeklyMomentum} xp={xp} momentumStreak={momentumStreak} toggleMotion={toggleMotion} addMotion={addMotion} openMomentum={() => setTab("momentum")} />}
        {tab === "goals" && <GoalsScreen goals={goals} habits={habits} nudgeGoal={nudgeGoal} addGoal={addGoal} addHabit={addHabit} toggleHabit={toggleHabit} />}
        {tab === "momentum" && <MomentumScreen xp={xp} points={weeklyMomentum} streak={momentumStreak} reviewComplete={reviewComplete} completeReview={completeReview} events={progression.events} history={progression.history} />}
        {tab === "library" && <LibraryScreen />}
        {tab === "network" && <NetworkScreen />}
        {tab === "messages" && <MessagesScreen userId={userId} />}
        {tab === "profile" && <ProfileScreen role={role} name={name} focuses={focuses} xp={xp} onLogout={onLogout} />}
      </View>

      <Modal visible={notificationsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setNotificationsOpen(false)}>
        <View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setNotificationsOpen(false)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>NOTIFICATIONS</Text><Text style={styles.modalMeta}>YOUR PRIVATE ACTIVITY</Text></View><Ionicons name="notifications-outline" color={colors.gold} size={21}/></View>
        <ScrollView contentContainerStyle={styles.chatContent}>{!notifications.length&&<EmptyLine icon="notifications-off-outline" text="Nothing needs your attention."/>}{notifications.map(item=><Pressable key={item.id} onPress={()=>readNotification(item)} style={[styles.notificationRow,!item.read_at&&styles.notificationUnread]}><View style={styles.standardIcon}><Ionicons name={item.type==="direct_message"?"chatbubble-outline":item.type==="project_invitation"?"folder-outline":"notifications-outline"} color={colors.gold} size={18}/></View><View style={{flex:1}}><Text style={styles.notificationTitle}>{notificationLabel(item.type)}</Text><Text style={styles.notificationTime}>{relativeTime(item.created_at)}</Text></View>{!item.read_at&&<View style={styles.notificationDot}/>}</Pressable>)}</ScrollView></View>
      </Modal>

      <View style={styles.tabBar}>
        {tabs.map(item => {
          const active = tab === item.id;
          return <Pressable key={item.id} onPress={() => setTab(item.id)} style={styles.tab}>
            <View style={active && styles.tabIconActive}><Ionicons name={item.icon} size={20} color={active ? colors.gold : colors.muted}/>{item.id === "messages" && <View style={styles.messageDot}/>}</View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  );
}

function TodayScreen({ firstName, motions, goals, momentum, weeklyMomentum, xp, momentumStreak, toggleMotion, addMotion, openMomentum }: {
  firstName:string;motions:MotionItem[];goals:GoalItem[];momentum:number;weeklyMomentum:number;xp:number;
  momentumStreak:number;toggleMotion:(id:string)=>void;addMotion:(title:string,focus:Focus)=>Promise<void>;openMomentum:()=>void;
}) {
  const level = getLevel(xp);
  const stage = getMomentumStage(weeklyMomentum);
  const [adding,setAdding]=useState(false);
  const [title,setTitle]=useState("");
  const [focus,setFocus]=useState<Focus>("Business");
  const save=async()=>{
    if(!title.trim())return;
    try{await addMotion(title.trim(),focus);setTitle("");setAdding(false);}
    catch(error){Alert.alert("Move could not be created",error instanceof Error?error.message:"Try again.");}
  };
  return <ScrollView contentContainerStyle={styles.screen}>
    <View style={styles.hero}>
      <Eyebrow>FRIDAY · DAY 47 IN MOTION</Eyebrow>
      <Text style={styles.heroTitle}>MOVE WITH{`\n`}INTENT, {firstName.toUpperCase()}.</Text>
      <Text style={styles.heroText}>Build the day before the day builds you.</Text>
    </View>
    <View style={styles.metricRow}>
      <Card style={styles.metricCard}><Text style={styles.metricValue}>{momentum}</Text><Text style={styles.metricLabel}>MOMENTUM INDEX</Text><Text style={styles.metricDelta}>↑ 8 this week</Text></Card>
      <Card style={styles.metricCard}><Text style={styles.metricValue}>{level.level}</Text><Text style={styles.metricLabel}>{level.name.toUpperCase()}</Text><Text style={styles.metricDelta}>{level.xpToNext} XP to next level</Text></Card>
    </View>
    <Pressable onPress={openMomentum}>
      <Card style={styles.weeklyMomentumCard}>
        <View style={styles.weeklyMomentumTop}><View><Eyebrow>WEEKLY MOMENTUM</Eyebrow><Text style={styles.weeklyMomentumStage}>{stage.name.toUpperCase()}</Text></View><Text style={styles.weeklyMomentumPoints}>{weeklyMomentum}<Text style={styles.weeklyMomentumTotal}>/100</Text></Text></View>
        <View style={styles.momentumTrack}><View style={[styles.momentumFill,{width:`${weeklyMomentum}%`}]} /></View>
        <View style={styles.weeklyMomentumBottom}><Text style={styles.weeklyMomentumHint}>{100-weeklyMomentum} POINTS TO SECURE +{weeklyMomentumBonus(momentumStreak)} MOMENTUM XP</Text><Text style={styles.weeklyMomentumTime}>2D 06H LEFT →</Text></View>
      </Card>
    </Pressable>
    <View style={styles.sectionHead}><View><Eyebrow>TODAY’S MOTION</Eyebrow><Text style={styles.sectionTitle}>MOVES THAT MATTER</Text></View><Pressable onPress={()=>setAdding(!adding)}><Text style={styles.sectionCount}>{adding?"CLOSE":"+ ADD"}</Text></Pressable></View>
    {adding&&<Card style={styles.addCard}>
      <Text style={styles.label}>NEW PRIVATE MOVE</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="What must move today?" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/>
      <FocusPicker value={focus} onChange={setFocus}/>
      <GoldButton label="Add to today" onPress={save} disabled={!title.trim()}/>
    </Card>}
    <Card style={styles.motionCard}>
      {!motions.length&&<EmptyLine icon="pulse-outline" text="Set one to three moves that would make today count."/>}
      {motions.map((motion, index) => <Pressable key={motion.id} onPress={() => toggleMotion(motion.id)} style={[styles.motion, index > 0 && styles.motionBorder]}>
        <View style={[styles.check, motion.complete && styles.checkDone]}>{motion.complete && <Ionicons name="checkmark" size={14} color={colors.black}/>}</View>
        <View style={{ flex: 1 }}><Text style={[styles.motionTitle, motion.complete && styles.motionTitleDone]}>{motion.title}</Text><Text style={styles.motionMeta}>{motion.focus.toUpperCase()} · {motion.meta}</Text></View>
        <Ionicons name="chevron-forward" color={colors.mutedDark} size={17}/>
      </Pressable>)}
    </Card>
    <View style={styles.sectionHead}><View><Eyebrow>FORWARD PATH</Eyebrow><Text style={styles.sectionTitle}>GOALS IN MOTION</Text></View><Pressable><Text style={styles.textLink}>VIEW ALL →</Text></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRail}>
      {!goals.length&&<Card style={styles.goalMini}><Text style={styles.focusTag}>PRIVATE BY DEFAULT</Text><Text style={styles.goalMiniTitle}>Create your first outcome in Goals.</Text><Text style={styles.motionMeta}>Direction first. Then the daily work.</Text></Card>}
      {goals.map((goal, index) => <Card key={goal.id} style={styles.goalMini}>
        <Text style={styles.goalNumber}>0{index + 1}</Text><Text style={styles.focusTag}>{goal.focus.toUpperCase()}</Text><Text style={styles.goalMiniTitle}>{goal.title}</Text><ProgressBar value={goal.progress}/><View style={styles.goalMeta}><Text style={styles.goalPercent}>{goal.progress}%</Text><Text style={styles.goalTarget}>{goal.target}</Text></View>
      </Card>)}
    </ScrollView>
    <Card style={styles.networkPrompt}><View style={styles.promptTop}><View style={styles.liveDot}/><Text style={styles.promptLive}>18 ACTIVE IN THE TRADING FLOOR</Text></View><Text style={styles.promptTitle}>Which rule protected your capital this week?</Text><Text style={styles.promptMeta}>23 replies · Members only</Text><OutlineButton label="Enter the room" icon="arrow-forward" onPress={() => Alert.alert("The Trading Floor", "Room opened. Live WebSocket messages connect in the backend milestone.")}/></Card>
  </ScrollView>;
}

function GoalsScreen({ goals, habits, nudgeGoal, addGoal, addHabit, toggleHabit }:{
  goals:GoalItem[];habits:HabitItem[];nudgeGoal:(id:string)=>void;
  addGoal:(title:string,focus:Focus)=>Promise<void>;addHabit:(title:string,focus:Focus)=>Promise<void>;
  toggleHabit:(id:string)=>void;
}) {
  const [filter,setFilter]=useState<"All"|Focus>("All");
  const [adding,setAdding]=useState<"goal"|"habit"|null>(null);
  const [title,setTitle]=useState("");
  const [focus,setFocus]=useState<Focus>("Business");
  const visible=filter==="All"?goals:goals.filter(goal=>goal.focus===filter);
  const save=async()=>{
    if(!title.trim()||!adding)return;
    try{
      if(adding==="goal")await addGoal(title.trim(),focus);
      else await addHabit(title.trim(),focus);
      setTitle("");setAdding(null);
    }catch(error){
      Alert.alert("Could not create item",error instanceof Error?error.message:"Try again.");
    }
  };
  return <ScrollView contentContainerStyle={styles.screen}>
    <ScreenIntro eyebrow="MOMENTUM SYSTEM" title="GOALS & STANDARDS" text="Direction without a system is only intention." />
    <View style={styles.filterRow}>{(["All","Business","Trading","Fitness"] as const).map(item=><Pressable key={item} onPress={()=>setFilter(item)} style={[styles.filterChip,filter===item&&styles.filterChipActive]}><Text style={[styles.filterText,filter===item&&styles.filterTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>
    {!visible.length&&<EmptyLine icon="flag-outline" text="No private goals in this view yet."/>}
    {visible.map(goal=><Card key={goal.id} style={styles.fullGoal}>
      <View style={styles.fullGoalTop}><View style={styles.categoryIcon}><Ionicons name={goal.focus==="Business"?"briefcase-outline":goal.focus==="Trading"?"trending-up":"barbell-outline"} color={colors.gold} size={20}/></View><View style={{flex:1}}><Text style={styles.focusTag}>{goal.focus.toUpperCase()}</Text><Text style={styles.fullGoalTitle}>{goal.title}</Text></View><Text style={styles.fullGoalPercent}>{goal.progress}%</Text></View>
      <ProgressBar value={goal.progress}/><View style={styles.fullGoalBottom}><Text style={styles.goalTarget}>TARGET · {goal.target.toUpperCase()}</Text><Pressable onPress={()=>nudgeGoal(goal.id)}><Text style={styles.logProgress}>+5% PROGRESS</Text></Pressable></View>
    </Card>)}
    {adding==="goal"?<Card style={styles.addCard}>
      <Text style={styles.label}>NEW PRIVATE GOAL</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="What are you moving towards?" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/>
      <FocusPicker value={focus} onChange={setFocus}/>
      <GoldButton label="Save private goal" onPress={save} disabled={!title.trim()}/>
      <OutlineButton label="Cancel" onPress={()=>setAdding(null)}/>
    </Card>:<OutlineButton label="Create a private goal" icon="add" onPress={()=>{setTitle("");setAdding("goal");}}/>}
    <View style={styles.sectionHead}><View><Eyebrow>DAILY STANDARDS</Eyebrow><Text style={styles.sectionTitle}>CONSISTENCY ENGINE</Text></View><Pressable onPress={()=>{setTitle("");setAdding(adding==="habit"?null:"habit");}}><Text style={styles.sectionCount}>{adding==="habit"?"CLOSE":"+ ADD"}</Text></Pressable></View>
    {adding==="habit"&&<Card style={styles.addCard}>
      <Text style={styles.label}>NEW PRIVATE STANDARD</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="What will you keep consistently?" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/>
      <FocusPicker value={focus} onChange={setFocus}/>
      <GoldButton label="Save daily standard" onPress={save} disabled={!title.trim()}/>
    </Card>}
    {!habits.length&&<EmptyLine icon="repeat-outline" text="Create a daily standard that supports the person you are becoming."/>}
    {habits.map(item=><Pressable key={item.id} onPress={()=>toggleHabit(item.id)} style={styles.standardRow}><View style={styles.standardIcon}><Ionicons name={item.focus==="Business"?"briefcase-outline":item.focus==="Trading"?"trending-up":"barbell-outline"} color={colors.gold} size={17}/></View><View style={{flex:1}}><Text style={styles.standardTitle}>{item.title}</Text><Text style={styles.motionMeta}>{item.focus.toUpperCase()} · {item.checkinsLast30} CHECK-INS THIS MONTH</Text></View><Ionicons name={item.checked?"checkmark-circle":"ellipse-outline"} color={item.checked?colors.green:colors.mutedDark} size={20}/></Pressable>)}
  </ScrollView>;
}

function MomentumScreen({ xp, points, streak, reviewComplete, completeReview, events, history }:{
  xp:number;points:number;streak:number;reviewComplete:boolean;
  completeReview:(reflection:string,nextWeekFocus:string)=>Promise<void>;
  events:ProgressionState["events"];history:ProgressionState["history"];
}) {
  const level = getLevel(xp);
  const stage = getMomentumStage(points);
  const bonus = weeklyMomentumBonus(streak);
  const [reviewOpen,setReviewOpen]=useState(false);
  const [reflection,setReflection]=useState("");
  const [nextFocus,setNextFocus]=useState("");
  const [reviewBusy,setReviewBusy]=useState(false);
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),60000);return()=>clearInterval(timer);},[]);
  const deadline=weekCloseCountdown(clock);
  const activity=events.slice(0,8).map(event=>({
    title:event.event_type.replaceAll("_"," "),
    source:event.event_type,
    points:event.momentum_points,
    xp:event.xp_points,
    icon:(event.event_type.includes("goal")?"flag-outline":event.event_type.includes("habit")?"repeat-outline":event.event_type.includes("review")?"document-text-outline":"pulse-outline") as keyof typeof Ionicons.glyphMap
  }));
  const saveReview=async()=>{
    if(reflection.trim().length<20||nextFocus.trim().length<2)return;
    setReviewBusy(true);
    try{await completeReview(reflection.trim(),nextFocus.trim());setReviewOpen(false);}
    catch(error){Alert.alert("Review could not be saved",error instanceof Error?error.message:"Try again.");}
    finally{setReviewBusy(false);}
  };
  return <ScrollView contentContainerStyle={styles.screen}>
    <ScreenIntro eyebrow="PERMANENT PROGRESSION" title={`LEVEL ${level.level} · ${level.name.toUpperCase()}`} text="XP marks the work you have banked. It never resets." />
    <Card style={styles.levelCard}>
      <View style={styles.levelTop}><View><Text style={styles.levelXp}>{xp.toLocaleString()} XP</Text><Text style={styles.levelCaption}>{level.next ? `${level.xpToNext} XP TO ${level.next.name.toUpperCase()}` : "MAXIMUM LEVEL REACHED"}</Text></View><View style={styles.levelBadge}><Text style={styles.levelBadgeNumber}>{level.level}</Text></View></View>
      <ProgressBar value={level.progress}/><Text style={styles.levelProgressText}>{level.progress}% THROUGH THIS LEVEL</Text>
    </Card>

    <Card style={styles.momentumHero}>
      <View style={styles.momentumHeroHead}><View><Eyebrow>THIS WEEK</Eyebrow><Text style={styles.momentumHeroTitle}>BUILD THE BAR.</Text></View><Text style={styles.momentumHeroPoints}>{points}<Text style={styles.momentumHeroTotal}>/100</Text></Text></View>
      <View style={styles.momentumLargeTrack}><View style={[styles.momentumLargeFill,{width:`${points}%`}]} /></View>
      <View style={styles.stageRail}>{["IGNITION","BUILDING","MOVING","DRIVING","FULL MOTION"].map((name,index)=><View key={name} style={styles.stageItem}><View style={[styles.stageDot,index<=stage.index&&styles.stageDotActive]}/><Text style={[styles.stageName,index===stage.index&&styles.stageNameActive]}>{name}</Text></View>)}</View>
      <View style={styles.deadlineRow}><View><Text style={styles.deadlineLabel}>WEEK CLOSES IN</Text><Text style={styles.deadlineValue}>{deadline}</Text></View><View style={styles.bonusBlock}><Text style={styles.deadlineLabel}>FULL-MOTION REWARD</Text><Text style={styles.bonusValue}>+{bonus} XP</Text></View></View>
      <Text style={styles.resetNote}><Ionicons name="refresh-outline" size={12}/> The bar resets Sunday at midnight. Fill it to bank Momentum XP and extend your streak.</Text>
    </Card>

    <View style={styles.momentumStats}>
      <Card style={styles.momentumStat}><Text style={styles.momentumStatValue}>{streak}</Text><Text style={styles.momentumStatLabel}>FULL WEEKS IN A ROW</Text></Card>
      <Card style={styles.momentumStat}><Text style={styles.momentumStatValue}>{events.filter(event=>event.momentum_points>0).length}</Text><Text style={styles.momentumStatLabel}>REWARDED ACTIONS</Text></Card>
      <Card style={styles.momentumStat}><Text style={styles.momentumStatValue}>{Math.max(0,100-points)}</Text><Text style={styles.momentumStatLabel}>POINTS TO FULL MOTION</Text></Card>
    </View>

    <View style={styles.sectionHead}><View><Eyebrow>POINT SOURCES</Eyebrow><Text style={styles.sectionTitle}>WHAT MOVED THE BAR</Text></View></View>
    <Card style={styles.ledgerCard}>
      {!activity.length&&<EmptyLine icon="flash-outline" text="Complete a move, standard or progress update to start the ledger."/>}
      {activity.map((item,index)=><View key={`${item.source}-${index}`} style={[styles.ledgerRow,index>0&&styles.ledgerBorder]}><View style={styles.ledgerIcon}><Ionicons name={item.icon} color={colors.gold} size={17}/></View><View style={{flex:1}}><Text style={styles.ledgerTitle}>{item.title}</Text><Text style={styles.ledgerSource}>{item.source.toUpperCase()}</Text></View><View><Text style={styles.ledgerPoints}>+{item.points} MOM</Text><Text style={styles.ledgerXp}>+{item.xp} XP</Text></View></View>)}
    </Card>

    {!reviewComplete ? <GoldButton label="Complete weekly review · +10 momentum" icon="document-text-outline" onPress={()=>setReviewOpen(true)}/> : <View style={styles.reviewDone}><Ionicons name="checkmark-circle" color={colors.green} size={19}/><Text style={styles.reviewDoneText}>WEEKLY REVIEW COMPLETE · REWARD BANKED</Text></View>}

    <View style={styles.sectionHead}><View><Eyebrow>LEVEL LADDER</Eyebrow><Text style={styles.sectionTitle}>THE FORWARD PATH</Text></View></View>
    <Card style={styles.ladder}>{LEVELS.map(item=><View key={item.level} style={styles.ladderRow}><View style={[styles.ladderNumber,item.level<=level.level&&styles.ladderNumberActive]}><Text style={[styles.ladderNumberText,item.level<=level.level&&styles.ladderNumberTextActive]}>{item.level}</Text></View><View style={{flex:1}}><Text style={[styles.ladderName,item.level===level.level&&styles.ladderCurrent]}>{item.name.toUpperCase()}</Text><Text style={styles.ladderXp}>{item.xp.toLocaleString()} XP</Text></View>{item.level<level.level?<Ionicons name="checkmark" color={colors.green} size={17}/>:item.level===level.level?<Text style={styles.youAreHere}>YOU ARE HERE</Text>:<Ionicons name="lock-closed-outline" color={colors.mutedDark} size={15}/>}</View>)}</Card>

    <View style={styles.sectionHead}><View><Eyebrow>RECENT WEEKS</Eyebrow><Text style={styles.sectionTitle}>MOMENTUM HISTORY</Text></View></View>
    {!history.length&&<EmptyLine icon="calendar-outline" text="Your completed and missed Momentum weeks will appear here."/>}
    {history.map(item=><View key={item.week_start} style={styles.historyRow}><Text style={styles.historyWeek}>{new Date(`${item.week_start}T00:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short"})}</Text><View style={{flex:1}}><ProgressBar value={item.points}/><Text style={styles.historyResult}>{item.status.toUpperCase()}</Text></View><Text style={[styles.historyReward,!item.bonus_xp&&styles.noBonus]}>{item.bonus_xp?`+${item.bonus_xp} XP`:"NO BONUS"}</Text></View>)}

    <Card style={styles.rulesCard}><Eyebrow>HOW IT STAYS FAIR</Eyebrow><Text style={styles.rulesTitle}>MOMENTUM REWARDS CONSISTENCY, NOT TAPPING.</Text><Text style={styles.rulesText}>Every action has a daily cap. Reversing and repeating an action cannot earn points twice. Project and community rewards require meaningful contribution. The server closes each week in your account timezone and awards Momentum XP once.</Text></Card>
    <Modal visible={reviewOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setReviewOpen(false)}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHead}><Pressable onPress={()=>setReviewOpen(false)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>WEEKLY REVIEW</Text><Text style={styles.modalMeta}>PRIVATE TO YOU</Text></View><Ionicons name="lock-closed-outline" color={colors.gold} size={21}/></View>
        <ScrollView contentContainerStyle={styles.reviewForm}>
          <Eyebrow>LOOK AT THE EVIDENCE</Eyebrow>
          <Text style={styles.reviewPrompt}>What worked, what broke, and what did the week teach you?</Text>
          <TextInput value={reflection} onChangeText={setReflection} multiline placeholder="Write at least a few honest sentences…" placeholderTextColor={colors.mutedDark} style={styles.reviewInput}/>
          <Text style={styles.reviewPrompt}>What is the most important focus next week?</Text>
          <TextInput value={nextFocus} onChangeText={setNextFocus} multiline placeholder="One clear direction…" placeholderTextColor={colors.mutedDark} style={styles.reviewInputSmall}/>
          <GoldButton label={reviewBusy?"Saving privately":"Complete review"} disabled={reviewBusy||reflection.trim().length<20||nextFocus.trim().length<2} onPress={saveReview} icon="checkmark"/>
        </ScrollView>
      </View>
    </Modal>
  </ScrollView>;
}

function LibraryScreen() {
  const resources=libraryContent as LibraryResource[];
  const [category,setCategory]=useState("All");
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<LibraryResource | null>(null);
  const [progress,setProgress]=useState<Record<string,LibraryProgress>>({});
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    listLibraryProgress()
      .then(result=>setProgress(Object.fromEntries(result.items.map(item=>[item.resource_id,item]))))
      .catch(error=>Alert.alert("Library progress could not load",error instanceof Error?error.message:"Try again."));
  },[]);

  const filtered=useMemo(()=>resources.filter(item=>{
    const matchesCategory=category==="All"||item.category===category;
    const haystack=`${item.title} ${item.summary} ${item.outcome}`.toLowerCase();
    return matchesCategory&&haystack.includes(query.trim().toLowerCase());
  }),[category,query]);

  const openResource=async (resource:LibraryResource)=>{
    setSelected(resource);
    if(!progress[resource.id]){
      try{
        const updated=await updateLibraryProgress(resource.id,{});
        setProgress(current=>({...current,[resource.id]:updated}));
      }catch{}
    }
  };
  const saveResource=async (resource:LibraryResource)=>{
    setBusy(true);
    try{
      const updated=await updateLibraryProgress(resource.id,{saved:!progress[resource.id]?.saved});
      setProgress(current=>({...current,[resource.id]:updated}));
    }catch(error){
      Alert.alert("Library item could not be updated",error instanceof Error?error.message:"Try again.");
    }finally{setBusy(false);}
  };
  const toggleChecklist=async (resource:LibraryResource,index:number)=>{
    const current=progress[resource.id]?.checklist??[];
    const checklist=current.includes(index)?current.filter(item=>item!==index):[...current,index];
    setBusy(true);
    try{
      const updated=await updateLibraryProgress(resource.id,{checklist,completed:checklist.length===resource.checklist.length});
      setProgress(state=>({...state,[resource.id]:updated}));
    }catch(error){
      Alert.alert("Checklist could not be updated",error instanceof Error?error.message:"Try again.");
    }finally{setBusy(false);}
  };

  return <View style={{flex:1}}>
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenIntro eyebrow="THE FIELD LIBRARY" title="KNOWLEDGE FOR THE NEXT MOVE" text="Complete playbooks for business, trading, fitness and personal execution. Reading activity is private."/>
      <View style={styles.searchBox}><Ionicons name="search" color={colors.muted} size={18}/><TextInput value={query} onChangeText={setQuery} placeholder="Search guides and systems" placeholderTextColor={colors.mutedDark} style={styles.librarySearchInput}/></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.libraryFilters}>
        {libraryCategories.map(item=><Pressable key={item} onPress={()=>setCategory(item)} style={[styles.filterChip,category===item&&styles.filterChipActive]}><Text style={[styles.filterText,category===item&&styles.filterTextActive]}>{item.toUpperCase()} · {item==="All"?resources.length:resources.filter(resource=>resource.category===item).length}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.libraryResultHead}><Text style={styles.sectionTitle}>{filtered.length} RESOURCES</Text><Text style={styles.privateTag}>PRIVATE PROGRESS</Text></View>
      {filtered.map(resource=>{
        const state=progress[resource.id];
        const completion=resource.checklist.length?Math.round(((state?.checklist.length??0)/resource.checklist.length)*100):0;
        return <Pressable key={resource.id} onPress={()=>openResource(resource)}>
          <Card style={styles.libraryCard}>
            <View style={styles.libraryCardTop}><View style={styles.categoryIcon}><Ionicons name={resource.category==="Trading"?"trending-up":resource.category==="Business"?"briefcase-outline":resource.category==="Fitness"?"barbell-outline":"compass-outline"} color={colors.gold} size={19}/></View><View style={{flex:1}}><Text style={styles.focusTag}>{resource.category.toUpperCase()} · {resource.type.toUpperCase()}</Text><Text style={styles.libraryTitle}>{resource.title}</Text></View>{state?.saved&&<Ionicons name="bookmark" color={colors.gold} size={18}/>}</View>
            <Text style={styles.librarySummary}>{resource.summary}</Text>
            <View style={styles.libraryMeta}><Text>{resource.minutes} MIN</Text><Text>{resource.level.toUpperCase()}</Text><Text>{completion?`${completion}% COMPLETE`:"NOT STARTED"}</Text></View>
          </Card>
        </Pressable>;
      })}
      {!filtered.length&&<EmptyLine icon="search-outline" text="No resources match that search."/>}
    </ScrollView>
    <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSelected(null)}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHead}><Pressable onPress={()=>setSelected(null)}><Ionicons name="chevron-back" color={colors.text} size={25}/></Pressable><View style={{flex:1,paddingHorizontal:10}}><Text numberOfLines={1} style={styles.modalTitle}>{selected?.title}</Text><Text style={styles.modalMeta}>{selected?.category.toUpperCase()} · PRIVATE READING</Text></View><Pressable disabled={!selected||busy} onPress={()=>selected&&saveResource(selected)}><Ionicons name={selected&&progress[selected.id]?.saved?"bookmark":"bookmark-outline"} color={colors.gold} size={22}/></Pressable></View>
        {selected&&<ScrollView contentContainerStyle={styles.readerContent}>
          <Text style={styles.readerType}>{selected.type.toUpperCase()} · {selected.minutes} MIN · {selected.level.toUpperCase()}</Text>
          <Text style={styles.readerTitle}>{selected.title}</Text>
          <Text style={styles.readerSummary}>{selected.summary}</Text>
          <Card style={styles.outcomeCard}><Eyebrow>OUTCOME</Eyebrow><Text style={styles.outcomeText}>{selected.outcome}</Text></Card>
          {selected.safety&&<View style={styles.safetyCallout}><Ionicons name="shield-checkmark-outline" color={colors.gold} size={18}/><Text style={styles.safetyText}>{selected.safety}</Text></View>}
          {selected.sections.map((section,sectionIndex)=><View key={`${section.heading}-${sectionIndex}`} style={styles.readerSection}>
            <Text style={styles.readerHeading}>{section.heading}</Text>
            {section.body?.map((paragraph,index)=><Text key={index} style={styles.readerBody}>{paragraph}</Text>)}
            {section.bullets?.map((bullet,index)=><View key={index} style={styles.readerBullet}><Text style={styles.readerBulletMark}>•</Text><Text style={styles.readerBody}>{bullet}</Text></View>)}
            {section.steps?.map((step,index)=><View key={index} style={styles.readerBullet}><Text style={styles.readerStep}>{index+1}</Text><Text style={styles.readerBody}>{step}</Text></View>)}
            {section.table&&<ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.readerTable}><View style={styles.readerTableRow}>{section.table.headers.map((header,index)=><Text key={index} style={[styles.readerCell,styles.readerHeaderCell]}>{header}</Text>)}</View>{section.table.rows.map((row,rowIndex)=><View key={rowIndex} style={styles.readerTableRow}>{row.map((cell,index)=><Text key={index} style={styles.readerCell}>{cell}</Text>)}</View>)}</View></ScrollView>}
            {section.callout&&<View style={styles.readerCallout}><Text style={styles.readerCalloutLabel}>{section.callout.label.toUpperCase()}</Text><Text style={styles.readerBody}>{section.callout.text}</Text></View>}
          </View>)}
          <View style={styles.readerSection}><Text style={styles.readerHeading}>Action checklist</Text><Text style={styles.readerBody}>Your checklist is stored privately and is never shown to other members.</Text>{selected.checklist.map((item,index)=>{
            const checked=progress[selected.id]?.checklist.includes(index)??false;
            return <Pressable disabled={busy} key={index} onPress={()=>toggleChecklist(selected,index)} style={styles.checklistRow}><View style={[styles.check,checked&&styles.checkDone]}>{checked&&<Ionicons name="checkmark" color={colors.black} size={15}/>}</View><Text style={[styles.checklistText,checked&&styles.checklistTextDone]}>{item}</Text></Pressable>;
          })}</View>
          {selected.template&&<Card style={styles.templateCard}><Eyebrow>WORKING TEMPLATE</Eyebrow><Text style={styles.readerHeading}>{selected.template.title}</Text><Text style={styles.readerBody}>{selected.template.intro}</Text>{selected.template.fields.map((field,index)=><View key={index} style={styles.templateField}><Text style={styles.templateLabel}>{field[0]}</Text><Text style={styles.readerBody}>{field[1]}</Text></View>)}</Card>}
          {!!selected.sources?.length&&<View style={styles.readerSection}><Text style={styles.readerHeading}>Sources and further reading</Text>{selected.sources.map((source,index)=><Pressable key={index} onPress={()=>Linking.openURL(source.url)} style={styles.sourceLink}><Ionicons name="open-outline" color={colors.gold} size={15}/><Text style={styles.sourceText}>{source.label}</Text></Pressable>)}</View>}
        </ScrollView>}
      </View>
    </Modal>
  </View>;
}

function NetworkScreen() {
  const [mode, setMode] = useState<"rooms" | "projects">("rooms");
  const [roomItems,setRoomItems]=useState<RoomItem[]>([]);
  const [projectItems,setProjectItems]=useState<ProjectItem[]>([]);
  const [members,setMembers]=useState<MemberDirectoryItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [selectedProject,setSelectedProject]=useState<ProjectItem | null>(null);
  const [roomPosts,setRoomPosts]=useState<ChatMessage[]>([]);
  const [projectPosts,setProjectPosts]=useState<ProjectUpdate[]>([]);
  const [message, setMessage] = useState("");
  const [newProject,setNewProject]=useState(false);
  const [projectTitle,setProjectTitle]=useState("");
  const [projectDescription,setProjectDescription]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{Promise.all([listRooms(),listProjects(),listMembers()]).then(([r,p,m])=>{setRoomItems(r.items);setProjectItems(p.items);setMembers(m.items);}).catch(error=>Alert.alert("Network could not load",error instanceof Error?error.message:"Try again."));},[]);
  useEffect(()=>{
    if(!selectedRoom)return;
    let active=true;
    let socket:WebSocket|undefined;
    getRealtimeUrl().then(url=>{
      if(!active)return;
      socket=new WebSocket(url);
      socket.onopen=()=>socket?.send(JSON.stringify({type:"subscribe",roomId:selectedRoom.id}));
      socket.onmessage=event=>{
        try{
          const payload=JSON.parse(String(event.data)) as ChatMessage&{type?:string};
          if(payload.type==="room.message"&&payload.room_id===selectedRoom.id){
            setRoomPosts(current=>current.some(item=>item.id===payload.id)?current:[...current,payload]);
          }
        }catch{}
      };
    }).catch(()=>undefined);
    return()=>{active=false;socket?.close();};
  },[selectedRoom?.id]);
  const openRoom=async(room:RoomItem)=>{setSelectedRoom(room);try{setRoomPosts((await listRoomMessages(room.id)).items);}catch(error){Alert.alert("Room could not open",error instanceof Error?error.message:"Try again.");}};
  const openProject=async(project:ProjectItem)=>{setSelectedProject(project);try{setProjectPosts((await listProjectUpdates(project.id)).items);}catch(error){Alert.alert("Project could not open",error instanceof Error?error.message:"Try again.");}};
  const send=async()=>{const body=message.trim();if(!body)return;setBusy(true);try{if(selectedRoom){const sent=await sendRoomMessage(selectedRoom.id,body);setRoomPosts(current=>current.some(item=>item.id===sent.id)?current:[...current,sent]);}else if(selectedProject){const sent=await sendProjectUpdate(selectedProject.id,body);setProjectPosts(current=>[...current,sent]);}setMessage("");}catch(error){Alert.alert("Message could not send",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const saveProject=async()=>{if(!projectTitle.trim())return;setBusy(true);try{const created=await createProject({title:projectTitle.trim(),description:projectDescription.trim()||undefined});setProjectItems(current=>[{...created,role:"owner",member_count:1},...current]);setProjectTitle("");setProjectDescription("");setNewProject(false);}catch(error){Alert.alert("Project could not be created",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const inviteMember=async(member:MemberDirectoryItem)=>{if(!selectedProject)return;try{await inviteProjectMember(selectedProject.id,member.id);Alert.alert("Invitation sent",`${member.display_name} can now access this private workspace.`);}catch(error){Alert.alert("Member could not be invited",error instanceof Error?error.message:"Try again.");}};
  return <ScrollView contentContainerStyle={styles.screen}>
    <ScreenIntro eyebrow="THE NETWORK" title="BUILD WITH PEOPLE IN MOTION" text="Useful conversations. Strong introductions. Shared standards." />
    <View style={styles.segment}><Pressable onPress={() => setMode("rooms")} style={[styles.segmentItem, mode==="rooms"&&styles.segmentActive]}><Text style={[styles.segmentText,mode==="rooms"&&styles.segmentTextActive]}>ROOMS</Text></Pressable><Pressable onPress={() => setMode("projects")} style={[styles.segmentItem,mode==="projects"&&styles.segmentActive]}><Text style={[styles.segmentText,mode==="projects"&&styles.segmentTextActive]}>PROJECTS</Text></Pressable></View>
    {mode === "rooms" ? <>
      {!roomItems.length&&<EmptyLine icon="chatbubbles-outline" text="No rooms are open to your membership yet."/>}
      {roomItems.map(room => <Pressable key={room.id} onPress={() => openRoom(room)}><Card style={styles.roomCard}><View style={styles.roomIcon}><Ionicons name={room.focus==="Trading"?"trending-up":room.focus==="Business"?"briefcase-outline":room.focus==="Fitness"?"barbell-outline":"chatbubbles-outline"} color={colors.gold} size={21}/></View><View style={{flex:1}}><Text style={styles.roomTitle}>{room.title}</Text><Text style={styles.roomText}>{room.description||"Private member discussion."}</Text><Text style={styles.roomMeta}>{room.member_count} MEMBERS · MEMBERS ONLY</Text></View><Ionicons name="arrow-forward" color={colors.gold} size={18}/></Card></Pressable>)}
    </> : <>
      {!projectItems.length&&<EmptyLine icon="folder-outline" text="You have not joined an invitation-only project workspace yet."/>}
      {projectItems.map(project => <Pressable key={project.id} onPress={() => openProject(project)}><Card style={styles.projectCard}><View style={styles.projectTop}><Ionicons name="folder-outline" color={colors.gold} size={20}/><View style={{flex:1}}><Text style={styles.roomTitle}>{project.title}</Text><Text style={styles.roomMeta}>{project.member_count} MEMBERS · {project.role.toUpperCase()}</Text></View><Text style={styles.projectPercent}>{project.progress}%</Text></View><Text style={styles.roomText}>{project.description||"Private project workspace"}</Text><ProgressBar value={project.progress}/></Card></Pressable>)}
      {newProject?<Card style={styles.addCard}><Text style={styles.label}>NEW PRIVATE PROJECT</Text><TextInput value={projectTitle} onChangeText={setProjectTitle} placeholder="Project name" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/><TextInput value={projectDescription} onChangeText={setProjectDescription} placeholder="What are you building together?" placeholderTextColor={colors.mutedDark} style={[styles.inlineInput,{minHeight:80}]} multiline/><GoldButton label={busy?"Creating":"Create invitation-only workspace"} onPress={saveProject} disabled={busy||!projectTitle.trim()}/><OutlineButton label="Cancel" onPress={()=>setNewProject(false)}/></Card>:<OutlineButton label="Create a private project" icon="add" onPress={()=>setNewProject(true)}/>}
    </>}
    <Modal visible={!!selectedRoom} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedRoom(null)}>
      <View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={() => setSelectedRoom(null)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>{selectedRoom?.title}</Text><Text style={styles.modalMeta}>{selectedRoom?.member_count} MEMBERS · PRIVATE</Text></View><Ionicons name="people-outline" color={colors.gold} size={21}/></View>
      <ScrollView contentContainerStyle={styles.chatContent}>{!roomPosts.length&&<EmptyLine icon="chatbubble-outline" text="Be the first to start a useful conversation."/>}{roomPosts.map(post=><View key={post.id} style={styles.roomPost}><View style={styles.avatar}><Text style={styles.avatarText}>{memberInitials(post.display_name)}</Text></View><View style={{flex:1}}><Text style={styles.postName}>{post.display_name} <Text style={styles.postTime}>· {relativeTime(post.created_at)}</Text></Text><Text style={styles.postText}>{post.body}</Text></View></View>)}</ScrollView>
      <View style={styles.composer}><TextInput value={message} onChangeText={setMessage} placeholder="Add to the conversation…" placeholderTextColor={colors.mutedDark} style={styles.composerInput}/><Pressable disabled={busy} onPress={send} style={styles.sendButton}><Ionicons name="arrow-up" color={colors.black} size={19}/></Pressable></View></View>
    </Modal>
    <Modal visible={!!selectedProject} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSelectedProject(null)}>
      <View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setSelectedProject(null)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>{selectedProject?.title}</Text><Text style={styles.modalMeta}>INVITATION-ONLY WORKSPACE</Text></View><Ionicons name="lock-closed-outline" color={colors.gold} size={20}/></View>
      <ScrollView contentContainerStyle={styles.chatContent}>{selectedProject?.role==="owner"&&<Card style={styles.inviteCard}><Eyebrow>INVITE A MEMBER</Eyebrow><Text style={styles.roomText}>Only invited members can see this workspace or its updates.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{members.map(member=><Pressable key={member.id} onPress={()=>inviteMember(member)} style={styles.memberChip}><Text style={styles.memberChipInitials}>{memberInitials(member.display_name)}</Text><Text style={styles.memberChipName}>{member.display_name}</Text></Pressable>)}</ScrollView></Card>}{!projectPosts.length&&<EmptyLine icon="construct-outline" text="Post the first project update, decision or request."/>}{projectPosts.map(post=><View key={post.id} style={styles.roomPost}><View style={styles.avatar}><Text style={styles.avatarText}>{memberInitials(post.display_name)}</Text></View><View style={{flex:1}}><Text style={styles.postName}>{post.display_name} <Text style={styles.postTime}>· {relativeTime(post.created_at)}</Text></Text><Text style={styles.postText}>{post.body}</Text></View></View>)}</ScrollView>
      <View style={styles.composer}><TextInput value={message} onChangeText={setMessage} placeholder="Private project update…" placeholderTextColor={colors.mutedDark} style={styles.composerInput}/><Pressable disabled={busy} onPress={send} style={styles.sendButton}><Ionicons name="arrow-up" color={colors.black} size={19}/></Pressable></View></View>
    </Modal>
  </ScrollView>;
}

function MessagesScreen({userId}:{userId:string}) {
  const [threads,setThreads]=useState<DirectThread[]>([]);
  const [members,setMembers]=useState<MemberDirectoryItem[]>([]);
  const [selected, setSelected] = useState<DirectThread | null>(null);
  const [chat,setChat]=useState<ChatMessage[]>([]);
  const [memberPicker,setMemberPicker]=useState(false);
  const [query,setQuery]=useState("");
  const [message, setMessage] = useState("");
  const [safetyOpen,setSafetyOpen]=useState(false);
  const [safetyDetail,setSafetyDetail]=useState("");
  const [busy,setBusy]=useState(false);
  const load=async()=>{try{const [threadResult,memberResult]=await Promise.all([listDirectThreads(),listMembers()]);setThreads(threadResult.items);setMembers(memberResult.items);}catch(error){Alert.alert("Messages could not load",error instanceof Error?error.message:"Try again.");}};
  useEffect(()=>{load();},[]);
  useEffect(()=>{
    if(!selected)return;
    let active=true;
    let socket:WebSocket|undefined;
    getRealtimeUrl().then(url=>{
      if(!active)return;
      socket=new WebSocket(url);
      socket.onopen=()=>socket?.send(JSON.stringify({type:"subscribe.thread",threadId:selected.id}));
      socket.onmessage=event=>{
        try{
          const payload=JSON.parse(String(event.data)) as ChatMessage&{type?:string};
          if(payload.type==="direct.message"&&payload.thread_id===selected.id){
            setChat(current=>current.some(item=>item.id===payload.id)?current:[...current,payload]);
          }
        }catch{}
      };
    }).catch(()=>undefined);
    return()=>{active=false;socket?.close();};
  },[selected?.id]);
  const open=async(thread:DirectThread)=>{setSelected(thread);try{setChat((await listDirectMessages(thread.id)).items);}catch(error){Alert.alert("Conversation could not open",error instanceof Error?error.message:"Try again.");}};
  const start=async(member:MemberDirectoryItem)=>{setBusy(true);try{const result=await createDirectThread(member.id);const existing=threads.find(item=>item.id===result.id);const thread=existing??{id:result.id,member_id:member.id,display_name:member.display_name,focuses:member.focuses,avatar_key:member.avatar_key,last_message:null,last_message_at:null};setThreads(current=>existing?current:[thread,...current]);setMemberPicker(false);await open(thread);}catch(error){Alert.alert("Conversation could not start",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const send=async()=>{const body=message.trim();if(!selected||!body)return;setBusy(true);try{const sent=await sendDirectMessage(selected.id,body);setChat(current=>current.some(item=>item.id===sent.id)?current:[...current,{...sent,display_name:"You"}]);setMessage("");setThreads(current=>current.map(item=>item.id===selected.id?{...item,last_message:body,last_message_at:new Date().toISOString()}:item));}catch(error){Alert.alert("Message could not send",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const reportMember=async()=>{if(!selected||safetyDetail.trim().length<3)return;setBusy(true);try{await createModerationReport({targetType:"member",targetId:selected.member_id,reason:"Member conduct or safety concern",detail:safetyDetail.trim()});setSafetyDetail("");setSafetyOpen(false);Alert.alert("Report received","A Motion Only moderator can now review this privately.");}catch(error){Alert.alert("Report could not be sent",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const blockSelected=async()=>{if(!selected)return;setBusy(true);try{await blockMember(selected.member_id);setThreads(current=>current.filter(item=>item.id!==selected.id));setSafetyOpen(false);setSelected(null);Alert.alert("Member blocked","They can no longer start or continue a private conversation with you.");}catch(error){Alert.alert("Member could not be blocked",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const filtered=threads.filter(item=>`${item.display_name} ${item.last_message??""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={{flex:1}}><ScrollView contentContainerStyle={styles.screen}>
    <ScreenIntro eyebrow="PRIVATE CHANNELS" title="DIRECT MESSAGES" text="Private conversations for feedback, introductions and accountability." />
    <View style={styles.searchBox}><Ionicons name="search" color={colors.muted} size={18}/><TextInput value={query} onChangeText={setQuery} placeholder="Search conversations" placeholderTextColor={colors.mutedDark} style={styles.librarySearchInput}/></View>
    {!filtered.length&&<EmptyLine icon="chatbubble-ellipses-outline" text="No private conversations yet. Start one with another member."/>}
    {filtered.map(person => <Pressable key={person.id} onPress={() => open(person)} style={styles.conversation}><View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{memberInitials(person.display_name)}</Text></View><View style={{flex:1}}><View style={styles.conversationTop}><Text style={styles.conversationName}>{person.display_name}</Text><Text style={styles.conversationTime}>{person.last_message_at?relativeTime(person.last_message_at):""}</Text></View><Text style={styles.conversationContext}>{person.focuses.join(" · ").toUpperCase()}</Text><Text style={styles.conversationPreview} numberOfLines={1}>{person.last_message||"Start the conversation"}</Text></View></Pressable>)}
    <OutlineButton label="Start a private conversation" icon="create-outline" onPress={()=>setMemberPicker(true)}/>
    </ScrollView>
    <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}><View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setSelected(null)}><Ionicons name="chevron-back" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>{selected?.display_name}</Text><Text style={styles.modalMeta}>PRIVATE · MEMBER TO MEMBER</Text></View><Pressable accessibilityLabel="Conversation safety options" onPress={()=>setSafetyOpen(true)}><Ionicons name="ellipsis-horizontal-circle-outline" color={colors.gold} size={23}/></Pressable></View>
      <ScrollView contentContainerStyle={styles.directChat}>{!chat.length&&<EmptyLine icon="chatbubble-outline" text="Messages in this conversation are private to its members."/>}{chat.map(item=>{const mine=item.sender_id===userId;return <View key={item.id} style={mine?styles.sentBubble:styles.received}><Text style={mine?styles.sentBubbleText:styles.bubbleText}>{item.body}</Text><Text style={mine?styles.sentBubbleTime:styles.bubbleTime}>{relativeTime(item.created_at)}</Text></View>;})}</ScrollView>
      <View style={styles.composer}><TextInput value={message} onChangeText={setMessage} placeholder="Private message…" placeholderTextColor={colors.mutedDark} style={styles.composerInput}/><Pressable disabled={busy} onPress={send} style={styles.sendButton}><Ionicons name="arrow-up" color={colors.black} size={19}/></Pressable></View></View></Modal>
    <Modal visible={safetyOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSafetyOpen(false)}><View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setSafetyOpen(false)}><Ionicons name="close" color={colors.text} size={24}/></Pressable><View><Text style={styles.modalTitle}>SAFETY OPTIONS</Text><Text style={styles.modalMeta}>{selected?.display_name?.toUpperCase()}</Text></View><Ionicons name="shield-outline" color={colors.gold} size={22}/></View><ScrollView contentContainerStyle={styles.reviewForm}><Text style={styles.label}>PRIVATE REPORT TO MODERATORS</Text><TextInput value={safetyDetail} onChangeText={setSafetyDetail} multiline maxLength={1000} placeholder="Briefly explain what happened." placeholderTextColor={colors.mutedDark} style={styles.reviewInput}/><GoldButton label={busy?"Sending":"Send private report"} disabled={busy||safetyDetail.trim().length<3} onPress={reportMember}/><OutlineButton label="Block this member" icon="ban-outline" onPress={blockSelected}/><Text style={styles.evidenceNote}>Blocking stops new direct conversations. Moderators can review reports in Network Operations.</Text></ScrollView></View></Modal>
    <Modal visible={memberPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setMemberPicker(false)}><View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setMemberPicker(false)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>NEW CONVERSATION</Text><Text style={styles.modalMeta}>MEMBERS ONLY</Text></View><Ionicons name="people-outline" color={colors.gold} size={21}/></View><ScrollView contentContainerStyle={styles.chatContent}>{members.map(member=><Pressable disabled={busy} key={member.id} onPress={()=>start(member)} style={styles.conversation}><View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{memberInitials(member.display_name)}</Text></View><View style={{flex:1}}><Text style={styles.conversationName}>{member.display_name}</Text><Text style={styles.conversationContext}>{member.focuses.join(" · ").toUpperCase()}</Text><Text numberOfLines={2} style={styles.conversationPreview}>{member.bio||"Motion Only member"}</Text></View><Ionicons name="arrow-forward" color={colors.gold} size={18}/></Pressable>)}</ScrollView></View></Modal>
  </View>;
}

function ProfileScreen({ role, name, focuses, xp, onLogout }: { role:"member"|"moderator"|"admin";name:string; focuses:Focus[]; xp:number; onLogout:()=>void }) {
  const level = getLevel(xp);
  const [displayName,setDisplayName]=useState(name);
  const [bio,setBio]=useState("");
  const [editOpen,setEditOpen]=useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [progressPrivate, setProgressPrivate] = useState(true);
  const [messagesAllowed,setMessagesAllowed]=useState(true);
  const [achievements,setAchievements]=useState<AchievementItem[]>([]);
  const [achievementOpen,setAchievementOpen]=useState(false);
  const [adminOpen,setAdminOpen]=useState(false);
  const [achievementTitle,setAchievementTitle]=useState("");
  const [achievementDescription,setAchievementDescription]=useState("");
  const [achievementEvidence,setAchievementEvidence]=useState<DocumentPicker.DocumentPickerAsset|null>(null);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{Promise.all([getMe(),listAchievements()]).then(([profile,result])=>{setDisplayName(profile.display_name??name);setBio(profile.bio??"");setDiscoverable(profile.profile_visibility!=="private");setProgressPrivate(profile.progress_visibility!=="members");setMessagesAllowed(profile.messaging_permission!=="nobody");setAchievements(result.items);}).catch(()=>undefined);},[]);
  const privacyChange=async(kind:"profile"|"progress"|"messages",value:boolean)=>{
    if(kind==="profile")setDiscoverable(value);if(kind==="progress")setProgressPrivate(value);if(kind==="messages")setMessagesAllowed(value);
    try{await updateMe(kind==="profile"?{profileVisibility:value?"members":"private"}:kind==="progress"?{progressVisibility:value?"private":"members"}:{messagingPermission:value?"members":"nobody"});}
    catch(error){if(kind==="profile")setDiscoverable(!value);if(kind==="progress")setProgressPrivate(!value);if(kind==="messages")setMessagesAllowed(!value);Alert.alert("Privacy setting could not save",error instanceof Error?error.message:"Try again.");}
  };
  const saveProfile=async()=>{setBusy(true);try{const updated=await updateMe({displayName:displayName.trim(),bio:bio.trim()||null});setDisplayName(updated.display_name??displayName);setEditOpen(false);}catch(error){Alert.alert("Profile could not save",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const chooseEvidence=async()=>{const result=await DocumentPicker.getDocumentAsync({type:["image/jpeg","image/png","image/webp","application/pdf"],multiple:false,copyToCacheDirectory:true});if(!result.canceled)setAchievementEvidence(result.assets[0]??null);};
  const saveAchievement=async()=>{if(!achievementTitle.trim())return;setBusy(true);try{const evidence=achievementEvidence?await uploadPrivateFile(achievementEvidence):null;const item=await createAchievement({title:achievementTitle.trim(),description:achievementDescription.trim()||undefined,evidenceFileId:evidence?.id});setAchievements(current=>[item,...current]);setAchievementTitle("");setAchievementDescription("");setAchievementEvidence(null);setAchievementOpen(false);}catch(error){Alert.alert("Achievement could not save",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  return <ScrollView contentContainerStyle={styles.screen}>
    <ScreenIntro eyebrow="YOUR CONTROL" title="PROFILE & PRIVACY" text="Your identity inside Motion Only. Your data stays under your control." />
    <Card style={styles.profileCard}><View style={styles.profileAvatar}><Text style={styles.profileInitials}>{memberInitials(displayName)}</Text></View><Text style={styles.profileName}>{displayName}</Text><Text style={styles.profileMeta}>LEVEL {level.level} · {level.name.toUpperCase()} · {xp} XP</Text>{!!bio&&<Text style={styles.profileBio}>{bio}</Text>}<View style={styles.focusPills}>{focuses.map(focus=><Text key={focus} style={styles.focusPill}>{focus.toUpperCase()}</Text>)}</View><OutlineButton label="Edit member profile" icon="create-outline" onPress={()=>setEditOpen(true)}/></Card>
    <View style={styles.sectionHead}><View><Eyebrow>PRIVACY DEFAULTS</Eyebrow><Text style={styles.sectionTitle}>YOU DECIDE WHAT MOVES</Text></View></View>
    <SettingRow icon="lock-closed-outline" title="Goals and progress private" text="Keep your personal evidence visible only to you" value={progressPrivate} onValueChange={value=>privacyChange("progress",value)}/>
    <SettingRow icon="people-outline" title="Discoverable by members" text="Never visible outside Motion Only" value={discoverable} onValueChange={value=>privacyChange("profile",value)}/>
    <SettingRow icon="chatbubble-outline" title="Allow private messages" text="Turn off to stop new member conversations" value={messagesAllowed} onValueChange={value=>privacyChange("messages",value)}/>
    <View style={styles.sectionHead}><View><Eyebrow>PRIVATE RECORD</Eyebrow><Text style={styles.sectionTitle}>ACHIEVEMENTS</Text></View><Pressable onPress={()=>setAchievementOpen(true)}><Text style={styles.sectionCount}>+ ADD</Text></Pressable></View>
    {!achievements.length&&<EmptyLine icon="trophy-outline" text="Record a result you have earned. It stays private unless you later choose to share it."/>}
    {achievements.map(item=><Card key={item.id} style={styles.achievementCard}><Ionicons name="trophy-outline" color={colors.gold} size={20}/><View style={{flex:1}}><Text style={styles.achievementTitle}>{item.title}</Text>{!!item.description&&<Text style={styles.roomText}>{item.description}</Text>}<Text style={styles.motionMeta}>{new Date(item.achieved_at).toLocaleDateString()} · PRIVATE</Text></View></Card>)}
    {(role==="admin"||role==="moderator")&&<Pressable onPress={()=>setAdminOpen(true)} style={styles.operations}><Ionicons name="shield-checkmark-outline" color={colors.gold} size={20}/><View style={{flex:1}}><Text style={styles.operationsTitle}>NETWORK OPERATIONS</Text><Text style={styles.operationsText}>Members, invitations, roles, rooms and moderation</Text></View><Ionicons name="chevron-forward" color={colors.muted} size={18}/></Pressable>}
    <OutlineButton label="Sign out securely" icon="log-out-outline" onPress={onLogout}/>
    <Text style={styles.version}>MOTION ONLY · VERSION 0.2.0 · PRIVATE TEST</Text>
    <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setEditOpen(false)}><View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setEditOpen(false)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>EDIT PROFILE</Text><Text style={styles.modalMeta}>MEMBERS-ONLY IDENTITY</Text></View><Ionicons name="person-outline" color={colors.gold} size={21}/></View><ScrollView contentContainerStyle={styles.reviewForm}><Text style={styles.label}>DISPLAY NAME</Text><TextInput value={displayName} onChangeText={setDisplayName} style={styles.inlineInput}/><Text style={styles.label}>SHORT BIO</Text><TextInput value={bio} onChangeText={setBio} multiline maxLength={600} placeholder="What are you building or working towards?" placeholderTextColor={colors.mutedDark} style={styles.reviewInput}/><GoldButton label={busy?"Saving":"Save profile"} disabled={busy||displayName.trim().length<2} onPress={saveProfile}/></ScrollView></View></Modal>
    <Modal visible={achievementOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setAchievementOpen(false)}><View style={styles.modalRoot}><View style={styles.modalHead}><Pressable onPress={()=>setAchievementOpen(false)}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>RECORD ACHIEVEMENT</Text><Text style={styles.modalMeta}>PRIVATE BY DEFAULT</Text></View><Ionicons name="trophy-outline" color={colors.gold} size={21}/></View><ScrollView contentContainerStyle={styles.reviewForm}><Text style={styles.label}>WHAT DID YOU ACHIEVE?</Text><TextInput value={achievementTitle} onChangeText={setAchievementTitle} style={styles.inlineInput}/><Text style={styles.label}>EVIDENCE OR CONTEXT</Text><TextInput value={achievementDescription} onChangeText={setAchievementDescription} multiline maxLength={2000} placeholder="Describe the result and what made it count." placeholderTextColor={colors.mutedDark} style={styles.reviewInput}/><OutlineButton label={achievementEvidence?`Evidence · ${achievementEvidence.name}`:"Attach private evidence"} icon="attach-outline" onPress={chooseEvidence}/><Text style={styles.evidenceNote}>Optional · JPEG, PNG, WebP or PDF · stored privately</Text><GoldButton label={busy?"Saving privately":"Save private achievement"} disabled={busy||achievementTitle.trim().length<2} onPress={saveAchievement}/></ScrollView></View></Modal>
    <Modal visible={adminOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={()=>setAdminOpen(false)}><AdminScreen role={role as "admin"|"moderator"} onClose={()=>setAdminOpen(false)}/></Modal>
  </ScrollView>;
}

function AdminScreen({role,onClose}:{role:"admin"|"moderator";onClose:()=>void}) {
  type Mode="members"|"invites"|"rooms"|"reports";
  const modes:Mode[]=role==="admin"?["members","invites","rooms","reports"]:["members","reports"];
  const [mode,setMode]=useState<Mode>("members");
  const [members,setMembers]=useState<AdminMember[]>([]);
  const [invites,setInvites]=useState<AdminInvitation[]>([]);
  const [rooms,setRooms]=useState<AdminRoom[]>([]);
  const [reports,setReports]=useState<ModerationReport[]>([]);
  const [email,setEmail]=useState("");
  const [inviteRole,setInviteRole]=useState<"member"|"moderator"|"admin">("member");
  const [roomTitle,setRoomTitle]=useState("");
  const [roomDescription,setRoomDescription]=useState("");
  const [busy,setBusy]=useState(false);
  const load=async()=>{
    setBusy(true);
    try{
      const [memberResult,reportResult]=await Promise.all([listAdminMembers(),listModerationReports()]);
      setMembers(memberResult.items);setReports(reportResult.items);
      if(role==="admin"){const [inviteResult,roomResult]=await Promise.all([listAdminInvitations(),listAdminRooms()]);setInvites(inviteResult.items);setRooms(roomResult.items);}
    }catch(error){Alert.alert("Administration could not load",error instanceof Error?error.message:"Try again.");}
    finally{setBusy(false);}
  };
  useEffect(()=>{load();},[]);
  const sendInvite=async()=>{if(!email.trim())return;setBusy(true);try{const created=await createAdminInvitation({email:email.trim(),role:inviteRole,expiresInDays:7});setEmail("");setInvites(current=>[{id:created.id,email:created.email,role:inviteRole,expires_at:new Date(Date.now()+7*86400000).toISOString(),accepted_at:null,revoked_at:null,created_at:new Date().toISOString()},...current]);if(created.emailSent)Alert.alert("Invitation sent",`A secure invitation was emailed to ${created.email}.`);else Share.share({message:`You are invited to the private Motion Only test. Accept here: ${created.joinLink}`});}catch(error){Alert.alert("Invitation could not be created",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const revokeInvite=async(item:AdminInvitation)=>{try{await revokeAdminInvitation(item.id);setInvites(current=>current.map(invite=>invite.id===item.id?{...invite,revoked_at:new Date().toISOString()}:invite));}catch(error){Alert.alert("Invitation could not be revoked",error instanceof Error?error.message:"Try again.");}};
  const changeMember=async(member:AdminMember,input:{status?:"active"|"suspended";role?:"member"|"moderator"|"admin"})=>{try{await updateAdminMember(member.id,input);setMembers(current=>current.map(item=>item.id===member.id?{...item,...input}:item));}catch(error){Alert.alert("Member could not be updated",error instanceof Error?error.message:"Try again.");}};
  const addRoom=async()=>{if(!roomTitle.trim())return;setBusy(true);try{const slug=roomTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);const created=await createAdminRoom({title:roomTitle.trim(),slug:`${slug}-${Date.now().toString().slice(-4)}`,description:roomDescription.trim()||undefined,isPrivate:false});setRooms(current=>[...current,{...created,member_count:members.filter(item=>item.status==="active").length}]);setRoomTitle("");setRoomDescription("");}catch(error){Alert.alert("Room could not be created",error instanceof Error?error.message:"Try again.");}finally{setBusy(false);}};
  const toggleRoom=async(room:AdminRoom)=>{try{const updated=await updateAdminRoom(room.id,{archived:!room.archived_at});setRooms(current=>current.map(item=>item.id===room.id?{...item,archived_at:updated.archived_at}:item));}catch(error){Alert.alert("Room could not be updated",error instanceof Error?error.message:"Try again.");}};
  const closeReport=async(report:ModerationReport,status:"resolved"|"dismissed")=>{try{const updated=await updateModerationReport(report.id,{status});setReports(current=>current.map(item=>item.id===report.id?updated:item));}catch(error){Alert.alert("Report could not be updated",error instanceof Error?error.message:"Try again.");}};
  return <View style={styles.modalRoot}>
    <View style={styles.modalHead}><Pressable onPress={onClose}><Ionicons name="close" color={colors.text} size={25}/></Pressable><View><Text style={styles.modalTitle}>NETWORK OPERATIONS</Text><Text style={styles.modalMeta}>{role.toUpperCase()} ACCESS · AUDITED</Text></View><Ionicons name="shield-checkmark-outline" color={colors.gold} size={22}/></View>
    <View style={styles.adminTabs}>{modes.map(item=><Pressable key={item} onPress={()=>setMode(item)} style={[styles.adminTab,mode===item&&styles.segmentActive]}><Text style={[styles.segmentText,mode===item&&styles.segmentTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.chatContent}>
      {busy&&<ActivityIndicator color={colors.gold}/>}
      {mode==="members"&&<>{members.map(member=><Card key={member.id} style={styles.adminCard}><View style={styles.adminCardTop}><View style={styles.avatar}><Text style={styles.avatarText}>{memberInitials(member.display_name)}</Text></View><View style={{flex:1}}><Text style={styles.conversationName}>{member.display_name}</Text><Text style={styles.conversationPreview}>{member.email}</Text><Text style={styles.roomMeta}>{member.role.toUpperCase()} · {member.status.toUpperCase()} · LEVEL {member.current_level}</Text></View></View>{role==="admin"&&<View style={styles.adminActions}><Pressable onPress={()=>changeMember(member,{role:member.role==="moderator"?"member":"moderator"})} style={styles.adminAction}><Text style={styles.adminActionText}>{member.role==="moderator"?"MAKE MEMBER":"MAKE MODERATOR"}</Text></Pressable><Pressable onPress={()=>changeMember(member,{status:member.status==="suspended"?"active":"suspended"})} style={styles.adminAction}><Text style={styles.adminActionText}>{member.status==="suspended"?"RESTORE":"SUSPEND"}</Text></Pressable></View>}</Card>)}</>}
      {mode==="invites"&&<><Card style={styles.addCard}><Text style={styles.label}>INVITE ONE TEST MEMBER</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="member@email.com" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/><View style={styles.focusPicker}>{(["member","moderator","admin"] as const).map(item=><Pressable key={item} onPress={()=>setInviteRole(item)} style={[styles.focusChoice,inviteRole===item&&styles.focusChoiceActive]}><Text style={[styles.focusChoiceText,inviteRole===item&&styles.focusChoiceTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View><GoldButton label={busy?"Creating":"Send secure invitation"} disabled={busy||!email.includes("@")} onPress={sendInvite}/></Card>{invites.map(item=>{const active=!item.accepted_at&&!item.revoked_at&&new Date(item.expires_at)>new Date();return <View key={item.id} style={styles.adminListRow}><View style={{flex:1}}><Text style={styles.conversationName}>{item.email}</Text><Text style={styles.roomMeta}>{item.accepted_at?"ACCEPTED":item.revoked_at?"REVOKED":active?"PENDING":"EXPIRED"} · {item.role.toUpperCase()}</Text></View>{active&&<Pressable onPress={()=>revokeInvite(item)}><Text style={styles.adminDanger}>REVOKE</Text></Pressable>}</View>;})}</>}
      {mode==="rooms"&&<><Card style={styles.addCard}><Text style={styles.label}>NEW TOPIC ROOM</Text><TextInput value={roomTitle} onChangeText={setRoomTitle} placeholder="Room name" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/><TextInput value={roomDescription} onChangeText={setRoomDescription} placeholder="Purpose and discussion standard" placeholderTextColor={colors.mutedDark} style={styles.inlineInput}/><GoldButton label={busy?"Creating":"Open room to all active members"} disabled={busy||roomTitle.trim().length<2} onPress={addRoom}/></Card>{rooms.map(room=><View key={room.id} style={styles.adminListRow}><View style={{flex:1}}><Text style={styles.conversationName}>{room.title}</Text><Text style={styles.roomMeta}>{room.member_count} MEMBERS · {room.archived_at?"ARCHIVED":"OPEN"}</Text></View><Pressable onPress={()=>toggleRoom(room)}><Text style={styles.adminActionText}>{room.archived_at?"RESTORE":"ARCHIVE"}</Text></Pressable></View>)}</>}
      {mode==="reports"&&<>{!reports.length&&<EmptyLine icon="shield-checkmark-outline" text="No moderation reports need attention."/>}{reports.map(report=><Card key={report.id} style={styles.adminCard}><Text style={styles.roomMeta}>{report.status.toUpperCase()} · {report.target_type.toUpperCase()}</Text><Text style={styles.achievementTitle}>{report.reason}</Text>{!!report.detail&&<Text style={styles.roomText}>{report.detail}</Text>}<Text style={styles.conversationPreview}>Reported by {report.reporter_name} · {relativeTime(report.created_at)}</Text>{!["resolved","dismissed"].includes(report.status)&&<View style={styles.adminActions}><Pressable onPress={()=>closeReport(report,"resolved")} style={styles.adminAction}><Text style={styles.adminActionText}>RESOLVE</Text></Pressable><Pressable onPress={()=>closeReport(report,"dismissed")} style={styles.adminAction}><Text style={styles.adminActionText}>DISMISS</Text></Pressable></View>}</Card>)}</>}
    </ScrollView>
  </View>;
}

function memberInitials(name:string) {
  return name.split(/\s+/).filter(Boolean).map(part=>part[0]).join("").slice(0,2).toUpperCase()||"MO";
}

function relativeTime(value:string) {
  const seconds=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/1000));
  if(seconds<60)return "now";
  const minutes=Math.floor(seconds/60);if(minutes<60)return `${minutes}m`;
  const hours=Math.floor(minutes/60);if(hours<24)return `${hours}h`;
  const days=Math.floor(hours/24);return days<7?`${days}d`:new Date(value).toLocaleDateString(undefined,{day:"numeric",month:"short"});
}

function notificationLabel(type:string) {
  if(type==="direct_message")return "New private message";
  if(type==="project_invitation")return "You were added to a private project";
  return type.replaceAll("_"," ");
}

function isCurrentWeek(value:string) {
  const start=new Date();
  start.setHours(0,0,0,0);
  start.setDate(start.getDate()-((start.getDay()+6)%7));
  return new Date(value)>=start;
}

function weekCloseCountdown(nowValue:number) {
  const now=new Date(nowValue);
  const close=new Date(now);
  const daysUntilMonday=(8-now.getDay())%7||7;
  close.setDate(now.getDate()+daysUntilMonday);
  close.setHours(0,0,0,0);
  const minutes=Math.max(0,Math.floor((close.getTime()-now.getTime())/60000));
  return `${Math.floor(minutes/1440)}D ${String(Math.floor((minutes%1440)/60)).padStart(2,"0")}H ${String(minutes%60).padStart(2,"0")}M`;
}

function FocusPicker({value,onChange}:{value:Focus;onChange:(focus:Focus)=>void}) {
  return <View style={styles.focusPicker}>{(["Business","Trading","Fitness"] as Focus[]).map(item=><Pressable key={item} onPress={()=>onChange(item)} style={[styles.focusChoice,value===item&&styles.focusChoiceActive]}><Text style={[styles.focusChoiceText,value===item&&styles.focusChoiceTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>;
}

function EmptyLine({icon,text}:{icon:keyof typeof Ionicons.glyphMap;text:string}) {
  return <View style={styles.emptyLine}><Ionicons name={icon} color={colors.gold} size={18}/><Text style={styles.emptyLineText}>{text}</Text></View>;
}

function ScreenIntro({ eyebrow, title, text }: { eyebrow:string; title:string; text:string }) {
  return <View style={styles.screenIntro}><Eyebrow>{eyebrow}</Eyebrow><Text style={styles.screenTitle}>{title}</Text><Text style={styles.screenText}>{text}</Text></View>;
}

function SettingRow({ icon, title, text, value, onValueChange }: {icon:keyof typeof Ionicons.glyphMap;title:string;text:string;value:boolean;onValueChange:(value:boolean)=>void}) {
  return <View style={styles.settingRow}><View style={styles.standardIcon}><Ionicons name={icon} color={colors.gold} size={18}/></View><View style={{flex:1}}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingText}>{text}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{false:colors.line,true:"#514628"}} thumbColor={value?colors.gold:colors.muted}/></View>;
}

const styles = StyleSheet.create({
  loadingState:{flex:1,backgroundColor:colors.background,alignItems:"center",justifyContent:"center",gap:13},
  loadingText:{color:colors.muted,fontSize:8,fontWeight:"800",letterSpacing:1},
  focusPicker:{flexDirection:"row",gap:7},
  focusChoice:{flex:1,minHeight:38,borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},
  focusChoiceActive:{borderColor:colors.gold,backgroundColor:colors.goldSoft},
  focusChoiceText:{color:colors.muted,fontSize:7,fontWeight:"800",letterSpacing:.5},
  focusChoiceTextActive:{color:colors.gold},
  emptyLine:{minHeight:68,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:14},
  emptyLineText:{flex:1,color:colors.muted,fontSize:9,lineHeight:14},
  reviewForm:{gap:13,padding:18},
  reviewPrompt:{color:colors.textSoft,fontSize:10,fontWeight:"700",lineHeight:15},
  reviewInput:{minHeight:138,borderWidth:1,borderColor:colors.lineStrong,color:colors.text,padding:13,textAlignVertical:"top"},
  reviewInputSmall:{minHeight:54,borderWidth:1,borderColor:colors.lineStrong,color:colors.text,padding:13,textAlignVertical:"top"},
  librarySearchInput:{flex:1,color:colors.text,fontSize:10},
  libraryFilters:{gap:7,paddingRight:12},
  libraryResultHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:8},
  privateTag:{color:colors.gold,fontSize:6.5,fontWeight:"800",letterSpacing:.6},
  libraryCard:{gap:12},
  libraryCardTop:{flexDirection:"row",alignItems:"flex-start",gap:11},
  libraryTitle:{color:colors.text,fontSize:15,lineHeight:19,fontWeight:"900",fontStyle:"italic"},
  librarySummary:{color:colors.muted,fontSize:9,lineHeight:14},
  libraryMeta:{flexDirection:"row",justifyContent:"space-between",borderTopWidth:1,borderTopColor:colors.line,paddingTop:11},
  readerContent:{padding:18,paddingBottom:60,gap:16},
  readerType:{color:colors.gold,fontSize:7,fontWeight:"800",letterSpacing:.75},
  readerTitle:{color:colors.text,fontSize:29,lineHeight:32,fontWeight:"900",fontStyle:"italic"},
  readerSummary:{color:colors.textSoft,fontSize:12,lineHeight:19},
  outcomeCard:{gap:8,borderLeftWidth:3,borderLeftColor:colors.gold},
  outcomeText:{color:colors.textSoft,fontSize:11,lineHeight:17,fontWeight:"700"},
  safetyCallout:{flexDirection:"row",gap:10,borderWidth:1,borderColor:"#4A4028",backgroundColor:"#151510",padding:14},
  safetyText:{flex:1,color:colors.muted,fontSize:9,lineHeight:15},
  readerSection:{gap:10,borderTopWidth:1,borderTopColor:colors.line,paddingTop:17},
  readerHeading:{color:colors.text,fontSize:18,lineHeight:22,fontWeight:"900",fontStyle:"italic"},
  readerBody:{flex:1,color:colors.textSoft,fontSize:10.5,lineHeight:17},
  readerBullet:{flexDirection:"row",alignItems:"flex-start",gap:9},
  readerBulletMark:{color:colors.gold,fontSize:16,lineHeight:18},
  readerStep:{width:22,height:22,backgroundColor:colors.gold,color:colors.black,textAlign:"center",paddingTop:3,fontSize:10,fontWeight:"900"},
  readerCallout:{gap:6,borderLeftWidth:2,borderLeftColor:colors.gold,backgroundColor:colors.goldSoft,padding:13},
  readerCalloutLabel:{color:colors.gold,fontSize:7,fontWeight:"900",letterSpacing:.7},
  readerTable:{borderWidth:1,borderColor:colors.line},
  readerTableRow:{flexDirection:"row"},
  readerCell:{width:145,color:colors.textSoft,fontSize:8.5,lineHeight:13,padding:9,borderRightWidth:1,borderBottomWidth:1,borderColor:colors.line},
  readerHeaderCell:{color:colors.gold,fontWeight:"900",backgroundColor:colors.surface},
  checklistRow:{minHeight:52,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:colors.line},
  checklistText:{flex:1,color:colors.textSoft,fontSize:9.5,lineHeight:14},
  checklistTextDone:{color:colors.muted,textDecorationLine:"line-through"},
  templateCard:{gap:11,borderTopWidth:2,borderTopColor:colors.gold},
  templateField:{gap:4,borderTopWidth:1,borderTopColor:colors.line,paddingTop:10},
  templateLabel:{color:colors.gold,fontSize:8,fontWeight:"900",letterSpacing:.4},
  sourceLink:{flexDirection:"row",alignItems:"flex-start",gap:9,paddingVertical:8},
  sourceText:{flex:1,color:colors.textSoft,fontSize:9,lineHeight:14,textDecorationLine:"underline"},
  inviteCard:{gap:11},
  memberChip:{width:100,minHeight:82,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:"center",justifyContent:"center",gap:7,padding:8},
  memberChipInitials:{color:colors.black,backgroundColor:colors.gold,width:28,height:28,textAlign:"center",paddingTop:6,fontSize:9,fontWeight:"900"},
  memberChipName:{color:colors.textSoft,fontSize:7.5,fontWeight:"800",textAlign:"center"},
  profileBio:{color:colors.muted,fontSize:9,lineHeight:14,textAlign:"center",maxWidth:280},
  achievementCard:{flexDirection:"row",alignItems:"flex-start",gap:12},
  achievementTitle:{color:colors.textSoft,fontSize:11,fontWeight:"800"},
  notificationRow:{minHeight:70,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:colors.line,paddingHorizontal:12},
  notificationUnread:{backgroundColor:colors.goldSoft},
  notificationTitle:{color:colors.textSoft,fontSize:10,fontWeight:"800"},
  notificationTime:{color:colors.muted,fontSize:7,marginTop:5},
  notificationDot:{width:7,height:7,borderRadius:4,backgroundColor:colors.gold},
  adminTabs:{flexDirection:"row",backgroundColor:colors.black,padding:4},
  adminTab:{flex:1,minHeight:43,alignItems:"center",justifyContent:"center"},
  adminCard:{gap:11},
  adminCardTop:{flexDirection:"row",alignItems:"center",gap:11},
  adminActions:{flexDirection:"row",gap:8,borderTopWidth:1,borderTopColor:colors.line,paddingTop:10},
  adminAction:{flex:1,minHeight:34,borderWidth:1,borderColor:colors.lineStrong,alignItems:"center",justifyContent:"center"},
  adminActionText:{color:colors.gold,fontSize:7,fontWeight:"900",letterSpacing:.45},
  adminListRow:{minHeight:68,flexDirection:"row",alignItems:"center",gap:10,borderBottomWidth:1,borderBottomColor:colors.line},
  adminDanger:{color:"#D67A65",fontSize:7,fontWeight:"900",letterSpacing:.5},
  evidenceNote:{color:colors.muted,fontSize:7,lineHeight:11,textAlign:"center"},
  root:{flex:1,backgroundColor:colors.background},header:{height:93,paddingTop:48,paddingHorizontal:18,borderBottomWidth:1,borderBottomColor:colors.line,backgroundColor:colors.black,flexDirection:"row",alignItems:"center"},headerCenter:{flex:1,alignItems:"center"},headerBrand:{color:colors.text,fontWeight:"900",fontStyle:"italic",fontSize:14,letterSpacing:.8},headerSub:{color:colors.mutedDark,fontSize:6,letterSpacing:1.3,marginTop:2},headerButton:{width:38,height:38,alignItems:"center",justifyContent:"center"},dot:{position:"absolute",right:8,top:7,width:6,height:6,backgroundColor:colors.gold},screen:{paddingHorizontal:18,paddingTop:27,paddingBottom:40,gap:12},hero:{borderLeftWidth:3,borderLeftColor:colors.gold,paddingLeft:15,marginBottom:10},heroTitle:{color:colors.text,fontSize:34,lineHeight:33,fontWeight:"900",fontStyle:"italic",letterSpacing:-.3},heroText:{color:colors.muted,fontSize:11,marginTop:9},metricRow:{flexDirection:"row",gap:10},metricCard:{flex:1,minHeight:120},metricValue:{color:colors.text,fontSize:35,fontWeight:"900",fontStyle:"italic"},metricSmall:{color:colors.muted,fontSize:18},metricLabel:{color:colors.textSoft,fontSize:8,fontWeight:"800",letterSpacing:.8,marginTop:6},metricDelta:{color:colors.gold,fontSize:8,marginTop:9},weeklyMomentumCard:{borderColor:"#4A4028",backgroundColor:"#151510",gap:12},weeklyMomentumTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"},weeklyMomentumStage:{color:colors.text,fontSize:20,fontWeight:"900",fontStyle:"italic"},weeklyMomentumPoints:{color:colors.gold,fontSize:28,fontWeight:"900",fontStyle:"italic"},weeklyMomentumTotal:{color:colors.muted,fontSize:13},momentumTrack:{height:8,backgroundColor:"#292A27",overflow:"hidden"},momentumFill:{height:8,backgroundColor:colors.gold},weeklyMomentumBottom:{flexDirection:"row",justifyContent:"space-between",gap:8},weeklyMomentumHint:{flex:1,color:colors.muted,fontSize:6.5,lineHeight:10,fontWeight:"700",letterSpacing:.35},weeklyMomentumTime:{color:colors.textSoft,fontSize:7,fontWeight:"800",letterSpacing:.5},sectionHead:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:14,marginBottom:2},sectionTitle:{color:colors.text,fontSize:20,fontWeight:"900",fontStyle:"italic",letterSpacing:.1},sectionCount:{color:colors.gold,fontWeight:"900",fontSize:14},motionCard:{paddingVertical:2},motion:{minHeight:68,flexDirection:"row",alignItems:"center",gap:12,paddingVertical:13},motionBorder:{borderTopWidth:1,borderTopColor:colors.line},check:{width:22,height:22,borderWidth:1,borderColor:colors.lineStrong,alignItems:"center",justifyContent:"center"},checkDone:{backgroundColor:colors.gold,borderColor:colors.gold},motionTitle:{color:colors.textSoft,fontSize:11,fontWeight:"700"},motionTitleDone:{color:colors.muted,textDecorationLine:"line-through"},motionMeta:{color:colors.muted,fontSize:7,letterSpacing:.6,marginTop:5},textLink:{color:colors.textSoft,fontSize:8,fontWeight:"800",letterSpacing:.5},goalRail:{gap:10,paddingRight:18},goalMini:{width:225,minHeight:160,position:"relative",overflow:"hidden"},goalNumber:{position:"absolute",right:7,bottom:-16,color:"#222527",fontSize:68,fontWeight:"900",fontStyle:"italic"},focusTag:{color:colors.gold,fontSize:7,fontWeight:"800",letterSpacing:1,marginBottom:8},goalMiniTitle:{color:colors.text,fontWeight:"800",fontSize:13,lineHeight:17,minHeight:53,maxWidth:170},goalMeta:{flexDirection:"row",justifyContent:"space-between",marginTop:9},goalPercent:{color:colors.text,fontWeight:"900",fontSize:11},goalTarget:{color:colors.muted,fontSize:7,letterSpacing:.5},networkPrompt:{marginTop:9,borderTopWidth:2,borderTopColor:colors.gold,gap:10},promptTop:{flexDirection:"row",alignItems:"center",gap:7},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:colors.green},promptLive:{color:colors.muted,fontSize:7,letterSpacing:.7,fontWeight:"700"},promptTitle:{color:colors.text,fontWeight:"900",fontStyle:"italic",fontSize:22,lineHeight:24},promptMeta:{color:colors.muted,fontSize:8,marginBottom:4},screenIntro:{borderLeftWidth:3,borderLeftColor:colors.gold,paddingLeft:15,marginBottom:13},screenTitle:{color:colors.text,fontWeight:"900",fontStyle:"italic",fontSize:31,lineHeight:31},screenText:{color:colors.muted,fontSize:10,lineHeight:16,marginTop:9,maxWidth:330},filterRow:{flexDirection:"row",gap:6,marginBottom:3},filterChip:{paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:colors.line},filterChipActive:{borderColor:colors.gold,backgroundColor:colors.goldSoft},filterText:{color:colors.muted,fontWeight:"800",fontSize:7,letterSpacing:.5},filterTextActive:{color:colors.gold},fullGoal:{gap:13},fullGoalTop:{flexDirection:"row",alignItems:"center",gap:11},categoryIcon:{width:40,height:40,alignItems:"center",justifyContent:"center",backgroundColor:colors.goldSoft},fullGoalTitle:{color:colors.text,fontSize:13,fontWeight:"800",lineHeight:17},fullGoalPercent:{color:colors.text,fontWeight:"900",fontStyle:"italic",fontSize:19},fullGoalBottom:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},logProgress:{color:colors.gold,fontSize:8,fontWeight:"900",letterSpacing:.5},addCard:{gap:10,borderColor:"#4D4228"},label:{color:colors.gold,fontSize:8,fontWeight:"800",letterSpacing:1},inlineInput:{minHeight:46,borderWidth:1,borderColor:colors.lineStrong,color:colors.text,paddingHorizontal:12},standardRow:{minHeight:70,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:colors.line},standardIcon:{width:39,height:39,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center"},standardTitle:{color:colors.textSoft,fontSize:11,fontWeight:"700"},levelCard:{gap:11,borderTopWidth:2,borderTopColor:colors.gold},levelTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},levelXp:{color:colors.text,fontSize:26,fontWeight:"900",fontStyle:"italic"},levelCaption:{color:colors.muted,fontSize:7,letterSpacing:.7,marginTop:4},levelBadge:{width:48,height:48,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center"},levelBadgeNumber:{color:colors.black,fontSize:23,fontWeight:"900",fontStyle:"italic"},levelProgressText:{color:colors.muted,fontSize:6.5,letterSpacing:.6},momentumHero:{gap:16,borderColor:"#4A4028",backgroundColor:"#151510"},momentumHeroHead:{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between"},momentumHeroTitle:{color:colors.text,fontSize:25,fontWeight:"900",fontStyle:"italic"},momentumHeroPoints:{color:colors.gold,fontSize:37,fontWeight:"900",fontStyle:"italic"},momentumHeroTotal:{color:colors.muted,fontSize:16},momentumLargeTrack:{height:13,backgroundColor:"#292A27",overflow:"hidden"},momentumLargeFill:{height:13,backgroundColor:colors.gold},stageRail:{flexDirection:"row",justifyContent:"space-between"},stageItem:{width:"19%",alignItems:"center",gap:5},stageDot:{width:7,height:7,borderRadius:4,backgroundColor:colors.lineStrong},stageDotActive:{backgroundColor:colors.gold},stageName:{color:colors.mutedDark,fontSize:5.5,fontWeight:"800",letterSpacing:.25,textAlign:"center"},stageNameActive:{color:colors.gold},deadlineRow:{flexDirection:"row",justifyContent:"space-between",borderTopWidth:1,borderTopColor:"#373427",paddingTop:14},deadlineLabel:{color:colors.muted,fontSize:6.5,letterSpacing:.7,fontWeight:"700"},deadlineValue:{color:colors.text,fontSize:17,fontWeight:"900",marginTop:4},bonusBlock:{alignItems:"flex-end"},bonusValue:{color:colors.gold,fontSize:17,fontWeight:"900",marginTop:4},resetNote:{color:colors.muted,fontSize:7.5,lineHeight:12},momentumStats:{flexDirection:"row",gap:7},momentumStat:{flex:1,minHeight:95,padding:12},momentumStatValue:{color:colors.text,fontSize:25,fontWeight:"900",fontStyle:"italic"},momentumStatLabel:{color:colors.muted,fontSize:6.5,lineHeight:10,fontWeight:"700",letterSpacing:.4,marginTop:7},ledgerCard:{paddingVertical:2},ledgerRow:{minHeight:69,flexDirection:"row",alignItems:"center",gap:11,paddingVertical:12},ledgerBorder:{borderTopWidth:1,borderTopColor:colors.line},ledgerIcon:{width:37,height:37,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center"},ledgerTitle:{color:colors.textSoft,fontSize:10,fontWeight:"700"},ledgerSource:{color:colors.muted,fontSize:6.5,letterSpacing:.55,marginTop:4},ledgerPoints:{color:colors.gold,fontSize:8,fontWeight:"900",textAlign:"right"},ledgerXp:{color:colors.muted,fontSize:7,textAlign:"right",marginTop:4},reviewDone:{minHeight:48,borderWidth:1,borderColor:"#29402F",backgroundColor:"#111A14",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},reviewDoneText:{color:colors.textSoft,fontSize:8,fontWeight:"800",letterSpacing:.45},ladder:{paddingVertical:4},ladderRow:{minHeight:59,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:colors.line},ladderNumber:{width:29,height:29,borderWidth:1,borderColor:colors.lineStrong,alignItems:"center",justifyContent:"center"},ladderNumberActive:{backgroundColor:colors.gold,borderColor:colors.gold},ladderNumberText:{color:colors.muted,fontSize:10,fontWeight:"900"},ladderNumberTextActive:{color:colors.black},ladderName:{color:colors.muted,fontSize:10,fontWeight:"800",letterSpacing:.45},ladderCurrent:{color:colors.gold},ladderXp:{color:colors.mutedDark,fontSize:6.5,marginTop:3},youAreHere:{color:colors.gold,fontSize:6.5,fontWeight:"900",letterSpacing:.5},historyRow:{minHeight:64,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:colors.line},historyWeek:{color:colors.textSoft,fontSize:8,fontWeight:"800",width:66},historyResult:{color:colors.muted,fontSize:6.5,letterSpacing:.5,marginTop:5},historyReward:{color:colors.gold,fontSize:8,fontWeight:"900",width:55,textAlign:"right"},noBonus:{color:colors.mutedDark},rulesCard:{marginTop:8,borderLeftWidth:3,borderLeftColor:colors.gold},rulesTitle:{color:colors.text,fontSize:14,fontWeight:"900",fontStyle:"italic",lineHeight:18},rulesText:{color:colors.muted,fontSize:8.5,lineHeight:14,marginTop:9},segment:{flexDirection:"row",backgroundColor:colors.black,padding:3,marginBottom:4},segmentItem:{flex:1,alignItems:"center",paddingVertical:10},segmentActive:{backgroundColor:colors.raised},segmentText:{color:colors.muted,fontWeight:"800",fontSize:8,letterSpacing:.8},segmentTextActive:{color:colors.gold},roomCard:{flexDirection:"row",alignItems:"center",gap:13,minHeight:102},roomIcon:{width:45,height:45,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center"},roomTitle:{color:colors.text,fontWeight:"900",fontStyle:"italic",fontSize:16},roomText:{color:colors.muted,fontSize:9,marginTop:4,lineHeight:13},roomMeta:{color:colors.gold,fontSize:7,fontWeight:"700",letterSpacing:.6,marginTop:7},projectCard:{gap:13},projectTop:{flexDirection:"row",alignItems:"center",gap:11},projectPercent:{color:colors.text,fontWeight:"900",fontSize:17},modalRoot:{flex:1,backgroundColor:colors.background},modalHead:{paddingTop:24,paddingHorizontal:18,paddingBottom:15,borderBottomWidth:1,borderBottomColor:colors.line,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},modalTitle:{color:colors.text,fontWeight:"900",fontSize:15,textAlign:"center"},modalMeta:{color:colors.gold,fontSize:7,letterSpacing:.7,textAlign:"center",marginTop:3},chatContent:{padding:18,gap:22},roomPost:{flexDirection:"row",gap:11},avatar:{width:36,height:36,backgroundColor:colors.raised,alignItems:"center",justifyContent:"center"},avatarText:{color:colors.text,fontWeight:"800",fontSize:10},postName:{color:colors.textSoft,fontWeight:"800",fontSize:10},postTime:{color:colors.muted,fontWeight:"400"},postText:{color:colors.textSoft,fontSize:12,lineHeight:18,marginTop:7},postActions:{flexDirection:"row",alignItems:"center",gap:5,marginTop:10},postActionText:{color:colors.muted,fontSize:8,marginRight:7},composer:{padding:12,paddingBottom:28,borderTopWidth:1,borderTopColor:colors.line,flexDirection:"row",alignItems:"center",gap:9},composerInput:{flex:1,minHeight:44,backgroundColor:colors.surface,color:colors.text,paddingHorizontal:13,borderWidth:1,borderColor:colors.line},sendButton:{width:44,height:44,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center"},searchBox:{minHeight:46,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:13,marginBottom:5},searchText:{color:colors.muted,fontSize:10},conversation:{minHeight:82,borderBottomWidth:1,borderBottomColor:colors.line,flexDirection:"row",alignItems:"center",gap:12},avatarLarge:{width:46,height:46,backgroundColor:colors.raised,alignItems:"center",justifyContent:"center"},avatarLargeText:{color:colors.text,fontWeight:"900",fontSize:12},conversationTop:{flexDirection:"row",justifyContent:"space-between"},conversationName:{color:colors.text,fontWeight:"800",fontSize:12},conversationTime:{color:colors.muted,fontSize:8},conversationContext:{color:colors.gold,fontSize:6,fontWeight:"800",letterSpacing:.7,marginTop:4},conversationPreview:{color:colors.muted,fontSize:9,marginTop:4},unread:{width:19,height:19,borderRadius:10,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center"},unreadText:{color:colors.black,fontWeight:"900",fontSize:8},directChat:{padding:18,gap:12,flexGrow:1},received:{alignSelf:"flex-start",maxWidth:"82%",backgroundColor:colors.raised,padding:13},sentBubble:{alignSelf:"flex-end",maxWidth:"82%",backgroundColor:colors.gold,padding:13},bubbleText:{color:colors.textSoft,fontSize:12,lineHeight:17},sentBubbleText:{color:colors.black,fontSize:12,lineHeight:17},bubbleTime:{color:colors.muted,fontSize:7,marginTop:7},sentBubbleTime:{color:"#55451F",fontSize:7,marginTop:7},profileCard:{alignItems:"center",gap:9,borderTopWidth:2,borderTopColor:colors.gold},profileAvatar:{width:70,height:70,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center"},profileInitials:{color:colors.black,fontSize:22,fontWeight:"900"},profileName:{color:colors.text,fontWeight:"900",fontStyle:"italic",fontSize:22},profileMeta:{color:colors.muted,fontSize:7,letterSpacing:.8},focusPills:{flexDirection:"row",gap:6,marginVertical:6},focusPill:{color:colors.gold,borderWidth:1,borderColor:"#4E4328",backgroundColor:colors.goldSoft,paddingHorizontal:8,paddingVertical:5,fontSize:7,fontWeight:"800"},settingRow:{minHeight:72,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:colors.line},settingTitle:{color:colors.textSoft,fontSize:11,fontWeight:"700"},settingText:{color:colors.muted,fontSize:8,marginTop:4},operations:{minHeight:72,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:"#493F29",backgroundColor:"#151510",padding:13,marginVertical:8},operationsTitle:{color:colors.text,fontWeight:"900",fontSize:10,letterSpacing:.6},operationsText:{color:colors.muted,fontSize:8,marginTop:4},version:{color:colors.mutedDark,textAlign:"center",fontSize:7,letterSpacing:.8,marginTop:13},tabBar:{height:82,paddingBottom:20,borderTopWidth:1,borderTopColor:colors.line,backgroundColor:colors.black,flexDirection:"row"},tab:{flex:1,alignItems:"center",justifyContent:"center",gap:4},tabIconActive:{position:"relative"},tabLabel:{color:colors.muted,fontSize:6.2,fontWeight:"700",letterSpacing:.15},tabLabelActive:{color:colors.gold},messageDot:{position:"absolute",right:-4,top:-2,width:6,height:6,borderRadius:3,backgroundColor:colors.gold}
});
