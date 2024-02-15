using {
    sap.cap.incidentmgt as my
} from '../db/schema';


service IncidentsMgtService{
    entity Incidents as projection on my.Incidents;   
}

extend projection IncidentsMgtService.Incidents with {
    interface || ':  ' || substring(errMsg,0,100) || ' ' || '...' as title: String
}

annotate IncidentsMgtService.Incidents with @odata.draft.enabled;
