const { createServer } = require('http');
const next = require('next');
// const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();



app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            await handle(req, res);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    }).listen(process.env.PORT || 3000, (err) => {
        if (err) {
            console.error('Error starting server:', err);
            process.exit(1);
        }
        console.log('> Server running on port', process.env.PORT || 3000);
    });
});


