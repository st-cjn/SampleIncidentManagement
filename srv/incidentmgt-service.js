const cds = require('@sap/cds')
const xsenv = require("@sap/xsenv");

class IncidentsMgtService extends cds.ApplicationService {
  
    /** Registering custom event handlers */
    init() {
      //const [Incidents,Queues,Projects,Tenants] =  this.entities;
      console.log("***************initialization************************");
     
      const Incidents = this.entities.Incidents;
      const Projects = this.entities.Projects;
      const Tenants = this.entities.Tenants;

      this.before("UPDATE",Incidents, (req) => this.onUpdate(req));
      this.before(["READ","WRITE","UPDATE"],"Incidents", async (req) => {
        console.log("***************init filter ************************");
       
          //const testdes = await cds.connect.to("Destination_Srv");
          //console.log(testdes);
        //console.log("*************** abcdefg ************************");

        const filter = req.context._queryOptions.$filter
        console.log(req.user);
        if (filter != null && filter.includes('project_code') && filter.includes('tenant_code')){

          
          //const db = await cds.connect.to('db');
          //const incidentTbl = await db.read('SAP_CAP_INCIDENTMGT_INCIDENTS');
          //const projectTbl =  await db.read('SAP_CAP_INCIDENTMGT_PROJECTS');
          //const tenantTbl =  await db.read('SAP_CAP_INCIDENTMGT_TENANTS');

          const projectCode = (filter.split('project_code')[1]).split("'")[1];
          //console.log(await cds.run(SELECT.from(Projects)));

          const tenantCode = (filter.split('tenant_code')[1]).split("'")[1];

          const tenantDetails = await getTenantDetails(projectCode,tenantCode);
          //console.log(tenantDetails);

          var queueID = '';
          if (filter.includes('queue')) {
            queueID = (filter.split('queue')[1]).split("'")[1];
          }

          // get access token
          const accessToken = await getAccToken(tenantDetails);
          //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< Access Token >>>>>>>>>>>>>>>>>>>>>>>>>"); 
          //console.log(accessToken); 
          //// connect to /Queues('<queuename>')/messages
          //// Get Name (queue), CreatedAt
          const queueEdp = await buildEndpoint("/Queues",queueID,"/Messages"); 
          const queueUrl = await buildUrl(tenantDetails,"443",queueEdp,"$format=json")

          const queueDetails = await httpGet(queueUrl,accessToken,"bearer");
          //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< /Queues(<queuename>)/Messages Response >>>>>>>>>>>>>>>>>>>>>>>>>"); 
          //console.log(queueDetails); 
          const jsobjQueue = JSON.parse(queueDetails);
          const queueResultsLst = jsobjQueue.d.results;
          queueResultsLst.forEach(async function(obj) {
            //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< Messages Overview >>>>>>>>>>>>>>>>>>>>>>>>>"); 
            //console.log(obj);
            const msgId = obj.Mplid;
            const createdAtUnix = obj.CreatedAt;
            var createdAt = new Date(Number(createdAtUnix));
            //// connect to /MessageProcessingLogs('<messageid>')
            //// Get CorrelationId, ApplicationMessageId, BUT NO INTERFACE INFO!!!!!!!!!!!!!!!!!!
            const msgEndpoint = await buildEndpoint("/MessageProcessingLogs",msgId,null); 
            const msgProcLogUrl = await buildUrl(tenantDetails,"443",msgEndpoint,"$format=json")
            //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< /MessageProcessingLogs('<messageid>') Url >>>>>>>>>>>>>>>>>>>>>>>>>"); 
            //console.log(msgProcLogUrl); 
            const msgDetails = await httpGet(msgProcLogUrl,accessToken,"bearer");
            const jsobjMsg = JSON.parse(msgDetails);
            const msgDetailsObj = jsobjMsg.d;
            //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< Messages Details >>>>>>>>>>>>>>>>>>>>>>>>>"); 
            //console.log(msgDetailsObj); 
            const correlationId = msgDetailsObj.CorrelationId;
            var applicationId = msgDetailsObj.ApplicationMessageId; 
            const interfacename = msgDetailsObj.ApplicationMessageType;
            const iflowName = msgDetailsObj.IntegrationFlowName;
            const msgStatus = msgDetailsObj.CustomStatus;

            //// connect to /MessageProcessingLogs('<messageid>')/ErrorInformation
            //// Get Error messages
            const errInfoUrl = msgDetailsObj.ErrorInformation.__deferred.uri+"/$value";
            //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< Error Information Uri >>>>>>>>>>>>>>>>>>>>>>>>>"); 
            //console.log(errInfoUrl);
            const errMessage = await httpGet(errInfoUrl,accessToken,"bearer");
            //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< Error Messages >>>>>>>>>>>>>>>>>>>>>>>>>"); 
            //console.log(errMessage);

            var hasErrMsg = false;
            //await cds.run(DELETE.from(Incidents));
            const incidentTbl = await cds.run(SELECT.from(Incidents));
            incidentTbl.forEach(async function(row) {
                if (msgId == row.msgid && errMessage == row.errMsg ){ //&& row.errStatus != 'Ok'
                    hasErrMsg = true;
                    return;
                }
            });
            //console.log("<<<<<<<<<<<<<<<<<<<<<<<<< has duplicated Error >>>>>>>>>>>>>>>>>>>>>>>>>"); 
            //fconsole.log(hasErrMsg);
            if (!hasErrMsg){
              //table,createdAt,createdBy,modifiedAt,modifiedBy,project_code,tenant_code,queue,interface,iflowName,applicationId,msgid,correlationId,errMsg,msgStatus,urgency_code,status_code,assignto
                await insertMessages(Incidents,createdAt,"SYS",new Date(),"SYS",projectCode,tenantCode,queueID,interfacename,iflowName,applicationId,msgId,correlationId,errMessage,msgStatus,"L","N","TEST_USR_01");
            }
        });
      } 
      console.log("<<<<<<<<<<<<<<<<<<<<<<<<< run post >>>>>>>>>>>>>>>>>>>>>>>>>")
      
      //console.log(Incidents)
      //await httpPost();
    
      });

      this.after("READ", Incidents, (data) => { 
        
        this.changeUrgencyDueToSubject(data)
  
      });
  
      return super.init();
    }

