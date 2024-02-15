using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';

namespace sap.cap.incidentmgt;

/** 
entity Queues:cuid,managed {
    key ID: String;
    name:String;
};
*/

entity Projects:CodeList{

    key code : String enum {
        lynk01 = 'L01';
        asml01 = 'A01';

    };
    customer:String;
    uri_identifier:String;
}

entity Tenants:CodeList{
    key code: String enum {
        dev = 'DEV';
        Uat = 'UAT';
        prd = 'PRD';
    };
    uri_identifier:String;
}

entity Incidents:cuid,managed{
    project:Association to Projects;
    tenant:Association to Tenants;
    //queue: Association to Queues;
    queue: String;
    interface: String;
    iflowName:String;
    applicationId:String;
    msgid:String;
    correlationId:String;
    errMsg:String;
    msgStatus: String;
    notes:Composition of many Notes on notes.incidents = $self;
    urgency: Association to Urgency;
    status: Association to Status; 
    assignto:String;  
};

entity Notes: cuid,managed {
    incidents:Association to Incidents;
    timestamp: DateTime;
    user: String @cds.on.insert: $user;
    msg: String;
};

entity Urgency: CodeList {

    key code: String enum {
        high = 'H';
        medium = 'M';
        low = 'L';
    };

};

entity Status: CodeList {
    key code: String enum {
        new = 'N';
        assigned = 'A';
        in_process = 'I';
        on_hold = 'H';
        resolved = 'R';
        closed = 'C';
    };
    criticality : Integer; 
};