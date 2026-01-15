export default function TaskCard({ task }) {
  return (
    <div className="p-3 bg-gray-200 rounded shadow">
      {task.title}
    </div>
  );
}