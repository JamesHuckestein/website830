"use client";

type SubmitModalProps = {
  success: boolean;
  message: string;
  onDismiss: () => void;
};

export function SubmitModal({ success, message, onDismiss }: SubmitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-xl">
        <h2 className={`text-lg font-semibold ${success ? "text-[#032147]" : "text-red-700"}`}>
          {success ? "Success" : "Error"}
        </h2>
        <p className="text-sm text-[#888888]">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
