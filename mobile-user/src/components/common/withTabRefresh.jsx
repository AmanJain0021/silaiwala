// Bottom-tab screens stay mounted; reload one when the user comes back to it after a while
// (e.g. the Orders list after placing an order), as the web does on every page open.
import React from 'react';
import useRefreshOnReturn from '../../lib/useRefreshOnReturn';

export default function withTabRefresh(ScreenComponent) {
  const Tab = (props) => {
    const key = useRefreshOnReturn();
    return <ScreenComponent key={key} {...props} />;
  };
  Tab.displayName = `withTabRefresh(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Tab;
}
