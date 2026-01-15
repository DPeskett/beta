import { useState } from "react";

export default function useTasks() {
  const [tasks, setTasks] = useState([
    // Example starter tasks
    { id: crypto.randomUUID(), title: "Sample Task", status: "todo" }
  ]);

  const addTask = (title) => {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      status: "todo"
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id, updates) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  return { tasks, addTask, updateTask };
}