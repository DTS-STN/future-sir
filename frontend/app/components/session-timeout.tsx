import { useEffect, useState } from 'react';

import { useFetchers, useLocation, useNavigation } from 'react-router';

import { useTranslation } from 'react-i18next';
import type { IIdleTimerProps } from 'react-idle-timer';
import { useIdleTimer } from 'react-idle-timer';

import { Button } from '~/components/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';

export interface SessionTimeoutProps extends Required<Pick<IIdleTimerProps, 'promptBeforeIdle' | 'timeout'>> {
  /**
   * Function to call when the session end is triggered.
   */
  onSessionEnd: () => Promise<void> | void;

  /**
   * Function to call when the session extend is triggered.
   */
  onSessionExtend: () => Promise<void> | void;
}

/**
 * SessionTimeout component to handle user session timeout prompts.
 * This component uses the `react-IdleTimer` library to manage idle time and prompt the user
 * before the session expires. It integrates with Remix's to activate the IdleTimer on route changes,
 * fetcher submissions, and form submissions.
 */
export function SessionTimeout({ promptBeforeIdle, timeout, onSessionEnd, onSessionExtend }: SessionTimeoutProps) {
  const { t } = useTranslation(['gcweb']);
  const [timeRemaining, setTimeRemaining] = useState('');

  /**
   * Function to end the session.
   */
  const handleSessionEnd = async () => {
    try {
      await onSessionEnd();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  /**
   * Function to extend the session.
   */
  const handleSessionExtend = async () => {
    try {
      await onSessionExtend();
    } catch (error) {
      console.error('Error extending session:', error);
    }
  };

  const { activate, isPrompted, getRemainingTime } = useIdleTimer({
    // Disable default event listeners; The IdleTimer should only activate during route navigation and form
    // submissions, as these actions will interact with the session and extend its lifespan.
    events: [],
    onIdle: handleSessionEnd,
    promptBeforeIdle,
    timeout,
  });

  // Track the current location and its key for detecting navigation changes.
  const { key: locationKey } = useLocation();

  useEffect(() => {
    // Activate the IdleTimer whenever the location changes (indicating a route navigation).
    activate();
  }, [locationKey, activate]);

  // Track fetcher states to activate the IdleTimer during submissions.
  const fetchers = useFetchers();
  const fetcherSubmitting = fetchers.some(({ state }) => state === 'submitting');

  useEffect(() => {
    // Activate the IdleTimer if any fetcher is submitting.
    if (fetcherSubmitting) {
      activate();
    }
  }, [fetcherSubmitting, activate]);

  // Track Remix's <Form> submission state to activate the IdleTimer during <Form> submissions.
  const navigation = useNavigation();
  const formSubmitting = navigation.state === 'submitting';

  useEffect(() => {
    // Activate the IdleTimer if a <Form> is submitting.
    if (formSubmitting) {
      activate();
    }
  }, [formSubmitting, activate]);

  useEffect(() => {
    const updateRemainingTime = () => {
      const remainingTime = getRemainingTime();
      const minutes = Math.floor(remainingTime / 60_000);
      const seconds = Math.floor((remainingTime % 60_000) / 1_000);
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
    };

    const interval = setInterval(updateRemainingTime, 1000);
    updateRemainingTime(); // Initial call to set the time immediately

    return () => {
      clearInterval(interval);
    };
  }, [getRemainingTime]);

  return (
    <Dialog open={isPrompted()} onOpenChange={(open) => !open && handleSessionExtend()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('gcweb:session-timeout.header')}</DialogTitle>
        </DialogHeader>
        {t('gcweb:session-timeout.description', { timeRemaining })}
        <DialogFooter>
          <Button id="end-session-button" variant="default" size="sm" onClick={handleSessionEnd}>
            {t('gcweb:session-timeout.end-session')}
          </Button>
          <Button id="continue-session-button" variant="primary" size="sm" onClick={handleSessionExtend}>
            {t('gcweb:session-timeout.continue-session')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