    impl(){

      this.before("READ", Incidents, async (req,next) => {
        console.log("***************impl************************");
        const incident = await next();
        
      });

      this.on("READ", Incidents, async (req,next) => {
        console.log("***************impl************************");
        const incident = await next();
        
      });


    }

    
  
    changeUrgencyDueToSubject(data) {
      if (data) {
        const incidents = Array.isArray(data) ? data : [data];
        incidents.forEach((incident) => {
          if (incident.title?.toLowerCase().includes("urgent")) {
            incident.urgency = { code: "H", descr: "High" };
          }
        });
      }
    }
  
    /** Custom Validation */
    async onUpdate (req) {
      const { status_code } = await SELECT.one(req.subject, i => i.status_code).where({ID: req.data.ID})
      if (status_code === 'C')
        return req.reject(`Can't modify a closed incident`)
    }
  }

  async function getAccToken(tenantDetails){
    // get accesstoken
const cltk = tenantDetails.get('clientKey');
const clts = tenantDetails.get('clientSecret');
const tokenUrl = tenantDetails.get('tokenUrl');
var basicAuthToken = btoa(cltk+':'+clts);
const resJsonToken = await httpGet(tokenUrl,basicAuthToken,"basic");
const jsobjToken = JSON.parse(resJsonToken);
const authToken = jsobjToken.access_token;
return authToken;
}

