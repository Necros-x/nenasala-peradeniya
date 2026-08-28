import "server-only";
import { createClient } from "@/lib/supabase/server";

export type IntakeStatus =
  | "draft"
  | "upcoming"
  | "open"
  | "closing_soon"
  | "full"
  | "active"
  | "completed"
  | "closed";

export type IntakeRecord = {
  id: string;
  programme_id: string;
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  capacity: number | null;
  status: IntakeStatus;
  created_at: string;
  updated_at: string;
  programme_name: string;
  programme_slug: string;
};

const INTAKE_COLUMNS =
  "id,programme_id,name,slug,start_date,end_date,registration_open_at,registration_close_at,capacity,status,created_at,updated_at,programmes(name,slug)" as const;

function mapIntake(row: any): IntakeRecord {
  const programme = Array.isArray(row.programmes) ? row.programmes[0] : row.programmes;
  return {
    id: row.id,
    programme_id: row.programme_id,
    name: row.name,
    slug: row.slug,
    start_date: row.start_date,
    end_date: row.end_date,
    registration_open_at: row.registration_open_at,
    registration_close_at: row.registration_close_at,
    capacity: row.capacity,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    programme_name: programme?.name ?? "Programme",
    programme_slug: programme?.slug ?? "",
  };
}

export async function getAdminIntakes(): Promise<IntakeRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("intakes")
    .select(INTAKE_COLUMNS)
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Unable to load admin intakes:", error.message);
    return [];
  }

  return (data ?? []).map(mapIntake);
}

export async function getPublicIntakes(): Promise<IntakeRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("intakes")
    .select(INTAKE_COLUMNS)
    .in("status", ["upcoming", "open", "closing_soon", "full", "active"])
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Unable to load public intakes:", error.message);
    return [];
  }

  return (data ?? []).map(mapIntake);
}
