import { Injectable } from '@nestjs/common';

import { Note, NewNote } from '@/src/models/notes_model';
import { Backupable } from '@/src/utils/backuppable';

export interface NotesRequestOutput {
  notes: Note[];
  morePages: boolean;
}

export interface GetNotesInput {
  page?: number;
  pagination?: number;
}

@Injectable()
export abstract class NotesService implements Backupable {
  abstract getNotes(input?: GetNotesInput): Promise<NotesRequestOutput>;

  abstract getById(id: string): Promise<Note>;

  abstract addNote(newNote: NewNote): Promise<Note>;

  abstract updateNote(updatedNote: Note): Promise<Note>;

  abstract deleteNote(id: string): Promise<Note>;

  abstract backup(): Promise<void>;
}
