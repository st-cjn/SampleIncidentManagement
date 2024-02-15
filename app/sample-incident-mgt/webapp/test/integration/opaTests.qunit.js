sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'sampleincidentmgt/sampleincidentmgt/test/integration/FirstJourney',
		'sampleincidentmgt/sampleincidentmgt/test/integration/pages/IncidentsList',
		'sampleincidentmgt/sampleincidentmgt/test/integration/pages/IncidentsObjectPage'
    ],
    function(JourneyRunner, opaJourney, IncidentsList, IncidentsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('sampleincidentmgt/sampleincidentmgt') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheIncidentsList: IncidentsList,
					onTheIncidentsObjectPage: IncidentsObjectPage
                }
            },
            opaJourney.run
        );
    }
);