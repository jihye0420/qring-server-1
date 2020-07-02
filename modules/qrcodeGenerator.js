const path = require('path'); 
const qrCode = require('qrcode');
const AWS = require('aws-sdk');
const fs = require('fs');
const s3Info = require('../config/s3info.json');

const s3 = new AWS.S3({
    accessKeyId: s3Info.accessKey,
    secretAccessKey: s3Info.secretAccessKey,
    region : s3Info.region
})

module.exports = {
    makeQrcode: (userEmail, meetingId) => {
        const qrInformation = `userEmail : ${userEmail}, meetingId : ${meetingId}`
        qrCode.toFile(path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`), `https://github.com/bokdoll`,
            (err, string) => {
                if (err) {
                    console.log(err);
                    throw err;
                }

                const param = {
                    'Bucket':'qring',
                    'Key': 'qrcode/' + `${meetingId}`,
                    'ACL':'public-read',
                    'Body': fs.createReadStream(path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`)),
                    'ContentType':'image/png'
                };

                s3.upload(param, (err, data) => {
                    if (err) throw err;
                    console.log('QRcode generator', data.Location);
                    fs.unlink(path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`), (err) => {
                        if (err) throw err;
                    })
                });

                //console.log(result.body.path);
        })
    }
}