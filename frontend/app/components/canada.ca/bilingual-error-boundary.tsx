import { Link, Links, Meta, Scripts } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from '../../+types/root';
import { PageTitle } from '~/components/page-title';
import { isCodedError } from '~/errors/coded-error';

/**
 * A bilingual error boundary that renders appropriate error messages in both languages.
 *
 * **Important Note:**
 *
 * React Router error boundaries should be designed to be as robust as possible.
 * If an error boundary itself throws an error, there's no subsequent error
 * boundary to catch and render it, potentially leading to infinite error loops.
 */
export function BilingualErrorBoundary({ actionData, error, loaderData, params }: Route.ErrorBoundaryProps) {
  const { i18n } = useTranslation(['gcweb']);
  const en = i18n.getFixedT('en');
  const fr = i18n.getFixedT('fr');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className="border-b-[3px] border-slate-700 print:hidden">
          <div id="wb-bnr">
            <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
              <Link to="https://canada.ca/">
                <img
                  className="h-8 w-auto"
                  src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/sig-blk-en.svg"
                  alt={`${en('gcweb:header.govt-of-canada.text')} / ${fr('gcweb:header.govt-of-canada.text')}`}
                  width="300"
                  height="28"
                  decoding="async"
                />
              </Link>
            </div>
          </div>
        </header>
        <main className="container">
          <div className="grid grid-cols-1 gap-6 py-2.5 sm:grid-cols-2 sm:py-3.5">
            <div id="english" lang="en">
              <PageTitle className="my-8">
                <span>{en('gcweb:server-error.page-title')}</span>
                <small className="block text-2xl font-normal text-neutral-500">
                  {en('gcweb:server-error.page-subtitle', { statusCode: isCodedError(error) ? error.statusCode : 500 })}
                </small>
              </PageTitle>
              <p className="mb-8 text-lg text-gray-500">{en('gcweb:server-error.page-message')}</p>
              {isCodedError(error) && (
                <ul className="list-disc pl-10 text-gray-800">
                  <li>
                    <Trans
                      t={en}
                      i18nKey="gcweb:server-error.error-code"
                      components={{ span: <span className="font-mono" />, strong: <strong className="font-semibold" /> }}
                      values={{ errorCode: error.errorCode }}
                    />
                  </li>
                  <li>
                    <Trans
                      t={en}
                      i18nKey="gcweb:server-error.correlation-id"
                      components={{ span: <span className="font-mono" />, strong: <strong className="font-semibold" /> }}
                      values={{ correlationId: error.correlationId }}
                    />
                  </li>
                </ul>
              )}
            </div>
            <div id="french" lang="fr">
              <PageTitle className="my-8">
                <span>{fr('gcweb:server-error.page-title')}</span>
                <small className="block text-2xl font-normal text-neutral-500">
                  {fr('gcweb:server-error.page-subtitle', { statusCode: isCodedError(error) ? error.statusCode : 500 })}
                </small>
              </PageTitle>
              <p className="mb-8 text-lg text-gray-500">{fr('gcweb:server-error.page-message')}</p>
              {isCodedError(error) && (
                <ul className="list-disc pl-10 text-gray-800">
                  <li>
                    <Trans
                      t={fr}
                      i18nKey="gcweb:server-error.error-code"
                      components={{ span: <span className="font-mono" />, strong: <strong className="font-semibold" /> }}
                      values={{ errorCode: error.errorCode }}
                    />
                  </li>
                  <li>
                    <Trans
                      t={fr}
                      i18nKey="gcweb:server-error.correlation-id"
                      components={{ span: <span className="font-mono" />, strong: <strong className="font-semibold" /> }}
                      values={{ correlationId: error.correlationId }}
                    />
                  </li>
                </ul>
              )}
            </div>
          </div>
        </main>
        <footer id="wb-info" tabIndex={-1} className="mt-8 bg-stone-50 print:hidden">
          <div className="container flex items-center justify-end gap-6 py-2.5 sm:py-3.5">
            <div>
              <h2 className="sr-only">
                <span lang="en">{en('gcweb:footer.about-site')}</span> / <span lang="fr">{fr('gcweb:footer.about-site')}</span>
              </h2>
              <div>
                <img
                  src="https://www.canada.ca/etc/designs/canada/wet-boew/assets/wmms-blk.svg"
                  alt={`${en('gcweb:footer.gc-symbol')} / ${fr('gcweb:footer.gc-symbol')}`}
                  width={300}
                  height={71}
                  className="h-10 w-auto"
                />
              </div>
            </div>
          </div>
        </footer>
        <Scripts nonce={loaderData?.nonce} />
        <script //
          nonce={loaderData?.nonce}
          src={`/api/client-env?v=${loaderData?.clientEnvRevision}`}
          suppressHydrationWarning={true}
        />
      </body>
    </html>
  );
}
