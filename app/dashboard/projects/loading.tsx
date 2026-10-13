import React from "react";
import { CenteredLoader } from "@/components/ui/LoadingOrb";

export default function ProjectsLoading() {
  return <CenteredLoader minHeight="min-h-[70vh]" size={64} state="listening" />;
}
