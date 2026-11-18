// Port of shared/components/Skeletons/OrderCardSkeleton.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { Box, Scroll } from '../../ui/primitives';

/**
 * OrderCardSkeleton - Loading placeholder for order cards
 */
const OrderCardSkeleton = () => {
  return <Box className="animate-pulse bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
      <Box className="flex justify-between items-start">
        <Box className="space-y-2">
          <Box className="h-3 w-20 bg-slate-200 rounded" />
          <Box className="h-4 w-32 bg-slate-200 rounded" />
        </Box>
        <Box className="h-8 w-8 bg-slate-200 rounded-xl" />
      </Box>
      <Box className="space-y-2">
        <Box className="h-3 w-full bg-slate-100 rounded" />
        <Box className="h-3 w-3/4 bg-slate-100 rounded" />
      </Box>
      <Box className="flex justify-between items-center pt-2 border-t border-slate-50">
        <Box className="h-3 w-16 bg-slate-200 rounded" />
        <Box className="h-8 w-24 bg-slate-200 rounded-xl" />
      </Box>
    </Box>;
};
export default OrderCardSkeleton;