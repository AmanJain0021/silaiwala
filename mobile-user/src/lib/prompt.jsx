// window.prompt replacement: `const v = await prompt(message)` -> string | null. <PromptHost/> is mounted in app/_layout.
import React, { useState } from 'react';
import { create } from 'zustand';
import { Dialog } from '../components/ui/Sheet';
import { Box, Txt, Btn, Input } from '../components/ui/primitives';

const usePromptStore = create((set) => ({ req: null, set: (req) => set({ req }) }));

export const prompt = (message, defaultValue = '') =>
  new Promise((resolve) => usePromptStore.getState().set({ message, defaultValue, resolve }));

export function PromptHost() {
  const req = usePromptStore((s) => s.req);
  const [value, setValue] = useState('');
  const [lastReq, setLastReq] = useState(null);
  if (req !== lastReq) {
    setLastReq(req);
    setValue(req?.defaultValue || '');
  }
  const done = (v) => {
    req?.resolve(v);
    usePromptStore.getState().set(null);
  };
  return (
    <Dialog visible={!!req} onClose={() => done(null)} className="bg-white rounded-2xl w-full max-w-sm p-5">
      <Txt className="text-sm font-bold text-gray-900 mb-3">{req?.message}</Txt>
      <Input value={value} onChangeText={setValue} autoFocus multiline className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 min-h-[72px]" />
      <Box className="flex flex-row justify-end gap-2 mt-4">
        <Btn onPress={() => done(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600">Cancel</Btn>
        <Btn onPress={() => done(value)} className="px-4 py-2 rounded-lg bg-[#843D9B] text-white text-sm font-bold">OK</Btn>
      </Box>
    </Dialog>
  );
}
