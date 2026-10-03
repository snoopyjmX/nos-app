import React from 'react';
import { LegalDocumentView } from '@/components/ui/LegalDocumentView';
import { PRIVACY_TEXT } from '@/constants/legal/privacy';

export default function PrivacyScreen() {
  return <LegalDocumentView title="Política de Privacidade" text={PRIVACY_TEXT} />;
}
