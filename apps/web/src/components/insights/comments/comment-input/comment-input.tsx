/* eslint-disable @typescript-eslint/no-shadow -- this is fine*/
/* eslint-disable import/no-named-as-default -- this is fine */
'use client';

import Document from '@tiptap/extension-document';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { EditorContent, useEditor } from '@tiptap/react';
import { type ReactNode, useEffect } from 'react';
import suggestion from './suggestion';
import './editor.scss';

interface PropsType {
  disabled: boolean;
  placeholder: string;
  maxLength: number;
  content: string;
  onContentChanged: (content: string) => void;
  onContentLengthChanged: (length: number) => void;
  onCtrlEnter: (content: string) => void;
  onSubmit: (content: string) => void;
  setCommentInputContentTemp: (content: string) => void;
}

export default function CommentInput(props: PropsType): ReactNode {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        placeholder: props.placeholder,
        showOnlyWhenEditable: false,
      }),
      Mention.configure({
        suggestion,
      }),
    ],
    immediatelyRender: false, // SSR warning fix
    content: ``,
    onUpdate({ editor }) {
      const text = editor.getText();

      // Update the parent component with the current content of the editor
      props.onContentLengthChanged(text.length);
      props.setCommentInputContentTemp(editor.getHTML());

      if (text.length > props.maxLength) {
        const truncatedText = text.slice(0, props.maxLength);
        editor.commands.setContent(truncatedText, true);
      }
    },
    editorProps: {
      handleKeyDown(_, event) {
        // Call the function on Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          if (editor) {
            const content = editor.getHTML();
            props.onSubmit(content);
          }
        }
      },
    },
  });

  // Sync the editor content with props.content
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(props.content);
    }
  }, [props.content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setOptions({ editable: !props.disabled });
    }
  }, [props.disabled, editor]);

  if (!editor) {
    return null;
  }
  return <EditorContent editor={editor} />;
}
