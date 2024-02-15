using IncidentsMgtService as service from '../../srv/incidentmgt-service';
using from '../../db/schema';
annotate service.Incidents with @(
    UI.SelectionFields : [
        project_code,tenant_code,
        queue,
        status_code,
        urgency_code,]
);

annotate service.Incidents with {
    urgency @Common.Label : '{i18n>Urgency}'
};


annotate service.Incidents with {
    status @Common.Label : '{i18n>HandlingStatus}'
};
annotate service.Incidents with {
    urgency @Common.Text : {
            $value : urgency.descr,
            ![@UI.TextArrangement] : #TextOnly,
        }
};
annotate service.Incidents with {
    urgency @Common.ValueListWithFixedValues : true
};
annotate service.Incidents with {
    status @Common.Text : status.name
};
annotate service.Incidents with {
    status @Common.ValueListWithFixedValues : true
};
annotate service.Incidents with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : createdAt,
        },
        {
            $Type : 'UI.DataField',
            Value : msgid,
            Label : '{i18n>MessageId}',
        },
        {
            $Type : 'UI.DataField',
            Value : errMsg,
            Label : '{i18n>ErrorMessage}',
        },
        {
            $Type : 'UI.DataField',
            Value : urgency_code,
        },
        {
            $Type : 'UI.DataField',
            Value : status_code,
            Criticality : status.criticality,
        },
    ]
);

annotate service.Incidents with @(
    UI.Facets : [
        {
            $Type : 'UI.CollectionFacet',
            Label : 'Overview',
            ID : 'Overview',
            Facets : [
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : '{i18n>Details}',
                    ID : 'MessageDetails',
                    Target : '@UI.FieldGroup#MessageDetails',
                },],
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Processing Notes',
            ID : 'ProcessingNotes',
            Target : 'notes/@UI.LineItem#ProcessingNotes',
        },
    ]
);

annotate service.Incidents with @(
    UI.FieldGroup #MessageDetails : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : project_code,
            },
            {
                $Type : 'UI.DataField',
                Value : tenant_code,
            },
            {
                $Type : 'UI.DataField',
                Value : queue,
            },
            {
                $Type : 'UI.DataField',
                Value : interface,
                Label : '{i18n>Interface}',
            },
            {
                $Type : 'UI.DataField',
                Value : iflowName,
                Label : '{i18n>IflowName1}',
            },
            {
                $Type : 'UI.DataField',
                Value : createdAt,
            },
            {
                $Type : 'UI.DataField',
                Value : applicationId,
                Label : '{i18n>ApplicationId}',
            },
            {
                $Type : 'UI.DataField',
                Value : msgid,
                Label : '{i18n>MessageId}',
            },
            {
                $Type : 'UI.DataField',
                Value : correlationId,
                Label : '{i18n>CorrelationId}',
            },{
                $Type : 'UI.DataField',
                Value : errMsg,
                Label : '{i18n>ErrorMessage}',
            },
            {
                $Type : 'UI.DataField',
                Value : msgStatus,
                Label : '{i18n>MessageStatus}',
            },{
                $Type : 'UI.DataField',
                Value : urgency_code,
            },{
                $Type : 'UI.DataField',
                Value : status_code,
                Criticality : status.criticality,
                Label : '{i18n>HandlingStatus}',
            },
            {
                $Type : 'UI.DataField',
                Value : assignto,
                Label : '{i18n>AssignTo}',
            },],
    }
);
annotate service.Notes with @(
    UI.LineItem #ProcessingNotes : [
        {
            $Type : 'UI.DataField',
            Value : user,
            Label : '{i18n>User}',
        },
        {
            $Type : 'UI.DataField',
            Value : timestamp,
            Label : '{i18n>Time}',
        },{
            $Type : 'UI.DataField',
            Value : msg,
            Label : '{i18n>Comments}',
        },]
);
annotate service.Incidents with @(
    UI.HeaderInfo : {
        TypeName : '{i18n>IncidentManagement}',
        TypeNamePlural : '',
        Title : {
            $Type : 'UI.DataField',
            Value : title,
        },
    }
);

annotate service.Incidents with {
    project @Common.Label : '{i18n>Project}'
};
annotate service.Incidents with {
    tenant @Common.Label : '{i18n>Tenant}'
};
annotate service.Tenants with {
    code @Common.Label : '{i18n>Tenant}'
};
annotate service.Projects with {
    name @Common.Label : '{i18n>Project}'
};
annotate service.Projects with {
    name @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Projects',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : name,
                    ValueListProperty : 'name',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
        Common.Text : {
            $value : customer,
            ![@UI.TextArrangement] : #TextOnly,
        }
)};
annotate service.Tenants with {
    code @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Tenants',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : code,
                    ValueListProperty : 'code',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
        Common.Text : {
            $value : descr,
            ![@UI.TextArrangement] : #TextOnly,
        }
)};
annotate service.Incidents with {
    project @Common.Text : project.name
};
annotate service.Incidents with {
    project @Common.ValueListWithFixedValues : true
};
annotate service.Projects with {
    code @Common.Text : customer
};
annotate service.Incidents with {
    tenant @Common.Text : tenant.code
};
annotate service.Incidents with {
    tenant @Common.ValueListWithFixedValues : true
};
annotate service.Incidents with {
    queue @Common.Label : 'Queue'
};


annotate service.Incidents with @(
    Capabilities : {
        FilterRestrictions:{
            $Type: 'Capabilities.FilterRestrictionsType',
            FilterExpressionRestrictions: [
                {
                    Property: 'project_code',
                    AllowedExpressions: 'SingleValue'
                },
                {
                    Property: 'tenant_code',
                    AllowedExpressions: 'SingleValue'
                }
            ],
            RequiredProperties : [
                project_code,
                tenant_code,
            ],
    }
});
annotate service.Incidents with {
    project @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    tenant @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    msgid @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    errMsg @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    queue @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    interface @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    iflowName @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    applicationId @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    correlationId @Common.FieldControl : #ReadOnly
};
annotate service.Incidents with {
    msgStatus @Common.FieldControl : #ReadOnly
};
