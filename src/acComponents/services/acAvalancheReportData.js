angular.module('acComponents.services')
  .factory('acAvalancheReportData', function(acFormUtils) {
    var fields = {

      avalancheObsComment: {
        prompt: 'Avalanche Observation Comment',
        type: 'textarea',
        value: null,
        helpText: 'Please add additional information, for example terrain, aspect, elevation etc. especially if describing many avalanches together.',
        order: 1
      },

      avalancheOccurrenceEpoch: {
        prompt: 'Avalanche Observation Datetime',
        type: 'datetime',
        value: null,
        order: 2
      },

      avalancheNumber: {
        prompt: 'Number of avalanches in this report',
        type: 'radio',
        inline: true,
        options: ['1', '2-5', '6-10', '11-50', '51-100'],
        value: null,
        order: 3
      },

      avalancheSize: {
        prompt: 'Avalanche Size',
        type: 'radio',
        inline: true,
        value: null,
        options: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'],
        helpText: 'Use Canadian size classification. Size 1 is relatively harmless to people. Size 2 can bury, injure or kill a person. Size 3 can bury and destroy a car. Size 4 can destroy a railway car. Size 5 can destroy 40 hectares of forest.',
        order: 4
      },

      slabThickness: {
        type: 'number',
        prompt: 'Slab Thickness (centimetres)',
        value: null,
        options: {
          min: 10,
          max: 500,
          step: 10
        },
        order: 5
      },

      slabWidth: {
        type: 'number',
        prompt: 'Slab Width (meters)',
        value: null,
        options: {
          min: 1,
          max: 3000,
          step: 100
        },
        order: 6
      },

      runLength: {
        type: 'number',
        prompt: 'Run length (meters)',
        options: {
          min: 1,
          max: 10000,
          step: 100
        },
        value: null,
        helpText: 'Length from crown to toe of debris.',
        order: 7
      },

      avalancheCharacter: {
        type: 'checkbox',
        prompt: 'Avalanche Character',
        limit: 3,
        options: {
          'Loose wet': false,
          'Loose dry': false,
          'Storm slab': false,
          'Persistent slab': false,
          'Deep persistent slab': false,
          'Wet slab': false,
          'Cornice only': false,
          'Cornice with slab': false
        },
        order: 8
      },

      triggerType: {
        type: 'dropdown',
        prompt: 'Trigger Type',
        options:['Natural', 'Skier', 'Snowmobile', 'Other Vehicle', 'Helicopter', 'Explosives'],
        value: null,
        order: 9
      },

      triggerSubtype: {
        type: 'dropdown',
        prompt: 'Trigger Subtype',
        value: null,
        options: ['Accidental', 'Intentional', 'Remote'],
        helpText: 'A remote trigger is when the avalanche starts some distance away from where the trigger was  applied.',
        order: 10
      },

      triggerDistance: {
        type: 'number',
        prompt: 'Remote Trigger Distance (metres)',
        options: {
          min: 0,
          max: 2000,
          step: 50
        },
        helpText: 'If a remote trigger, enter how far from the trigger point is the nearest part of the crown.',
        value: null,
        order: 11
      },

      startZoneAspect: {
        type: 'radio',
        inline: true,
        prompt: 'Start Zone Aspect',
        options: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        value: null,
        order: 12
      },

      startZoneElevationBand: {
        prompt: 'Start Zone Elevation Band',
        type: 'radio',
        inline: true,
        options: ['Alpine', 'Treeline', 'Below Treeline'],
        value: null,
        order: 13
      },

      startZoneElevation: {
        type: 'number',
        prompt: 'Start Zone Elevation (metres above sea level)',
        options: {
          min: 0,
          max: 5000,
          step: 50
        },
        value: null,
        order: 14
      },

      startZoneIncline: {
        type: 'number',
        prompt: 'Start Zone Incline',
        options: {
          min: 0,
          max: 90,
          step: 5
        },
        value: null,
        order: 15
      },

      runoutZoneElevation: {
        type: 'number',
        prompt: 'Runout Zone Elevation (metres above sea level)',
        options: {
          min: 0,
          max: 5000,
          step: 50
        },
        helpText: 'The lowest point of the debris.',
        value: null,
        order: 16

      },

      weakLayerBurialDate: {
        prompt: 'Weak Layer Burial Date',
        type: 'datetime',
        helpText:'Date the weak layer was buried.',
        order: 17
      },

      weakLayerCrystalType: {
        type: 'checkbox',
        prompt: 'Weak Layer Crystal Type',
        limit: 2,
        options: {
          'Surface hoar': false,
          'Facets': false,
          'Surface hoar and facets': false,
          'Depth hoar': false,
          'Storm snow': false
        },
        order: 18
      },

      crustNearWeakLayer:{
        prompt: 'Crust Near Weak Layer',
        type: 'radio',
        inline: true,
        options: ['Yes', 'No'],
        value: null,
        order: 19
      },

      windExposure: {
        type: 'dropdown',
        prompt: 'Wind Exposure',
        options: ['Lee slope', 'Windward slope', 'Down flow', 'Cross-loaded slope', 'Reverse-loaded slope', 'No wind exposure'],
        value: null,
        order: 20
      },

      vegetationCover: {
        type: 'dropdown',
        prompt: 'Vegetation cover',
        value: null,
        options: ['Open slope', 'Sparse trees or gladed slope', 'Dense trees'],
        order: 21
      }

    };

    return acFormUtils.buildReport(fields);

  });
