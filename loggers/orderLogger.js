const winston = require('winston');
require('winston-mongodb');

const orderLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),

    transports: [
        new winston.transports.MongoDB({
            level: 'info',
            db: process.env.DB_URI,
            collection: 'orderLogs',
            tryReconnect: true,
            options: {useUnifiedTopology: true}
        })
    ]
});

module.exports = orderLogger;