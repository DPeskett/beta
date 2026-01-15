import useTasks from "../hooks/useTasks";
import AddTaskForm from "../components/AddTaskForm";
import Column from "../components/Column";

export default function Dashboard() {
  const { tasks, addTask } = useTasks();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <AddTaskForm onAdd={addTask} />

      <div className="flex gap-4">
        <Column title="To Do" status="todo" tasks={tasks} />
        <Column title="Doing" status="doing" tasks={tasks} />
        <Column title="Done" status="done" tasks={tasks} />
      </div>
    </div>
  );
}