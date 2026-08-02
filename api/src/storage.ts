import {
  CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config.js";

export const storage=new S3Client({
  endpoint:config.STORAGE_ENDPOINT,
  region:config.STORAGE_REGION,
  forcePathStyle:config.STORAGE_FORCE_PATH_STYLE,
  credentials:{accessKeyId:config.STORAGE_ACCESS_KEY,secretAccessKey:config.STORAGE_SECRET_KEY}
});

export async function ensurePrivateBucket() {
  try{
    await storage.send(new HeadBucketCommand({Bucket:config.STORAGE_BUCKET}));
  }catch{
    if(config.NODE_ENV==="production")throw new Error("Private storage bucket is unavailable");
    await storage.send(new CreateBucketCommand({Bucket:config.STORAGE_BUCKET}));
  }
}

export function storePrivateObject(key:string,body:Buffer,contentType:string) {
  return storage.send(new PutObjectCommand({
    Bucket:config.STORAGE_BUCKET,Key:key,Body:body,ContentType:contentType,
    Metadata:{privacy:"private"}
  }));
}

export function deletePrivateObject(key:string) {
  return storage.send(new DeleteObjectCommand({Bucket:config.STORAGE_BUCKET,Key:key}));
}

export function privateDownloadUrl(key:string,downloadName:string) {
  return getSignedUrl(storage,new GetObjectCommand({
    Bucket:config.STORAGE_BUCKET,Key:key,
    ResponseContentDisposition:`attachment; filename="${downloadName.replace(/["\r\n]/g,"_")}"`
  }),{expiresIn:300});
}
