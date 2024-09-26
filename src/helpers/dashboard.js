const User  = require('../models/user.model');
const brandGuideController = require('../controllers/brandguide/brandguide-controller');
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'us-west-2' // Replace with your region if necessary
});

const s3 = new AWS.S3();

module.exports = {
    runBrandGuide: async (url,brandType,email) => {
        try {
            let brandGuideResult;
                if(brandType=="domain"){
                    if (!url.includes('https://') && !url.includes('http://')) {
                        url = `https://${url}`;
                    }
                    const brandExist = await User.findOne({
                        $and: [
                            { domain: url },
                            { 'brandDetails.brandInfo.colors': { $exists: true, $ne: [] } },
                            { 'brandDetails.brandInfo.logo': { $exists: true } }
                        ]
                    });
                    if (brandExist) {
                        let res = await User.findOneAndUpdate(
                            { email: email },
                            { 
                                $set: {
                                    'brandDetails.brandInfo': brandExist.brandDetails.brandInfo,
                                    'domain': url,
                                    'brandDetails.enabled':true
                                }
                            },
                            { 
                                upsert: true,
                                new: true // This option returns the updated document
                            }
                        );
                        return res;                        // return brandExist.brandDetail;
                    }
                    brandGuideResult = await brandGuideController.extractFontsColorsLogos(url);
                }
                if(brandType==="file"){
                    let logo  = url;
                   let extractedColors = await brandGuideController.extractColorsLogos(logo);
                   brandGuideResult = {...brandGuideResult,colors:extractedColors,logo:logo};
                }
                if(brandGuideResult && brandGuideResult.colors && brandGuideResult.colors.length>0){
                   let extractedColors = await extractBestColor(brandGuideResult.colors);
                   brandGuideResult.colors = extractedColors;
                 }
               
                if(brandType=="file"){
                    const domain = email.split('@')[1];
                    const newurl = `https://${domain}`;
                    url=newurl;                    
                }
                let res = await User.findOneAndUpdate(
                    { email },
                    { 
                        $set: {
                            'brandDetails.brandInfo': brandGuideResult,
                            'domain': url,
                            'brandDetails.enabled':true
                        }
                    },
                    { 
                        upsert: true,
                        new: true 
                    }
                ); 
                return res;
        } catch (err) {
        }
    },
    uploadToAWS: async (file) => {
        try{
            const params = {
                Bucket: process.env.AWS_BUCKET,
                Key: `tool_builder/${Date.now()}_${file.originalname}`, // File path in S3
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL: 'public-read'
            };
            const response = await s3.upload(params).promise();
            return  response.Location // S3 file URL

        }catch(error){
            console.log("Error during uploading to AWS:", error.message);
        }
    }





 
  
      
}


async function extractBestColor (colors) {
    try {
        console.log("colors: ", colors);
        if (colors.length > 1) {
            const sortedColors = await sortByDarkness(colors);
            colors[0] = sortedColors[0];
            colors[1] = sortedColors[1];

            if (!isLightColor(sortedColors[sortedColors.length - 1])) {
                const lighterColor = await lightenColor(sortedColors[sortedColors.length - 1], 60);
                colors[3] = lighterColor;
            } else if (colors.length > 4) {
                const lighterColor = await lightenColor(sortedColors[sortedColors.length - 2], 65);
                colors[3] = lighterColor;
            }
        } else if (colors.length === 1) {
            colors[0] = colors[0];
        }

        return colors;
    } catch (error) {
        return colors;
    }
}

function sortByDarkness(colors) {
    return colors.sort((color1, color2) => {
        const darkness1 = hexToDarkness(color1);
        const darkness2 = hexToDarkness(color2);

        return darkness1 - darkness2;
    });
}

function hexToDarkness(hex) {
    hex = hex.replace(/^#/, '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return (r * 0.299 + g * 0.587 + b * 0.114);
}

function isLightColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    const threshold = 240;
    return brightness > threshold;
}

function lightenColor(hexColor, percentage) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const whiteR = 255;
    const whiteG = 255;
    const whiteB = 255;

    const distanceToWhite = Math.sqrt(
        Math.pow(whiteR - r, 2) + Math.pow(whiteG - g, 2) + Math.pow(whiteB - b, 2)
    );

    const moveDistance = (percentage / 100) * distanceToWhite;

    const newR = Math.min(r + moveDistance, 255);
    const newG = Math.min(g + moveDistance, 255);
    const newB = Math.min(b + moveDistance, 255);

    const newHexColor = `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;

    return newHexColor;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return { r, g, b };
}

function colorDifference(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    const diff = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    return diff;
}