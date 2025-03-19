/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#ff6b81',
                    light: '#ff8c9d',
                    dark: '#ff5268'
                },
            },
            fontFamily: {
                sans: ['Poppins', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            screens: {
                'xs': '480px',
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1536px',
            },
        },
    },
    plugins: [],
} 