// /delivery/legal/:type -> <SharedLegalPage category="delivery" /> on the web
import React from 'react';
import LegalPage from './LegalPage';

export default function DeliveryLegal() {
  return <LegalPage category="delivery" />;
}
