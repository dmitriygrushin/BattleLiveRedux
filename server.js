const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, (req, res) => {
    console.log(`Listening on port: ${PORT}`);
});