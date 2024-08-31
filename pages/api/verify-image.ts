import { NextApiRequest, NextApiResponse } from "next";
import { addressCheckMiddleware, pinataApiKey, pinataSecretApiKey, withSession } from "./utils";
import { Session } from "next-iron-session";
import { FileReq } from "@/types/nft";
import FormData from "form-data";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default withSession(async (req: NextApiRequest & { session: Session }, res: NextApiResponse) => {
  // POST请求
  if (req.method === "POST") {
    const { bytes, fileName, contentType } = req.body as FileReq;
    console.log(bytes);
    console.log(fileName);
    console.log(contentType);

    if (!bytes || !fileName || !contentType) {
      return res.status(200).json({ message: "Image data are missing" });
    }

    // 验证地址是否是本人
    await addressCheckMiddleware(req, res);

    const buffer = Buffer.from(Object.values(bytes));
    const formData = new FormData();

    formData.append("file", buffer, {
      contentType,
      filename: fileName + uuidv4()
    });

    const { data } = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey
      }
    });
    return res.status(200).json(data);
  } else {
    return res.status(200).json({ message: "Invalid api route" });
  }
});
