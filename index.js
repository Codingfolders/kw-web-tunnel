// Libraries
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { msg } = require('oho-console');
const yaml = require('js-yaml');
const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Functions
const { changeTimeUnit } = require('./fun/time.js');

// App
const config = yaml.load(fs.readFileSync('config.yml'));
const { NETWORK: { port, points, duration, block_duration: blockDuration }, PAGES: pages } = config;
const STATIC_DIR = path.join(__dirname, 'frontend');

if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR);
if (!fs.existsSync(path.join(__dirname, '.env'))) return msg.error(`The file cannot be found: ${path.join(__dirname, '.env')}`);

const app = express();
const rateLimiter = new RateLimiterMemory({
    points, 
    duration: changeTimeUnit(duration), 
    blockDuration: changeTimeUnit(blockDuration)}
)

app.use(
    (req, res, next) => {
        const clientIP = req.ip === '::1' ? '127.0.0.1' : req.ip.split('::ffff:')[1];

        rateLimiter.consume(req.ip)
            .then(() => {
                msg.info(`Client(${clientIP}) → Connected`);
                next();
            }).catch(() => {
                res.status(429).send('429 Too Many Requests');
                msg.warn(`Client(${clientIP}) → 429 Too Many Requests`, {isImportant: true});
            })
    }
)

app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') msg.warn('Development mode is currently enabled! If you are currently running an external server, please switch to Production mode(production) and restart the server app.');
    
    msg.info(`Server running at localhost:${port}`, {color: 'green', isImportant: true});
})

// Static page routing
app.get('{/:pagePath}', (req, res, next) => {
    try {
        const clientIP = req.ip === '::1' ? '127.0.0.1' : req.ip.split('::ffff:')[1];
        const requestedPath = req.params.pagePath;

        const pageConfig = pages?.find(page => page.name == requestedPath);
        
        if (!pageConfig) {
            msg.error(`Client(${clientIP}) → 404 Not Found: ${requestedPath}`);
            return res.status(404).send('404 Not Found')
        }

        const { entry, whitelist, redirect_to: redirectTo = '' } = pageConfig;

        if (redirectTo && redirectTo !== requestedPath) {
            return res.redirect(`/${redirectTo}`);
        }

        // Check if the client IP is in the whitelist
        if (whitelist && whitelist?.length > 0 && !whitelist.includes(clientIP)) {
            msg.warn(`Client(${clientIP}) → 403 Access Denied: ${requestedPath}`);
            return res.status(403).send('403 Access Denied');
        }

        // Send the requested file
        res.sendFile(path.resolve(STATIC_DIR, entry), (err) => {
            if (err) next(err);
        })
    } catch (err) {
        msg.info(err.stack, {isImportant: true});
        next(err);
    }
})
