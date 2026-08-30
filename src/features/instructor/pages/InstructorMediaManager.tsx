"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, PlayCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { InstructorTeachingData, TeachingLiveSession, TeachingRecording } from "@/lib/services/instructor-teaching";
import { saveTeachingLiveSessionAction, saveTeachingRecordingAction } from "@/lib/actions/instructor/teaching";

const field = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";
const area = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";

export default function InstructorMediaManager({ data, accessKey }: { data: InstructorTeachingData; accessKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"live" | "recordings">("live");
  function run(action: (fd: FormData) => Promise<{ok:boolean;error?:string}>, formData: FormData, success: string) {
    formData.set("accessKey", accessKey);
    startTransition(async () => { const result = await action(formData); if (!result.ok) return void toast.error(result.error ?? "Unable to save."); toast.success(success); router.refresh(); });
  }

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-primary">Teaching tools</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">Live Sessions & Recordings</h1><p className="mt-1 text-text-secondary">Schedule live classes, publish recordings and assign them to your classes.</p></div>
      <div className="inline-flex rounded-full border border-border bg-surface p-1"><button onClick={() => setTab("live")} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "live" ? "bg-brand-primary text-[var(--color-static-white)]" : "text-text-secondary"}`}>Live sessions</button><button onClick={() => setTab("recordings")} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "recordings" ? "bg-brand-primary text-[var(--color-static-white)]" : "text-text-secondary"}`}>Recordings</button></div>
      {tab === "live" ? <LiveSection data={data} pending={pending} run={run} /> : <RecordingSection data={data} pending={pending} run={run} />}
    </div>
  );
}

function LiveSection({ data, pending, run }: { data: InstructorTeachingData; pending: boolean; run: any }) {
  return <div className="space-y-5">
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1"><form className="grid gap-4 rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const fd = new FormData(event.currentTarget); run(saveTeachingLiveSessionAction, fd, "Live session scheduled."); event.currentTarget.reset(); }}>
      <div className="md:col-span-2 flex items-center gap-2"><Plus className="h-5 w-5 text-brand-primary" /><h2 className="text-lg font-bold text-text-primary">Schedule live session</h2></div>
      <Select label="Class" name="class_id" options={data.classes.map((row) => ({value:row.id,label:`${row.name} · ${row.course_title}`}))} />
      <Input label="Title" name="title" required />
      <Input label="Starts" name="starts_at" type="datetime-local" required />
      <Input label="Ends" name="ends_at" type="datetime-local" />
      <Input label="Provider" name="provider" placeholder="Zoom / Google Meet / Teams" />
      <Input label="Meeting reference" name="meeting_reference" placeholder="Optional meeting ID" />
      <Input label="Join URL" name="join_url" type="url" placeholder="https://..." />
      <Select label="Status" name="status" defaultValue="scheduled" options={["scheduled","live","completed","cancelled"].map((v)=>({value:v,label:cap(v)}))} />
      <label className="md:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span><textarea name="description" rows={2} className={area} /></label>
      <div className="md:col-span-2"><button disabled={pending || data.classes.length === 0} className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">Schedule session</button></div>
    </form></section>
    <div className="grid gap-3 lg:grid-cols-2">{data.liveSessions.map((session) => <LiveCard key={session.id} session={session} data={data} pending={pending} run={run} />)}</div>
  </div>;
}

