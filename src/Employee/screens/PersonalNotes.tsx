import React from "react";
import PersonalNotes from "@/components/shared/PersonalNotes";
import { 
  getPersonalNotes, 
  createPersonalNote, 
  updatePersonalNote, 
  deletePersonalNote 
} from "../lib/api";

export default function EmployeePersonalNotes() {
  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Private Notes</h1>
        <p className="text-muted-foreground text-sm">Personal space for your thoughts. Private to you only.</p>
      </div>
      <PersonalNotes 
        getNotes={getPersonalNotes}
        createNote={createPersonalNote}
        updateNote={updatePersonalNote}
        deleteNote={deletePersonalNote}
      />
    </div>
  );
}
