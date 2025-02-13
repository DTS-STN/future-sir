import type { MachineContext, MetaObject } from 'xstate';

type StateMachineDebugProps = {
  /**
   * The XState machine context.
   * Allows an undefined machineContext to make using this component easier.
   */
  machineContext?: MachineContext;
  /**
   * The XState meta object.
   * This is typically acquired by calling `actor.getSnapshot().getMeta()`.
   */
  metaObject?: MetaObject;
};

/**
 * A component to render XState machine snapshots for troubleshooting purposes.
 */
export function StateMachineDebug({ machineContext, metaObject }: StateMachineDebugProps) {
  if (machineContext)
    return (
      <div className="mt-8">
        <span>Current machine context</span>
        <pre className="max-h-64 overflow-y-auto border border-gray-400 bg-gray-200 p-2 text-xs">
          {JSON.stringify({ machineContext, metaObject }, null, 2)}
        </pre>
      </div>
    );
}
