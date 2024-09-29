const winston = require('winston');
require('winston-mongodb');
const moment = require('moment-timezone');


const customTimestamp = () => {
    return moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');
}

const orderLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({format: customTimestamp}),
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