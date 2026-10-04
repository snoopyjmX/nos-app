import React from 'react';
import { LegalDocumentView } from '@/components/ui/LegalDocumentView';
import { TERMS_TEXT } from '@/constants/legal/terms';

export default function TermsScreen() {
  return <LegalDocumentView title="Termos de Uso" text={TERMS_TEXT} />;
}
