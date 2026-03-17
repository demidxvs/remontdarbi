/*
Projekta nosaukums: Remontdarbi
Autors: Artjoms Demidovs
Versija: 1.0
Izveides datums: 2026. gada 7. janvāris
Pēdējo izmaiņu datums: 2026. gada 17. marts
Mērķauditorija: Klienti, administratori un sistēmas lietotāji
Projekta mērķis: Nodrošināt remontdarbu pieteikumu iesniegšanu un pārvaldību tīmekļa vidē
Atsauksme uz resursiem: Izmantoti mācību materiāli, Vite, React, Tailwind CSS, Express un PostgreSQL dokumentācija
Faila apraksts: Tailwind CSS konfigurācijas fails lietotnes stilu sistēmai
*/
/** @type {import('tailwindcss').Config} */
// Tailwind konfiguracija un dizaina paplasinajumi.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(16, 16, 24, 0.08), 0 18px 60px -30px rgba(16, 16, 24, 0.6)',
      },
      backgroundImage: {
        'mesh':
          'radial-gradient(circle at 12% 12%, rgba(245, 212, 154, 0.45), transparent 50%), radial-gradient(circle at 85% 18%, rgba(141, 196, 255, 0.35), transparent 55%), radial-gradient(circle at 30% 75%, rgba(233, 168, 196, 0.35), transparent 45%)',
      },
    },
  },
  plugins: [],
}
