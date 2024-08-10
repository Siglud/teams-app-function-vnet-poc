import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

export async function health(
    request: HttpRequest,
    _: InvocationContext
): Promise<HttpResponseInit> {
    const storageName = process.env["STORAGE_NAME"];
    if (!storageName) {
        return { status: 500, body: "STORAGE_NAME is not set" };
    }
    const body = {
        read: "error",
        write: "error",
        log: "",
        list: "",
        readOk: false,
        writeOk: false,
    }
    try {
        const credential = request.query.get('name') === "clinetId" ? new DefaultAzureCredential({ managedIdentityClientId: process.env["MANAGED_IDENTITY_ID"] }) : new DefaultAzureCredential();
        const blobServiceClient = new BlobServiceClient(`https://${storageName}.blob.core.windows.net`, credential);
        blobServiceClient.getContainerClient("health");
    } catch (error) {
        body.read = error.message;
        body.write = error.message;
        const res: HttpResponseInit = { status: 200, jsonBody: body };
        return res;
    }
    
    const credential = request.query.get('name') === "clinetId" ? new DefaultAzureCredential({ managedIdentityClientId: process.env["MANAGED_IDENTITY_ID"] }) : new DefaultAzureCredential();
    body.log = JSON.stringify(request.query.get('name') === "clinetId" ? process.env["MANAGED_IDENTITY_ID"] : "use default");
    const blobServiceClient = new BlobServiceClient(`https://${storageName}.blob.core.windows.net`, credential);
    const containerClient = blobServiceClient.getContainerClient("health");


    try {
        for await (const i of containerClient.listBlobsFlat()) {
            body.list += i.name + ";";
        }
        const content = await containerClient.getBlockBlobClient("a").downloadToBuffer();
        if (content) {
            body.read = content.toString();
            body.readOk = true;
        }
    } catch (error) {
        body.read = JSON.stringify(error, Object.getOwnPropertyNames(error));
    }
    
    try {
        const test = Buffer.from("health");
        const write  = containerClient.getBlockBlobClient("b");
        await write.upload(test, test.length);
        body.writeOk = true;
    } catch (error) {
        body.write = JSON.stringify(error, Object.getOwnPropertyNames(error));
    }
    

    const res: HttpResponseInit = { status: 200, jsonBody: body };
    return res;
}

app.get("health", health);