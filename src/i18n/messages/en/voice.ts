import type { MessageTree } from "../../types";

export const voiceMessages: MessageTree = {
  title: "Voice assistant",
  subtitle: "Beta — review details once after recognition",
  testBanner:
    "This feature is in test mode. Always verify amount, category, and date before confirming.",
  processing: "Processing…",
  listening: "Listening…",
  example: 'Example: "Paid 10M for coffee today"',
  typePlaceholder: "Or type your message here…",
  recognizedText: "Recognized text",
  actionSummary: "Action summary",
  confidence: "Confidence: {{percent}}%",
  cannotExecute: "Command cannot be executed — speak more clearly or edit the text.",
  recording: "Recording…",
  startRecording: "Start recording",
  analyzeText: "Analyze text",
  executing: "Executing…",
  confirmExecute: "Confirm & run",
  cancelAction: "Cancel",
  newCommand: "New command",
  interpretError: "Failed to interpret command",
  executeError: "Failed to execute command",
};
