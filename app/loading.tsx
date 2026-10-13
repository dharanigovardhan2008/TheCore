import React from "react";
import { CenteredLoader } from "@/components/ui/LoadingOrb";

export default function RootLoading() {
  return <CenteredLoader minHeight="min-h-[100dvh]" size={64} state="listening" />;
}
