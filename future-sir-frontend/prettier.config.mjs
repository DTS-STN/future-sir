/**
 * @type {import('prettier').Config}
 */
export default {
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  importOrder: ['^react(-dom/.*)?$', '^[@]?react-router(/.*)?', '<THIRD_PARTY_MODULES>', '^[(\\.|~)/]'],
  importOrderSeparation: true,
  printWidth: 128,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
};
