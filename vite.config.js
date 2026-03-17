/*
Projekta nosaukums: Remontdarbi
Autors: Artjoms Demidovs
Versija: 1.0
Izveides datums: 2026. gada 7. janvāris
Pēdējo izmaiņu datums: 2026. gada 17. marts
Mērķauditorija: Klienti, administratori un sistēmas lietotāji
Projekta mērķis: Nodrošināt remontdarbu pieteikumu iesniegšanu un pārvaldību tīmekļa vidē
Atsauksme uz resursiem: Izmantoti mācību materiāli, Vite, React, Tailwind CSS, Express un PostgreSQL dokumentācija
Faila apraksts: Vite konfigurācijas fails frontenda izstrādei un būvēšanai
*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Vite konfiguracija ar React SWC spraudni.
export default defineConfig({
  plugins: [react()],
})
