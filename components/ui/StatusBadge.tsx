import { ProjectStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ProjectStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: ProjectStatus) => {
    switch (status) {
      case "idea":
        return "bg-surface-tint text-content-secondary";
      case "in_progress":
        return "bg-blue-50 text-blue-600";
      case "deployed":
        return "bg-green-50 text-green-600";
      case "paused":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-surface-tint text-content-secondary";
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case "idea": return "Idea";
      case "in_progress": return "In Progress";
      case "deployed": return "Deployed";
      case "paused": return "Paused";
      default: return status;
    }
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}
