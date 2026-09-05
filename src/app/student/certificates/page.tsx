import Certificates from "@/features/student/pages/Certificates";
import RealCertificates from "@/features/student/pages/RealCertificates";
import { hasRealStudentSession } from "@/lib/auth/guards";
import { getCurrentStudentCertificates } from "@/lib/services/certificates";

export default async function Page() {
  const localPreview = process.env.NODE_ENV !== "production" && process.env.LOCAL_UI_BYPASS === "true";
  const [realStudent] = await Promise.all([
    hasRealStudentSession()
  ]);

  if (!realStudent && (localPreview)) return <Certificates />;

  const certificates = await getCurrentStudentCertificates();
  return <RealCertificates certificates={certificates} />;
}
