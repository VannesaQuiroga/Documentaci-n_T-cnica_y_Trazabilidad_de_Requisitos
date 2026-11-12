const app = require('./app');
const { port } = require('./config');

app.listen(port, () => {
  console.log(`Puesto de chance API escuchando en http://localhost:${port}`);
});