async function getTenantDetails(projectCode,tenantCode){

  var destinationDetails = {};
  if (projectCode == 'L01' && tenantCode == 'TST'){
    destinationDetails = await getDestinationSrv("TEST_DES_L01_TST")
  } else if (projectCode == 'L01' && tenantCode == 'UAT'){
    destinationDetails = await getDestinationSrv("TEST_DES_L01_UAT")
  } else if (projectCode == 'L01' && tenantCode == 'PRD'){
    // ADD MORE DETAILS IN THE FUTURE
  } 

  const tokenUrl = destinationDetails.tokenServiceURL+'?grant_type=client_credentials';
  const cltk = destinationDetails.clientId;
  const clts = destinationDetails.clientSecret;
  const host = destinationDetails.URL;
  const tenantDetails = new Map([
    ["tokenUrl",tokenUrl],
    ["clientKey",cltk],
    ["clientSecret",clts],
    ["host",host]
  ]);

  return tenantDetails;

}

async function buildUrl(tenantDetails,port,endpoint,query){
    //var host = 'https://'+tnt+'-'+prj+'.it-cpi024.cfapps.eu10-002.hana.ondemand.com';
    var host = tenantDetails.get('host');
    var servicePath = '/api/v1';
    var url = host+':'+port+servicePath+endpoint;
    if (query !=null && query != '' ){
        return url+'?'+query;
    }else{
        return url;
    }
}

async function buildEndpoint(entity,id,navPath){
    var endpoint = '';
    if (entity !=null && entity != '' ){
        endpoint += entity;
    };

    if (id !=null && id != '' ){
        endpoint = endpoint + "('"+id+ "')";
    };

    if (navPath !=null && navPath != '' ){
        endpoint += navPath;
    };
    return endpoint;
}

async function httpGet(url,authToken,TypeToken){
    var myHeadersAPI = new Headers();
    if(TypeToken=="basic"){
        authToken = "Basic "+authToken
    } else if (TypeToken=="bearer") {
        authToken = "bearer "+authToken
    }
    myHeadersAPI.append("Authorization", authToken);
    var requestOptionsAPI = {
        method: 'GET',
        headers: myHeadersAPI,
        redirect: 'follow'
    };
    const responseQueue = await fetch(url, requestOptionsAPI)
    .catch(error => console.log('error', error));
    const resJsonQueue = await responseQueue.text();
    return resJsonQueue;
}

async function httpPost(){
  url = "https://port4004-workspaces-ws-9lqxc.eu10.applicationstudio.cloud.sap/odata/v4/incidents-mgt/$batch";
  //var basicAuthToken = btoa("S0025624760"+':'+"hjH&aVTt?juzf!CSy.#^123");
  console.log("+++++")
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "multipart/mixed; boundary=batch_id-1707295704540-192");
  myHeaders.append("Accept", "multipart/mixed");
  myHeaders.append("Accept-Encoding", "gzip, deflate, br");
  myHeaders.append("Mime-Version", "1.0");
  myHeaders.append("Odata-Maxversion", "4.0");
  myHeaders.append("Odata-Version", "4.0");
  myHeaders.append("Cookie", "dtCookie=v_4_srv_25_sn_C8B2CB56BEF4E8FF7BA71D9A39276950_perc_100000_ol_0_mul_1_app-3Acab67a9e1543df82_0; workspaces-ws-9lqxc_WSR_SESSIONID=ID92ZvEqB5qYzkCtOrQBwZz4Lb9DhzPKaB1NzxIJCDYMbW35vFewq5JLFDak1+ls1OFYKbhpQ+MlzjjAWki2rQ==");
  myHeaders.append("Authorization", "Basic UzAwMjU2MjQ3NjA6aGpIJmFWVHQ/anV6ZiFDU3kuI14xMjM=kk");

  
  var raw = "--batch_id-1707295704540-192\r\nContent-Type:application/http\r\nContent-Transfer-Encoding:binary\r\n\r\nGET Incidents?$count=true&$filter=(IsActiveEntity%20eq%20false%20or%20SiblingEntity/IsActiveEntity%20eq%20null)%20and%20project_code%20eq%20'L01'%20and%20tenant_code%20eq%20'TST'%20and%20queue%20eq%20'EO_COSMOS_primary'&$select=HasActiveEntity,ID,IsActiveEntity,createdAt,errMsg,msgid,status_code,urgency_code&$expand=status($select=code,criticality,name),urgency($select=code,descr)&$skip=0&$top=30 HTTP/1.1\r\nAccept:application/json;odata.metadata=minimal;IEEE754Compatible=true\r\nAccept-Language:en-GB\r\nContent-Type:application/json;charset=UTF-8;IEEE754Compatible=true\r\n\r\n\r\n--batch_id-1707295704540-192--\r\nGroup ID: $auto.Workers";
  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  console.log("+++++")

  const responseQueue = await fetch(url, requestOptions)
  .catch(error => console.log('error', error));

  //console.log(responseQueue) 

  const resJsonQueue = await responseQueue.text();
  //console.log(resJsonQueue)
  return resJsonQueue;


}