function LiveCard({ session, data, pending, run }: { session: TeachingLiveSession; data: InstructorTeachingData; pending:boolean; run:any }) {
  return <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-1"><div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-text-primary">{session.title}</h3><p className="mt-1 text-xs text-text-secondary">{new Date(session.starts_at).toLocaleString()}</p></div><span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold capitalize text-text-secondary">{session.status}</span></div>
    <details className="mt-3 rounded-md border border-border bg-background p-3"><summary className="cursor-pointer list-none text-xs font-bold text-brand-primary">Edit session</summary><form className="mt-3 grid gap-3" onSubmit={(event)=>{event.preventDefault();const fd=new FormData(event.currentTarget);fd.set("id",session.id);run(saveTeachingLiveSessionAction,fd,"Live session updated.");}}>
      <Select label="Class" name="class_id" defaultValue={session.class_id} options={data.classes.map((row)=>({value:row.id,label:`${row.name} · ${row.course_title}`}))}/><Input label="Title" name="title" required defaultValue={session.title}/><Input label="Starts" name="starts_at" type="datetime-local" defaultValue={localDateTime(session.starts_at)} required/><Input label="Ends" name="ends_at" type="datetime-local" defaultValue={localDateTime(session.ends_at)}/><Input label="Provider" name="provider" defaultValue={session.provider ?? ""}/><Input label="Meeting reference" name="meeting_reference" defaultValue={session.meeting_reference ?? ""}/><Input label="Join URL" name="join_url" type="url" defaultValue={session.join_url ?? ""}/><Select label="Status" name="status" defaultValue={session.status} options={["scheduled","live","completed","cancelled"].map((v)=>({value:v,label:cap(v)}))}/><label><span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span><textarea name="description" rows={2} defaultValue={session.description ?? ""} className={area}/></label><button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-[var(--color-static-white)]">Save session</button>
    </form></details></div></article>;
}

function RecordingSection({ data, pending, run }: { data: InstructorTeachingData; pending:boolean; run:any }) {
  const [courseId, setCourseId] = useState(data.courses[0]?.id ?? "");
  const classes = useMemo(()=>data.classes.filter((row)=>row.course_id===courseId),[data.classes,courseId]);
  const sessions = useMemo(()=>data.liveSessions.filter((row)=>classes.some((c)=>c.id===row.class_id)),[data.liveSessions,classes]);
  return <div className="space-y-5">
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1"><form className="grid gap-4 rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 md:grid-cols-2" onSubmit={(event)=>{event.preventDefault();const fd=new FormData(event.currentTarget);run(saveTeachingRecordingAction,fd,"Recording saved.");event.currentTarget.reset();}}>
      <div className="md:col-span-2 flex items-center gap-2"><Plus className="h-5 w-5 text-brand-primary"/><h2 className="text-lg font-bold text-text-primary">Add recording</h2></div>
      <Select label="Course" name="course_id" value={courseId} onChange={setCourseId} options={data.courses.map((row)=>({value:row.id,label:row.title}))}/><Input label="Title" name="title" required/><Select label="Source type" name="source_type" defaultValue="external" options={["external","live_session","uploaded","legacy"].map((v)=>({value:v,label:cap(v.replace("_"," "))}))}/><Select label="Status" name="status" defaultValue="published" options={["draft","processing","published","archived"].map((v)=>({value:v,label:cap(v)}))}/><Select label="Source class" name="source_class_id" options={[{value:"",label:"None"},...classes.map((row)=>({value:row.id,label:row.name}))]}/><Select label="Source live session" name="source_live_session_id" options={[{value:"",label:"None"},...sessions.map((row)=>({value:row.id,label:row.title}))]}/><Input label="Playback URL" name="playback_url" type="url" placeholder="https://..."/><Input label="Provider" name="provider" placeholder="YouTube / Vimeo / Drive / etc."/><Input label="Recorded at" name="recorded_at" type="datetime-local"/><Input label="Duration (minutes)" name="duration_minutes" type="number"/><label className="md:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span><textarea name="description" rows={2} className={area}/></label>
      <ClassChecks classes={classes} selected={[]} />
      <div className="md:col-span-2"><button disabled={pending || !courseId} className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">Save recording</button></div>
    </form></section>
    <div className="grid gap-3 lg:grid-cols-2">{data.recordings.map((recording)=><RecordingCard key={recording.id} recording={recording} data={data} pending={pending} run={run}/>)}</div>
  </div>;
}

