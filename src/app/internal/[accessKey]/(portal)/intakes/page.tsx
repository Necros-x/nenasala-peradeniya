import IntakesManager from "@/features/admin/pages/admin/IntakesManager";
import { getAdminIntakes } from "@/lib/services/intakes";
import { getAdminProgrammes } from "@/lib/services/programmes";

export default async function Page({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const [intakes, programmes] = await Promise.all([getAdminIntakes(), getAdminProgrammes()]);
  return <IntakesManager intakes={intakes} programmes={programmes} accessKey={accessKey} readOnlyDemo={false} />;
}
