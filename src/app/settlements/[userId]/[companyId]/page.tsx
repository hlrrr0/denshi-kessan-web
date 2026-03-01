"use client";

import { useParams } from "next/navigation";
import SettlementDetail from "@/components/SettlementDetail";

export default function SettlementDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const companyId = params.companyId as string;

  return <SettlementDetail userId={userId} companyId={companyId} />;
}
