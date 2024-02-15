const jose = require('node-jose');
const fetch = require('node-fetch'); // use version 2  when working with commonJS modules 

const xsenv = require("@sap/xsenv");
xsenv.loadEnv();
//console.log("***********************find credstore************************");
//console.log(xsenv.getServices({ credstore: { tag: 'credstore'}}));
console.log(xsenv.readServices());
//const binding = xsenv.getServices({ credstore: { tag: 'credstore' } }).credstore;
const binding = xsenv.getServices({ destination: { tag: 'destination'} });
//console.log(xsenv.getServices({ destination: { tag: 'destination'} }));
//const binding = xsenv.getServices({ credstore: { tag: 'test_cs_cpi_incident_mgt' } }).credstore;
//console.log(await readCredential(binding, "CredentialStoreNameSpace", "password", "MyCredential"));

function checkStatus(response) {
    //console.log("*********************************response******************************");
    //console.log(response.body);
    if (!response.ok) console.log(`Please verify that you CredStore binding info is up to date
    Unexpected status code: ${response.status}`);
    return response;
}

async function decryptPayload(privateKey, payload) {
    const key = await jose.JWK.asKey(`-----BEGIN PRIVATE KEY-----${privateKey}-----END PRIVATE KEY-----`,
        "pem",
        { alg: "RSA-OAEP-256", enc: "A256GCM" }
    );
    const decrypt = await jose.JWE.createDecrypt(key).decrypt(payload);
    const result = decrypt.plaintext.toString();
    return result;
}

async function encryptPayload(publicKey, payload) {
    const key = await jose.JWK.asKey(`-----BEGIN PUBLIC KEY-----${publicKey}-----END PUBLIC KEY-----`,
        "pem",
        { alg: "RSA-OAEP-256" }
    );
    const options = {
        contentAlg: "A256GCM",
        compact: true,
        fields: { "iat": Math.round(new Date().getTime() / 1000) }
    };
    return jose.JWE.createEncrypt(options, key).update(Buffer.from(payload, "utf8")).final();
}

function headers(binding, namespace, init) {
    console.log("*************** test ****************");
    console.log(binding);
    const headers = new fetch.Headers(init);
    headers.set("Authorization", `Basic ${Buffer.from(`${binding.username}:${binding.password}`).toString("base64")}`);
    //headers.set("sapcp-credstore-namespace", namespace);
    return headers;
}

async function readDestinationSrv(binding){
    // post call to get the token
    const headersToken = new Headers();
    headersToken.append("Content-Type", 'application/x-www-form-urlencoded');
    const tokenUrl = binding.destination.url;
    const clientid = binding.destination.clientid;
    const clientsecret = binding.destination.clientsecret;
    const urlencoded = new URLSearchParams();
    urlencoded.append("client_id", clientid);
    urlencoded.append("client_secret", clientsecret);

    const requestOptions = {
        method: "POST",
        headers: headersToken,
        body: urlencoded,
      };

    const tokenResp = fetch(tokenUrl+"/auth/token?grant_type=client_credentials", requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));

    console.log(tokenResp);
    

}

async function fetchAndDecrypt(privateKey, url, method, headers, body) {
    return fetch(url, { method, headers, body })
    .then((resFetch)=>{
        const resCheckStatus = checkStatus(resFetch)
        return(resCheckStatus)})
    .then((response) => {
        const resText = response.text()
        return resText

        })
        .then(payload => decryptPayload(privateKey, payload))
        .then((resObj)=>{
            return(JSON.parse(resObj))})
        .catch(e=>{
            `opps  we have an issue: ${JSON.stringify(e)}`
        });
}

async function readCredential(namespace, type, name) {
    const headersToSend = headers(binding, namespace)
    console.log("***********************read credstore************************");
    console.log(binding.password);
    const resData = await fetchAndDecrypt(
        binding.encryption.client_private_key,
        `${binding.url}/${type}?name=${encodeURIComponent(name)}`,
        "get",
        headersToSend
        );
        return(resData)
    }
    
async function writeCredential( namespace, type, credential) {
    const headersToSend = headers(binding, namespace, { "Content-Type": "application/jose" })
    const bodyToSend = await encryptPayload(binding.encryption.server_public_key, JSON.stringify(credential))
    const resData = await  fetchAndDecrypt(
        binding.encryption.client_private_key,
        `${binding.url}/${type}`,
        "post",
        headersToSend,
        bodyToSend
    );
    return(resData)
}

    async function deleteCredential(namespace, type, name) {
        await fetch(
            `${binding.url}/${type}?name=${encodeURIComponent(name)}`,
            {
                method: "delete",
                headers: headers(binding, namespace)
            }
        ).then(checkStatus);
    }

module.exports = {readCredential, writeCredential, deleteCredential}