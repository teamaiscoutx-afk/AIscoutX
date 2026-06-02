"use client";

import { AnimatePresence, motion } from "framer-motion";

type CopyToastProps = {
  visible: boolean;
  message?: string;
};

export function CopyToast({ visible, message = "Copied!" }: CopyToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full border border-[#deff9a]/30 bg-[#0a0a0f]/95 px-4 py-2 text-sm font-medium text-[#deff9a] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          role="status"
          aria-live="polite"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
