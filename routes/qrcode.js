const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');

/**
 * QR코드 테스트
 */
router.get('/', async(req, res) => {
    let qrImg = new QrCodeWithLogo({
        canvas: document.getElementById("canvas"),
        content: "https://github.com/qring-sopt/qring-server",
        width: 380,
        download: true,
        image: document.getElementById("image"),
        logo: {
            src: "https://avatars1.githubusercontent.com/u/28730619?s=460&v=4"
        }
    }).toImage();


})

module.exports = router;