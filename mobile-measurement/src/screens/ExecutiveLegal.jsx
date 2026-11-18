// /executive/legal/:type -> <SharedLegalPage category="executive" /> on the web
import React from 'react';
import LegalPage from './LegalPage';

export default function ExecutiveLegal() {
  return <LegalPage category="executive" />;
}
