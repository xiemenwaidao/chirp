/** @type {import("prettier").Config} */
const config = {
    plugins: [require.resolve("prettier-plugin-tailwindcss")],
    printWidth: 160,
    tabWidth: 4,
};

module.exports = config;
