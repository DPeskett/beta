import TaskCard from "./TaskCard";

export default function Column({ title, status, tasks }) {
  const filtered = tasks.filter(t => t.status === status);

  return (
    <div className="bg-white p-4 rounded shadow w-80">
      <h2 className="font-bold mb-3">{title}</h2>

      <div className="flex flex-col gap-3">
        {filtered.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}