function RecordingCard({ recording, data, pending, run }: { recording:TeachingRecording;data:InstructorTeachingData;pending:boolean;run:any }) {
  const classes=data.classes.filter((row)=>row.course_id===recording.course_id); const sessions=data.liveSessions.filter((row)=>classes.some((c)=>c.id===row.class_id));
  return <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-1"><div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-text-primary">{recording.title}</h3><p className="mt-1 text-xs text-text-secondary">{data.courses.find((c)=>c.id===recording.course_id)?.title ?? "Course"}</p></div><span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold capitalize text-text-secondary">{recording.status}</span></div>
    <details className="mt-3 rounded-md border border-border bg-background p-3"><summary className="cursor-pointer list-none text-xs font-bold text-brand-primary">Edit recording</summary><form className="mt-3 grid gap-3" onSubmit={(event)=>{event.preventDefault();const fd=new FormData(event.currentTarget);fd.set("id",recording.id);fd.set("course_id",recording.course_id);run(saveTeachingRecordingAction,fd,"Recording updated.");}}>
      <Input label="Title" name="title" required defaultValue={recording.title}/><Select label="Source type" name="source_type" defaultValue={recording.source_type} options={["external","live_session","uploaded","legacy"].map((v)=>({value:v,label:cap(v.replace("_"," "))}))}/><Select label="Status" name="status" defaultValue={recording.status} options={["draft","processing","published","archived"].map((v)=>({value:v,label:cap(v)}))}/><Select label="Source class" name="source_class_id" defaultValue={recording.source_class_id ?? ""} options={[{value:"",label:"None"},...classes.map((row)=>({value:row.id,label:row.name}))]}/><Select label="Source live session" name="source_live_session_id" defaultValue={recording.source_live_session_id ?? ""} options={[{value:"",label:"None"},...sessions.map((row)=>({value:row.id,label:row.title}))]}/><Input label="Playback URL" name="playback_url" type="url" defaultValue={recording.playback_url ?? ""}/><Input label="Provider" name="provider" defaultValue={recording.provider ?? ""}/><Input label="Recorded at" name="recorded_at" type="datetime-local" defaultValue={localDateTime(recording.recorded_at)}/><Input label="Duration (minutes)" name="duration_minutes" type="number" defaultValue={recording.duration_seconds == null ? "" : String(Math.round(recording.duration_seconds/60))}/><label><span className="mb-1.5 block text-sm font-semibold text-text-primary">Description</span><textarea name="description" rows={2} defaultValue={recording.description ?? ""} className={area}/></label><ClassChecks classes={classes} selected={recording.class_ids}/><button disabled={pending} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-[var(--color-static-white)]">Save recording</button>
    </form></details></div></article>;
}

function ClassChecks({ classes, selected }: { classes: InstructorTeachingData["classes"]; selected:string[] }) { return <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold text-text-primary">Available to classes</legend><div className="grid gap-2 sm:grid-cols-2">{classes.map((row)=><label key={row.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-secondary"><input type="checkbox" name="class_ids" value={row.id} defaultChecked={selected.includes(row.id)} className="accent-[var(--color-primary)]"/>{row.name}</label>)}</div></fieldset>; }
function Input({label,name,type="text",required,defaultValue,placeholder}:{label:string;name:string;type?:string;required?:boolean;defaultValue?:string;placeholder?:string}) { return <label><span className="mb-1.5 block text-sm font-semibold text-text-primary">{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} className={field}/></label>; }
function Select({label,name,options,value,onChange,defaultValue}:{label:string;name:string;options:{value:string;label:string}[];value?:string;onChange?:(value:string)=>void;defaultValue?:string}) { return <label><span className="mb-1.5 block text-sm font-semibold text-text-primary">{label}</span><select name={name} className={field} value={value} defaultValue={value===undefined?defaultValue:undefined} onChange={onChange?(e)=>onChange(e.target.value):undefined}>{options.map((o)=><option key={`${name}-${o.value}`} value={o.value}>{o.label}</option>)}</select></label>; }
function cap(value:string){return value ? value[0].toUpperCase()+value.slice(1) : value;}
function localDateTime(value:string|null){ if(!value)return ""; const date=new Date(value); const offset=date.getTimezoneOffset()*60000; return new Date(date.getTime()-offset).toISOString().slice(0,16); }