async function insertMessages(table,createdAt,createdBy,modifiedAt,modifiedBy,project_code,tenant_code,queue,interface,iflowName,applicationId,msgid,correlationId,errMsg,msgStatus,urgency_code,status_code,assignto){
  
  /**
  const insertMsgDB = await db.insert('SAP_CAP_INCIDENTMGT_INCIDENTS').entries(
    {
      ID: cds.utils.uuid(),
      createdAt:createdAt,
      createdBy:createdBy,
      modifiedAt:modifiedAt,
      modifiedBy:modifiedBy,
      project_code:project_code,
      tenant_code:tenant_code,
      queue:queue,
      interface:interface,
      iflowName:iflowName,
      applicationId:applicationId,
      msgid:msgid,
      correlationId:correlationId,
      errMsg:errMsg,
      msgStatus:msgStatus,
      urgency_code:urgency_code,
      status_code:status_code,
      assignto:assignto
    }
  );
  const keyFields1 = [...insertMsgDB];
  */

  const insertMsg = await cds.run(
      INSERT.into(table).entries([
        {
          ID: cds.utils.uuid(),
          createdAt:createdAt,
          createdBy:createdBy,
          modifiedAt:modifiedAt,
          modifiedBy:modifiedBy,
          project_code:project_code,
          tenant_code:tenant_code,
          queue:queue,
          interface:interface,
          iflowName:iflowName,
          applicationId:applicationId,
          msgid:msgid,
          correlationId:correlationId,
          errMsg:errMsg,
          msgStatus:msgStatus,
          urgency_code:urgency_code,
          status_code:status_code,
          assignto:assignto
        },
      ])
    );
    const keyFields = [...insertMsg];
    //delete keyFields.IsActiveEntity;
    //const roles = await cds.run(SELECT.from(Message).where(keyFields));
    //await cds.run(SELECT.from(msgTable));
    //const role = roles[0];
    //return role;
}

async function getDestinationSrv(destinationName){

  xsenv.loadEnv();
  const binding = xsenv.getServices({ destination: { tag: 'destination'} });
  // post call to get the token
  const headersToken = new Headers();
  headersToken.append("Content-Type", 'application/x-www-form-urlencoded');
  const tokenUrl = binding.destination.url;
  //console.log(tokenUrl);
  const clientid = binding.destination.clientid;
  //console.log(clientid);
  const clientsecret = binding.destination.clientsecret;
  //console.log(clientsecret);
  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", clientid);
  urlencoded.append("client_secret", clientsecret);

  const requestOptions = {
      method: "POST",
      headers: headersToken,
      body: urlencoded,
      redirect: "follow"
    };

  const tokenResponse = await fetch(tokenUrl+"/oauth/token?grant_type=client_credentials", requestOptions)
      .catch((error) => console.error(error));
  const token = (JSON.parse(await tokenResponse.text())).access_token;
  //console.log(token);

  // get call to access configured destinations
  const destinationUri = binding.destination.uri;
  const destinations = JSON.parse(await httpGet(destinationUri+"/destination-configuration/v1/subaccountDestinations",token,"bearer"));
  //console.log(await findDestination(destinations,"TEST_DES_L01_TST"));
  return await findDestination(destinations,destinationName);
}


async function findDestination(jsonObject,destinationName){
  return jsonObject.filter(function(jsonObject) {return (jsonObject['Name'] == destinationName);})[0];
}


module.exports = IncidentsMgtService