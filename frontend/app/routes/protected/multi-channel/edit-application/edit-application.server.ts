import 'express-session';

import { getSinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { i18nRedirect } from '~/.server/utils/route-utils';

declare module 'express-session' {
  interface SessionData {
    editingCase: SinCaseDto;
  }
}

export function getEditingSinCase(request: Request, session: AppSession, caseId: string): SinCaseDto {
  const editingCase = session.editingCase;
  if (!editingCase) {
    throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request, {
      params: { caseId: caseId },
    });
  }
  if (editingCase.caseId !== caseId) {
    throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request, {
      params: { caseId: editingCase.caseId },
    });
  }
  return editingCase;
}

export async function fetchSinCase(session: AppSession, caseId: string) {
  if (session.editingCase && session.editingCase.caseId === caseId) {
    return session.editingCase;
  }
  return await getSinCaseService().getSinCaseById(caseId);
}

export function cleanupEditingSinCase(session: AppSession) {
  session.editingCase = undefined;
}
