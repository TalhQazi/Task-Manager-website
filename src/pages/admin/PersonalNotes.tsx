import React from "react";
import PersonalNotes from "@/components/shared/PersonalNotes";
import { apiFetch } from "@/lib/api";

export default function AdminPersonalNotes() {
  const getNotes = () => apiFetch<{ items: any[] }>("/api/notes");
  const createNote = (payload: any) => apiFetch<{ item: any }>("/api/notes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const updateNote = (id: string, payload: any) => apiFetch<{ item: any }>(`/api/notes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  const deleteNote = (id: string) => apiFetch(`/api/notes/${encodeURIComponent(id)}`, {
     method: "DELETE"
  });

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Personal Workspace</h1>
        <p className="text-muted-foreground">Keep your private notes and reminders in one place.</p>
      </div>
      <PersonalNotes 
        getNotes={getNotes}
        createNote={createNote}
        updateNote={updateNote}
        deleteNote={deleteNote}
      />
    </div>
  );
}
