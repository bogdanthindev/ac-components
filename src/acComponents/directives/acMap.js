angular.module('acComponents.directives')
  .directive('acMapboxMap', function ($rootScope, $window, $location, $timeout, acBreakpoint, acObservation, acForecast, MAPBOX_ACCESS_TOKEN, MAPBOX_MAP_ID) {
    return {
      template: '<div id="map"></div>',
      replace: true,
      scope: {
        region: '=acRegion',
        regions: '=acRegions',
        showRegions: '=acShowRegions',
        subs: '=acObs',
        ob: '=acOb'
      },
      link: function ($scope, el, attrs) {
        $scope.device = {};
        $scope.obs = [];
        $scope.showRegions = $scope.showRegions || true;
        var layers = {
          dangerIcons: L.featureGroup()
        };
        var styles = {
          region: {
            default: {
              fillColor: 'transparent',
              color: 'transparent'
            },
            selected: {
              fillColor: '#489BDF'
            },
            hover: {
              color: '#B43A7E'
            },
            selectedhover: {
              fillColor: '#489BDF',
              color: '#B43A7E'
            }
          }
        };

        L.mapbox.accessToken = MAPBOX_ACCESS_TOKEN;
        var map = L.mapbox.map(el[0].id, MAPBOX_MAP_ID, {attributionControl: false});
        map.setView([52.3, -120.74966], 6);

        /*var provinces = L.mapbox.geocoder('mapbox.places-province-v1');
         provinces.query('British-Columbia', function (err, results) {
         var bcBounds = L.latLngBounds([results.bounds[1], results.bounds[0]], [results.bounds[3], results.bounds[2]]);
         map.fitBounds(bcBounds);
         });*/

        L.control.locate({
          locateOptions: {
            maxZoom: 14
          }
        }).addTo(map);

        acBreakpoint.setBreakpoints({
          xs: 480,
          sm: 600,
          md: 1025
        });

        $rootScope.$on('breakpoint', function (e, breakpoint) {
          $scope.device.size = breakpoint;
        });

        function getInvalidateSize(topOffset) {
          return function () {
            el.height($($window).height() - Number(topOffset));
            map.invalidateSize();
          }
        }

        if (attrs.topOffset) {
          var offset = Number(attrs.topOffset);
          var invalidateSize = getInvalidateSize(offset);

          angular.element(document).ready(invalidateSize);
          angular.element($window).bind('resize', invalidateSize);
        }

        function getDangerIcon(options) {
          var size = map.getZoom() <= 6 ? 60 : 80;

          return L.icon({
            iconUrl: options.iconUrl || acForecast.getDangerIconUrl(options.regionId),
            iconSize: [size, size],
            labelAnchor: [6, 0]
          });
        };

        function initRegionsLayer() {
          layers.regions = L.geoJson($scope.regions, {
            style: function (feature) {
              return styles.region.default;
            },
            onEachFeature: function (featureData, layer) {
              layer.bindLabel(featureData.properties.name);

              function showRegion(evt) {
                if (map.getZoom() < 9) {
                  var padding = getMapPadding();

                  map.fitBounds(layer.getBounds(), {
                    paddingBottomRight: padding
                  });
                }

                layers.currentRegion = layer;

                $scope.$apply(function () {
                  $scope.region = layer;
                });
              }

              layer.on('click', showRegion);

              layer.on('mouseover', function () {
                if (layer == layers.currentRegion) {
                  layer.setStyle(styles.region.selectedhover);
                } else {
                  layer.setStyle(styles.region.hover);
                }
              });

              layer.on('mouseout', function () {
                if (layer == layers.currentRegion) {
                  layer.setStyle(styles.region.selected);
                } else {
                  layer.setStyle(styles.region.default);
                }
              });

              if (featureData.properties.centroid) {
                var centroid = L.latLng(featureData.properties.centroid[1], featureData.properties.centroid[0]);

                var marker = L.marker(centroid);
                var icon = getDangerIcon({regionId: featureData.id});

                marker.setIcon(icon);
                var zindex = 1;
                marker.setZIndexOffset(zindex);

                marker.on('click', function () {
                  //zindex = zindex === 1 ? 200 : 1;
                  //smarker.setZIndexOffset(zindex);
                  showRegion();
                });

                layers.dangerIcons.addLayer(marker);
              }
            }
          });

          refreshLayers();
        }

        function refreshDangerIconsLayer() {
          layers.dangerIcons.eachLayer(function (dangerIconLayer) {
            var iconUrl = dangerIconLayer.options.icon.options.iconUrl;
            var icon = getDangerIcon({iconUrl: iconUrl});

            dangerIconLayer.setIcon(icon);
          });
        }

        function refreshLayers() {
          var zoom = map.getZoom();

          if (layers.regions && $scope.showRegions) {
            var regionsVisible = map.hasLayer(layers.regions);

            if (zoom < 6 && regionsVisible) {
              map.removeLayer(layers.regions);
            } else if (zoom >= 6 && !regionsVisible) {
              map.addLayer(layers.regions);
            } else if (zoom > 10 && regionsVisible) {
              map.removeLayer(layers.regions);
            }
          }

          if (layers.dangerIcons) {
            var dangerIconsVisible = map.hasLayer(layers.dangerIcons);

            if (map.getZoom() < 6 && dangerIconsVisible) {
              map.removeLayer(layers.dangerIcons);
            } else if (map.getZoom() >= 6 && !dangerIconsVisible) {
              map.addLayer(layers.dangerIcons);
            }

            var dangerIcon = layers.dangerIcons.getLayers()[0];
            if (dangerIcon) {
              var dangerIconSize = dangerIcon.options.icon.options.iconSize[0];
              if ((zoom > 6 && dangerIconSize === 60) || (zoom <= 6 && dangerIconSize === 80)) {
                refreshDangerIconsLayer();
              }
            }
          }

          if (layers.obs) {
            // var obsVisible = map.hasLayer(layers.obs);

            // if(map.getZoom() < 7 && obsVisible) {
            //     map.removeLayer(layers.obs);
            // } else if (map.getZoom() >= 7 && !obsVisible){
            //     map.addLayer(layers.obs);
            // }

            map.addLayer(layers.obs);
          }

          if (layers.subs) {
            map.addLayer(layers.subs)
          }


          var opacity = 0.2;
          if (layers.currentRegion && $scope.showRegions) {
            if (zoom <= 9) {
              styles.region.selected.fillOpacity = opacity;
              layers.currentRegion.setStyle(styles.region.selected);
            } else if (zoom > 9 && zoom < 13) {
              switch (zoom) {
                case 10:
                  opacity = 0.15;
                  break;
                case 11:
                  opacity = 0.10;
                  break;
                case 12:
                  opacity = 0.05;
                  break;
              }

              styles.region.selected.fillOpacity = opacity;
              layers.currentRegion.setStyle(styles.region.selected);
            } else {
              layers.currentRegion.setStyle(styles.region.default);
            }
          }
        }

        function refreshObsLayer() {
          if (map.hasLayer(layers.obs)) {
            map.removeLayer(layers.obs);
          }
          if ($scope.obs.length > 0) {
            var markers = $scope.obs.map(function (ob) {

              var marker = L.marker(ob.latlng, {
                icon: L.mapbox.marker.icon({
                  'marker-size': 'small',
                  'marker-color': (ob.obtype === 'incident') ? '#f00' : '#09c'
                })
              });

              marker.on('click', function () {
                //showObservationsMakers();
                acObservation.getOne(ob.obid, 'html').then(function (obHtml) {
                  if ($scope.device.size === 'sm' || $scope.device.size === 'xs') {
                    $scope.$emit('ac.min.obclicked', obHtml);
                  } else {
                    var popup = marker.getPopup();

                    if (!popup) {
                      var maxHeight = map.getSize().y - 100;
                      popup = L.popup({maxHeight: maxHeight, maxWidth: 400, autoPanPaddingTopLeft: [0, 30]});
                      popup.setContent(obHtml);
                      marker.bindPopup(popup);
                    }

                    marker.openPopup();
                  }
                });
                acObservation.getOne(ob.obid, 'json').then(function (ob) {
                  // add opengraph tags
                  $rootScope.ogTags = [{type: 'title', value: ob.title},
                    {type: 'image', value: ob.thumbs[0]},
                    {type: 'description', value: ob.comment}];
                });
              });

              //! set obs to z index 100. Forecast icons are at 1
              marker.setZIndexOffset(100);

              return marker;
            });

            layers.obs = L.featureGroup(markers);
            layers.obs.bringToFront();
          } else {
            layers.obs = undefined;
          }

          refreshLayers();

        }

        function createSubsMarkers() {
          var distance = 0.035;
          if (map.hasLayer(layers.subs)) {
            map.removeLayer(layers.subs);
          }

          if ($scope.subs && $scope.subs.length > 0) {

            _.forEach($scope.subs, function (sub) {
              if (sub.obs && sub.obs.length > 1) {
                var markers = L.markerClusterGroup({
                  maxClusterRadius: 5,
                  singleMarkerMode: true,
                  iconCreateFunction: function (cluster) {
                    return L.divIcon({
                      html: '<div><img width="30" src="https://cdn4.iconfinder.com/data/icons/simplicio/128x128/piechart.png"/></div>',
                      className: 'marker-cluster',
                      iconSize: new L.Point(40, 40)
                    });
                  }
                });


                _.forEach(sub.obs, function (ob) {
                  var marker = L.marker(ob.latlng, {
                    icon: L.mapbox.marker.icon({
                      'marker-size': 'small',
                      'marker-color': (ob.obtype === 'incident') ? '#f00' : '#09c'
                    })
                  });

                  markers.on('clusterclick', function () {
                    //if (sub.expanded) {
                    //  _.remove($scope.obs, {subid: sub.subid});
                    //  sub.expanded = false;
                    //} else {
                    //  sub.expanded = true;
                    //  var obs = [];
                    //  var length = sub.obs.length;
                    //  _.forEach(sub.obs, function (ob, i) {
                    //    var copiedOb = angular.copy(ob);
                    //    copiedOb.latlng = [ob.latlng[0] + distance, ob.latlng[1] + (((length-1)* distance)/2 - (i * distance))];
                    //    obs.push(copiedOb);
                    //  });
                    //  $scope.obs = $scope.obs.concat(obs);
                    //  map.setView(sub.latlng, 10);
                    //}
                    //
                    //$scope.$apply();
                  });

                  //! set obs to z index 100. Forecast icons are at 1
                  marker.setZIndexOffset(100);
                  //markers.push(marker);
                  markers.addLayer(marker);
                });

                map.addLayer(markers);

              } else {
                $scope.obs.push(sub.obs[0]);
              }
            });

            //layers.subs = L.featureGroup(markers);
            //layers.subs.bringToFront();
          } else {
            //layers.subs = undefined;
          }

        }

        function latLngToGeoJSON(latlng) {
          return {
            type: 'Point',
            coordinates: [latlng.lng, latlng.lat]
          };
        }

        function getMapPadding() {
          switch ($scope.device.size) {
            case 'xs':
              return L.point([0, 0]);
            case 'sm':
              return L.point([350, 0]);
            case 'md':
            case 'lg':
              return L.point([480, 0]);
            default:
              return L.point([0, 0]);
          }
        }

        function getMapOffset() {
          return getMapPadding().divideBy(2);
        }

        // offfset can be negative i.e. [-240, 0]
        function offsetLatLng(latlng, offset) {
          var point = map.latLngToLayerPoint(latlng);
          return map.layerPointToLatLng(point.subtract(offset));
        }

        function getMapCenter() {
          var offset = getMapOffset();
          return offsetLatLng(map.getCenter(), offset);
        }


        function setRegionFocus() {
          if ($scope.showRegions) {
            var regionLayers = layers.regions.getLayers();
            var mapCenter = getMapCenter();

            var region = _.find(regionLayers, function (r) {
              return gju.pointInPolygon(latLngToGeoJSON(mapCenter), r.feature.geometry);
            });

            if (!region) {
              region = _.min(regionLayers, function (r) {
                var centroid = L.latLng(r.feature.properties.centroid[1], r.feature.properties.centroid[0]);
                return centroid.distanceTo(mapCenter);
              });
            }

            if (region) setRegion(region);
          }
        }

        function setRegion(region) {
          layers.currentRegion = region;
          if ($scope.region !== region) {
            $timeout(function () {
              $scope.region = region;
            }, 10);
          }

          layers.regions.eachLayer(function (layer) {
            if (layer === region) {
              layer.setStyle(styles.region.selected);
            } else {
              layer.setStyle(styles.region.default);
            }
          });
        }


        map.on('load', refreshLayers);
        //map.on('dragend', setRegionFocus);
        map.on('zoomend', refreshLayers);

        $scope.$watch('region', function (newRegion, oldRegion) {
          if (layers.regions && newRegion && newRegion !== oldRegion) {
            setRegion(newRegion);
          }
        });

        $scope.$watch('regions', function (newRegions, oldRegions) {
          if (newRegions && newRegions.features) {
            initRegionsLayer();
          }
        });

        $scope.$watch('showRegions', function (newShowRegions, oldShowRegions) {
          if (newShowRegions !== oldShowRegions) {
            if (!newShowRegions && map.hasLayer(layers.regions)) {
              if (layers.currentRegion) {
                $scope.region = null;
                layers.currentRegion.setStyle(styles.region.default);
              }
              map.removeLayer(layers.regions);
            } else if (newShowRegions && !map.hasLayer(layers.regions)) {
              map.addLayer(layers.regions);
              setRegionFocus();
            }
          }
        });

        $scope.$watch('subs', function (newSubs, oldSubs) {
          if (newSubs) {
            createSubsMarkers();
          }
        });

        $scope.$watch('obs', function (newObs, oldObs) {
          if (newObs) {
            refreshObsLayer();
          }
        }, true);

        $scope.$watch('ob', function (newObs, oldObs) {
          if (newObs && newObs.latlng) {
            acObservation.getOne(newObs.obid, 'html').then(function (obHtml) {
              var marker = L.marker(newObs.latlng, {
                icon: L.mapbox.marker.icon({
                  'marker-size': 'small',
                  'marker-color': '#09c'
                })
              });
              var maxHeight = map.getSize().y - 100;

              marker.bindPopup(obHtml, {maxHeight: maxHeight, maxWidth: 400, autoPanPaddingTopLeft: [0, 30]});
              marker.on('popupclose', function () {
                map.removeLayer(marker);
                $timeout(function () {
                  $location.path('/');
                }, 0);
              });

              marker.setZIndexOffset(10000);
              map.addLayer(marker);

              marker.togglePopup();
            });
            acObservation.getOne(newObs.obid, 'json').then(function (ob) {
              // add opengraph tags
              $rootScope.ogTags = [{type: 'title', value: ob.title},
                {type: 'image', value: ob.thumbs[0]},
                {type: 'description', value: ob.comment}];
            });
          }
        });

      }
    };
  });
