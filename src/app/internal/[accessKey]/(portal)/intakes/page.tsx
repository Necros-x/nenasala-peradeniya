import IntakesManager from "@/features/admin/pages/admin/IntakesManager";
import { getAdminIntakes } from "@/lib/services/intakes";
import { getAdminProgrammes } from "@/lib/services/programmes";
import { hasValidDemoSession, isAdminDemoEnabled } from "@/lib/demo/session";
export default async function Page({params}:{params:Promise<{accessKey:string}>}){const {accessKey}=await params;const [intakes,programmes,demo]=await Promise.all([getAdminIntakes(),getAdminProgrammes(),hasValidDemoSession()]);return <IntakesManager intakes={intakes} programmes={programmes} accessKey={accessKey} readOnlyDemo={isAdminDemoEnabled()&&demo}/>;}
