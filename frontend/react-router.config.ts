import type { Config } from '@react-router/dev/config';

export default {
  future: {
    // TODO ::: GjB ::: remove once middleware becomes stable
    // see https://reactrouter.com/changelog#middleware-unstable
    unstable_middleware: true,
  },
  serverBuildFile: 'app.js',
} satisfies Config;
