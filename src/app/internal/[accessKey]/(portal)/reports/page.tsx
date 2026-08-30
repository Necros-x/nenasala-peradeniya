import AdminAnalytics from "@/features/admin/pages/admin/AdminAnalytics";
import {
  getAdminAnalyticsData,
  type AnalyticsRange,
} from "@/lib/services/admin-analytics";

export const dynamic = "force-dynamic";

const ranges = new Set<AnalyticsRange>([30, 90, 180, 365]);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.range);
  const range = ranges.has(requested as AnalyticsRange)
    ? (requested as AnalyticsRange)
    : 90;

  const data = await getAdminAnalyticsData(range);
  return <AdminAnalytics data={data} />;
}
