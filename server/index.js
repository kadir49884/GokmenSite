import { app } from './app.js';

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Site hazır: http://localhost:${PORT}`);
  console.log(`Yönetim paneli: http://localhost:${PORT}/admin.html`);
});
