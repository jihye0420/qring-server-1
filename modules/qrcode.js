const path = require('path'); 
const qrCode = require('qrcode');
const AWS = require('aws-sdk');
const fs = require('fs');
const s3Info = require('../config/s3info.json');
const meetingModel = require('../models/meeting');

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
                s3.upload(param, async (err, data) => {
                    if (err) throw err;
                    console.log('QRcode generator', data.Location);
                    
                    // DB에 이미지 링크 저장
                    const filter = {_id : meetingId};
                    const update = {qrImg : data.Location};
                    const result = await meetingModel.updateOne(filter, {$set : update});

                    fs.unlink(path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`), (err) => {
                        if (err) throw err;
                    });
                });
        });
    }, 
}