import { atom } from 'jotai';

interface EditedComment {
  id: string;
  body: string;
}

export const editedCommentAtom = atom<EditedComment | null>(null);
