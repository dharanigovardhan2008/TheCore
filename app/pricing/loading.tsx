import React from "react";
import { CenteredLoader } from "@/components/ui/LoadingOrb";

export default function PricingLoading() {
  return <CenteredLoader minHeight="min-h-[80vh]" size={64} state="listening" />;
}
