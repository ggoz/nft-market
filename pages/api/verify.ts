import { NextApiRequest, NextApiResponse } from "next";
import { addressCheckMiddleware, contractAddress, pinataApiKey, pinataSecretApiKey, withSession } from "./utils";
import { Session } from "next-iron-session";
import { v4 as uuidv4 } from "uuid";
import { NftMeta } from "@/types/nft";
import axios from "axios";

export default withSession(async (req: NextApiRequest & { session: Session }, res: NextApiResponse) => {
  // post请求
  if (req.method === "POST") {
    try {
      const { body } = req;
      const nft = body.nft as NftMeta;
      if (!nft.name || !nft.description || !nft.attributes) {
        return res.status(422).json({ message: "Some of the form are missing" });
      }
      await addressCheckMiddleware(req, res);

      // 上传到pinata
      const { data } = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataMetadata: {
            name: uuidv4()
          },
          pinataContent: nft
        },
        {
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey
          }
        }
      );
      console.log(data);

      return res.status(200).json(data);
    } catch {
      return res.status(422).json({ message: "Can not create JSON" });
    }
  } else if (req.method === "GET") {
    // get请求
    try {
      const message = { contractAddress, id: uuidv4() };
      req.session.set("message-session", message);
      // 给前端设置cookie
      await req.session.save();

      return res.status(200).json({ message });
    } catch (error) {
      return res.status(422).json({ message: "Can not generate a message!" });
    }
  } else {
    return res.status(200).json({ message: "Invalid api route" });
  }
  // res.status(200).json({});
});
