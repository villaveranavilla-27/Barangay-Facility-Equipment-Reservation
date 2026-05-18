import { createClient } from "@/utils/supabase/server";

export default async function SupabaseExamplePage() {
  const supabase = createClient();
  const { data: todos, error } = await supabase.from("todos").select();

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Supabase Example</h1>
        <p className="mt-4 text-sm text-red-600">
          Failed to load todos: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Supabase Example</h1>
      <ul className="mt-4 list-disc pl-6">
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </main>
  );
}
