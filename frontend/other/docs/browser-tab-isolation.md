# Understanding the `useTabId()` hook

## Overview

The `useTabId()` hook is a custom react hook designed to generate and manage a
unique identifier for each browser tab or window. This identifier is crucial for
applications with multi-page flows, ensuring that user data and application
state remain isolated and consistent across different browser tabs.

By storing a unique id in the browser's **session storage** (which is inherently
unique per tab) and optionally synchronizing it with the URL, `useTabId()`
prevents data conflicts and ensures a consistent user experience when
interacting with the application in multiple tabs simultaneously.

This document explains how `useTabId()` works, clarifies why it's essential for
maintaining data integrity in multi-tab environments, and highlights the
potential problems it solves.

## How the `useTabId()` hook works

The `useTabId()` hook is defined as follows:

```ts
function useTabId(options?: Options): string | undefined;
```

### Key concepts and parameters

The `useTabId()` hook's behavior can be customized using an optional `options`
parameter; an object that allows you to adjust various aspects of its
functionality.

1. **`options` parameter (optional):**

   | Option            | Type    | Default value | Description                                                                                                                   |
   | ----------------- | ------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
   | idSearchParamKey  | string  | `'tid'`       | The query parameter key used to store the tab id in the URL. This allows for URL-based tracking of tab IDs                    |
   | navigate          | boolean | `true`        | Determines whether the hook should automatically update the browser URL with the tab id                                       |
   | reloadDocument    | boolean | `false`       | If navigate is `true`, this option controls whether to force a document reload after updating the URL                         |
   | sessionStorageKey | string  | `'tab-id'`    | The key used to store the tab id in the browser's session storage; this is where the unique id is persistently stored per tab |

1. **Session storage and URL synchronization:**
   `useTabId()` leverages react's `useSyncExternalStore()` hook to maintain
   consistency of the tab id between two key locations:

   - **session storage:** the primary storage for the unique tab id, ensuring
     persistence across page navigations within the same tab (session storage is
     naturally isolated per browser tab).
   - **browser URL (optional):** the hook can optionally synchronize the tab id
     with the URL as a query parameter (ex: `?tid=uniqueId`).

The `useSyncExternalStore()` hook ensures that if the tab id changes in session
storage (though this is primarily managed internally by `useTabId()`), any
component using the hook will re-render to reflect the updated id. If the hook's
`navigate` option is `true`, the hook also updates the URL to include the tab
id.

## Why `useTabId()` is essential: addressing data isolation in multi-tab applications

### Ensuring unique browser tab identification

In applications with multi-page or complex workflows that span multiple screens,
maintaining user session state across pages is crucial. When users open the
application in multiple browser tabs or windows, each tab **necessarily must
represent a separate user session context**.

Without a mechanism to differentiate between tabs, data associated with one tab
could inadvertently interfere with or overwrite data in another tab, leading to
data corruption and a frustrating user experience. `useTabId()` helps to solve
this problem by providing a unique identifier for each tab, effectively
isolating the data context for each instance of your application.

### Leveraging session storage for tab-specific data isolation

By generating and storing a unique tab id in session storage, `useTabId()`
establishes an isolated data space for each tab directly within the user's
browser. This isolation is critical for:

- **preventing data conflicts:** to ensure that actions and data manipulations
  in one tab do not affect the data or state in other tabs
- **maintaining data integrity:** to guarantee that form data, application
  state, and user progress within a multi-page flow remains consistent and
  reliable within the context of a single tab

## The problem of data clobbering: what happens without unique tab ids?

### Understanding data clobbering

If the application relies on a single, non-unique session storage location (or
similar shared storage) to manage data for multi-page flows, we run the risk of
data clobbering. This occurs when multiple tabs or windows of your application
attempt to read and write data to the same storage location simultaneously. The
result is unpredictable and often leads to one tab's data overwriting or
corrupting another's.

### Example scenario: data loss and confusion

Imagine a user completing a multi-page application form and, as many users do,
they open a second tab to potentially refer back to an earlier page or compare
information. Let's illustrate what can go wrong without `useTabId()`:

1. **Tab A: _--form in progress--_:** the user opens the application in Tab A
   and begins filling out a multi-page form. They complete the first page and
   navigate to the second page. The data entered so far is stored in session
   storage (without a unique tab id).
1. **Tab B: _--new form instance--_:** the user opens a new tab (Tab B) and
   navigates to the same application form. They also start filling out the first
   page of the form in this new tab.
1. **‼ DATA COLLISION ‼:** because there's no unique tab identification, both Tab A
   and Tab B are potentially using the same session storage key to save form
   data. When the user in Tab B enters data on the first page, this new data
   overwrites the data previously saved by Tab A in session storage.
1. **Tab A: _--‼ DATA CORRUPTION ‼--_ 😱:** when the user returns to Tab A (where
   they were on the second page of the form), they may now find that the form
   fields are populated with the data they entered in Tab B, or even with a
   corrupted or incomplete state. This leads to significant confusion, data
   loss, and a broken user experience.

## Conclusion

The `useTabId()` hook is an essential tool for developers building react
applications that need to function reliably and predictably in multi-tab browser
environments. By automatically managing unique identifiers for each tab and
ensuring data isolation through session storage, `useTabId()` prevents data
clobbering, maintains data integrity, and contributes to a more robust and
user-friendly application experience, especially for complex multi-page flows.
Integrating `useTabId()` is a proactive step towards building web applications
that handle the realities of modern user browsing habits.
