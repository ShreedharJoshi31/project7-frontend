"use client";

import {
  BlockNoteEditor,
  filterSuggestionItems,
  PartialBlock,
} from "@blocknote/core";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const insertPromptItem = (editor: BlockNoteEditor) => ({
  title: "Generate the answer",
  onItemClick: async () => {
    const currentBlock = editor.getTextCursorPosition().block;

    // Insert a prompt input block as heading 2
    const promptBlock: PartialBlock = {
      type: "heading",
      props: { level: 2 },
      // content: [
      //   {
      //     type: "text",
      //     text: "Enter your prompt here and press Enter to generate",
      //     styles: {},
      //   },
      // ],
    };

    const insertedPromptBlock = editor.insertBlocks(
      [promptBlock],
      currentBlock,
      "after",
    )[0];

    // Focus the newly inserted block
    editor.setTextCursorPosition(insertedPromptBlock, "end");

    // Add a small delay to avoid capturing the initial Enter keypress
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create a promise that resolves when Enter is pressed
    const getPromptText = () =>
      new Promise<string>((resolve, reject) => {
        let isFirstInput = true;

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();

            // Get the current block content
            const block = editor.getBlock(insertedPromptBlock);
            const promptText = block.content
              .map((item) => item.text)
              .join("")
              .trim();

            // If it's still the default text or empty, ignore
            if (
              !promptText ||
              promptText ===
                "Enter your prompt here and press Enter to generate"
            ) {
              return;
            }

            // Remove the event listener
            document.removeEventListener("keydown", handleKeyDown);
            resolve(promptText);
          }
        };

        // Handle the case where user clicks away without submitting
        const handleBlur = () => {
          const block = editor.getBlock(insertedPromptBlock);
          if (!block) {
            document.removeEventListener("keydown", handleKeyDown);
            reject(new Error("Prompt cancelled"));
          }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("blur", handleBlur);
      });

    try {
      // Wait for the prompt input
      const prompt = await getPromptText();

      // Insert a loading block
      const loadingBlock: PartialBlock = {
        type: "paragraph",
        content: [{ type: "text", text: "Loading...", styles: {} }],
      };

      const insertedResponseBlock = editor.insertBlocks(
        [loadingBlock],
        insertedPromptBlock,
        "after",
      )[0];

      const handleWebSocket = () => {
        return new Promise<void>((resolve, reject) => {
          const socket = new WebSocket("ws://localhost:8000/generate");
          let accumulatedText = "";

          socket.onopen = () => {
            const requestPayload = JSON.stringify({ query: prompt });
            socket.send(requestPayload);
          };

          socket.onmessage = async (event) => {
            let rawData;

            rawData = JSON.parse(event.data);
            if (rawData.response === null) {
              // Convert the accumulated text into blocks using tryParseMarkdownToBlocks
              const blocks =
                await editor.tryParseMarkdownToBlocks(accumulatedText);

              // Remove the loading block and insert the parsed blocks
              editor.removeBlocks([insertedResponseBlock]);
              editor.insertBlocks(blocks, insertedPromptBlock, "after");

              socket.close();
              resolve();
              return;
            }

            try {
              const data = rawData;

              let content;
              if (data.response && data.response !== "") {
                content = data.response;
              }

              if (content) {
                accumulatedText += content;
                // Update loading block with accumulated text while streaming
                editor.updateBlock(insertedResponseBlock, {
                  type: "paragraph",
                  content: [
                    { type: "text", text: accumulatedText, styles: {} },
                  ],
                });
              }
            } catch (error) {
              console.error("Failed to parse message:", error);
              console.error("Received data:", rawData);
            }
          };

          socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            reject(error);
            socket.close();
          };
        });
      };

      await handleWebSocket();
    } catch (error) {
      if (error.message !== "Prompt cancelled") {
        console.error("Error handling WebSocket:", error);
      }
    }
  },
  aliases: ["generate", "prompt"],
  group: "Prompt",
  subtext: "Used to send a prompt and receive an answer below.",
});

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const res = await edgestore.publicFiles.upload({
      file,
    });
    return res.url;
  };

  const getCustomSlashMenuItems = (
    editor: BlockNoteEditor,
  ): DefaultReactSuggestionItem[] => [
    insertPromptItem(editor),
    ...getDefaultReactSlashMenuItems(editor),
  ];

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  });

  const handleEditorChange = () => {
    onChange(JSON.stringify(editor.document, null, 2));
  };

  return (
    <div>
      <BlockNoteView
        editable={editable}
        editor={editor}
        slashMenu={false}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;
