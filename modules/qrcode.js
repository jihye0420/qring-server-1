const path = require('path'); 
const qrCode = require('qrcode');
const AWS = require('aws-sdk');
const fs = require('fs');
const s3Info = require('../config/s3info.json');

const s3 = new AWS.S3({
    accessKeyId: s3Info.accessKeyId,
    secretAccessKey: s3Info.secretAccessKey,
    region : s3Info.region
})

module.exports = {
    makeQrcode: async (userEmail, meetingId) => {
        const qrInformation = `https://github.com/bokdoll`;
        qrCode.toFile(path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`), qrInformation,
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

                // s3 버킷에 업로드
                s3.upload(param, (err, data) => {
                    if (err) throw err;
                    console.log('QRcode generator', data.Location);
                    console.log(data);
                    fs.unlink(path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`), (err) => {
                        if (err) throw err;
                    })
                });
        })
    }, 
}