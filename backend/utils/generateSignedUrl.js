const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3Client");

const generateSignedUrl = async (key, download = false) => {

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  };

  if (download) {

    // force download
    params.ResponseContentDisposition = `attachment; filename="${key}"`;

  } else {

    // force browser preview
    params.ResponseContentDisposition = `inline`;
    params.ResponseContentType = "application/octet-stream";

  }

  const command = new GetObjectCommand(params);

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 60
  });

  return url;
};

module.exports = generateSignedUrl;