import { TaskDashboard } from '@plugins/task/frontend/TaskDashboard';

export default async function TasksPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <TaskDashboard clubId={resolvedParams.slug} />;
}
